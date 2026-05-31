import React, { useState, useEffect } from "react";
import { useStore } from "../store";
import { Database, Copy, Check, RefreshCw, Key, Link2, ShieldCheck, HelpCircle, Sparkles } from "lucide-react";

export default function SupabaseSyncPanel() {
  const { 
    isSupabaseActive, 
    supabaseConfig, 
    saveSupabaseConfig, 
    localOnly, 
    resetDatabase, 
    isActionLoading,
    categories,
    foodItems,
    orders,
    reviews,
    reloadCatalog
  } = useStore();

  const [inputUrl, setInputUrl] = useState(supabaseConfig.url || "");
  const [inputKey, setInputKey] = useState(supabaseConfig.key || "");
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setInputUrl(supabaseConfig.url || "");
    setInputKey(supabaseConfig.key || "");
  }, [supabaseConfig]);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    const ok = await saveSupabaseConfig(inputUrl.trim(), inputKey.trim());
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await reloadCatalog();
    }
  };

  const handleClearCredentials = async () => {
    if (confirm("Disconnect live Supabase linkage and revert to simulated sandbox environment?")) {
      await saveSupabaseConfig("", "");
      setInputUrl("");
      setInputKey("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await reloadCatalog();
    }
  };

  const schemaSql = `-- ======================================================
-- ISSA KITCHEN - FULL DATABASE SCHEMA BOOTSTRAP SQL
-- Copy and run this inside your Supabase SQL Editor
-- ======================================================

-- 1. Enable UUID Extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS "categories" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Food Items Table
CREATE TABLE IF NOT EXISTS "food_items" (
  "id" TEXT PRIMARY KEY,
  "categoryId" TEXT,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "price" NUMERIC NOT NULL,
  "image" TEXT NOT NULL,
  "description" TEXT,
  "calories" INTEGER,
  "deliveryTime" TEXT,
  "rating" NUMERIC NOT NULL DEFAULT 4.5,
  "isPopular" BOOLEAN NOT NULL DEFAULT FALSE,
  "isSpicy" BOOLEAN NOT NULL DEFAULT FALSE,
  "isVegetarian" BOOLEAN NOT NULL DEFAULT FALSE,
  "isFeatured" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Users Profile Table (Public Mirror of Auth.users)
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "role" TEXT NOT NULL DEFAULT 'customer',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS "orders" (
  "id" TEXT PRIMARY KEY,
  "orderNumber" TEXT NOT NULL,
  "customerId" TEXT,
  "customerName" TEXT NOT NULL,
  "customerPhone" TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL,
  "deliveryLocation" TEXT NOT NULL,
  "deliveryAddress" TEXT NOT NULL,
  "deliveryNotes" TEXT,
  "paymentMethod" TEXT NOT NULL,
  "totalAmount" NUMERIC NOT NULL,
  "deliveryFee" NUMERIC NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Order Items Table
CREATE TABLE IF NOT EXISTS "order_items" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT,
  "foodItemId" TEXT,
  "foodItemName" TEXT,
  "foodItemImage" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "price" NUMERIC NOT NULL
);

-- 7. Reviews List Table
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT,
  "customerName" TEXT NOT NULL,
  "foodItemId" TEXT NOT NULL,
  "foodItemName" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "review" TEXT NOT NULL,
  "isApproved" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Customer Saved Addresses
CREATE TABLE IF NOT EXISTS "addresses" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "notes" TEXT
);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(schemaSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-left" id="panel-supabase-workspace">
      
      {/* 1. Connection Status Hero Card */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-150 pb-4">
          <div>
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-600 animate-pulse" /> Supabase Database Workspace
            </h3>
            <p className="text-stone-500 text-xs mt-0.5">
              Hook active cloud storage directly to enable real-time Vercel persistence and PostgreSQL synchronization.
            </p>
          </div>

          <button
            onClick={reloadCatalog}
            className="px-3.5 py-1.5 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-poll Database
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
            <span className="text-[10px] text-stone-400 font-black uppercase tracking-wider block">Connection Strategy</span>
            <div className="flex items-center gap-2">
              {isSupabaseActive ? (
                <>
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block animate-ping" />
                  <span className="text-sm font-bold text-green-700">🟢 Direct Supabase Connection (Live)</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 bg-orange-400 rounded-full inline-block" />
                  <span className="text-sm font-bold text-orange-700">⚪ Sandbox Mock State (Offline)</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-stone-500 font-medium">
              {isSupabaseActive 
                ? "Excellent connection! Data is sync'd directly from the browser to your live cloud cluster."
                : "Credentials missing. The application is running in an offline sandbox storing data in localStorage."}
            </p>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
            <span className="text-[10px] text-stone-400 font-black uppercase tracking-wider block">Live Schema Catalog</span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px] text-stone-500 list-none">
              <li>• Categories: <strong className="text-stone-800">{categories.length}</strong></li>
              <li>• Dishes: <strong className="text-stone-800">{foodItems.length}</strong></li>
              <li>• Orders: <strong className="text-stone-800">{orders.length}</strong></li>
              <li>• Reviews: <strong className="text-stone-800">{reviews.length}</strong></li>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Setup Form & Real-time Seeder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Credentials Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
          <div className="border-b border-stone-150 pb-3 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-stone-900 text-sm">Cluster Connection Details</h4>
              <p className="text-[11px] text-stone-500">Provide public api keys to establish persistent connectivity.</p>
            </div>
            {isSupabaseActive && (
              <button 
                onClick={handleClearCredentials}
                className="text-[10px] text-red-600 hover:text-red-700 font-bold uppercase transition cursor-pointer"
              >
                Disconnect Connection
              </button>
            )}
          </div>

          {saveSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 text-xs p-3 rounded-xl font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Link connections updated successfully!
            </div>
          )}

          <form onSubmit={handleSaveCredentials} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-xs text-stone-600 font-bold block flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-stone-400" /> Supabase Project URL
              </label>
              <input
                type="text"
                required
                placeholder="https://your-project-id.supabase.co"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs text-stone-900 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-stone-600 font-bold block flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-stone-400" /> Supabase Public Anon Key
              </label>
              <textarea
                required
                rows={2}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs text-stone-900 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl cursor-pointer transition shadow flex items-center gap-1.5"
            >
              <span>Verify & Connect Live Database</span>
            </button>
          </form>
        </div>

        {/* Cloud Seeder */}
        <div className="lg:col-span-1 bg-gradient-to-br from-stone-850 to-stone-950 rounded-3xl border border-stone-900 p-6 shadow-xl text-white flex flex-col justify-between">
          <div className="space-y-3">
            <div className="bg-amber-600/35 text-amber-400 border border-amber-500/20 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest inline-block">
              Schema Seeder
            </div>
            <h4 className="text-base font-black tracking-tight font-sans text-amber-500">
              One-Click Seed Setup
            </h4>
            <p className="text-stone-300 text-[11px] leading-relaxed">
              Connect your database key first, register tables using the bootstrap script, then click below to fully migrate Issa Kitchen initial seed dishes, categories, and reviews.
            </p>
            <p className="text-stone-400 text-[10px] leading-relaxed italic">
              *Warning: This wipes existing records on connected tables to prevent conflicts.
            </p>
          </div>

          <div className="pt-6 space-y-3">
            <button
              type="button"
              disabled={isActionLoading || !isSupabaseActive}
              onClick={resetDatabase}
              className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 border ${
                isSupabaseActive 
                  ? "bg-amber-600 hover:bg-amber-500 border-amber-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-stone-800 border-stone-800 text-stone-500 cursor-not-allowed"
              }`}
            >
              {isActionLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Provisioning...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Reset & Seed Supabase
                </>
              )}
            </button>
            {!isSupabaseActive && (
              <span className="text-[9px] text-stone-500 text-center block leading-tight">
                (Verify credentials setup on the left to activate seeders)
              </span>
            )}
          </div>
        </div>

      </div>

      {/* 3. Schema Bootstrap Instructions */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-stone-150 pb-3">
          <div>
            <h4 className="font-bold text-stone-900 text-sm">PostgreSQL Schema Bootstrap Commands</h4>
            <p className="text-[11px] text-stone-500">Run this complete SQL bootstrap script inside your Supabase dashboard editor.</p>
          </div>
          <button
            onClick={handleCopySql}
            className="p-1.5 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" /> Copied Script!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-500" /> Copy SQL Bootstrap
              </>
            )}
          </button>
        </div>

        <pre className="bg-stone-900 rounded-2xl p-4 font-mono text-[10px] text-stone-300 overflow-x-auto h-72 max-h-72 border border-stone-800 leading-relaxed select-all text-left">
          {schemaSql}
        </pre>
      </div>

    </div>
  );
}
