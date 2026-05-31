import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { 
  UserProfile, Category, FoodItem, Order, OrderItem, Review, 
  CustomerAddress, CartItem, OrderStatus, PaymentMethod 
} from "./types";

interface StoreContextType {
  // Session
  user: UserProfile | null;
  addresses: CustomerAddress[];
  switchUserRole: (role: "customer" | "admin") => Promise<void>;
  updateProfile: (name: string, email: string, phone: string) => Promise<boolean>;
  
  // Navigation / Views
  activeTab: string; // 'home' | 'menu' | 'reviews' | 'dashboard' | 'admin-dashboard' | 'checkout' | 'track-order'
  setActiveTab: (tab: string) => void;
  adminSubTab: "analytics" | "orders" | "foods" | "categories" | "customers" | "reviews" | "supabase";
  setAdminSubTab: (tab: "analytics" | "orders" | "foods" | "categories" | "customers" | "reviews" | "supabase") => void;
  selectedFoodId: string | null;
  setSelectedFoodId: (id: string | null) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;

  // Catalog
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
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Session
  const [user, setUser] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);

  // Navigation
  const [activeTab, setActiveTabState] = useState<string>("home");
  const [adminSubTab, setAdminSubTab] = useState<"analytics" | "orders" | "foods" | "categories" | "customers" | "reviews" | "supabase">("analytics");
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Catalog
  const [categories, setCategories] = useState<Category[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("popular");

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);

  // Admin Data
  const [adminCustomers, setAdminCustomers] = useState<any[]>([]);
  const [adminAnalytics, setAdminAnalytics] = useState<any>(null);

  // Loading States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // ==========================================
  // VIEW MANAGER (intercepts for analytics)
  // ==========================================
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ==========================================
  // DATA HARVESTING / API SYNCING
  // ==========================================
  
  const fetchSession = async () => {
    try {
      const r = await fetch("/api/auth/session");
      if (r.ok) {
        const u = await r.json();
        setUser(u);
        return u;
      }
    } catch (e) {
      console.error("Error fetching session:", e);
    }
    return null;
  };

  const fetchCatalogData = async () => {
    try {
      const [catsRes, itemsRes, revsRes, addrsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/food-items"),
        fetch("/api/reviews"),
        fetch("/api/addresses"),
      ]);
      
      if (catsRes.ok) setCategories(await catsRes.json());
      if (itemsRes.ok) setFoodItems(await itemsRes.json());
      if (revsRes.ok) setReviews(await revsRes.json());
      if (addrsRes.ok) setAddresses(await addrsRes.json());
    } catch (e) {
      console.error("Error fetching catalog data:", e);
    }
  };

  const fetchOrdersAndAdmin = async (currentUser: UserProfile | null) => {
    if (!currentUser) return;
    try {
      const ordersRes = await fetch("/api/orders");
      if (ordersRes.ok) setOrders(await ordersRes.json());

      if (currentUser.role === "admin") {
        const [custRes, analRes] = await Promise.all([
          fetch("/api/admin/customers"),
          fetch("/api/admin/analytics"),
        ]);
        if (custRes.ok) setAdminCustomers(await custRes.json());
        if (analRes.ok) setAdminAnalytics(await analRes.json());
      }
    } catch (e) {
      console.error("Error fetching orders & admin data:", e);
    }
  };

  const loadAllData = async () => {
    setIsLoading(true);
    const u = await fetchSession();
    await fetchCatalogData();
    if (u) {
      await fetchOrdersAndAdmin(u);
    }
    setIsLoading(false);
  };

  const reloadCatalog = async () => {
    await fetchCatalogData();
    if (user) {
      await fetchOrdersAndAdmin(user);
    }
  };

  useEffect(() => {
    loadAllData();
    
    // Load physical cart items from local storage on mount
    try {
      const cached = localStorage.getItem("issa_kitchen_cart");
      if (cached) setCart(JSON.parse(cached));
    } catch (e) {
      console.error("Failed to restore cart", e);
    }
  }, []);

  // Sync cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem("issa_kitchen_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to cash cart", e);
    }
  }, [cart]);

  // ==========================================
  // SESSION CONTROLLERS
  // ==========================================
  
  const switchUserRole = async (role: "customer" | "admin") => {
    setIsActionLoading(true);
    // Determine target userId
    const targetId = role === "admin" ? "usr-admin" : "usr-customer";
    try {
      const r = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetId }),
      });
      if (r.ok) {
        const res = await r.json();
        setUser(res.user);
        
        // Push user to their respective screen
        if (role === "admin") {
          setActiveTab("admin-dashboard");
        } else {
          setActiveTab("home");
        }
        
        // Refresh orders & statistics
        await fetchOrdersAndAdmin(res.user);
        await reloadCatalog();
      }
    } catch (e) {
      console.error("Error switching role:", e);
    } finally {
      setIsActionLoading(false);
    }
  };

  const updateProfile = async (name: string, email: string, phone: string) => {
    setIsActionLoading(true);
    try {
      const r = await fetch("/api/auth/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      });
      if (r.ok) {
        const res = await r.json();
        setUser(res.user);
        setIsActionLoading(false);
        return true;
      }
    } catch (e) {
      console.error("Error updating profile:", e);
    }
    setIsActionLoading(false);
    return false;
  };

  // ==========================================
  // CART ACTIONS
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

    // Simple flat delivery charge unless empty
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
  // ORDERS WORKFLOW
  // ==========================================
  
  const createOrder = async (formData: any) => {
    setIsActionLoading(true);
    const { subtotal } = getCartTotals();
    if (subtotal === 0) return null;

    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          cartItems: cart,
          deliveryFee: 3.00,
        }),
      });

      if (r.ok) {
        const order = await r.json();
        setOrders((prev) => [order, ...prev]);
        clearCart();
        setSelectedOrderId(order.id);
        setActiveTab("track-order");
        
        // Refresh address book
        const addrRes = await fetch("/api/addresses");
        if (addrRes.ok) setAddresses(await addrRes.json());
        
        setIsActionLoading(false);
        return order;
      } else {
        const err = await r.json();
        alert(err.error || "Failed to submit order. Please try again.");
      }
    } catch (e) {
      console.error("Error creating order:", e);
    } finally {
      setIsActionLoading(false);
    }
    return null;
  };

  const advanceTrackingSim = async (orderId: string) => {
    try {
      const r = await fetch(`/api/orders/${orderId}/advance-sim`, {
        method: "POST"
      });
      if (r.ok) {
        const updated = await r.json();
        // Update local state orders list
        setOrders((prev) => prev.map(o => o.id === orderId ? { ...o, status: updated.status } : o));
      }
    } catch (e) {
      console.error("Error advancing order simulation:", e);
    }
  };

  // ==========================================
  // REVIEWS INTERACTIONS
  // ==========================================

  const submitReview = async (foodItemId: string, foodItemName: string, rating: number, review: string) => {
    setIsActionLoading(true);
    try {
      const r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodItemId, foodItemName, rating, review }),
      });
      if (r.ok) {
        const res = await r.json();
        // Insert into state if approved
        if (res.review.isApproved) {
          setReviews((prev) => [res.review, ...prev]);
        }
        await reloadCatalog();
        setIsActionLoading(false);
        return res;
      }
    } catch (e) {
      console.error("Error posting review:", e);
    }
    setIsActionLoading(false);
    return { review: {} as Review, aiStatus: "Failure submitting review" };
  };

  // ==========================================
  // ADMINISTRATOR CONTROLS (CRUD)
  // ==========================================

  const createCategory = async (name: string) => {
    try {
      const r = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (r.ok) {
        await reloadCatalog();
      }
    } catch (e) {
      console.error("Error creating category:", e);
    }
  };

  const updateCategory = async (id: string, name: string) => {
    try {
      const r = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (r.ok) {
        await reloadCatalog();
      }
    } catch (e) {
      console.error("Error updating category:", e);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const r = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE"
      });
      if (r.ok) {
        await reloadCatalog();
      }
    } catch (e) {
      console.error("Error deleting category:", e);
    }
  };

  const createFoodItem = async (food: any) => {
    try {
      const r = await fetch("/api/admin/food-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(food),
      });
      if (r.ok) {
        await reloadCatalog();
      }
    } catch (e) {
      console.error("Error adding food item:", e);
    }
  };

  const updateFoodItem = async (id: string, food: any) => {
    try {
      const r = await fetch(`/api/admin/food-items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(food),
      });
      if (r.ok) {
        await reloadCatalog();
      }
    } catch (e) {
      console.error("Error updating food item:", e);
    }
  };

  const deleteFoodItem = async (id: string) => {
    try {
      const r = await fetch(`/api/admin/food-items/${id}`, {
        method: "DELETE"
      });
      if (r.ok) {
        await reloadCatalog();
      }
    } catch (e) {
      console.error("Error deleting food item:", e);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const r = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (r.ok) {
        // Find inside local list
        setOrders((prev) => prev.map(o => o.id === orderId ? { ...o, status } : o));
        // Refresh admin metrics
        const analRes = await fetch("/api/admin/analytics");
        if (analRes.ok) setAdminAnalytics(await analRes.json());
      }
    } catch (e) {
      console.error("Error changing order status:", e);
    }
  };

  const moderateReview = async (reviewId: string, approve: boolean) => {
    try {
      const action = approve ? "approve" : "reject";
      const r = await fetch(`/api/reviews/${reviewId}/${action}`, {
        method: "PUT"
      });
      if (r.ok) {
        await reloadCatalog();
      }
    } catch (e) {
      console.error("Error moderating review:", e);
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      const r = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE"
      });
      if (r.ok) {
        await reloadCatalog();
      }
    } catch (e) {
      console.error("Error deleting review:", e);
    }
  };

  const resetDatabase = async () => {
    setIsActionLoading(true);
    try {
      const r = await fetch("/api/reset-db", {
        method: "POST"
      });
      if (r.ok) {
        alert("Success: Database reset to original state with core categories, foods, orders, and reviews!");
        // Clear cart to avoid mismatch
        clearCart();
        await loadAllData();
      }
    } catch (e) {
      console.error("Error resetting Database:", e);
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
