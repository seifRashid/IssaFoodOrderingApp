import React, { useState, useMemo, useEffect } from "react";
import { useStore } from "../store";
import { OrderStatus, FoodItem, Category } from "../types";
import { 
  TrendingUp, DollarSign, Users, ShoppingCart, Activity, 
  Trash2, Edit, Plus, Check, X, ShieldAlert, Star, Coffee, 
  Tag, ListOrdered, Calendar, UserCheck, RefreshCw, BarChart3, ChevronDown,
  Database, Copy
} from "lucide-react";
import SupabaseSyncPanel from "./SupabaseSyncPanel";

export default function AdminDashboard() {
  const {
    categories,
    foodItems,
    orders,
    reviews,
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
    reloadCatalog,
    adminSubTab,
    setAdminSubTab
  } = useStore();

  // Filter query triggers
  const [orderQuery, setOrderQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  // Forms / Modals States
  const [showCatModal, setShowCatModal] = useState<"add" | "edit" | null>(null);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [catNameInput, setCatNameInput] = useState("");

  const [showFoodModal, setShowFoodModal] = useState<"add" | "edit" | null>(null);
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [foodForm, setFoodForm] = useState({
    name: "",
    categoryId: "",
    description: "",
    price: "",
    image: "",
    preparationTime: "10",
    isFeatured: false,
    isPopular: false,
    isAvailable: true
  });

  // Load Categories on mount in case we need dropdowns
  useEffect(() => {
    reloadCatalog();
  }, []);

  // Filter orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];
    if (orderStatusFilter !== "all") {
      result = result.filter(o => o.status === orderStatusFilter);
    }
    if (orderQuery.trim()) {
      const q = orderQuery.toLowerCase();
      result = result.filter(
        o => 
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q)
      );
    }
    return result;
  }, [orders, orderStatusFilter, orderQuery]);

  // ==========================================
  // ACTIONS DISPATCHERS
  // ==========================================
  
  const handleCatMutation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameInput.trim()) return;
    if (showCatModal === "add") {
      await createCategory(catNameInput);
    } else if (showCatModal === "edit" && selectedCatId) {
      await updateCategory(selectedCatId, catNameInput);
    }
    setShowCatModal(null);
    setCatNameInput("");
    setSelectedCatId("");
  };

  const openEditCat = (cat: Category) => {
    setSelectedCatId(cat.id);
    setCatNameInput(cat.name);
    setShowCatModal("edit");
  };

  const handleFoodMutation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodForm.name || !foodForm.price || !foodForm.categoryId) {
      alert("Name, price, and category are required.");
      return;
    }

    const payload = {
      name: foodForm.name,
      categoryId: foodForm.categoryId,
      description: foodForm.description,
      price: Number(foodForm.price),
      image: foodForm.image,
      preparationTime: Number(foodForm.preparationTime),
      isFeatured: foodForm.isFeatured,
      isPopular: foodForm.isPopular,
      isAvailable: foodForm.isAvailable
    };

    if (showFoodModal === "add") {
      await createFoodItem(payload);
    } else if (showFoodModal === "edit" && selectedFoodId) {
      await updateFoodItem(selectedFoodId, payload);
    }

    setShowFoodModal(null);
    setSelectedFoodId("");
    setFoodForm({
      name: "",
      categoryId: "",
      description: "",
      price: "",
      image: "",
      preparationTime: "10",
      isFeatured: false,
      isPopular: false,
      isAvailable: true
    });
  };

  const openEditFood = (food: FoodItem) => {
    setSelectedFoodId(food.id);
    setFoodForm({
      name: food.name,
      categoryId: food.categoryId,
      description: food.description,
      price: String(food.price),
      image: food.image,
      preparationTime: String(food.preparationTime),
      isFeatured: food.isFeatured,
      isPopular: food.isPopular,
      isAvailable: food.isAvailable
    });
    setShowFoodModal("edit");
  };

  // Safe checks for analytics values in case they are loading
  const stats = adminAnalytics?.summary || {
    totalOrders: orders.length,
    totalRevenue: orders.filter(o => o.status !== "Cancelled").reduce((s, o) => s + o.totalAmount, 0),
    totalCustomers: adminCustomers.length || 1,
    totalFoodItems: foodItems.length,
    activeOrders: orders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled").length
  };

  const salesPoints = adminAnalytics?.dailySales || [];
  const topDishes = adminAnalytics?.popularDishes || [];

  return (
    <div className="py-6 space-y-8" id="admin-dashboard-panel">
      
      {/* 1. Statistics Cards strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        
        {/* Total Revenue Card */}
        <div className="bg-white border border-stone-200 p-4 rounded-2xl flex items-center gap-3 shadow-xs col-span-2 lg:col-span-1 text-left">
          <div className="p-2.5 bg-green-50 text-green-700 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-stone-400 font-bold tracking-wider block uppercase">Total Revenue</span>
            <span className="text-xl font-black text-stone-900 font-sans tracking-tight block leading-none mt-1">
              ${stats.totalRevenue.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="bg-white border border-stone-200 p-4 rounded-2xl flex items-center gap-3 shadow-xs text-left">
          <div className="p-2.5 bg-stone-100 text-stone-850 rounded-xl">
            <ShoppingCart className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[10px] text-stone-450 font-bold tracking-wider block uppercase">Total Orders</span>
            <span className="text-xl font-black text-stone-900 font-sans tracking-tight block leading-none mt-1">
              {stats.totalOrders}
            </span>
          </div>
        </div>

        {/* Active Deliveries */}
        <div className="bg-white border border-stone-200 p-4 rounded-2xl flex items-center gap-3 shadow-xs text-left">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl animate-pulse">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[10px] text-amber-800 font-bold tracking-wider block uppercase">Active Orders</span>
            <span className="text-xl font-black text-amber-700 font-sans tracking-tight block leading-none mt-1">
              {stats.activeOrders}
            </span>
          </div>
        </div>

        {/* Registered customers */}
        <div className="bg-white border border-stone-200 p-4 rounded-2xl flex items-center gap-3 shadow-xs text-left">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
            <Users className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[10px] text-blue-800 font-bold tracking-wider block uppercase">Customers</span>
            <span className="text-xl font-black text-stone-900 font-sans tracking-tight block leading-none mt-1">
              {stats.totalCustomers}
            </span>
          </div>
        </div>

        {/* Total Food Catalog items */}
        <div className="bg-white border border-stone-200 p-4 rounded-2xl flex items-center gap-3 shadow-xs text-left">
          <div className="p-2.5 bg-stone-50 border border-stone-150 text-stone-600 rounded-xl font-mono">
            <span>{stats.totalFoodItems}</span>
          </div>
          <div>
            <span className="text-[10px] text-stone-400 font-bold tracking-wider block uppercase">Dishes Catalog</span>
            <span className="text-sm font-bold text-stone-850 block leading-none mt-1">
              Active Menus
            </span>
          </div>
        </div>

      </div>

      {/* 2. Admin Horizontal Tabs selector bar */}
      <div className="bg-stone-100 p-1.5 rounded-2xl border border-stone-200 flex flex-wrap gap-1 shadow-sm">
        <button
          onClick={() => setAdminSubTab("analytics")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition cursor-pointer flex items-center gap-1.5 ${
            adminSubTab === "analytics" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> Sales Analytics
        </button>
        <button
          onClick={() => setAdminSubTab("orders")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition cursor-pointer flex items-center gap-1.5 ${
            adminSubTab === "orders" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" /> Live Orders ({stats.activeOrders})
        </button>
        <button
          onClick={() => setAdminSubTab("foods")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition cursor-pointer flex items-center gap-1.5 ${
            adminSubTab === "foods" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
          }`}
        >
          <Coffee className="w-3.5 h-3.5" /> Food Management
        </button>
        <button
          onClick={() => setAdminSubTab("categories")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition cursor-pointer flex items-center gap-1.5 ${
            adminSubTab === "categories" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
          }`}
        >
          <Tag className="w-3.5 h-3.5" /> Category CRUD
        </button>
        <button
          onClick={() => setAdminSubTab("customers")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition cursor-pointer flex items-center gap-1.5 ${
            adminSubTab === "customers" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Customers Directory
        </button>
        <button
          onClick={() => setAdminSubTab("reviews")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition cursor-pointer flex items-center gap-1.5 ${
            adminSubTab === "reviews" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
          }`}
        >
          <Star className="w-3.5 h-3.5" /> Reviews Mod ({reviews.length})
        </button>
        <button
          onClick={() => setAdminSubTab("supabase")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition cursor-pointer flex items-center gap-1.5 ${
            adminSubTab === "supabase" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
          }`}
        >
          <Database className="w-3.5 h-3.5" /> Database Sync
        </button>
      </div>

      {/* 3. Sub-Tab Panel Views */}
      
      {/* Tab 3.1: Sales charts and analytics (Highly visual custom SVG graphs) */}
      {adminSubTab === "analytics" && (
        <div className="space-y-6 text-left" id="panel-analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Custom Daily Sales Bar Grap (SVG layout designed for React 19) */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <div className="border-b border-stone-150 pb-3">
                <h3 className="font-bold text-stone-950 flex items-center gap-1 text-base tracking-tight font-sans">
                  <TrendingUp className="w-4.5 h-4.5 text-green-600" /> Daily Sales Trend
                </h3>
                <span className="text-xs text-stone-500">Gross revenue performance over current days</span>
              </div>

              {salesPoints.length > 0 ? (
                <div className="space-y-5">
                  {/* Styled custom vertical layout bars to fit low-resolution and mobile screens too! */}
                  <div className="space-y-3.5 pt-2">
                    {salesPoints.map((pt, i) => {
                      // Max finding
                      const maxVal = Math.max(...salesPoints.map(p => p.revenue), 10);
                      const pct = Math.min((pt.revenue / maxVal) * 100, 100);
                      return (
                        <div key={i} className="flex items-center justify-between text-xs font-mono">
                          <span className="w-12 text-stone-500 font-bold font-sans">{pt.day}</span>
                          <div className="flex-1 mx-4 bg-stone-100 h-6 rounded-lg overflow-hidden border border-stone-150 relative">
                            <div 
                              className="bg-amber-600 h-full rounded-r-md transition-all duration-500 flex items-center justify-end px-2"
                              style={{ width: `${pct}%` }}
                            >
                              {pct > 15 && (
                                <span className="text-[10px] text-white font-black font-mono">
                                  ${pt.revenue.toFixed(0)}
                                </span>
                              )}
                            </div>
                            {pct <= 15 && (
                              <span className="text-[10px] text-stone-600 font-semibold absolute left-2 top-0.5">
                                ${pt.revenue.toFixed(0)}
                              </span>
                            )}
                          </div>
                          <span className="w-14 text-right text-stone-400">{pt.count} Orders</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-stone-450 italic text-center text-xs">
                  Awaiting daily transactions seed logs to visualize chart data...
                </div>
              )}
            </div>

            {/* Top Hit Category popular breakdown */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <div className="border-b border-stone-150 pb-3">
                <h3 className="font-bold text-stone-900 flex items-center gap-1 text-base tracking-tight font-sans">
                  <Star className="w-4.5 h-4.5 text-amber-500" /> Top Popular Dishes
                </h3>
                <span className="text-xs text-stone-500">Most ordered menu items by customers</span>
              </div>

              {topDishes.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {topDishes.map((dish, i) => {
                    const maxQty = Math.max(...topDishes.map(d => d.count), 1);
                    const pct = (dish.count / maxQty) * 100;
                    return (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="w-36 truncate font-medium text-stone-800">{dish.name}</div>
                        <div className="flex-1 mx-3 bg-stone-100 h-4 rounded-md overflow-hidden relative">
                          <div 
                            className="bg-stone-850 h-full rounded-r-md"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="w-14 text-right font-mono font-black text-amber-700">
                          {dish.count} ordered
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-stone-450 text-center text-xs italic">
                  Awaiting order quantities logs to rank menu items...
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Tab 3.2: Order Management */}
      {adminSubTab === "orders" && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden text-left" id="panel-orders">
          <div className="px-6 py-5 border-b border-stone-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-stone-900 font-sans tracking-tight">Active Customer Orders</h3>
              <span className="text-xs text-stone-500">View logs, download reports, and update rider progress.</span>
            </div>
            
            {/* Quick Filter Controls */}
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search orders..."
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                className="bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900 focus:outline-none"
              />
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-stone-700"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Preparing">Preparing</option>
                <option value="Ready">Ready</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-150 text-[10px] text-stone-500 uppercase tracking-wider font-mono">
                  <th className="px-6 py-3.5">Order No</th>
                  <th className="px-6 py-3.5">Customer details</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Status Update</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150 text-xs">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50/50">
                      <td className="px-6 py-4">
                        <span className="font-mono font-black text-stone-900 block">{order.orderNumber}</span>
                        <span className="text-[10px] text-stone-400 font-mono block">
                          {new Date(order.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <strong className="text-stone-900 text-sm font-semibold block">{order.customerName}</strong>
                        <span className="text-stone-500 font-mono text-[11px] block">{order.customerPhone}</span>
                        <span className="text-[10px] text-stone-400 block max-w-44 truncate">{order.deliveryAddress}</span>
                      </td>
                      <td className="px-6 py-4 font-mono font-black text-stone-900">
                        ${order.totalAmount.toFixed(2)}
                        <span className="text-[10px] text-stone-400 block uppercase font-mono">{order.paymentMethod}</span>
                      </td>
                      <td className="px-6 py-4">
                        {/* Selector dropdown to easily change order states */}
                        <div className="relative inline-block w-36">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                            className={`w-full appearance-none border rounded-lg px-2.5 py-1.5 pr-8 font-extrabold text-[11px] uppercase tracking-wider focus:outline-none ${
                              order.status === "Delivered" ? "bg-green-100 text-green-800 border-green-300" :
                              order.status === "Cancelled" ? "bg-red-100 text-red-800 border-red-300" :
                              order.status === "Pending" ? "bg-amber-100 text-amber-800 border-amber-300 animate-pulse" :
                              "bg-blue-105 text-blue-900 border-blue-300"
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Preparing">Preparing</option>
                            <option value="Ready">Ready</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-stone-700 absolute right-2.5 top-2.5 pointer-events-none" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => { updateOrderStatus(order.id, "Cancelled"); }}
                          className="text-stone-450 hover:text-red-700 p-2 hover:bg-stone-100 rounded-lg cursor-pointer"
                          title="Quick Cancel Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-stone-450 italic">
                      No customer orders match search query criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3.3: Foods Management list & Edit Modal */}
      {adminSubTab === "foods" && (
        <div className="space-y-6 text-left" id="panel-foods font-sans">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <div>
              <h3 className="font-bold text-stone-900 text-base">Dishes Catalog</h3>
              <span className="text-xs text-stone-500">Edit, availability toggle, and manage dishes listing.</span>
            </div>
            
            <button
              onClick={() => {
                setShowFoodModal("add");
                setFoodForm({
                  name: "",
                  categoryId: categories[0]?.id || "",
                  description: "",
                  price: "",
                  image: "",
                  preparationTime: "10",
                  isFeatured: false,
                  isPopular: false,
                  isAvailable: true
                });
              }}
              className="bg-stone-900 hover:bg-stone-850 text-white font-bold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Food Item
            </button>
          </div>

          {/* Grid list of foods under manager */}
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden divide-y divide-stone-150">
            {foodItems.map((food) => (
              <div key={food.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 hover:bg-stone-50 transition">
                <img
                  src={food.image}
                  alt={food.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="flex items-center flex-wrap justify-center sm:justify-start gap-1.5 mb-0.5">
                    <strong className="text-stone-900 font-bold block truncate text-sm">{food.name}</strong>
                    <span className="bg-stone-100 text-stone-500 text-[9px] font-mono font-black px-1.5 py-0.5 rounded uppercase">
                      {categories.find(c => c.id === food.categoryId)?.name || "Dish"}
                    </span>
                    {!food.isAvailable && (
                      <span className="bg-red-100 text-red-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                        Unavailable
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 block truncate max-w-md">{food.description}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0 font-sans">
                  <div className="text-center sm:text-right">
                    <span className="font-mono text-sm font-black text-stone-900 block">${food.price.toFixed(2)}</span>
                    <span className="text-[10px] text-stone-400 block font-mono">Prep: {food.preparationTime}m</span>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditFood(food)}
                      className="p-2 bg-stone-100 border border-stone-200 hover:bg-stone-200 rounded-lg text-stone-750 cursor-pointer"
                      title="Edit Dish details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm("Delete this food item?")) deleteFoodItem(food.id); }}
                      className="p-2 bg-stone-50 hover:bg-red-50 hover:border-red-200 border border-stone-200 text-red-600 rounded-lg cursor-pointer"
                      title="Delete dish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ADD / EDIT FOOD ITEMS OVERLAY DIALOG */}
          {showFoodModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 sm:p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => setShowFoodModal(null)}
                  className="absolute top-4 right-4 text-stone-450 hover:text-stone-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-black tracking-tight text-stone-900 mb-4 uppercase">
                  {showFoodModal === "add" ? "Create Food Item" : "Edit Food Item"}
                </h3>

                <form onSubmit={handleFoodMutation} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 col-span-2">
                      <label className="text-xs text-stone-600 font-bold block">Dish Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sizzling Ribeye"
                        value={foodForm.name}
                        onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-900 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-stone-600 font-bold block">Price ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="e.g. 14.50"
                        value={foodForm.price}
                        onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-900 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-stone-600 font-bold block">Category *</label>
                      <select
                        value={foodForm.categoryId}
                        onChange={(e) => setFoodForm({ ...foodForm, categoryId: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-stone-600 font-bold block">Description</label>
                    <textarea
                      placeholder="Enter mouth-watering details..."
                      value={foodForm.description}
                      onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                      rows={2}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-stone-600 font-bold block">Preparation Time (Mins)</label>
                      <input
                        type="number"
                        placeholder="e.g. 15"
                        value={foodForm.preparationTime}
                        onChange={(e) => setFoodForm({ ...foodForm, preparationTime: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-900 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-stone-600 font-bold block">Image Link URL</label>
                      <input
                        type="text"
                        placeholder="e.g. https://images.unsplash.com..."
                        value={foodForm.image}
                        onChange={(e) => setFoodForm({ ...foodForm, image: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Flag Toggles checkboxes */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <label className="flex items-center gap-2 p-2.5 bg-stone-50 border border-stone-200 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={foodForm.isFeatured}
                        onChange={(e) => setFoodForm({ ...foodForm, isFeatured: e.target.checked })}
                        className="w-3.5 h-3.5"
                      />
                      <span className="text-[11px] font-bold text-stone-800">Featured</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-stone-50 border border-stone-200 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={foodForm.isPopular}
                        onChange={(e) => setFoodForm({ ...foodForm, isPopular: e.target.checked })}
                        className="w-3.5 h-3.5"
                      />
                      <span className="text-[11px] font-bold text-stone-800">Popular</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-stone-50 border border-stone-200 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={foodForm.isAvailable}
                        onChange={(e) => setFoodForm({ ...foodForm, isAvailable: e.target.checked })}
                        className="w-3.5 h-3.5"
                      />
                      <span className="text-[11px] font-bold text-stone-800">Available</span>
                    </label>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase py-3 rounded-lg tracking-wider cursor-pointer"
                    >
                      {showFoodModal === "add" ? "Create Hot Item" : "Update Catalog Item"}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Tab 3.4: Categories Management (CRUD) */}
      {adminSubTab === "categories" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left" id="panel-categories font-sans">
          
          <div className="md:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4.5 border-b border-stone-150 flex justify-between items-center bg-stone-50">
              <span className="font-extrabold text-stone-900 text-sm">Dishes Categories list</span>
              <button
                onClick={() => { setShowCatModal("add"); setCatNameInput(""); }}
                className="text-xs text-amber-700 font-black flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-600" /> New Category
              </button>
            </div>

            <div className="divide-y divide-stone-150 text-xs">
              {categories.map((cat) => (
                <div key={cat.id} className="px-6 py-4 flex justify-between items-center hover:bg-stone-50 transition">
                  <div>
                    <strong className="text-sm font-bold text-stone-900 block">{cat.name}</strong>
                    <span className="text-[10px] text-stone-400 font-mono tracking-wider">slug: {cat.slug}</span>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditCat(cat)}
                      className="p-1 px-2 hover:bg-stone-200 rounded-md text-stone-700 border border-stone-200 font-semibold cursor-pointer"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => { if (confirm("Delete this category? Associated items may become orphans.")) deleteCategory(cat.id); }}
                      className="p-1 px-2 hover:bg-red-50 hover:text-red-700 rounded-md text-red-600 border border-stone-200 font-semibold cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-1">
            {showCatModal && (
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <span className="text-xs font-black uppercase tracking-wider block text-stone-900 border-b border-stone-100 pb-2">
                  {showCatModal === "add" ? "Create Category" : "Rename Category"}
                </span>

                <form onSubmit={handleCatMutation} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-stone-600 font-bold block">Category name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Side Mocktails"
                      value={catNameInput}
                      onChange={(e) => setCatNameInput(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 rounded uppercase cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCatModal(null); setCatNameInput(""); setSelectedCatId(""); }}
                      className="flex-1 bg-stone-200 hover:bg-stone-300 text-stone-750 font-bold text-xs py-2 rounded uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 3.5: Customer Directory */}
      {adminSubTab === "customers" && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden text-left" id="panel-customers font-sans">
          <div className="px-6 py-5 border-b border-stone-150">
            <h3 className="font-bold text-stone-900 text-base">Customer Account Ledger</h3>
            <span className="text-xs text-stone-400">Track total orders count, spends, and contact numbers.</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-150 text-[10px] text-stone-500 uppercase tracking-wider font-mono">
                  <th className="px-6 py-3.5">Customer Name</th>
                  <th className="px-6 py-3.5">Phone Ledger</th>
                  <th className="px-6 py-3.5 text-center">Orders Placed</th>
                  <th className="px-6 py-3.5 text-right">Total Amount Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150 text-xs">
                {adminCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-stone-50/50">
                    <td className="px-6 py-4">
                      <strong className="text-stone-900 text-sm font-semibold block">{cust.name}</strong>
                      <span className="text-[10px] text-stone-450 block font-mono">ID: {cust.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-stone-800 font-medium block">{cust.phone}</span>
                      <span className="text-[10px] text-stone-405 font-mono block">{cust.email}</span>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-black text-stone-900">
                      {cust.totalOrders}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-black text-amber-900 text-sm">
                      ${cust.totalSpend.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3.6: Reviews Management */}
      {adminSubTab === "reviews" && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden text-left" id="panel-reviews font-sans">
          <div className="px-6 py-5 border-b border-stone-150">
            <h3 className="font-bold text-stone-900 text-base">Feedback and Reviews moderation</h3>
            <span className="text-xs text-stone-500">Enable, reject, or wipe customer feedback logs from catalog display.</span>
          </div>

          <div className="divide-y divide-stone-150 text-xs">
            {reviews.length > 0 ? (
              reviews.map((rev) => (
                <div key={rev.id} className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-stone-50/50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-stone-900 font-bold block text-sm">{rev.customerName}</strong>
                      <span className="bg-stone-100 border border-stone-200 text-stone-500 font-mono text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase">
                        On: {rev.foodItemName}
                      </span>
                      {rev.isApproved ? (
                        <span className="bg-green-150 text-green-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                          ✓ On Catalog
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                          ⚠️ Hidden Policy Flag
                        </span>
                      )}
                    </div>
                    
                    <p className="text-stone-605 italic text-stone-600 block pl-2 font-medium">
                      "{rev.review}"
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-sans ml-auto sm:ml-0.5">
                    {/* Star Rating icons display */}
                    <div className="flex gap-0.5 text-amber-500">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-500 shadow-xs" />
                      ))}
                    </div>

                    <div className="flex gap-1.5">
                      {/* Approve Toggle */}
                      {!rev.isApproved ? (
                        <button
                          onClick={() => moderateReview(rev.id, true)}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] tracking-wider uppercase px-2.5 py-1.5 rounded-lg cursor-pointer"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => moderateReview(rev.id, false)}
                          className="bg-stone-200 hover:bg-stone-300 text-stone-750 font-bold text-[10px] tracking-wider uppercase px-2.5 py-1.5 rounded-lg cursor-pointer"
                        >
                          Hide Review
                        </button>
                      )}
                      
                      <button
                        onClick={() => { if (confirm("Delete review permanently?")) deleteReview(rev.id); }}
                        className="p-1 px-2 border border-stone-250 hover:bg-red-50 text-red-650 hover:border-red-200 rounded-lg cursor-pointer"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-stone-450 italic">
                No customer ratings submitted in the database log books yet.
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Tab 3.7: Supabase Sync Integration workspace */}
      {adminSubTab === "supabase" && (
        <SupabaseSyncPanel />
      )}

    </div>
  );
}
