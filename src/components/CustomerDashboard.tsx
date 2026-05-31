import React, { useState } from "react";
import { useStore } from "../store";
import { Order, CartItem, OrderStatus } from "../types";
import { ShoppingBag, ChevronRight, User, Plus, Clock, Key, ShieldCheck, Mail, Phone, RefreshCw, AlertCircle, FileText } from "lucide-react";

export default function CustomerDashboard() {
  const { 
    user, 
    orders, 
    addToCart, 
    updateProfile, 
    setActiveTab, 
    setSelectedOrderId, 
    addresses, 
    foodItems,
    isActionLoading 
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<"orders" | "profile">("orders");

  // Profile forms fields state
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Calculate overview counts
  const totalOrdersCount = orders.length;
  const activeOrdersCount = orders.filter(
    (o) => o.status !== "Delivered" && o.status !== "Cancelled"
  ).length;
  const completedOrdersCount = orders.filter((o) => o.status === "Delivered").length;

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profilePhone.trim()) {
      alert("Name and Phone fields are required.");
      return;
    }
    const ok = await updateProfile(profileName, profileEmail, profilePhone);
    if (ok) {
         setSaveSuccess(true);
         setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleTrackClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    setActiveTab("track-order");
  };

  // Reorder: 1-click action that maps items inside order to their active catalog FoodItem, 
  // inserts them into cart with matching quantity, and moves to Menu checkout page
  const handleReorderClick = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // In actual production, fetch items first (or find inside in-memory state)
    // For local mock demonstration, we can fetch matching records from our DB orderItems or simulate
    // Fetch directly from server (simulated store order items lookup)
    fetch(`/api/orders/${orderId}`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        if (data && data.items && data.items.length) {
          // Loop through items and push to cart
          data.items.forEach((item: any) => {
            // Find active catalog food
            const catalogFoodIndex = foodItems.findIndex((f) => f.id === item.foodItemId);
            if (catalogFoodIndex > -1) {
              addToCart(foodItems[catalogFoodIndex], item.quantity);
            }
          });
          alert("Success: Items from this order have been placed inside your Cart! Heading to checkout...");
          setActiveTab("menu"); // Push to checkout menu screen
        }
      })
      .catch(() => {
        alert("Failed to copy items for reordering. Please try adding from Menu.");
      });
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "Pending":
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">Pending</span>;
      case "Confirmed":
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">Confirmed</span>;
      case "Preparing":
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded uppercase font-mono">Cooking</span>;
      case "Ready":
        return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">Hot Ready</span>;
      case "Out for Delivery":
        return <span className="bg-orange-100 text-orange-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">In Rider Route</span>;
      case "Delivered":
        return <span className="bg-green-100 text-green-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">Delivered</span>;
      case "Cancelled":
        return <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">Cancelled</span>;
      default:
        return <span className="bg-stone-100 text-stone-700 text-[10px] font-black px-2 py-0.5 rounded uppercase">{status}</span>;
    }
  };

  return (
    <div className="py-6 space-y-6" id="customer-dashboard-root">
      
      {/* 1. Header Overview Cards block */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Orders Card */}
        <div className="bg-white border border-stone-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-stone-100 text-stone-850 rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-stone-450 font-bold block uppercase tracking-wider">Total Restaurant Orders</span>
            <span className="text-2xl font-black text-stone-900 font-sans tracking-tight block leading-none mt-1">
              {totalOrdersCount}
            </span>
          </div>
        </div>

        {/* Active Orders Card */}
        <div className="bg-white border border-stone-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-amber-800 font-bold block uppercase tracking-wider">Active Deliveries</span>
            <span className="text-2xl font-black text-amber-700 font-sans tracking-tight block leading-none mt-1">
              {activeOrdersCount}
            </span>
          </div>
        </div>

        {/* Completed Orders Card */}
        <div className="bg-white border border-stone-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-green-50 text-green-700 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-green-800 font-bold block uppercase tracking-wider">Enjoyed Cookings</span>
            <span className="text-2xl font-black text-green-700 font-sans tracking-tight block leading-none mt-1">
              {completedOrdersCount}
            </span>
          </div>
        </div>

      </div>

      {/* 2. Primary Tabs navigation */}
      <div className="bg-stone-100 p-1.5 rounded-2xl border border-stone-200 flex gap-1 shadow-sm max-w-sm">
        <button
          onClick={() => setActiveSubTab("orders")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-center tracking-wider uppercase transition cursor-pointer ${
            activeSubTab === "orders" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
          }`}
        >
          My Orders History
        </button>
        <button
          onClick={() => setActiveSubTab("profile")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-center tracking-wider uppercase transition cursor-pointer ${
            activeSubTab === "profile" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
          }`}
        >
          Manage Profile
        </button>
      </div>

      {/* 3. Sub-Tab Panels */}
      {activeSubTab === "orders" ? (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden" id="tab-orders-panel">
          <div className="px-6 py-5 border-b border-stone-150">
            <h3 className="text-lg font-bold text-stone-900 font-sans tracking-tight">
              Order Receipt Book
            </h3>
            <span className="text-xs text-stone-500">
              Click individual order cards to launch real-time motorcycle rider tracking timeline.
            </span>
          </div>

          {orders.length > 0 ? (
            <div className="divide-y divide-stone-150">
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => handleTrackClick(order.id)}
                  className="px-6 py-4 hover:bg-stone-50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group text-left"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-stone-900 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded">
                        {order.orderNumber}
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono font-medium">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 text-stone-600 truncate block">
                      Deliver to: <strong className="text-stone-750 font-semibold">{order.deliveryLocation} - {order.deliveryAddress}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 ml-auto sm:ml-0.5 shrink-0">
                    <div className="text-right">
                      <span className="font-mono font-black text-sm text-stone-900 block">${order.totalAmount.toFixed(2)}</span>
                      <span className="text-[10px] text-stone-400 block -mt-0.5">{order.paymentMethod}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.status)}
                      
                      {/* One Click Reorder Trigger */}
                      <button
                        type="button"
                        onClick={(e) => handleReorderClick(order.id, e)}
                        className="bg-amber-600 hover:bg-amber-700 text-white p-2 rounded-xl transition cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                        title="Reorder exact same food items inside this order instantly"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center max-w-sm mx-auto">
              <FileText className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-sm text-stone-500 font-medium leading-relaxed">
                You haven't ordered any meals yet. Our kitchen is standing by to prepare your breakfast, lunch, or snack!
              </p>
              <button
                onClick={() => setActiveTab("menu")}
                className="bg-stone-900 hover:bg-stone-800 text-white text-xs px-4  py-2.5 rounded-xl font-bold mt-4 cursor-pointer"
              >
                Browse Delicious Foods
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="tab-profile-panel">
          
          {/* Personal Information Form block */}
          <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-stone-900 font-sans tracking-tight">
              Personal Information
            </h3>

            {saveSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 text-xs px-4 py-3 rounded-xl font-bold flex items-center gap-2">
                ✓ Your customer profile details have been synchronized successfully!
              </div>
            )}

            <form onSubmit={handleUpdateProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-xs text-stone-600 font-bold block">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-450 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Your name"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs text-stone-600 font-bold block">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-450 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Your phone"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-stone-900 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs text-stone-600 font-bold block">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-450 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    placeholder="Your email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-3 rounded-lg uppercase tracking-wider shadow cursor-pointer transition"
                >
                  {isActionLoading ? "Syncing..." : "Update Profile"}
                </button>
              </div>

            </form>
          </div>

          {/* Quick Info / Saved Address summaries */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-stone-50 border border-stone-200 p-5 rounded-3xl space-y-4 text-left">
              <h4 className="font-bold text-stone-950 flex items-center gap-1.5 text-xs uppercase tracking-wider pb-2 border-b border-stone-200">
                ⭐ Saved Delivery Addresses
              </h4>

              {addresses && addresses.length > 0 ? (
                <div className="space-y-2.5">
                  {addresses.slice(0, 3).map((addr) => (
                    <div key={addr.id} className="bg-white p-3.5 rounded-xl border border-stone-150 text-xs">
                      <strong className="text-stone-900 font-extrabold block">{addr.location}</strong>
                      <span className="text-stone-500 block leading-relaxed mt-0.5">{addr.address}</span>
                      {addr.notes && (
                        <span className="text-amber-700 block italic mt-1 font-medium text-[11px]">
                          Note: "{addr.notes}"
                        </span>
                      )}
                    </div>
                  ))}
                  <p className="text-[10px] text-stone-400 italic text-center text-stone-500">
                    *Addresses are automatically remembered upon checking out.
                  </p>
                </div>
              ) : (
                <div className="text-center py-4 text-stone-400 text-xs">
                  No delivery addresses saved yet. They appear here when you checkout.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
