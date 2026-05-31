import { useStore } from "../store";
import { ChefHat, ShoppingBag, User, LayoutDashboard, Menu as MenuIcon, RefreshCw, Star, ShieldAlert } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const { 
    user, 
    switchUserRole, 
    activeTab, 
    setActiveTab, 
    getCartTotals, 
    isActionLoading,
    resetDatabase,
    signOutUser
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemCount, total } = getCartTotals();

  const handleRoleToggle = async () => {
    const nextRole = user?.role === "admin" ? "customer" : "admin";
    await switchUserRole(nextRole);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-stone-50 border-b border-stone-200 shadow-sm" id="main-header">
      {/* Top Workspace Bar Info */}
      <div className="bg-amber-950 text-amber-100 text-xs py-1.5 px-4 flex justify-between items-center font-mono">
        <span className="flex items-center gap-1.5">
          <ChefHat className="w-3 px-0.5" />
          <span>Issa Kitchen Applet Workspace</span>
        </span>
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={resetDatabase}
            disabled={isActionLoading}
            className="hover:text-white transition duration-150 flex items-center gap-1 text-[11px] bg-amber-900 px-2 py-0.5 rounded cursor-pointer"
          >
            <RefreshCw className={`w-2.5 ${isActionLoading ? 'animate-spin' : ''}`} />
            Reset Seed Data
          </button>
          <span>Server: Live Port 3000</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("home")}>
            <div className="bg-amber-600 text-white p-2 rounded-xl shadow-md flex items-center justify-center">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-stone-900 block font-sans">
                Issa Kitchen
              </span>
              <span className="text-[10px] text-amber-700 tracking-wider font-mono font-bold uppercase -mt-1 block">
                Fresh • Hot • Fast
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab("home")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-150 cursor-pointer ${
                activeTab === "home"
                  ? "bg-stone-200 text-stone-900"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab("menu")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-150 cursor-pointer ${
                activeTab === "menu"
                  ? "bg-stone-200 text-stone-900"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
            >
              Browse Menu
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-150 cursor-pointer ${
                activeTab === "reviews"
                  ? "bg-stone-200 text-stone-900"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
            >
              Reviews
            </button>
            
            {user?.role === "customer" && (
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-150 cursor-pointer ${
                  activeTab === "dashboard" || activeTab === "track-order"
                    ? "bg-stone-200 text-stone-900"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                }`}
              >
                My Account
              </button>
            )}

            {user?.role === "admin" && (
              <button
                onClick={() => setActiveTab("admin-dashboard")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition duration-150 cursor-pointer text-amber-900 border border-amber-300 bg-amber-50 hover:bg-amber-100`}
              >
                Admin Control
              </button>
            )}
          </nav>

          {/* Action Zone (Cart, Active Role, Switcher) */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* Quick Fast Switcher */}
            <div className="bg-stone-100 p-1.5 rounded-xl border border-stone-200 flex items-center gap-1.5">
              <span className="text-xs text-stone-500 font-medium pl-1.5 font-mono">
                Role: <strong className="text-stone-800 uppercase">{user?.role}</strong>
              </span>
              <button
                onClick={handleRoleToggle}
                disabled={isActionLoading}
                className="bg-amber-600 hover:bg-amber-700 hover:scale-105 active:scale-95 text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm transition cursor-pointer"
              >
                {user?.role === "admin" ? "To Customer" : "To Admin"}
              </button>
            </div>

            {/* Shopping Bag Button */}
            {user?.role === "customer" && (
              <button
                onClick={() => setActiveTab("menu")}
                className="relative bg-amber-50 hover:bg-amber-100 text-amber-900 p-2.5 rounded-xl border border-amber-200 transition duration-150 flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-5 h-5 text-amber-700" />
                {itemCount > 0 ? (
                  <>
                    <span className="bg-amber-600 text-white min-w-5 h-5 rounded-full px-1.5 flex items-center justify-center text-xs font-black absolute -top-1.5 -right-1.5 shadow-md">
                      {itemCount}
                    </span>
                    <span className="text-sm font-extrabold pr-0.5">${total.toFixed(2)}</span>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-stone-500">Cart Empty</span>
                )}
              </button>
            )}

            {/* User Greeting Segment */}
            {user ? (
              <div className="flex items-center gap-3 border-l border-stone-200 pl-4">
                <div className="text-left leading-none">
                  <span className="text-[10px] text-stone-400 font-extrabold uppercase block">{user.role}</span>
                  <span className="text-xs font-bold text-stone-855 block truncate max-w-28 mt-0.5">{user.name}</span>
                </div>
                <button
                  onClick={() => signOutUser()}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-250 hover:text-stone-900 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="border-l border-stone-200 pl-4">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>

          {/* Mobile Right Zone (Trigger / Role indicator) */}
          <div className="flex md:hidden items-center gap-2">
            {/* Quick Mobile Cart */}
            {user?.role === "customer" && itemCount > 0 && (
              <button
                onClick={() => setActiveTab("menu")}
                className="bg-amber-50 hover:bg-amber-100 text-amber-950 p-2 rounded-xl border border-amber-200 flex items-center gap-1 text-sm font-bold cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-amber-700" />
                <span>{itemCount}</span>
              </button>
            )}

            {/* Mobile Fast Switcher */}
            <button
              onClick={handleRoleToggle}
              className="bg-stone-800 text-stone-50 text-[10px] font-bold px-2 py-1.5 rounded cursor-pointer"
            >
              Go {user?.role === "admin" ? "Cust" : "Admin"}
            </button>

            {/* Mobile Nav Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 cursor-pointer"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white py-3 px-4 space-y-2 shadow-inner">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-stone-100">
            <div className="flex items-center gap-1.5 text-xs text-stone-600">
              <User className="w-3.5 h-3.5 text-amber-600" />
              <span>Hello, <strong>{user?.name || "Guest"}</strong></span>
            </div>
            {user && (
              <span className="inline-block bg-stone-100 text-stone-850 text-[10px] font-mono px-2 py-0.5 rounded font-black uppercase">
                {user.role} Mode
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setActiveTab("home"); setMobileMenuOpen(false); }}
              className={`p-3 rounded-xl text-center text-sm font-bold border transition ${
                activeTab === "home" ? "bg-stone-900 text-white border-stone-900" : "bg-stone-50 text-stone-700 border-stone-200"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => { setActiveTab("menu"); setMobileMenuOpen(false); }}
              className={`p-3 rounded-xl text-center text-sm font-bold border transition ${
                activeTab === "menu" ? "bg-stone-900 text-white border-stone-900" : "bg-stone-50 text-stone-700 border-stone-200"
              }`}
            >
              Our Menu
            </button>
            <button
              onClick={() => { setActiveTab("reviews"); setMobileMenuOpen(false); }}
              className={`p-3 rounded-xl text-center text-sm font-bold border transition ${
                activeTab === "reviews" ? "bg-stone-900 text-white border-stone-900" : "bg-stone-50 text-stone-700 border-stone-200"
              }`}
            >
              Reviews
            </button>
            {user?.role === "customer" ? (
              <button
                onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
                className={`p-3 rounded-xl text-center text-sm font-bold border transition ${
                  activeTab === "dashboard" || activeTab === "track-order" ? "bg-stone-900 text-white border-stone-900" : "bg-stone-50 text-stone-700 border-stone-200"
                }`}
              >
                My Account
              </button>
            ) : (
              <button
                onClick={() => { setActiveTab("admin-dashboard"); setMobileMenuOpen(false); }}
                className="p-3 rounded-xl text-center text-sm font-bold bg-amber-600 text-white border border-amber-700"
              >
                Admin Control
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
