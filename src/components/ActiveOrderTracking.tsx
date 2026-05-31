import { useStore } from "../store";
import { OrderStatus } from "../types";
import { Clock, Phone, MapPin, CheckCircle, Navigation, Play, User, Coffee, Bike, Home, ShoppingBag, ArrowLeft, RefreshCw } from "lucide-react";
import { useEffect, useMemo } from "react";

export default function ActiveOrderTracking() {
  const { 
    orders, 
    selectedOrderId, 
    setSelectedOrderId, 
    setActiveTab, 
    advanceTrackingSim 
  } = useStore();

  // Find targeted order
  const activeOrder = useMemo(() => {
    if (selectedOrderId) {
      return orders.find(o => o.id === selectedOrderId);
    }
    // Fall back to most recent order if none is selected
    return orders[0] || null;
  }, [orders, selectedOrderId]);

  // Status index helper
  const statusesList: OrderStatus[] = [
    "Pending", "Confirmed", "Preparing", "Ready", "Out for Delivery", "Delivered"
  ];

  const currentStatusIndex = useMemo(() => {
    if (!activeOrder) return -1;
    return statusesList.indexOf(activeOrder.status);
  }, [activeOrder]);

  const getStatusVisuals = (status: OrderStatus) => {
    switch (status) {
      case "Pending":
        return { label: "Awaiting Confirmation", desc: "Our chef is receiving your order request", color: "text-amber-600 bg-amber-50 border-amber-200" };
      case "Confirmed":
        return { label: "Order Accepted", desc: "Issa Kitchen has confirmed details and ingredients", color: "text-blue-600 bg-blue-50 border-blue-200" };
      case "Preparing":
        return { label: "Cooking in Progress", desc: "Hot pans are loaded. Food is cooking beautifully", color: "text-purple-600 bg-purple-50 border-purple-200" };
      case "Ready":
        return { label: "Hot & Packed", desc: "Sealed in heat-insulated bag wraps, ready for rider", color: "text-indigo-600 bg-indigo-50 border-indigo-200" };
      case "Out for Delivery":
        return { label: "Out for Delivery", desc: "Rider is speeding towards your location", color: "text-orange-600 bg-orange-50 border-orange-200" };
      case "Delivered":
        return { label: "Dispatched & Received", desc: "Bon appétit! Delivered warm to your door", color: "text-green-600 bg-green-50 border-green-200" };
      case "Cancelled":
        return { label: "Order Cancelled", desc: "This order has been cancelled", color: "text-red-650 bg-red-50 border-red-200" };
      default:
        return { label: "Tracking Status", desc: "Awaiting update...", color: "text-stone-500 bg-stone-100 border-stone-200" };
    }
  };

  if (!activeOrder) {
    return (
      <div className="py-12 text-center max-w-sm mx-auto" id="no-active-order">
        <div className="bg-stone-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-stone-200">
          <Navigation className="w-8 h-8 text-stone-400" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 font-sans tracking-tight">No Active Orders found</h2>
        <p className="text-xs text-stone-500 mt-2 mb-6">
          You haven't placed any food orders yet, or your orders are cleared. Head on over to the Menu to grab something!
        </p>
        <button
          onClick={() => setActiveTab("menu")}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-3 rounded-lg uppercase tracking-wider cursor-pointer"
        >
          Explore Food Menu
        </button>
      </div>
    );
  }

  const activeVisuals = getStatusVisuals(activeOrder.status);

  return (
    <div className="py-6 max-w-4xl mx-auto" id="order-tracking-panel">
      
      {/* Top Controls header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <button
            onClick={() => setActiveTab("dashboard")}
            className="text-xs text-stone-500 font-bold hover:text-stone-900 inline-flex items-center gap-1.5 mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to orders history
          </button>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-stone-900 tracking-tight font-sans">
              Track Order Progress
            </h2>
            <span className="bg-stone-200 text-stone-800 text-xs px-2 py-0.5 rounded-lg font-mono font-bold font-black">
              {activeOrder.orderNumber}
            </span>
          </div>
        </div>

        {/* MOCK PROGRESS BUTTON ADVANCE - Pure delight for testing real-time status changes! */}
        {activeOrder.status !== "Delivered" && activeOrder.status !== "Cancelled" && (
          <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-left flex items-center gap-3 shadow-xs">
            <div>
              <span className="text-[10px] text-amber-700 font-bold uppercase block -mb-0.5">Test Simulator</span>
              <span className="text-xs text-amber-900 font-bold block">Advance Delivery Rider</span>
            </div>
            <button
              onClick={() => advanceTrackingSim(activeOrder.id)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1.5 rounded-lg shadow-sm font-bold flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition"
              title="Click to advance status of rider delivery instantly"
            >
              <Play className="w-3.5 h-3.5" /> Advance State
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Status Timeline Progress Card (Left 2 Columns) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            
            {/* Active Status Display Box */}
            <div className={`p-4 rounded-2xl border flex items-start gap-3 ${activeVisuals.color}`}>
              {activeOrder.status === "Delivered" ? (
                <CheckCircle className="w-6 h-6 shrink-0 text-green-600 mt-1" />
              ) : (
                <div className="relative flex h-3.5 w-3.5 shrink-0 mt-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                </div>
              )}
              <div>
                <span className="text-xs uppercase font-black block tracking-widest text-stone-450">Current Status</span>
                <span className="text-lg font-black text-stone-900 block font-sans tracking-tight">{activeVisuals.label}</span>
                <span className="text-xs text-stone-600 block mt-0.5">{activeVisuals.desc}</span>
              </div>
            </div>

            {/* Visual Step-by-Step Vertical Timeline */}
            <div className="space-y-4 pt-4">
              <span className="text-[10px] text-stone-450 uppercase font-black tracking-widest block mb-4">
                🚚 Delivery Timeline Checklist
              </span>
              
              <div className="relative pl-6 border-l border-stone-200 ml-4 space-y-6">
                
                {/* 1. Pending */}
                <div className="relative text-left">
                  <div className={`absolute -left-[35px] top-0.5 rounded-full w-6 h-6 border flex items-center justify-center text-xs font-bold ${
                    currentStatusIndex >= 0 ? "bg-green-600 border-green-600 text-white" : "bg-white border-stone-300 text-stone-400"
                  }`}>
                    {currentStatusIndex > 0 ? "✓" : "1"}
                  </div>
                  <div className="pl-2">
                    <h3 className={`text-sm font-bold ${currentStatusIndex >= 0 ? "text-stone-900" : "text-stone-400"}`}>
                      Order Received
                    </h3>
                    <p className="text-xs text-stone-500 leading-normal">
                      Your requested dishes have been sent to Issa Kitchen systems successfully.
                    </p>
                  </div>
                </div>

                {/* 2. Confirmed */}
                <div className="relative text-left">
                  <div className={`absolute -left-[35px] top-0.5 rounded-full w-6 h-6 border flex items-center justify-center text-xs font-bold ${
                    currentStatusIndex >= 1 ? "bg-green-600 border-green-600 text-white" : "bg-white border-stone-300 text-stone-400"
                  }`}>
                    {currentStatusIndex > 1 ? "✓" : "2"}
                  </div>
                  <div className="pl-2">
                    <h3 className={`text-sm font-bold ${currentStatusIndex >= 1 ? "text-stone-900" : "text-stone-400"}`}>
                      Confirmed in Kitchen
                    </h3>
                    <p className="text-xs text-stone-500 leading-normal">
                      The restaurant chef verified ingredients stock and scheduled prep queue.
                    </p>
                  </div>
                </div>

                {/* 3. Preparing */}
                <div className="relative text-left">
                  <div className={`absolute -left-[35px] top-0.5 rounded-full w-6 h-6 border flex items-center justify-center text-xs font-bold ${
                    currentStatusIndex >= 2 ? "bg-green-600 border-green-600 text-white" : "bg-white border-stone-300 text-stone-400"
                  }`}>
                    {currentStatusIndex > 2 ? "✓" : "3"}
                  </div>
                  <div className="pl-2">
                    <h3 className={`text-sm font-bold ${currentStatusIndex >= 2 ? "text-stone-900" : "text-stone-400"}`}>
                      Chef is Cooking
                    </h3>
                    <p className="text-xs text-stone-500 leading-normal">
                      Your dishes are sizzled to perfection in the high flame griddle.
                    </p>
                  </div>
                </div>

                {/* 4. Ready */}
                <div className="relative text-left">
                  <div className={`absolute -left-[35px] top-0.5 rounded-full w-6 h-6 border flex items-center justify-center text-xs font-bold ${
                    currentStatusIndex >= 3 ? "bg-green-600 border-green-600 text-white" : "bg-white border-stone-300 text-stone-400"
                  }`}>
                    {currentStatusIndex > 3 ? "✓" : "4"}
                  </div>
                  <div className="pl-2">
                    <h3 className={`text-sm font-bold ${currentStatusIndex >= 3 ? "text-stone-900" : "text-stone-400"}`}>
                      Packed & Sealed
                    </h3>
                    <p className="text-xs text-stone-500 leading-normal">
                      Dished hot, labeled accurately, and secure-sealed in delivery boxes.
                    </p>
                  </div>
                </div>

                {/* 5. Out for Delivery */}
                <div className="relative text-left">
                  <div className={`absolute -left-[35px] top-0.5 rounded-full w-6 h-6 border flex items-center justify-center text-xs font-bold ${
                    currentStatusIndex >= 4 ? "bg-green-600 border-green-600 text-white" : "bg-white border-stone-300 text-stone-400"
                  }`}>
                    {currentStatusIndex > 4 ? "✓" : "5"}
                  </div>
                  <div className="pl-2">
                    <h3 className={`text-sm font-bold ${currentStatusIndex >= 4 ? "text-stone-900" : "text-stone-400"}`}>
                      Rider Speeding Over
                    </h3>
                    <p className="text-xs text-stone-500 leading-normal">
                      Our dispatch rider is navigating the traffic on his motorcycle.
                    </p>
                  </div>
                </div>

                {/* 6. Delivered */}
                <div className="relative text-left">
                  <div className={`absolute -left-[35px] top-0.5 rounded-full w-6 h-6 border flex items-center justify-center text-xs font-bold ${
                    currentStatusIndex >= 5 ? "bg-green-600 border-green-600 text-white" : "bg-white border-stone-300 text-stone-400"
                  }`}>
                    6
                  </div>
                  <div className="pl-2">
                    <h3 className={`text-sm font-bold ${currentStatusIndex >= 5 ? "text-stone-900" : "text-stone-400"}`}>
                      Arrived & Delivered!
                    </h3>
                    <p className="text-xs text-stone-500 leading-normal">
                      Warm hot meal safely delivered. Enjoy your quality cooking!
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Address and order details (Right 1 Column) */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Dispatch Destination Info Card */}
          <div className="bg-stone-50 border border-stone-200 p-5 rounded-3xl space-y-4">
            <h3 className="font-bold text-stone-950 flex items-center gap-1.5 text-sm pb-2 border-b border-stone-200">
              <MapPin className="w-4.5 h-4.5 text-amber-600" /> Deliver To
            </h3>
            <div className="text-xs text-stone-600 space-y-3">
              <div>
                <strong className="text-stone-900 text-sm font-bold block">{activeOrder.customerName}</strong>
                <span className="font-mono block mt-0.5">{activeOrder.customerPhone}</span>
              </div>
              <div className="border-t border-stone-150 pt-3">
                <span className="bg-stone-250 text-stone-850 px-2 py-0.5 rounded font-black font-mono text-[9px] block mb-1 w-max">
                  {activeOrder.deliveryLocation}
                </span>
                <span className="text-stone-800 leading-relaxed font-semibold block">{activeOrder.deliveryAddress}</span>
              </div>
              {activeOrder.deliveryNotes && (
                <div className="bg-amber-50 border border-amber-200 px-3 py-2.5 rounded-xl mt-2 text-stone-700">
                  <strong className="text-[10px] text-amber-800 block font-black uppercase mb-0.5">Rider Notes</strong>
                  "{activeOrder.deliveryNotes}"
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Statement Card */}
          <div className="bg-stone-50 border border-stone-200 p-5 rounded-3xl space-y-3">
            <h3 className="font-bold text-stone-900 flex items-center gap-1.5 text-sm pb-2 border-b border-stone-200">
              <ShoppingBag className="w-4.5 h-4.5 text-amber-600" /> Cost Breakdown
            </h3>
            <div className="text-xs space-y-2 text-stone-600">
              <div className="flex justify-between">
                <span>Rider Delivery fee:</span>
                <span className="font-mono text-stone-900 font-bold">${activeOrder.deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1.5 border-t border-stone-150">
                <span className="text-stone-900">Total charge:</span>
                <span className="font-mono text-sm text-stone-950 font-black">${activeOrder.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] bg-stone-200 p-2 rounded-lg mt-2 text-stone-700">
                <span className="font-bold uppercase font-mono text-[10px]">Method:</span>
                <span className="font-black font-sans text-stone-900 text-[11px]">{activeOrder.paymentMethod}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
