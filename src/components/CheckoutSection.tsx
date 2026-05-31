import React, { useState, useEffect } from "react";
import { useStore } from "../store";
import { PaymentMethod } from "../types";
import { Star, MapPin, Phone, User, ShoppingBag, Plus, Minus, CreditCard, ShieldCheck, Mail, Edit3, ArrowLeft } from "lucide-react";

export default function CheckoutSection() {
  const { 
    user, 
    cart, 
    addresses, 
    getCartTotals, 
    createOrder, 
    setActiveTab, 
    isActionLoading 
  } = useStore();

  const { subtotal, deliveryFee, total, itemCount } = getCartTotals();

  // Address and payment fields state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("Kilimani Estate");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("M-Pesa");

  // Load default user info on mount if present
  useEffect(() => {
    if (user) {
      setCustomerName(user.name || "");
      setCustomerPhone(user.phone || "");
      setCustomerEmail(user.email || "");
      
      // Auto-load first saved address if available
      if (addresses && addresses.length > 0) {
        setDeliveryLocation(addresses[0].location);
        setDeliveryAddress(addresses[0].address);
        setDeliveryNotes(addresses[0].notes || "");
      }
    }
  }, [user, addresses]);

  const handleApplyAddress = (addr: typeof addresses[0]) => {
    setDeliveryLocation(addr.location);
    setDeliveryAddress(addr.address);
    setDeliveryNotes(addr.notes || "");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      alert("Please fill out all required fields: Name, Phone, and Delivery Address.");
      return;
    }

    const orderData = {
      customerName,
      customerPhone,
      customerEmail,
      deliveryLocation,
      deliveryAddress,
      deliveryNotes,
      paymentMethod,
    };

    const order = await createOrder(orderData);
    if (order) {
      // Order placed successfully, store handles redirects
      console.log("Order placed successfully:", order);
    }
  };

  if (itemCount === 0) {
    return (
      <div className="py-12 text-center max-w-md mx-auto" id="checkout-empty-state">
        <div className="bg-amber-50 text-amber-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-stone-900 tracking-tight">Your Cart is Empty</h2>
        <p className="text-stone-500 text-sm mt-2 mb-6">
          You need to select at least one hot dish from Issa Kitchen before proceeding to checkout!
        </p>
        <button
          onClick={() => setActiveTab("menu")}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-6 py-3 rounded-xl uppercase tracking-wider cursor-pointer transition shadow"
        >
          Check out our menu
        </button>
      </div>
    );
  }

  return (
    <div className="py-6" id="checkout-section-wrapper">
      
      {/* Back to Menu trigger */}
      <button 
        type="button"
        onClick={() => setActiveTab("menu")}
        className="text-xs text-stone-500 font-bold hover:text-stone-900 mb-6 flex items-center gap-1.5 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to menu catalog
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Checkout Forms Panel (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm">
            
            <h2 className="text-2xl font-black text-stone-900 tracking-tight font-sans mb-1">
              Complete Your Order
            </h2>
            <p className="text-xs text-stone-550 mb-6">
              Complete the simple contact and delivery information fields below. Our kitchen will start preparing your fresh food immediately.
            </p>

            {/* Saved Address Book quick selection */}
            {addresses && addresses.length > 0 && (
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60 mb-6">
                <span className="text-[10px] text-amber-800 font-black uppercase tracking-widest block mb-2.5">
                  📌 Quick Apply Saved Addresses
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handleApplyAddress(addr)}
                      className="bg-white hover:bg-amber-50 text-left p-3 rounded-xl border border-stone-150 hover:border-amber-500 text-xs font-medium text-stone-700 transition cursor-pointer flex justify-between items-center"
                    >
                      <div className="truncate pr-2">
                        <strong className="text-stone-900 font-semibold block">{addr.location}</strong>
                        <span className="text-stone-500 truncate block">{addr.address}</span>
                      </div>
                      <span className="text-[10px] text-amber-700 font-bold shrink-0">Apply</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-5">
              
              {/* Customer Contact Information */}
              <div className="space-y-3.5">
                <span className="text-xs font-black text-stone-900 uppercase tracking-wider block border-b border-stone-100 pb-1">
                  1. Contact Information
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-stone-600 font-bold block">
                      Full Name <strong className="text-amber-600">*</strong>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-stone-600 font-bold block">
                      Phone Number <strong className="text-amber-600">*</strong>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. +254 712 345678"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-900 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-stone-600 font-bold block">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      placeholder="e.g. john@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="space-y-3.5 pt-2">
                <span className="text-xs font-black text-stone-900 uppercase tracking-wider block border-b border-stone-100 pb-1">
                  2. Delivery Address
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 flex flex-col justify-end">
                    <label className="text-xs text-stone-600 font-bold block">
                      General Area Estate <strong className="text-amber-600">*</strong>
                    </label>
                    <select
                      value={deliveryLocation}
                      onChange={(e) => setDeliveryLocation(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-850 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="Kilimani Estate">Kilimani Estate</option>
                      <option value="Westlands Area">Westlands Area</option>
                      <option value="Nairobi CBD">Nairobi CBD</option>
                      <option value="Karen Suburban">Karen Suburban</option>
                      <option value="Lavington Area">Lavington Area</option>
                      <option value="Parklands Area">Parklands Area</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-stone-600 font-bold block">
                      Street Address & House No <strong className="text-amber-600">*</strong>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3 h-4 mt-0.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Raphta Road, Villa Marina Apt 12"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-stone-600 font-bold block">
                    Additional Delivery Notes (e.g. "Leave with guard", "Call near gate")
                  </label>
                  <div className="relative">
                    <Edit3 className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <textarea
                      placeholder="Enter details to help the rider find you quickly..."
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3.5 pt-2">
                <span className="text-xs font-black text-stone-900 uppercase tracking-wider block border-b border-stone-100 pb-1">
                  3. Payment Method
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* M-Pesa block */}
                  <div
                    onClick={() => setPaymentMethod("M-Pesa")}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between h-24 ${
                      paymentMethod === "M-Pesa"
                        ? "border-amber-600 bg-amber-50/50"
                        : "border-stone-200 hover:border-stone-350"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="bg-emerald-600 text-white font-mono text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                        Safaricom
                      </span>
                      <input
                        type="radio"
                        checked={paymentMethod === "M-Pesa"}
                        onChange={() => setPaymentMethod("M-Pesa")}
                        className="accent-amber-600 w-3.5 h-3.5"
                      />
                    </div>
                    <div>
                      <span className="text-sm font-black text-stone-850 block font-mono">M-Pesa</span>
                      <span className="text-[10px] text-stone-400 block -mt-0.5">Pay via mobile phone</span>
                    </div>
                  </div>

                  {/* Cash block */}
                  <div
                    onClick={() => setPaymentMethod("Cash on Delivery")}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between h-24 ${
                      paymentMethod === "Cash on Delivery"
                        ? "border-amber-600 bg-amber-50/50"
                        : "border-stone-200 hover:border-stone-350"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="bg-stone-500 text-white font-mono text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                        Cash
                      </span>
                      <input
                        type="radio"
                        checked={paymentMethod === "Cash on Delivery"}
                        onChange={() => setPaymentMethod("Cash on Delivery")}
                        className="accent-amber-600 w-3.5 h-3.5"
                      />
                    </div>
                    <div>
                      <span className="text-sm font-black text-stone-850 block">Cash on Delivery</span>
                      <span className="text-[10px] text-stone-400 block -mt-0.5">Pay local rider in cash</span>
                    </div>
                  </div>

                  {/* Card Block */}
                  <div
                    onClick={() => setPaymentMethod("Card Payments")}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between h-24 ${
                      paymentMethod === "Card Payments"
                        ? "border-amber-600 bg-amber-50/50"
                        : "border-stone-200 hover:border-stone-350"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <CreditCard className="w-4 h-4 text-stone-600" />
                      <input
                        type="radio"
                        checked={paymentMethod === "Card Payments"}
                        onChange={() => setPaymentMethod("Card Payments")}
                        className="accent-amber-600 w-3.5 h-3.5"
                      />
                    </div>
                    <div>
                      <span className="text-sm font-black text-stone-850 block">Card Payment</span>
                      <span className="text-[10px] text-stone-400 block -mt-0.5">Visa / Mastercard / AMEX</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Submit triggers */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="w-full bg-amber-600 hover:bg-amber-700 active:scale-99 transition text-white py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isActionLoading ? "Ordering Your Food..." : `Place Order • $${total.toFixed(2)}`}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Order Summary Breakdowns (Right 1 Column) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-stone-50 border border-stone-200 p-6 rounded-3xl space-y-5">
            <h3 className="font-bold text-stone-900 pb-3 border-b border-stone-150 flex items-center gap-2">
              <ShoppingBag className="w-4.5 h-4.5 text-amber-600" /> Order Summary
            </h3>

            {/* Cart Items listing inside sidebar */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {cart.map((c) => (
                <div key={c.foodItem.id} className="flex justify-between items-center gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono bg-stone-200 text-stone-800 font-black min-w-5 h-5 flex items-center justify-center rounded px-1 shrink-0">
                      {c.quantity}x
                    </span>
                    <span className="text-stone-800 font-medium truncate block">{c.foodItem.name}</span>
                  </div>
                  <span className="font-mono text-stone-900 font-bold shrink-0">${(c.foodItem.price * c.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Billing breakdown calculations */}
            <div className="space-y-2 border-t border-stone-200 pt-4 text-xs">
              <div className="flex justify-between text-stone-500 font-medium">
                <span>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''}):</span>
                <span className="font-mono text-stone-900 font-bold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-500 font-medium">
                <span>Rider Delivery Fee:</span>
                <span className="font-mono text-stone-900 font-bold">${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-500 font-medium pb-2">
                <span>Vat Tax (Inclusive):</span>
                <span className="font-mono text-stone-900 font-bold">$0.00</span>
              </div>
              <div className="flex justify-between text-sm text-stone-900 font-black pt-2.5 border-t border-stone-200">
                <span>Grand Total:</span>
                <span className="font-mono text-lg text-amber-700">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Security banner */}
            <div className="bg-white border border-stone-150 p-3.5 rounded-2xl flex items-start gap-2 text-[10px] text-stone-500 max-w-sm">
              <ShieldCheck className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-850 font-bold block">Safe & Verified Checkout</strong>
                Your order is processed instantly inside our local restaurant. Cash and mobile transactions are handled safely with secure end-point confirmations.
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
