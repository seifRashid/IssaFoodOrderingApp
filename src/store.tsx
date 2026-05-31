import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { 
  UserProfile, Category, FoodItem, Order, OrderItem, Review, 
  CustomerAddress, CartItem, OrderStatus, PaymentMethod 
} from "./types";
import {
  defaultCategories,
  defaultFoodItems,
  defaultUsers,
  defaultReviews,
  defaultOrders,
  defaultOrderItems,
  defaultAddresses
} from "./data/seedData";

interface StoreContextType {
  // Session / Auth Management
  user: UserProfile | null;
  addresses: CustomerAddress[];
  switchUserRole: (role: "customer" | "admin") => Promise<void>;
  updateProfile: (name: string, email: string, phone: string) => Promise<boolean>;
  signUpUser: (email: string, password: string, name: string, phone: string, isAdmin?: boolean) => Promise<any>;
  signInUser: (email: string, password: string) => Promise<any>;
  signOutUser: () => Promise<void>;
  
  // Navigation / Views
  activeTab: string; // 'home' | 'menu' | 'reviews' | 'dashboard' | 'admin-dashboard' | 'checkout' | 'track-order'
  setActiveTab: (tab: string) => void;
  adminSubTab: "analytics" | "orders" | "foods" | "categories" | "customers" | "reviews" | "supabase";
  setAdminSubTab: (tab: "analytics" | "orders" | "foods" | "categories" | "customers" | "reviews" | "supabase") => void;
  selectedFoodId: string | null;
  setSelectedFoodId: (id: string | null) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;

  // Catalog Data
  categories: Category[];
  foodItems: FoodItem[];
  reviews: Review[];
  activeCategory: string; // 'all' or categoryId
  setActiveCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortBy: string; // 'price-asc' | 'price-desc' | 'popular' | 'newest'
  setSortBy: (s: string) => void;
  reloadCatalog: () => Promise<void>;

  // Cart
  cart: CartItem[];
  addToCart: (item: FoodItem, qty?: number) => void;
  removeFromCart: (foodItemId: string) => void;
  updateCartQuantity: (foodItemId: string, qty: number) => void;
  clearCart: () => void;
  getCartTotals: () => { subtotal: number; deliveryFee: number; total: number; itemCount: number };

  // Orders
  orders: Order[];
  createOrder: (formData: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    deliveryLocation: string;
    deliveryAddress: string;
    deliveryNotes: string;
    paymentMethod: PaymentMethod;
  }) => Promise<Order | null>;
  advanceTrackingSim: (orderId: string) => Promise<void>;

  // Admin Data & Management
  adminCustomers: Array<{ id: string; name: string; email: string; phone: string; totalOrders: number; totalSpend: number; createdAt: string }>;
  adminAnalytics: {
    summary: { totalOrders: number; totalRevenue: number; totalCustomers: number; totalFoodItems: number; activeOrders: number };
    popularDishes: Array<{ name: string; count: number; revenue: number }>;
    dailySales: Array<{ date: string; day: string; revenue: number; count: number }>;
  } | null;
  
  // Admin Operations
  createCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  createFoodItem: (food: Omit<FoodItem, "id" | "slug" | "createdAt">) => Promise<void>;
  updateFoodItem: (id: string, food: Partial<FoodItem>) => Promise<void>;
  deleteFoodItem: (id: string) => Promise<void>;
  
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  moderateReview: (reviewId: string, approve: boolean) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  submitReview: (foodItemId: string, foodItemName: string, rating: number, review: string) => Promise<{ review: Review; aiStatus: string }>;

  // Utilities
  isLoading: boolean;
  isActionLoading: boolean;
  resetDatabase: () => Promise<void>;
  localOnly: boolean;
  setLocalOnly: (val: boolean) => void;
  isSupabaseActive: boolean;
  supabaseConfig: { url: string; key: string };
  saveSupabaseConfig: (url: string, key: string) => Promise<boolean>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Local storage utility helpers
const getLocalData = (key: string, defaultValue: any) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setLocalData = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

// Client-side analytics and customer calculators
const calculateClientCustomers = (usersList: any[], ordersList: any[]) => {
  return usersList
    .filter(u => u.role === "customer")
    .map(cust => {
      const custOrders = ordersList.filter(o => o.customerId === cust.id);
      const totalSpend = custOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      return {
        id: cust.id,
        name: cust.name,
        email: cust.email,
        phone: cust.phone || "",
        totalOrders: custOrders.length,
        totalSpend: Math.round(totalSpend * 100) / 100,
        createdAt: cust.createdAt,
      };
    });
};

const calculateClientAnalytics = (ordersList: any[], foodItemsList: any[], usersList: any[]) => {
  const totalOrders = ordersList.length;
  const totalRevenue = ordersList
    .filter(o => o.status !== "Cancelled")
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const totalCustomers = usersList.filter(u => u.role === "customer").length;
  const totalFoodItems = foodItemsList.length;
  const activeOrders = ordersList.filter(o => o.status !== "Delivered" && o.status !== "Cancelled").length;

  const orderItemsList = getLocalData("ik_order_items", defaultOrderItems);

  const dishCounts: Record<string, { name: string; count: number; revenue: number }> = {};
  orderItemsList.forEach((item: any) => {
    const parentOrder = ordersList.find((o: any) => o.id === item.orderId);
    if (parentOrder && parentOrder.status !== "Cancelled") {
      if (!dishCounts[item.foodItemId]) {
        dishCounts[item.foodItemId] = { name: item.foodItemName, count: 0, revenue: 0 };
      }
      dishCounts[item.foodItemId].count += Number(item.quantity);
      dishCounts[item.foodItemId].revenue += Number(item.price) * Number(item.quantity);
    }
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
    const dayOrders = ordersList.filter((o: any) => o.createdAt.startsWith(dateStr) && o.status !== "Cancelled");
    const amount = dayOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
    const count = dayOrders.length;
    const dayName = new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" });
    return { date: dateStr, day: dayName, revenue: Math.round(amount * 100) / 100, count };
  });

  return {
    summary: {
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCustomers,
      totalFoodItems,
      activeOrders,
    },
    popularDishes,
    dailySales,
  };
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Session Configuration & Live Client Engine
  const [supabaseConfig, setSupabaseConfig] = useState(() => {
    const url = (import.meta as any).env.VITE_SUPABASE_URL || localStorage.getItem("VITE_SUPABASE_URL") || "";
    const key = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || localStorage.getItem("VITE_SUPABASE_ANON_KEY") || "";
    return { url, key };
  });

  const [localOnly, setLocalOnly] = useState<boolean>(() => {
    const url = (import.meta as any).env.VITE_SUPABASE_URL || localStorage.getItem("VITE_SUPABASE_URL") || "";
    const key = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || localStorage.getItem("VITE_SUPABASE_ANON_KEY") || "";
    return !(url && key);
  });

  const globalSupabaseClient = useMemo<SupabaseClient | null>(() => {
    if (supabaseConfig.url && supabaseConfig.key) {
      try {
        return createClient(supabaseConfig.url, supabaseConfig.key);
      } catch (e) {
        console.error("Failed to construct child Supabase client connection:", e);
      }
    }
    return null;
  }, [supabaseConfig]);

  const isSupabaseActive = !!globalSupabaseClient;

  // Global Context state variables
  const [user, setUser] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);

  // Navigation state monitors
  const [activeTab, setActiveTabState] = useState<string>("home");
  const [adminSubTab, setAdminSubTab] = useState<"analytics" | "orders" | "foods" | "categories" | "customers" | "reviews" | "supabase">("analytics");
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Catalog State Elements
  const [categories, setCategories] = useState<Category[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("popular");

  // Cart elements
  const [cart, setCart] = useState<CartItem[]>([]);

  // Orders State variables
  const [orders, setOrders] = useState<Order[]>([]);

  // Admin specific lists & visualizations
  const [adminCustomers, setAdminCustomers] = useState<any[]>([]);
  const [adminAnalytics, setAdminAnalytics] = useState<any>(null);

  // Layout spinners
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Scroll tab routing utility
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Helper: Save Credentials inside browser
  const saveSupabaseConfig = async (url: string, key: string) => {
    if (url && key) {
      localStorage.setItem("VITE_SUPABASE_URL", url);
      localStorage.setItem("VITE_SUPABASE_ANON_KEY", key);
      setSupabaseConfig({ url, key });
      setLocalOnly(false);
      return true;
    } else {
      localStorage.removeItem("VITE_SUPABASE_URL");
      localStorage.removeItem("VITE_SUPABASE_ANON_KEY");
      setSupabaseConfig({ url: "", key: "" });
      setLocalOnly(true);
      return false;
    }
  };

  // Helper mock data fallback load
  const loadLocalOnlyState = (forceUser?: UserProfile) => {
    setLocalOnly(true);
    const localCats = getLocalData("ik_categories", defaultCategories);
    const localFoods = getLocalData("ik_food_items", defaultFoodItems);
    const localReviews = getLocalData("ik_reviews", defaultReviews);
    const localAddresses = getLocalData("ik_addresses", defaultAddresses);
    const localOrders = getLocalData("ik_orders", defaultOrders);
    const localUser = forceUser || getLocalData("ik_user", defaultUsers[1]); // John Doe

    setLocalData("ik_categories", localCats);
    setLocalData("ik_food_items", localFoods);
    setLocalData("ik_reviews", localReviews);
    setLocalData("ik_addresses", localAddresses);
    setLocalData("ik_orders", localOrders);
    setLocalData("ik_user", localUser);

    setCategories(localCats);
    setFoodItems(localFoods);
    setReviews(localReviews);
    setAddresses(localAddresses);
    setOrders(localOrders);
    setUser(localUser);

    const calculatedCust = calculateClientCustomers(defaultUsers, localOrders);
    setAdminCustomers(calculatedCust);
    const calculatedAnal = calculateClientAnalytics(localOrders, localFoods, defaultUsers);
    setAdminAnalytics(calculatedAnal);
  };

  // ==========================================
  // DIRECT SUPABASE ACTION LAYER (CRUD & AUTH)
  // ==========================================

  const fetchCatalogDirect = useCallback(async () => {
    if (!globalSupabaseClient) return;
    try {
      const [catsRes, itemsRes, revsRes] = await Promise.all([
        globalSupabaseClient.from("categories").select("*").order("name"),
        globalSupabaseClient.from("food_items").select("*").order("createdAt", { ascending: false }),
        globalSupabaseClient.from("reviews").select("*").order("createdAt", { ascending: false }),
      ]);

      if (!catsRes.error && catsRes.data) setCategories(catsRes.data);
      if (!itemsRes.error && itemsRes.data) setFoodItems(itemsRes.data);
      if (!revsRes.error && revsRes.data) setReviews(revsRes.data);
    } catch (err) {
      console.error("fetchCatalogDirect database request crash:", err);
    }
  }, [globalSupabaseClient]);

  const fetchOrdersAndAdminDirect = useCallback(async (currentUser: UserProfile) => {
    if (!globalSupabaseClient) return;
    try {
      if (currentUser.role === "customer") {
        const [ordersRes, addrsRes] = await Promise.all([
          globalSupabaseClient.from("orders").select("*").eq("customerId", currentUser.id).order("createdAt", { ascending: false }),
          globalSupabaseClient.from("addresses").select("*").eq("customerId", currentUser.id),
        ]);

        if (!ordersRes.error && ordersRes.data) setOrders(ordersRes.data);
        if (!addrsRes.error && addrsRes.data) setAddresses(addrsRes.data);
      } 
      else if (currentUser.role === "admin") {
        const [ordersRes, addrsRes, usersRes, foodItemsRes, orderItemsRes] = await Promise.all([
          globalSupabaseClient.from("orders").select("*").order("createdAt", { ascending: false }),
          globalSupabaseClient.from("addresses").select("*"),
          globalSupabaseClient.from("users").select("*"),
          globalSupabaseClient.from("food_items").select("*"),
          globalSupabaseClient.from("order_items").select("*"),
        ]);

        if (!ordersRes.error && ordersRes.data) {
          setOrders(ordersRes.data);
          
          const allUsers = usersRes.data || [];
          const allFoods = foodItemsRes.data || [];
          const allOrderItems = orderItemsRes.data || [];

          // Save whole order items context in offline cache to support reordering operations lookup
          setLocalData("ik_order_items", allOrderItems);

          // Calculate Customers List data
          const adminCustList = allUsers
            .filter(u => u.role === "customer")
            .map(cust => {
              const custOrders = ordersRes.data.filter(o => o.customerId === cust.id);
              const totalSpend = custOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
              return {
                id: cust.id,
                name: cust.name,
                email: cust.email,
                phone: cust.phone || "",
                totalOrders: custOrders.length,
                totalSpend: Math.round(totalSpend * 100) / 100,
                createdAt: cust.createdAt,
              };
            });
          setAdminCustomers(adminCustList);

          // Calculate Business statistics metrics
          const totalOrders = ordersRes.data.length;
          const totalRevenue = ordersRes.data
            .filter(o => o.status !== "Cancelled")
            .reduce((sum, o) => sum + Number(o.totalAmount), 0);
          const totalCustomers = allUsers.filter(u => u.role === "customer").length;
          const totalFoodItems = allFoods.length;
          const activeOrders = ordersRes.data.filter(o => o.status !== "Delivered" && o.status !== "Cancelled").length;

          const dishCounts: Record<string, { name: string; count: number; revenue: number }> = {};
          allOrderItems.forEach((item: any) => {
            const parentOrder = ordersRes.data.find((o: any) => o.id === item.orderId);
            if (parentOrder && parentOrder.status !== "Cancelled") {
              if (!dishCounts[item.foodItemId]) {
                dishCounts[item.foodItemId] = { name: item.foodItemName || "Dish", count: 0, revenue: 0 };
              }
              dishCounts[item.foodItemId].count += Number(item.quantity || 1);
              dishCounts[item.foodItemId].revenue += Number(item.price || 0) * Number(item.quantity || 1);
            }
          });
          const popularDishesList = Object.values(dishCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

          const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split("T")[0];
          }).reverse();

          const dailySalesList = last7Days.map(dateStr => {
            const dayOrders = ordersRes.data.filter((o: any) => o.createdAt.startsWith(dateStr) && o.status !== "Cancelled");
            const amount = dayOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
            const count = dayOrders.length;
            const dayName = new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" });
            return { date: dateStr, day: dayName, revenue: Math.round(amount * 100) / 100, count };
          });

          setAdminAnalytics({
            summary: {
              totalOrders,
              totalRevenue: Math.round(totalRevenue * 100) / 100,
              totalCustomers,
              totalFoodItems,
              activeOrders,
            },
            popularDishes: popularDishesList,
            dailySales: dailySalesList,
          });
        }
        if (!addrsRes.error && addrsRes.data) setAddresses(addrsRes.data);
      }
    } catch (err) {
      console.error("fetchOrdersAndAdminDirect database query crash:", err);
    }
  }, [globalSupabaseClient]);

  // Handle Supabase Auth State synchronization dynamically
  useEffect(() => {
    if (!globalSupabaseClient) {
      loadLocalOnlyState();
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const checkInitialSession = async () => {
      const { data: { session } } = await globalSupabaseClient.auth.getSession();
      if (session?.user) {
        const { data: profile } = await globalSupabaseClient
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          const u: UserProfile = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone || "",
            role: profile.role || "customer",
            createdAt: profile.createdAt || session.user.created_at
          };
          setUser(u);
          fetchOrdersAndAdminDirect(u);
        }
      }
      fetchCatalogDirect();
      setIsLoading(false);
    };

    checkInitialSession();

    const { data: { subscription } } = globalSupabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await globalSupabaseClient!
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          const u: UserProfile = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone || "",
            role: profile.role || "customer",
            createdAt: profile.createdAt || session.user.created_at
          };
          setUser(u);
          fetchOrdersAndAdminDirect(u);
        } else {
          // Auto create user profile if Auth user signed up but database trigger was delayed
          const defaultName = session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User";
          const defaultPhone = session.user.user_metadata?.phone || "";
          const targetRole = session.user.email?.toLowerCase().includes("admin") ? "admin" : "customer";

          const newProfile = {
            id: session.user.id,
            name: defaultName,
            email: session.user.email || "",
            phone: defaultPhone,
            role: targetRole,
            createdAt: new Date().toISOString()
          };

          await globalSupabaseClient!.from("users").upsert(newProfile);
          setUser(newProfile);
          fetchOrdersAndAdminDirect(newProfile);
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [globalSupabaseClient, fetchCatalogDirect, fetchOrdersAndAdminDirect]);

  // Trigger catalog reloading upon state modifications
  const reloadCatalog = async () => {
    if (localOnly) {
      loadLocalOnlyState(user || undefined);
      return;
    }
    await fetchCatalogDirect();
    if (user) await fetchOrdersAndAdminDirect(user);
  };

  // Restore cart on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem("issa_kitchen_cart");
      if (cached) setCart(JSON.parse(cached));
    } catch (e) {
      console.error("Failed to restore cart", e);
    }
  }, []);

  // Sync cart details in browser offline storage
  useEffect(() => {
    try {
      localStorage.setItem("issa_kitchen_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart", e);
    }
  }, [cart]);

  // ==========================================
  // AUTH METHODS
  // ==========================================

  const signUpUser = async (email: string, password: string, name: string, phone: string, isAdmin = false) => {
    if (!globalSupabaseClient) throw new Error("Supabase is not connected.");
    setIsActionLoading(true);

    try {
      const { data, error } = await globalSupabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone }
        }
      });

      if (error) throw error;
      const authUser = data.user;
      if (!authUser) throw new Error("Authentication user row generation failed.");

      const role = isAdmin ? "admin" : "customer";
      const { error: profileErr } = await globalSupabaseClient.from("users").upsert({
        id: authUser.id,
        name,
        email,
        phone,
        role,
        createdAt: new Date().toISOString()
      });

      if (profileErr) console.warn("Public users table profile row insert delayed:", profileErr.message);
      return authUser;
    } finally {
      setIsActionLoading(false);
    }
  };

  const signInUser = async (email: string, password: string) => {
    if (!globalSupabaseClient) throw new Error("Supabase is not connected.");
    setIsActionLoading(true);

    try {
      // Automatic helper: Onboarding default credentials check to provision empty Supabase schemas instantly
      if (email === "admin@issa.com" && password === "admin123") {
        const { data: searchAuth } = await globalSupabaseClient.auth.signInWithPassword({ email, password }).catch(() => ({ data: { user: null } }));
        if (!searchAuth?.user) {
          console.log("Auto-provisioning missing default admin profile credentials...");
          await signUpUser("admin@issa.com", "admin123", "Chef Issa", "+254 711 000000", true).catch(() => null);
        }
      }

      const { data, error } = await globalSupabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.user;
    } finally {
      setIsActionLoading(false);
    }
  };

  const signOutUser = async () => {
    if (globalSupabaseClient) {
      await globalSupabaseClient.auth.signOut();
    }
    setUser(null);
    setOrders([]);
    setAddresses([]);
    setAdminCustomers([]);
    setAdminAnalytics(null);
    setActiveTab("home");
  };

  const switchUserRole = async (role: "customer" | "admin") => {
    setIsActionLoading(true);
    if (localOnly) {
      const targetId = role === "admin" ? "usr-admin" : "usr-customer";
      const matchedUser = defaultUsers.find(u => u.id === targetId) || defaultUsers[1];
      const updatedUser: UserProfile = { ...matchedUser, role };
      setUser(updatedUser);
      setLocalData("ik_user", updatedUser);
      
      if (role === "admin") {
        setActiveTab("admin-dashboard");
      } else {
        setActiveTab("home");
      }
      
      loadLocalOnlyState(updatedUser);
      setIsActionLoading(false);
      return;
    }

    if (globalSupabaseClient && user) {
      const { error } = await globalSupabaseClient.from("users").update({ role }).eq("id", user.id);
      if (!error) {
        setUser(prev => prev ? { ...prev, role } : null);
        if (role === "admin") {
          setActiveTab("admin-dashboard");
        } else {
          setActiveTab("home");
        }
      }
    }
    setIsActionLoading(false);
  };

  const updateProfile = async (name: string, email: string, phone: string) => {
    setIsActionLoading(true);
    if (localOnly) {
      const updatedUser: UserProfile = { ...user!, name, email, phone };
      setUser(updatedUser);
      setLocalData("ik_user", updatedUser);
      setIsActionLoading(false);
      return true;
    }

    if (globalSupabaseClient && user) {
      const { error } = await globalSupabaseClient.from("users").update({ name, email, phone }).eq("id", user.id);
      if (!error) {
        setUser(prev => prev ? { ...prev, name, email, phone } : null);
        setIsActionLoading(false);
        return true;
      }
    }
    setIsActionLoading(false);
    return false;
  };

  // ==========================================
  // CART OPERATIONS
  // ==========================================

  const addToCart = (item: FoodItem, qty = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.foodItem.id === item.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += qty;
        return updated;
      } else {
        return [...prev, { foodItem: item, quantity: qty }];
      }
    });
  };

  const removeFromCart = (foodItemId: string) => {
    setCart((prev) => prev.filter((c) => c.foodItem.id !== foodItemId));
  };

  const updateCartQuantity = (foodItemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(foodItemId);
      return;
    }
    setCart((prev) =>
      prev.map((c) =>
        c.foodItem.id === foodItemId ? { ...c, quantity: qty } : c
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("issa_kitchen_cart");
  };

  const getCartTotals = () => {
    let subtotal = 0;
    let itemCount = 0;
    cart.forEach((c) => {
      subtotal += c.foodItem.price * c.quantity;
      itemCount += c.quantity;
    });

    const deliveryFee = itemCount > 0 ? 3.00 : 0.00;
    const total = subtotal + deliveryFee;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      deliveryFee: Math.round(deliveryFee * 100) / 100,
      total: Math.round(total * 100) / 100,
      itemCount,
    };
  };

  // ==========================================
  // ORDERS MANAGEMENT
  // ==========================================

  const createOrder = async (formData: any) => {
    setIsActionLoading(true);
    const { subtotal } = getCartTotals();
    if (subtotal === 0) return null;

    if (localOnly || !globalSupabaseClient) {
      // Local Only offline mock checkout (same functionality)
      const orderId = `ord-${Date.now()}`;
      const orderNumber = `IK-${Math.floor(1000 + Math.random() * 9000)}`;
      const newOrder: Order = {
        id: orderId,
        orderNumber,
        customerId: user?.id || "usr-customer",
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        deliveryLocation: formData.deliveryLocation,
        deliveryAddress: formData.deliveryAddress,
        deliveryNotes: formData.deliveryNotes || "",
        paymentMethod: formData.paymentMethod,
        totalAmount: Math.round((subtotal + 3.00) * 100) / 100,
        deliveryFee: 3.00,
        status: "Pending",
        createdAt: new Date().toISOString(),
      };

      const existingItems = getLocalData("ik_order_items", defaultOrderItems);
      const newOrderItems = cart.map((c, i) => ({
        id: `item-${Date.now()}-${i}`,
        orderId: orderId,
        foodItemId: c.foodItem.id,
        foodItemName: c.foodItem.name,
        foodItemImage: c.foodItem.image,
        quantity: c.quantity,
        price: c.foodItem.price,
      }));
      setLocalData("ik_order_items", [...newOrderItems, ...existingItems]);

      const existingOrders = getLocalData("ik_orders", defaultOrders);
      const updatedOrders = [newOrder, ...existingOrders];
      setLocalData("ik_orders", updatedOrders);

      setOrders(updatedOrders);
      clearCart();
      setSelectedOrderId(orderId);
      setActiveTab("track-order");
      setIsActionLoading(false);
      return newOrder;
    }

    // Direct Supabase Orders Sync Insertion
    const orderId = `ord-${Date.now()}`;
    const orderNumber = `IK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      id: orderId,
      orderNumber,
      customerId: user?.id || "usr-customer",
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerEmail: formData.customerEmail,
      deliveryLocation: formData.deliveryLocation,
      deliveryAddress: formData.deliveryAddress,
      deliveryNotes: formData.deliveryNotes || "",
      paymentMethod: formData.paymentMethod,
      totalAmount: Math.round((subtotal + 3.00) * 100) / 100,
      deliveryFee: 3.00,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    const newOrderItems = cart.map((c, i) => ({
      id: `item-${Date.now()}-${i}`,
      orderId: orderId,
      foodItemId: c.foodItem.id,
      foodItemName: c.foodItem.name,
      foodItemImage: c.foodItem.image,
      quantity: c.quantity,
      price: c.foodItem.price,
    }));

    try {
      const { error: ordErr } = await globalSupabaseClient.from("orders").insert(newOrder);
      if (ordErr) throw new Error("Order write failed: " + ordErr.message);

      const { error: itemsErr } = await globalSupabaseClient.from("order_items").insert(newOrderItems);
      if (itemsErr) {
        await globalSupabaseClient.from("orders").delete().eq("id", orderId);
        throw new Error("Order items write failed: " + itemsErr.message);
      }

      await globalSupabaseClient.from("addresses").insert({
        id: `addr-${Date.now()}`,
        customerId: user?.id || "usr-customer",
        location: formData.deliveryLocation,
        address: formData.deliveryAddress,
        notes: formData.deliveryNotes || ""
      });

      clearCart();
      setSelectedOrderId(orderId);
      setActiveTab("track-order");
      await fetchOrdersAndAdminDirect(user!);
      return newOrder as Order;
    } catch (e: any) {
      alert("Failed to submit cloud order: " + e.message);
    } finally {
      setIsActionLoading(false);
    }
    return null;
  };

  const advanceTrackingSim = async (orderId: string) => {
    const orderStages: OrderStatus[] = ["Pending", "Confirmed", "Preparing", "Ready", "Out for Delivery", "Delivered"];

    if (localOnly) {
      const existingOrders = getLocalData("ik_orders", defaultOrders);
      const matchedOrder = existingOrders.find((o: any) => o.id === orderId);
      if (matchedOrder) {
        const currentIdx = orderStages.indexOf(matchedOrder.status);
        const nextStatus = currentIdx > -1 && currentIdx < orderStages.length - 1 ? orderStages[currentIdx + 1] : matchedOrder.status;
        matchedOrder.status = nextStatus;
        setLocalData("ik_orders", existingOrders);
        setOrders([...existingOrders]);
        
        const calculatedAnal = calculateClientAnalytics(existingOrders, foodItems, defaultUsers);
        setAdminAnalytics(calculatedAnal);
      }
      return;
    }

    if (globalSupabaseClient) {
      const { data: matchedOrder } = await globalSupabaseClient.from("orders").select("status").eq("id", orderId).single();
      if (matchedOrder) {
        const currentIdx = orderStages.indexOf(matchedOrder.status);
        const nextStatus = currentIdx > -1 && currentIdx < orderStages.length - 1 ? orderStages[currentIdx + 1] : matchedOrder.status;
        const { error } = await globalSupabaseClient.from("orders").update({ status: nextStatus }).eq("id", orderId);
        if (!error && user) {
          await fetchOrdersAndAdminDirect(user);
        }
      }
    }
  };

  // ==========================================
  // REVIEWS OPERATIONS
  // ==========================================

  const submitReview = async (foodItemId: string, foodItemName: string, rating: number, reviewContent: string) => {
    setIsActionLoading(true);
    const newReview = {
      id: `rev-${Date.now()}`,
      customerId: user?.id || "usr-customer",
      customerName: user?.name || "John Doe",
      foodItemId,
      foodItemName,
      rating,
      review: reviewContent,
      isApproved: true, 
      createdAt: new Date().toISOString(),
    };

    if (localOnly || !globalSupabaseClient) {
      const existingReviews = getLocalData("ik_reviews", defaultReviews);
      const updatedReviews = [newReview, ...existingReviews];
      setLocalData("ik_reviews", updatedReviews);
      setReviews(updatedReviews);
      setIsActionLoading(false);
      return { review: newReview as Review, aiStatus: "AI Moderation instant-approval bypassed (local model fallback)" };
    }

    try {
      const { error } = await globalSupabaseClient.from("reviews").insert(newReview);
      if (error) throw error;
      await fetchCatalogDirect();
      setIsActionLoading(false);
      return { review: newReview as Review, aiStatus: "Approved & Synced successfully with cloud database!" };
    } catch (err: any) {
      alert("Review write aborted: " + err.message);
    } finally {
      setIsActionLoading(false);
    }
    return { review: {} as Review, aiStatus: "Failure submitting review" };
  };

  // ==========================================
  // ADMINISTRATOR CONTROLS (CRUD OPERATIONS)
  // ==========================================

  const createCategory = async (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const newCat = {
      id: `cat-${Date.now()}`,
      name,
      slug,
      createdAt: new Date().toISOString()
    };

    if (localOnly || !globalSupabaseClient) {
      const existingCats = getLocalData("ik_categories", defaultCategories);
      const updated = [...existingCats, newCat];
      setLocalData("ik_categories", updated);
      setCategories(updated);
      return;
    }

    const { error } = await globalSupabaseClient.from("categories").insert(newCat);
    if (!error) await reloadCatalog();
  };

  const updateCategory = async (id: string, name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, "-");

    if (localOnly || !globalSupabaseClient) {
      const existingCats = getLocalData("ik_categories", defaultCategories);
      const updated = existingCats.map((c: any) => c.id === id ? { ...c, name, slug } : c);
      setLocalData("ik_categories", updated);
      setCategories(updated);
      return;
    }

    const { error } = await globalSupabaseClient.from("categories").update({ name, slug }).eq("id", id);
    if (!error) await reloadCatalog();
  };

  const deleteCategory = async (id: string) => {
    if (localOnly || !globalSupabaseClient) {
      const existingCats = getLocalData("ik_categories", defaultCategories);
      const updated = existingCats.filter((c: any) => c.id !== id);
      setLocalData("ik_categories", updated);
      setCategories(updated);
      return;
    }

    const { error } = await globalSupabaseClient.from("categories").delete().eq("id", id);
    if (!error) await reloadCatalog();
  };

  const createFoodItem = async (food: any) => {
    const slug = food.name.toLowerCase().replace(/\s+/g, "-");
    const newFood = {
      ...food,
      id: `food-${Date.now()}`,
      slug,
      createdAt: new Date().toISOString()
    };

    if (localOnly || !globalSupabaseClient) {
      const existingFoods = getLocalData("ik_food_items", defaultFoodItems);
      const updated = [...existingFoods, newFood];
      setLocalData("ik_food_items", updated);
      setFoodItems(updated);
      
      const calculatedAnal = calculateClientAnalytics(orders, updated, defaultUsers);
      setAdminAnalytics(calculatedAnal);
      return;
    }

    const { error } = await globalSupabaseClient.from("food_items").insert(newFood);
    if (!error) await reloadCatalog();
  };

  const updateFoodItem = async (id: string, food: any) => {
    const patch = { ...food };
    if (food.name) {
      patch.slug = food.name.toLowerCase().replace(/\s+/g, "-");
    }

    if (localOnly || !globalSupabaseClient) {
      const existingFoods = getLocalData("ik_food_items", defaultFoodItems);
      const updated = existingFoods.map((f: any) => f.id === id ? { ...f, ...patch } : f);
      setLocalData("ik_food_items", updated);
      setFoodItems(updated);
      
      const calculatedAnal = calculateClientAnalytics(orders, updated, defaultUsers);
      setAdminAnalytics(calculatedAnal);
      return;
    }

    const { error } = await globalSupabaseClient.from("food_items").update(patch).eq("id", id);
    if (!error) await reloadCatalog();
  };

  const deleteFoodItem = async (id: string) => {
    if (localOnly || !globalSupabaseClient) {
      const existingFoods = getLocalData("ik_food_items", defaultFoodItems);
      const updated = existingFoods.filter((f: any) => f.id !== id);
      setLocalData("ik_food_items", updated);
      setFoodItems(updated);
      
      const calculatedAnal = calculateClientAnalytics(orders, updated, defaultUsers);
      setAdminAnalytics(calculatedAnal);
      return;
    }

    const { error } = await globalSupabaseClient.from("food_items").delete().eq("id", id);
    if (!error) await reloadCatalog();
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (localOnly || !globalSupabaseClient) {
      const existingOrders = getLocalData("ik_orders", defaultOrders);
      const updated = existingOrders.map((o: any) => o.id === orderId ? { ...o, status } : o);
      setLocalData("ik_orders", updated);
      setOrders(updated);
      
      const calculatedAnal = calculateClientAnalytics(updated, foodItems, defaultUsers);
      setAdminAnalytics(calculatedAnal);
      return;
    }

    const { error } = await globalSupabaseClient.from("orders").update({ status }).eq("id", orderId);
    if (!error && user) await fetchOrdersAndAdminDirect(user);
  };

  const moderateReview = async (reviewId: string, approve: boolean) => {
    if (localOnly || !globalSupabaseClient) {
      const existingReviews = getLocalData("ik_reviews", defaultReviews);
      const updated = existingReviews.map((r: any) => r.id === reviewId ? { ...r, isApproved: approve } : r);
      setLocalData("ik_reviews", updated);
      setReviews(updated);
      return;
    }

    const { error } = await globalSupabaseClient.from("reviews").update({ isApproved: approve }).eq("id", reviewId);
    if (!error) await reloadCatalog();
  };

  const deleteReview = async (reviewId: string) => {
    if (localOnly || !globalSupabaseClient) {
      const existingReviews = getLocalData("ik_reviews", defaultReviews);
      const updated = existingReviews.filter((r: any) => r.id !== reviewId);
      setLocalData("ik_reviews", updated);
      setReviews(updated);
      return;
    }

    const { error } = await globalSupabaseClient.from("reviews").delete().eq("id", reviewId);
    if (!error) await reloadCatalog();
  };

  // Truncate and re-seed database with Issa Kitchen content
  const resetDatabase = async () => {
    setIsActionLoading(true);

    if (localOnly || !globalSupabaseClient) {
      localStorage.removeItem("ik_categories");
      localStorage.removeItem("ik_food_items");
      localStorage.removeItem("ik_reviews");
      localStorage.removeItem("ik_addresses");
      localStorage.removeItem("ik_orders");
      localStorage.removeItem("ik_order_items");
      localStorage.removeItem("ik_user");
      clearCart();
      loadLocalOnlyState();
      setIsActionLoading(false);
      alert("Success: Local Database reset back to design defaults!");
      return;
    }

    try {
      const trigger = confirm("Are you sure you want to completely erase your entire remote Supabase database and seed it with ISSA KITCHEN defaults? This will truncate categories, orders, customers, reviews, and addresses.");
      if (!trigger) {
        setIsActionLoading(false);
        return;
      }

      await Promise.all([
        globalSupabaseClient.from("addresses").delete().neq("id", ""),
        globalSupabaseClient.from("order_items").delete().neq("id", ""),
        globalSupabaseClient.from("orders").delete().neq("id", ""),
        globalSupabaseClient.from("reviews").delete().neq("id", ""),
        globalSupabaseClient.from("users").delete().neq("id", ""),
        globalSupabaseClient.from("food_items").delete().neq("id", ""),
        globalSupabaseClient.from("categories").delete().neq("id", ""),
      ]);

      await globalSupabaseClient.from("categories").insert(defaultCategories);
      await globalSupabaseClient.from("food_items").insert(defaultFoodItems);
      
      const formattedUsers = defaultUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        createdAt: u.createdAt
      }));
      await globalSupabaseClient.from("users").insert(formattedUsers);
      await globalSupabaseClient.from("reviews").insert(defaultReviews);
      await globalSupabaseClient.from("orders").insert(defaultOrders);
      await globalSupabaseClient.from("order_items").insert(defaultOrderItems);
      await globalSupabaseClient.from("addresses").insert(defaultAddresses);

      alert("Success: Live cloud Supabase Postgres schema fully seeded & connected!");
      await reloadCatalog();
    } catch (err: any) {
      alert("Failed database seed trigger: " + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        user,
        addresses,
        switchUserRole,
        updateProfile,
        signUpUser,
        signInUser,
        signOutUser,

        activeTab,
        setActiveTab,
        adminSubTab,
        setAdminSubTab,
        selectedFoodId,
        setSelectedFoodId,
        selectedOrderId,
        setSelectedOrderId,

        categories,
        foodItems,
        reviews,
        activeCategory,
        setActiveCategory,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        reloadCatalog,

        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        getCartTotals,

        orders,
        createOrder,
        advanceTrackingSim,

        adminCustomers,
        adminAnalytics,

        createCategory,
        updateCategory,
        deleteCategory,
        createFoodItem,
        updateFoodItem,
        deleteFoodItem,
        updateOrderStatus,
        moderateReview,
        deleteReview,
        submitReview,

        isLoading,
        isActionLoading,
        resetDatabase,
        localOnly,
        setLocalOnly,
        isSupabaseActive,
        supabaseConfig,
        saveSupabaseConfig,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used inside a StoreProvider");
  }
  return context;
}
