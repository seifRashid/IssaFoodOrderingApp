import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dns from "dns";
import { createClient } from "@supabase/supabase-js";

// Fix Node 17+ localhost address resolution preference
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

app.use(express.json());

// Initialize Gemini API client lazily and safely
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        ai = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      } catch (e) {
        console.error("Failed to initialize GoogleGenAI client:", e);
      }
    }
  }
  return ai;
}

// ==========================================
// SUPABASE CLIENT & OPERATIONS WRAPPER
// ==========================================

let supabaseClient: any = null;
let isSupabaseConfigured = false;
let isSupabaseConnected = false;
let supabaseError: string | null = null;

const schemaSql = `-- Drop existing tables if you want to recreate them (Warning: this deletes data)
-- DROP TABLE IF EXISTS "addresses";
-- DROP TABLE IF EXISTS "order_items";
-- DROP TABLE IF EXISTS "orders";
-- DROP TABLE IF EXISTS "reviews";
-- DROP TABLE IF EXISTS "users";
-- DROP TABLE IF EXISTS "food_items";
-- DROP TABLE IF EXISTS "categories";

CREATE TABLE IF NOT EXISTS "categories" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "food_items" (
  "id" TEXT PRIMARY KEY,
  "categoryId" TEXT,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "price" NUMERIC NOT NULL,
  "image" TEXT,
  "preparationTime" INTEGER,
  "isFeatured" BOOLEAN DEFAULT false,
  "isPopular" BOOLEAN DEFAULT false,
  "isAvailable" BOOLEAN DEFAULT true,
  "createdAt" TEXT NOT NULL,
  CONSTRAINT fk_category FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "phone" TEXT,
  "role" TEXT NOT NULL DEFAULT 'customer',
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "reviews" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT,
  "customerName" TEXT,
  "foodItemId" TEXT,
  "foodItemName" TEXT,
  "rating" INTEGER NOT NULL,
  "review" TEXT NOT NULL,
  "isApproved" BOOLEAN DEFAULT true,
  "createdAt" TEXT NOT NULL,
  CONSTRAINT fk_food FOREIGN KEY ("foodItemId") REFERENCES "food_items" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "orders" (
  "id" TEXT PRIMARY KEY,
  "orderNumber" TEXT UNIQUE NOT NULL,
  "customerId" TEXT,
  "customerName" TEXT NOT NULL,
  "customerPhone" TEXT NOT NULL,
  "customerEmail" TEXT,
  "deliveryLocation" TEXT NOT NULL,
  "deliveryAddress" TEXT NOT NULL,
  "deliveryNotes" TEXT,
  "paymentMethod" TEXT NOT NULL,
  "totalAmount" NUMERIC NOT NULL,
  "deliveryFee" NUMERIC DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT,
  "foodItemId" TEXT,
  "foodItemName" TEXT,
  "foodItemImage" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "price" NUMERIC NOT NULL,
  CONSTRAINT fk_order FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "addresses" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT,
  "location" TEXT,
  "address" TEXT,
  "notes" TEXT
);`;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL || "";
  const anonKey = process.env.SUPABASE_ANON_KEY || "";

  if (url && url !== "MY_SUPABASE_URL" && anonKey && anonKey !== "MY_SUPABASE_ANON_KEY") {
    try {
      supabaseClient = createClient(url, anonKey, {
        auth: {
          persistSession: false
        }
      });
      isSupabaseConfigured = true;
      return supabaseClient;
    } catch (e: any) {
      console.error("Failed to construct Supabase Client:", e);
      supabaseError = e.message || "Failed construct Client";
    }
  }
  return null;
}

async function checkSupabaseConnection(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    isSupabaseConnected = false;
    return false;
  }

  try {
    const { data, error } = await client.from("categories").select("id").limit(1);
    if (error) {
      console.warn("Supabase categories table query failed:", error.message);
      supabaseError = `Table query failed: ${error.message}. Database schema table "categories" might not exist yet. Please execute the SQL in the Admin Panel to install tables first.`;
      isSupabaseConnected = false;
      return false;
    }
    isSupabaseConnected = true;
    supabaseError = null;
    return true;
  } catch (e: any) {
    console.error("Supabase connection check threw:", e);
    supabaseError = e.message || "Connection check error";
    isSupabaseConnected = false;
    return false;
  }
}

// ------------------------------------------
// DB COLLABORATIVE MUTATION WRAPPERS
// ------------------------------------------

async function getCategories(): Promise<any[]> {
  const client = getSupabaseClient();
  if (isSupabaseConnected && client) {
    const { data, error } = await client.from("categories").select("*");
    if (!error && data) return data;
    if (error) console.error("Error loading categories from Supabase, falling back:", error);
  }
  return DB.categories;
}

async function createCategoryInDb(newCat: any): Promise<any> {
  const client = getSupabaseClient();
  if (isSupabaseConnected && client) {
    const { error } = await client.from("categories").insert(newCat);
    if (error) throw new Error("Supabase insert failed: " + error.message);
  }
  DB.categories.push(newCat);
  saveDb(DB);
  return newCat;
}

async function updateCategoryInDb(id: string, name: string, slug: string): Promise<any> {
  const client = getSupabaseClient();
  if (isSupabaseConnected && client) {
    const { error } = await client.from("categories").update({ name, slug }).eq("id", id);
    if (error) throw new Error("Supabase update failed: " + error.message);
  }
  const index = DB.categories.findIndex(c => c.id === id);
  if (index !== -1) {
    DB.categories[index].name = name;
    DB.categories[index].slug = slug;
    saveDb(DB);
    return DB.categories[index];
  }
  return null;
}

async function deleteCategoryInDb(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (isSupabaseConnected && client) {
    const { error } = await client.from("categories").delete().eq("id", id);
    if (error) throw new Error("Supabase delete failed: " + error.message);
  }
  DB.categories = DB.categories.filter(c => c.id !== id);
  saveDb(DB);
  return true;
}

async function getFoodItems(): Promise<any[]> {
  const client = getSupabaseClient();
  if (isSupabaseConnected && client) {
    const { data, error } = await client.from("food_items").select("*");
    if (!error && data) return data;
    if (error) console.error("Error loading food_items from Supabase, falling back:", error);
  }
  return DB.foodItems;
}

async function createFoodItemInDb(newItem: any): Promise<any> {
  const client = getSupabaseClient();
  if (isSupabaseConnected && client) {
    const { error } = await client.from("food_items").insert(newItem);
    if (error) throw new Error("Supabase insert failed: " + error.message);
  }
  DB.foodItems.push(newItem);
  saveDb(DB);
  return newItem;
}

async function updateFoodItemInDb(id: string, updatedFields: any): Promise<any> {
  const client = getSupabaseClient();
  if (isSupabaseConnected && client) {
    const { error } = await client.from("food_items").update(updatedFields).eq("id", id);
    if (error) throw new Error("Supabase update failed: " + error.message);
  }
  const index = DB.foodItems.findIndex(f => f.id === id);
  if (index !== -1) {
    DB.foodItems[index] = { ...DB.foodItems[index], ...updatedFields };
    saveDb(DB);
    return DB.foodItems[index];
  }
  return null;
}

async function deleteFoodItemInDb(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (isSupabaseConnected && client) {
    const { error } = await client.from("food_items").delete().eq("id", id);
    if (error) throw new Error("Supabase delete failed: " + error.message);
  }
  DB.foodItems = DB.foodItems.filter(f => f.id !== id);
  saveDb(DB);
  return true;
}

async function getUsers(): Promise<any[]> {
  const client = getSupabaseClient();
  if (isSupabaseConnected && client) {
    const { data, error } = await client.from("users").select("*");
    if (!error && data) return data;
    if (error) console.error("Error loading users from Supabase, falling back:", error);
  }
  return DB.users;
}

async function createUserInDb(newUser: any): Promise<any> {
  const client = getSupabaseClient();
  if (isSupabaseConnected && client) {
    const { error } = await client.from("users").insert(newUser);
    if (error) throw new Error("Supabase insert failed: " + error.message);
  }
  DB.users.push(newUser);
  saveDb(DB);
  return newUser;
}

async function updateUserInDb(id: string, updatedFields: any): Promise<any> {
  const client = getSupabaseClient();
  if (isSupabaseConnected && client) {
    const { error } = await client.from("users").update(updatedFields).eq("id", id);
    if (error) throw new Error("Supabase update failed: " + error.message);
  }
  const index = DB.users.findIndex(u => u.id === id);
  if (index !== -1) {
    DB.users[index] = { ...DB.users[index], ...updatedFields };
    saveDb(DB);
    return DB.users[index];
  }
  return null;
}

async function getReviews(): Promise<any[]> {
  const client = getSupabaseClient();
  if (isSupabaseConnected && client) {
    const { data, error } = await client.from("reviews").select("*");
    if (!error && data) return data;
    if (error) console.error("Error loading reviews from Supabase, falling back:", error);
  }
  return DB.reviews;
}

async function createReviewInDb(newReview: any): Promise<any> {
  const client = getSupabaseClient();
  if (isSupabaseConnected && client) {
    const { error } = await client.from("reviews").insert(newReview);
    if (error) throw new Error("Supabase insert failed: " + error.message);
  }
  DB.reviews.push(newReview);
  saveDb(DB);
  return newReview;
}

async function updateReviewApprovalInDb(id: string, isApproved: boolean): Promise<any> {
  const client = getSupabaseClient();
  if (isSupabaseConnected && client) {
    const { error } = await client.from("reviews").update({ isApproved }).eq("id", id);
    if (error) throw new Error("Supabase update failed: " + error.message);
  }
  const index = DB.reviews.findIndex(r => r.id === id);
  if (index !== -1) {
    DB.reviews[index].isApproved = isApproved;
    saveDb(DB);
    return DB.reviews[index];
  }
  return null;
}

async function deleteReviewInDb(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (isSupabaseConnected && client) {
    const { error } = await client.from("reviews").delete().eq("id", id);
    if (error) throw new Error("Supabase delete failed: " + error.message);
  }
  DB.reviews = DB.reviews.filter(r => r.id !== id);
  saveDb(DB);
  return true;
}

async function getOrders(): Promise<any[]> {
  const client = getSupabaseClient();
  if (isSupabaseConnected && client) {
    const { data, error } = await client.from("orders").select("*");
    if (!error && data) return data;
    if (error) console.error("Error loading orders from Supabase, falling back:", error);
  }
  return DB.orders;
}

async function getOrderItems(): Promise<any[]> {
  const client = getSupabaseClient();
  if (isSupabaseConnected && client) {
    const { data, error } = await client.from("order_items").select("*");
    if (!error && data) return data;
    if (error) console.error("Error loading order_items from Supabase, falling back:", error);
  }
  return DB.orderItems;
}

async function createOrderInDb(newOrder: any, items: any[]): Promise<any> {
  const client = getSupabaseClient();
  if (isSupabaseConnected && client) {
    const { error: orderError } = await client.from("orders").insert(newOrder);
    if (orderError) throw new Error("Supabase order insert failed: " + orderError.message);

    const { error: itemsError } = await client.from("order_items").insert(items);
    if (itemsError) {
      await client.from("orders").delete().eq("id", newOrder.id);
      throw new Error("Supabase order_items insert failed: " + itemsError.message);
    }
  }
  DB.orders.push(newOrder);
  DB.orderItems.push(...items);
  saveDb(DB);
  return newOrder;
}

async function updateOrderStatusInDb(id: string, status: string): Promise<any> {
  const client = getSupabaseClient();
  if (isSupabaseConnected && client) {
    const { error } = await client.from("orders").update({ status }).eq("id", id);
    if (error) throw new Error("Supabase order status update failed: " + error.message);
  }
  const index = DB.orders.findIndex(o => o.id === id);
  if (index !== -1) {
    DB.orders[index].status = status;
    saveDb(DB);
    return DB.orders[index];
  }
  return null;
}

async function getAddresses(): Promise<any[]> {
  const client = getSupabaseClient();
  if (isSupabaseConnected && client) {
    const { data, error } = await client.from("addresses").select("*");
    if (!error && data) return data;
    if (error) console.error("Error loading addresses from Supabase, falling back:", error);
  }
  return DB.addresses;
}

async function createAddressInDb(newAddr: any): Promise<any> {
  const client = getSupabaseClient();
  if (isSupabaseConnected && client) {
    const { error } = await client.from("addresses").insert(newAddr);
    if (error) throw new Error("Supabase address insert failed: " + error.message);
  }
  DB.addresses.push(newAddr);
  saveDb(DB);
  return newAddr;
}

async function seedSupabaseIfNeeded() {
  if (!isSupabaseConnected) return;
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const { data: cats, error: catErr } = await client.from("categories").select("id").limit(1);
    if (catErr) {
      console.warn("Supabase not fully set up. Categories query failed:", catErr.message);
      return;
    }

    if (cats && cats.length === 0) {
      console.log("Supabase categories are empty or newly active! Auto-seeding default data to Supabase...");

      const { error: catInsertErr } = await client.from("categories").insert(defaultCategories);
      if (catInsertErr) console.error("Error seeding categories:", catInsertErr);

      const { error: foodInsertErr } = await client.from("food_items").insert(defaultFoodItems);
      if (foodInsertErr) console.error("Error seeding food_items:", foodInsertErr);

      const { error: userInsertErr } = await client.from("users").insert(defaultUsers);
      if (userInsertErr) console.error("Error seeding users:", userInsertErr);

      const { error: revInsertErr } = await client.from("reviews").insert(defaultReviews);
      if (revInsertErr) console.error("Error seeding reviews:", revInsertErr);

      const { error: orderInsertErr } = await client.from("orders").insert(defaultOrders);
      if (orderInsertErr) console.error("Error seeding orders:", orderInsertErr);

      const { error: itemInsertErr } = await client.from("order_items").insert(defaultOrderItems);
      if (itemInsertErr) console.error("Error seeding order_items:", itemInsertErr);

      const { error: addrInsertErr } = await client.from("addresses").insert(defaultAddresses);
      if (addrInsertErr) console.error("Error seeding addresses:", addrInsertErr);

      console.log("Supabase seed written fully!");
    }
  } catch (e) {
    console.error("Failed to seed Supabase:", e);
  }
}

// ==========================================
// DATABASE SETUP & SEED DATA
// ==========================================

const defaultCategories = [
  { id: "cat-1", name: "Breakfast", slug: "breakfast", createdAt: new Date().toISOString() },
  { id: "cat-2", name: "Lunch", slug: "lunch", createdAt: new Date().toISOString() },
  { id: "cat-3", name: "Dinner", slug: "dinner", createdAt: new Date().toISOString() },
  { id: "cat-4", name: "Drinks", slug: "drinks", createdAt: new Date().toISOString() },
  { id: "cat-5", name: "Snacks", slug: "snacks", createdAt: new Date().toISOString() },
  { id: "cat-6", name: "Fast Food", slug: "fast-food", createdAt: new Date().toISOString() },
  { id: "cat-7", name: "Desserts", slug: "desserts", createdAt: new Date().toISOString() },
];

const defaultFoodItems = [
  {
    id: "food-1",
    categoryId: "cat-1",
    name: "Classic Fluffy Pancakes",
    slug: "classic-fluffy-pancakes",
    description: "Stack of fluffy homemade buttermilk pancakes served with rich maple syrup, salted butter, and fresh seasonal berries.",
    price: 8.50,
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&q=80&w=600",
    preparationTime: 10,
    isFeatured: true,
    isPopular: true,
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "food-2",
    categoryId: "cat-1",
    name: "Poached Egg Avocado Toast",
    slug: "poached-egg-avocado-toast",
    description: "Toasted country sourdough topped with cream cheese, fresh crushed avocado, chili flakes, sea salt, and a perfect runny poached egg.",
    price: 9.50,
    image: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&q=80&w=600",
    preparationTime: 8,
    isFeatured: true,
    isPopular: false,
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "food-3",
    categoryId: "cat-2",
    name: "Crispy Spicy Chicken Burger",
    slug: "crispy-spicy-chicken-burger",
    description: "Perfectly seasoned hand-breaded golden chicken breast coated in buffalo glaze, spicy sweet garlic aioli, lettuce, and sour pickles on a toasted brioche bun. Served with sea salt fries.",
    price: 12.50,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600",
    preparationTime: 15,
    isFeatured: false,
    isPopular: true,
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "food-4",
    categoryId: "cat-2",
    name: "Feta Mediterranean Salad",
    slug: "feta-mediterranean-salad",
    description: "Crisp chopped romaine lettuce, crunchy cucumbers, ripe cherry tomatoes, Kalamata olives, creamy sheep's milk feta cheese, red onion, tossed in our signature greek lemon-herb vinaigrette.",
    price: 10.00,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600",
    preparationTime: 10,
    isFeatured: false,
    isPopular: false,
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "food-5",
    categoryId: "cat-3",
    name: "Flame-Grilled Ribeye Steak",
    slug: "flame-grilled-ribeye-steak",
    description: "A premium 12oz tender grain-fed ribeye steak grilled to temperature, glazed with homemade herb garlic butter. Served with roasted asparagus and creamy gold mashed potatoes.",
    price: 24.00,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600",
    preparationTime: 20,
    isFeatured: true,
    isPopular: true,
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "food-6",
    categoryId: "cat-3",
    name: "Creamy Garlic Chicken Fettuccine",
    slug: "creamy-garlic-chicken-fettuccine",
    description: "Fettuccine pasta tossed in a rich, velvety garlic parmesan cream sauce, loaded with tender flame-grilled sliced chicken breast and sprinkled with fresh chopped Italian parsley.",
    price: 16.50,
    image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&q=80&w=600",
    preparationTime: 15,
    isFeatured: false,
    isPopular: false,
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "food-7",
    categoryId: "cat-4",
    name: "Fresh Tropical Mango Smoothie",
    slug: "fresh-tropical-mango-smoothie",
    description: "Sweet and beautifully refreshing blend of fresh Kent mango pulp, creamy Greek yogurt, organic honey, and a touch of coconut water.",
    price: 4.50,
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=600",
    preparationTime: 5,
    isFeatured: false,
    isPopular: true,
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "food-8",
    categoryId: "cat-4",
    name: "Iced Caramel Macchiato",
    slug: "iced-caramel-macchiato",
    description: "Chilled organic whole milk infused with sweet vanilla bean syrup, topped with bold shots of dark espresso, finished with a heavy swirl of buttery house-made caramel drizzle.",
    price: 5.00,
    image: "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&q=80&w=600",
    preparationTime: 5,
    isFeatured: false,
    isPopular: false,
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "food-9",
    categoryId: "cat-5",
    name: "Mozzarella Mudballs (Cheese Sticks)",
    slug: "mozzarella-mudballs",
    description: "Hand-rolled premium whole-milk mozzarella logs coated in seasoned Italian breadcrumbs, fried golden brown, served with a cup of warm zesty marinara dipping sauce.",
    price: 6.50,
    image: "https://images.unsplash.com/photo-1531749668029-2db88e4b76ce?auto=format&fit=crop&q=80&w=600",
    preparationTime: 7,
    isFeatured: false,
    isPopular: true,
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "food-10",
    categoryId: "cat-6",
    name: "Ultimate Loaded Nachos",
    slug: "ultimate-loaded-nachos",
    description: "Crispy freshly-fried white corn tortilla chips piled high with melted cheddar-jack, slow-simmered black beans, fresh house-made pico de gallo, ripe guacamole, and cool sour cream.",
    price: 11.00,
    image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&q=80&w=600",
    preparationTime: 10,
    isFeatured: false,
    isPopular: true,
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "food-11",
    categoryId: "cat-6",
    name: "Pepperoni Feast Pizza",
    slug: "pepperoni-feast-pizza",
    description: "Twelve-inch hand-stretched personal dough, topped with an extra-generous layering of spicy pepperoni slices, whole-milk shredded mozzarella, and our signature slow-simmered herb pizza sauce.",
    price: 14.50,
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=600",
    preparationTime: 12,
    isFeatured: true,
    isPopular: false,
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "food-12",
    categoryId: "cat-7",
    name: "Warm Chocolate Fudge Lava Cake",
    slug: "warm-chocolate-fudge-lava-cake",
    description: "Rich, decadent chocolate sponge cake with a warm molten chocolate core that flows beautifully. Served with a premium scoop of vanilla bean ice cream.",
    price: 7.50,
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=600",
    preparationTime: 10,
    isFeatured: true,
    isPopular: false,
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "food-13",
    categoryId: "cat-7",
    name: "Classic New York Strawberry Cheesecake",
    slug: "classic-new-york-cheesecake",
    description: "Velvety smooth, baked New York-style cream cheese filling on an organic buttery graham cracker crust, finished with a luscious sweet strawberry compote glaze.",
    price: 8.00,
    image: "https://images.unsplash.com/photo-1524351199679-46cddf530c04?auto=format&fit=crop&q=80&w=600",
    preparationTime: 5,
    isFeatured: false,
    isPopular: true,
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
];

const defaultUsers = [
  { id: "usr-admin", name: "Chef Issa", email: "issa@example.com", phone: "+254 711 000000", role: "admin", createdAt: new Date().toISOString() },
  { id: "usr-customer", name: "John Doe", email: "john@example.com", phone: "+254 722 123456", role: "customer", createdAt: new Date().toISOString() },
];

const defaultReviews = [
  {
    id: "rev-1",
    customerId: "usr-customer",
    customerName: "John Doe",
    foodItemId: "food-1",
    foodItemName: "Classic Fluffy Pancakes",
    rating: 5,
    review: "These pancakes are incredibly soft and fluffy! The maple syrup and fresh berries make it the perfect morning treat. Highly recommend Issa Kitchen!",
    isApproved: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "rev-2",
    customerId: "usr-customer",
    customerName: "John Doe",
    foodItemId: "food-5",
    foodItemName: "Flame-Grilled Ribeye Steak",
    rating: 5,
    review: "Absolutely tender and grilled to perfection. The garlic herb butter glaze elevates it completely. Will definitely order this dinner again!",
    isApproved: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const defaultOrders = [
  {
    id: "ord-1",
    orderNumber: "IK-1001",
    customerId: "usr-customer",
    customerName: "John Doe",
    customerPhone: "+254 722 123456",
    customerEmail: "john@example.com",
    deliveryLocation: "Kilimani Estate",
    deliveryAddress: "Yaya Center Area, Block B Flat 4A",
    deliveryNotes: "Call when arriving at the gate, please keep it warm.",
    paymentMethod: "M-Pesa" as const,
    totalAmount: 29.50,
    deliveryFee: 3.00,
    status: "Delivered" as string,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ord-2",
    orderNumber: "IK-1002",
    customerId: "usr-customer",
    customerName: "John Doe",
    customerPhone: "+254 722 123456",
    customerEmail: "john@example.com",
    deliveryLocation: "Westlands",
    deliveryAddress: "Raphta Road, Villa Marina Apt 12",
    deliveryNotes: "Please leave with the security guard at reception.",
    paymentMethod: "Card Payments" as const,
    totalAmount: 17.50,
    deliveryFee: 4.00,
    status: "Preparing" as string,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
  }
];

const defaultOrderItems = [
  { id: "item-1", orderId: "ord-1", foodItemId: "food-1", foodItemName: "Classic Fluffy Pancakes", foodItemImage: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&q=80&w=600", quantity: 2, price: 8.50 },
  { id: "item-2", orderId: "ord-1", foodItemId: "food-2", foodItemName: "Poached Egg Avocado Toast", foodItemImage: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&q=80&w=600", quantity: 1, price: 9.50 },
  { id: "item-3", orderId: "ord-2", foodItemId: "food-3", foodItemName: "Crispy Spicy Chicken Burger", foodItemImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600", quantity: 1, price: 12.50 },
];

const defaultAddresses = [
  { id: "addr-1", customerId: "usr-customer", location: "Kilimani Estate", address: "Yaya Center Area, Block B Flat 4A", notes: "Call when arriving at the gate, please keep it warm." },
  { id: "addr-2", customerId: "usr-customer", location: "Westlands", address: "Raphta Road, Villa Marina Apt 12", notes: "Please leave with the security guard at reception." }
];

interface DBState {
  categories: typeof defaultCategories;
  foodItems: typeof defaultFoodItems;
  users: typeof defaultUsers;
  reviews: typeof defaultReviews;
  orders: typeof defaultOrders;
  orderItems: typeof defaultOrderItems;
  addresses: typeof defaultAddresses;
  activeSessionUserId: string;
}

const initialDb: DBState = {
  categories: defaultCategories,
  foodItems: defaultFoodItems,
  users: defaultUsers,
  reviews: defaultReviews,
  orders: defaultOrders,
  orderItems: defaultOrderItems,
  addresses: defaultAddresses,
  activeSessionUserId: "usr-customer", // Start as John Doe Customer
};

// Help load & save DB safely
function loadDb(): DBState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to load db.json, using defaults.", e);
  }
  saveDb(initialDb);
  return initialDb;
}

function saveDb(db: DBState): boolean {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Failed to write db.json", e);
    return false;
  }
}

// ==========================================
// API CONTROLLERS
// ==========================================

// Global context DB reference
let DB = loadDb();

// 0. Supabase Connection Status API
app.get("/api/supabase/status", async (req, res) => {
  await checkSupabaseConnection();
  res.json({
    isConfigured: isSupabaseConfigured,
    isConnected: isSupabaseConnected,
    error: supabaseError,
    url: process.env.SUPABASE_URL || null,
    schemaSql: schemaSql,
  });
});

// Force manual database sync from JSON file to connected Supabase
app.post("/api/supabase/sync", async (req, res) => {
  await checkSupabaseConnection();
  if (!isSupabaseConnected) {
    return res.status(400).json({ error: "Supabase is not connected. Please verify credentials." });
  }
  const client = getSupabaseClient();
  if (!client) {
    return res.status(500).json({ error: "Could not initialize client." });
  }

  try {
    // Re-seed all tables directly from current DB state
    console.log("[Issa Kitchen] Manual Sync: Clearing existing records...");
    await client.from("addresses").delete().neq("id", "");
    await client.from("order_items").delete().neq("id", "");
    await client.from("orders").delete().neq("id", "");
    await client.from("reviews").delete().neq("id", "");
    await client.from("users").delete().neq("id", "");
    await client.from("food_items").delete().neq("id", "");
    await client.from("categories").delete().neq("id", "");

    console.log("[Issa Kitchen] Manual Sync: Writing local categories...", DB.categories.length);
    if (DB.categories.length) await client.from("categories").insert(DB.categories);
    if (DB.foodItems.length) await client.from("food_items").insert(DB.foodItems);
    if (DB.users.length) await client.from("users").insert(DB.users);
    if (DB.reviews.length) await client.from("reviews").insert(DB.reviews);
    if (DB.orders.length) await client.from("orders").insert(DB.orders);
    if (DB.orderItems.length) await client.from("order_items").insert(DB.orderItems);
    if (DB.addresses.length) await client.from("addresses").insert(DB.addresses);

    res.json({ success: true, message: "Manual synchronization executed successfully. All local data is now active in Supabase." });
  } catch (e: any) {
    console.error("Manual sync failed:", e);
    res.status(500).json({ error: "Failed to upload local tables: " + e.message });
  }
});

// 1. Session & Auth API
app.get("/api/auth/session", async (req, res) => {
  try {
    const list = await getUsers();
    const user = list.find(u => u.id === DB.activeSessionUserId);
    if (!user) {
      return res.status(404).json({ error: "No active session user" });
    }
    res.json(user);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/auth/switch-role", async (req, res) => {
  const { userId } = req.body;
  try {
    const list = await getUsers();
    const user = list.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    DB.activeSessionUserId = userId;
    saveDb(DB);
    res.json({ success: true, user });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email } = req.body;
  try {
    const list = await getUsers();
    const user = list.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: "Invalid email address or password" });
    }
    DB.activeSessionUserId = user.id;
    saveDb(DB);
    res.json({ success: true, user });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, phone, role } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: "Please fill out all required profile fields." });
  }
  try {
    const list = await getUsers();
    const existing = list.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: "A user with this email already exists." });
    }
    const newUser = {
      id: "usr-" + Math.random().toString(36).substr(2, 9),
      name,
      email,
      phone,
      role: (role || "customer") as "customer" | "admin",
      createdAt: new Date().toISOString(),
    };
    await createUserInDb(newUser);
    DB.activeSessionUserId = newUser.id;
    saveDb(DB);
    res.json({ success: true, user: newUser });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/auth/profile/update", async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const updated = await updateUserInDb(DB.activeSessionUserId, { name, email, phone });
    if (!updated) {
      return res.status(404).json({ error: "User profile not found." });
    }
    res.json({ success: true, user: updated });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 2. Categories API
app.get("/api/categories", async (req, res) => {
  try {
    const list = await getCategories();
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/admin/categories", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Category name is required" });
  const newCat = {
    id: "cat-" + Math.random().toString(36).substr(2, 9),
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    createdAt: new Date().toISOString()
  };
  try {
    await createCategoryInDb(newCat);
    res.status(201).json(newCat);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/admin/categories/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "";
  try {
    const updated = await updateCategoryInDb(id, name, slug);
    if (!updated) return res.status(404).json({ error: "Category not found" });
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/admin/categories/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await deleteCategoryInDb(id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 3. Food Items API
app.get("/api/food-items", async (req, res) => {
  try {
    const list = await getFoodItems();
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/admin/food-items", async (req, res) => {
  const { name, categoryId, description, price, image, preparationTime, isFeatured, isPopular, isAvailable } = req.body;
  if (!name || !price || !categoryId) {
    return res.status(400).json({ error: "Name, Price, and Category are required" });
  }
  const newItem = {
    id: "food-" + Math.random().toString(36).substr(2, 9),
    categoryId,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: description || "",
    price: Number(price),
    image: image || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=600",
    preparationTime: Number(preparationTime) || 12,
    isFeatured: !!isFeatured,
    isPopular: !!isPopular,
    isAvailable: isAvailable !== false,
    createdAt: new Date().toISOString()
  };
  try {
    await createFoodItemInDb(newItem);
    res.status(201).json(newItem);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/admin/food-items/:id", async (req, res) => {
  const { id } = req.params;
  const u = req.body;
  const updatedFields: any = {};
  if (u.name) updatedFields.name = u.name;
  if (u.categoryId) updatedFields.categoryId = u.categoryId;
  if (u.description !== undefined) updatedFields.description = u.description;
  if (u.price !== undefined) updatedFields.price = Number(u.price);
  if (u.image) updatedFields.image = u.image;
  if (u.preparationTime !== undefined) updatedFields.preparationTime = Number(u.preparationTime);
  if (u.isFeatured !== undefined) updatedFields.isFeatured = !!u.isFeatured;
  if (u.isPopular !== undefined) updatedFields.isPopular = !!u.isPopular;
  if (u.isAvailable !== undefined) updatedFields.isAvailable = !!u.isAvailable;

  try {
    const updated = await updateFoodItemInDb(id, updatedFields);
    if (!updated) return res.status(404).json({ error: "Food item not found" });
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/admin/food-items/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await deleteFoodItemInDb(id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 4. Orders API
app.get("/api/orders", async (req, res) => {
  try {
    const usersList = await getUsers();
    const currUser = usersList.find(u => u.id === DB.activeSessionUserId);
    if (!currUser) return res.json([]);
    
    const ordersList = await getOrders();
    if (currUser.role === "admin") {
      const sorted = [...ordersList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.json(sorted);
    } else {
      const subset = ordersList.filter(o => o.customerId === currUser.id);
      const sorted = [...subset].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.json(sorted);
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/orders/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const ordersList = await getOrders();
    const orderItemsList = await getOrderItems();
    const order = ordersList.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    const items = orderItemsList.filter(i => i.orderId === id);
    res.json({ ...order, items });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/orders", async (req, res) => {
  const {
    customerName,
    customerPhone,
    customerEmail,
    deliveryLocation,
    deliveryAddress,
    deliveryNotes,
    paymentMethod,
    cartItems,
    deliveryFee,
  } = req.body;

  if (!cartItems || !cartItems.length) {
    return res.status(400).json({ error: "Your shopping cart is empty." });
  }
  if (!customerName || !customerPhone || !deliveryLocation || !deliveryAddress) {
    return res.status(400).json({ error: "Please complete all required delivery information." });
  }

  try {
    const ordersList = await getOrders();
    const orderNumSeed = ordersList.length + 1001;
    const orderId = "ord-" + Math.random().toString(36).substr(2, 9);
    
    let subtotal = 0;
    const createdItems = cartItems.map((c: any) => {
      subtotal += c.foodItem.price * c.quantity;
      return {
        id: "item-" + Math.random().toString(36).substr(2, 9),
        orderId: orderId,
        foodItemId: c.foodItem.id,
        foodItemName: c.foodItem.name,
        foodItemImage: c.foodItem.image,
        quantity: Number(c.quantity),
        price: Number(c.foodItem.price),
      };
    });

    const dFee = Number(deliveryFee) || 3.00;
    const grandTotal = subtotal + dFee;

    const newOrder = {
      id: orderId,
      orderNumber: `IK-${orderNumSeed}`,
      customerId: DB.activeSessionUserId,
      customerName,
      customerPhone,
      customerEmail: customerEmail || "",
      deliveryLocation,
      deliveryAddress,
      deliveryNotes: deliveryNotes || "",
      paymentMethod,
      totalAmount: Number(grandTotal),
      deliveryFee: Number(dFee),
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    await createOrderInDb(newOrder, createdItems);

    // Auto save address
    const addressesList = await getAddresses();
    const existsAddr = addressesList.find(a => a.customerId === DB.activeSessionUserId && a.address === deliveryAddress);
    if (!existsAddr) {
      await createAddressInDb({
        id: "addr-" + Math.random().toString(36).substr(2, 9),
        customerId: DB.activeSessionUserId,
        location: deliveryLocation,
        address: deliveryAddress,
        notes: deliveryNotes || "",
      });
    }

    res.status(201).json({ ...newOrder, items: createdItems });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/orders/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updated = await updateOrderStatusInDb(id, status);
    if (!updated) return res.status(404).json({ error: "Order not found" });
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/orders/:id/advance-sim", async (req, res) => {
  const { id } = req.params;
  try {
    const ordersList = await getOrders();
    const order = ordersList.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const states = ["Pending", "Confirmed", "Preparing", "Ready", "Out for Delivery", "Delivered"];
    const curr = order.status;
    const currIdx = states.indexOf(curr);
    
    let nextStatus = curr;
    if (currIdx !== -1 && currIdx < states.length - 1) {
      nextStatus = states[currIdx + 1];
      await updateOrderStatusInDb(id, nextStatus);
    }
    res.json({ ...order, status: nextStatus });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 5. Reviews API with AI-assisted sentiment moderation
app.get("/api/reviews", async (req, res) => {
  try {
    const usersList = await getUsers();
    const currUser = usersList.find(u => u.id === DB.activeSessionUserId);
    const isAdmin = currUser?.role === "admin";
    
    const reviewsList = await getReviews();
    if (isAdmin) {
      res.json(reviewsList);
    } else {
      res.json(reviewsList.filter(r => r.isApproved));
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/reviews", async (req, res) => {
  const { foodItemId, foodItemName, rating, review } = req.body;
  if (!foodItemId || !rating || !review) {
    return res.status(400).json({ error: "Required review contents are missing." });
  }

  try {
    const usersList = await getUsers();
    const currUser = usersList.find(u => u.id === DB.activeSessionUserId);
    const customerName = currUser ? currUser.name : "Anonymous Guest";

    const newReviewId = "rev-" + Math.random().toString(36).substr(2, 9);
    
    const reviewObj = {
      id: newReviewId,
      customerId: DB.activeSessionUserId,
      customerName,
      foodItemId,
      foodItemName,
      rating: Number(rating),
      review,
      isApproved: true,
      createdAt: new Date().toISOString(),
    };

    // Perform AI Moderation via Gemini API
    const aiClient = getGeminiClient();
    let aiExplanation = "Auto-approved instantly.";
    
    if (aiClient) {
      try {
        const prompt = `
          You are a content safety and reviews assistant for "Issa Kitchen" restaurant.
          Analyze the following customer food review.
          Rule out spam, bad words, severe insults, and highly irrelevant gibberish.
          Output ONLY a JSON format structured precisely like this example:
          {
            "isSafe": true,
            "explanation": "Friendly constructive sentiment detected."
          }
          
          Review to analyze: "${review}"
        `;
        const aiResponse = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });
        const resText = aiResponse.text ? aiResponse.text.trim() : "{}";
        const result = JSON.parse(resText);
        if (result && typeof result.isSafe === "boolean") {
          reviewObj.isApproved = result.isSafe;
          aiExplanation = result.explanation || (result.isSafe ? "AI Safe" : "AI Filtered");
        }
      } catch (e) {
        console.error("Gemini AI Review moderation failed, falling back to auto-approval.", e);
        aiExplanation = "Auto-approved (Gemini API fallback)";
      }
    }

    await createReviewInDb(reviewObj);
    res.status(201).json({ review: reviewObj, aiStatus: aiExplanation });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/reviews/:id/approve", async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await updateReviewApprovalInDb(id, true);
    if (!updated) return res.status(404).json({ error: "Review not found" });
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/reviews/:id/reject", async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await updateReviewApprovalInDb(id, false);
    if (!updated) return res.status(404).json({ error: "Review not found" });
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/reviews/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await deleteReviewInDb(id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Addresses helper APIs
app.get("/api/addresses", async (req, res) => {
  try {
    const addressesList = await getAddresses();
    const userAddr = addressesList.filter(a => a.customerId === DB.activeSessionUserId);
    res.json(userAddr);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 6. Customers list with calculated dynamic totals (Admin dashboard section)
app.get("/api/admin/customers", async (req, res) => {
  try {
    const usersList = await getUsers();
    const ordersList = await getOrders();
    const result = usersList
      .filter(u => u.role === "customer")
      .map(cust => {
        const custOrders = ordersList.filter(o => o.customerId === cust.id);
        const totalSpend = custOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        return {
          id: cust.id,
          name: cust.name,
          email: cust.email,
          phone: cust.phone,
          totalOrders: custOrders.length,
          totalSpend: Math.round(totalSpend * 100) / 100,
          createdAt: cust.createdAt,
        };
      });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 7. Dynamic Business Analytics API
app.get("/api/admin/analytics", async (req, res) => {
  try {
    const ordersList = await getOrders();
    const usersList = await getUsers();
    const foodItemsList = await getFoodItems();
    const orderItemsList = await getOrderItems();

    const totalOrders = ordersList.length;
    const totalRevenue = ordersList
      .filter(o => o.status !== "Cancelled")
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalCustomers = usersList.filter(u => u.role === "customer").length;
    const totalFoodItems = foodItemsList.length;
    const activeOrders = ordersList.filter(o => o.status !== "Delivered" && o.status !== "Cancelled").length;

    const dishCounts: Record<string, { name: string; count: number; revenue: number }> = {};
    orderItemsList.forEach(item => {
      if (!dishCounts[item.foodItemId]) {
        dishCounts[item.foodItemId] = { name: item.foodItemName, count: 0, revenue: 0 };
      }
      dishCounts[item.foodItemId].count += Number(item.quantity);
      dishCounts[item.foodItemId].revenue += Number(item.price) * Number(item.quantity);
    });
    const popularDishes = Object.values(dishCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();

    const dailySales = last7Days.map(dateStr => {
      const dayOrders = ordersList.filter(o => o.createdAt.startsWith(dateStr) && o.status !== "Cancelled");
      const amount = dayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const count = dayOrders.length;
      const dayName = new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" });
      return { date: dateStr, day: dayName, revenue: Math.round(amount * 100) / 100, count };
    });

    res.json({
      summary: {
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCustomers,
        totalFoodItems,
        activeOrders,
      },
      popularDishes,
      dailySales,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Reset Database API (easy debugging and demoing)
app.post("/api/reset-db", async (req, res) => {
  DB = {
    categories: defaultCategories,
    foodItems: defaultFoodItems,
    users: defaultUsers,
    reviews: defaultReviews,
    orders: defaultOrders,
    orderItems: defaultOrderItems,
    addresses: defaultAddresses,
    activeSessionUserId: "usr-customer",
  };
  saveDb(DB);

  // If Supabase is connected, wipe and re-seed it too!
  await checkSupabaseConnection();
  if (isSupabaseConnected) {
    try {
      const client = getSupabaseClient();
      await client.from("addresses").delete().neq("id", "");
      await client.from("order_items").delete().neq("id", "");
      await client.from("orders").delete().neq("id", "");
      await client.from("reviews").delete().neq("id", "");
      await client.from("users").delete().neq("id", "");
      await client.from("food_items").delete().neq("id", "");
      await client.from("categories").delete().neq("id", "");
      
      await client.from("categories").insert(defaultCategories);
      await client.from("food_items").insert(defaultFoodItems);
      await client.from("users").insert(defaultUsers);
      await client.from("reviews").insert(defaultReviews);
      await client.from("orders").insert(defaultOrders);
      await client.from("order_items").insert(defaultOrderItems);
      await client.from("addresses").insert(defaultAddresses);
    } catch (err) {
      console.error("Failed to reset connected Supabase db:", err);
    }
  }

  res.json({ success: true, message: "Database reset to original seed data loaded successfully." });
});


// ==========================================
// STATIC FRONTEND SERVING & DEVELOPMENT
// ==========================================

async function startServer() {
  console.log("[Issa Kitchen] Checking database connections...");
  const connected = await checkSupabaseConnection();
  if (connected) {
    console.log("[Issa Kitchen] 🟢 Supabase connection verified successfully.");
    await seedSupabaseIfNeeded();
  } else {
    console.log("[Issa Kitchen] ⚪ Supabase not active or not configured. Running local fallback (db.json).");
  }

  // Vite integration for dev assets or static deployment
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Mount Vite middlewares after custom API endpoints
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Issa Kitchen] Server running on http://localhost:${PORT}`);
  });
}

startServer();
