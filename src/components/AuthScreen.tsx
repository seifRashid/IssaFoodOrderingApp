import React, { useState } from "react";
import { useStore } from "../store";
import { KeyRound, Mail, Phone, User, ShieldAlert, Sparkles, RefreshCw, Eye, EyeOff } from "lucide-react";

export default function AuthScreen({ onCancel }: { onCancel?: () => void }) {
  const { 
    signInUser, 
    signUpUser, 
    isSupabaseActive, 
    isActionLoading, 
    localOnly, 
    switchUserRole 
  } = useStore();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email || !password) {
      setMessage({ type: "error", text: "Please fill in email and password." });
      return;
    }

    if (isSignUp && (!name || !phone)) {
      setMessage({ type: "error", text: "Name and Phone values are required for sign up." });
      return;
    }

    try {
      if (localOnly) {
        // Simulated Local State Login
        setMessage({ type: "success", text: "Sandbox Login Verified! Launching session..." });
        const targetRole = email.toLowerCase().includes("admin") ? "admin" : "customer";
        setTimeout(() => {
          switchUserRole(targetRole);
        }, 1000);
        return;
      }

      if (isSignUp) {
        // Real Supabase User Register
        const isDefaultAdmin = email.toLowerCase() === "admin@issa.com";
        await signUpUser(email, password, name, phone, isDefaultAdmin);
        setMessage({ 
          type: "success", 
          text: isDefaultAdmin 
            ? "Administrative account successfully registered and provisioned! Please switch to login mode to sign in."
            : "Customer Registration complete! Please check your email or click log in now." 
        });
        setIsSignUp(false);
      } else {
        // Real Supabase User Login
        await signInUser(email, password);
        setMessage({ type: "success", text: "Authentication success! Launching session..." });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Failed to execute authentication sequence" });
    }
  };

  const handleFillAdminTemplate = () => {
    setEmail("admin@issa.com");
    setPassword("admin123");
    setName("Chef Issa");
    setPhone("+254 711 000000");
    setMessage(null);
  };

  const handleFillCustomerTemplate = () => {
    setEmail("customer@issa.com");
    setPassword("customer123");
    setName("Amina West");
    setPhone("+254 722 999111");
    setMessage(null);
  };

  return (
    <div className="max-w-md mx-auto my-8 bg-white border border-stone-200 rounded-3xl shadow-xl overflow-hidden p-6 sm:p-8" id="auth-panel">
      <div className="text-center space-y-2 mb-6">
        <div className="mx-auto w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center border border-amber-200">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-stone-900 tracking-tight font-sans">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h2>
        <p className="text-xs text-stone-500 max-w-xs mx-auto">
          {isSignUp 
            ? "Sign up to place swift local orders, review dishes, and track motor riders." 
            : "Sign in to access secure order books, delivery histories, and profiles."}
        </p>
      </div>

      {localOnly && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-[11px] text-amber-800 space-y-2 text-left">
          <div className="flex gap-2 items-start">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600" />
            <div>
              <strong className="font-extrabold block">Running in Local Mock Simulation</strong>
              <span className="leading-relaxed">
                Supabase database credentials are not active yet. Click below to auto-fill immediate simulated session logins.
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button 
              type="button" 
              onClick={handleFillAdminTemplate}
              className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] py-1 px-2 rounded-lg font-bold border border-amber-300/40 text-center cursor-pointer"
            >
              Fill Mock Admin
            </button>
            <button 
              type="button" 
              onClick={handleFillCustomerTemplate}
              className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] py-1 px-2 rounded-lg font-bold border border-amber-300/40 text-center cursor-pointer"
            >
              Fill Mock Customer
            </button>
          </div>
        </div>
      )}

      {!localOnly && (
        <div className="mb-5 bg-stone-50 border border-stone-200 rounded-2xl p-3 text-left">
          <span className="text-[10px] text-stone-400 font-black uppercase tracking-wider block mb-1">Testing Credentials Guide</span>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleFillAdminTemplate}
              className="flex-1 text-[11px] bg-stone-100 border border-stone-200 rounded-lg p-2 hover:bg-stone-200 transition text-left cursor-pointer"
            >
              <strong className="text-stone-800 block">Admin Credentials:</strong>
              <code className="text-[10px] block text-amber-700">admin@issa.com / admin123</code>
            </button>
            <button
              type="button"
              onClick={handleFillCustomerTemplate}
              className="flex-1 text-[11px] bg-stone-100 border border-stone-200 rounded-lg p-2 hover:bg-stone-200 transition text-left cursor-pointer"
            >
              <strong className="text-stone-800 block">Customer Account:</strong>
              <code className="text-[10px] block text-stone-500">customer@issa.com / customer123</code>
            </button>
          </div>
          <p className="text-[9px] text-stone-400 mt-1 pb-0.5 text-center">
            *Admin details auto-provision in real-time on first login if not present in your remote database!
          </p>
        </div>
      )}

      {message && (
        <div className={`mb-4 p-3 rounded-xl text-xs flex gap-2 items-start text-left ${
          message.type === "success" 
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-red-50 border border-red-200 text-red-800"
        }`}>
          <div className="font-semibold">{message.text}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <>
            <div className="space-y-1 text-left">
              <label className="text-[11px] text-stone-600 font-bold block">Your Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Amina Omondi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[11px] text-stone-600 font-bold block">Mobile Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. +254 711 222333"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-900 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </>
        )}

        <div className="space-y-1 text-left">
          <label className="text-[11px] text-stone-600 font-bold block">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="space-y-1 text-left">
          <label className="text-[11px] text-stone-600 font-bold block">Auth Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isActionLoading}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 mt-2 shadow"
        >
          {isActionLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
            </>
          ) : (
            <span>{isSignUp ? "Register Secure Account" : "Access Account"}</span>
          )}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-stone-150 text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-xs text-amber-700 hover:underline font-bold transition cursor-pointer"
        >
          {isSignUp 
            ? "Already possess an account? Sign in directly" 
            : "In need of an order dashboard? Sign up here"}
        </button>
      </div>
    </div>
  );
}
