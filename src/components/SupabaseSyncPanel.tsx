import React, { useState, useEffect } from "react";
import { Database, Copy, Check, RefreshCw } from "lucide-react";

export default function SupabaseSyncPanel() {
  const [status, setStatus] = useState<{
    isConfigured: boolean;
    isConnected: boolean;
    error: string | null;
    url: string | null;
    schemaSql: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/supabase/status");
      const data = await res.json();
      setStatus(data);
    } catch (err: any) {
      console.error("Failed to load Supabase integration status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCopySql = () => {
    if (!status?.schemaSql) return;
    navigator.clipboard.writeText(status.schemaSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSyncToCloud = async () => {
    if (!confirm("Are you sure you want to push all current local orders, customers, reviews, and food items directly into Supabase? This will clear any conflicting records in the remote database tables.")) {
      return;
    }
    try {
      setSyncLoading(true);
      setSyncResult(null);
      const res = await fetch("/api/supabase/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncResult({ success: true, message: data.message });
        fetchStatus();
      } else {
        setSyncResult({ success: false, message: data.error || "Synchronizer failed" });
      }
    } catch (err: any) {
      setSyncResult({ success: false, message: err.message || "Network request failed" });
    } finally {
      setSyncLoading(false);
    }
  };

  if (loading && !status) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
        <p className="text-stone-500 font-sans text-xs">Polling cloud database cluster integration state...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left" id="panel-supabase-workspace">
      
      {/* Cloud Setup Status Header widget */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-150 pb-4">
          <div>
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-600" /> Supabase Connection Workspace
            </h3>
            <p className="text-stone-500 text-xs mt-0.5">
              Connect your production-ready food ordering system directly to Supabase PostgreSQL Database.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="px-3.5 py-1.5 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50 transition cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Link
            </button>
          </div>
        </div>

        {/* Dynamic Status Grid indicator */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
            <span className="text-[10px] text-stone-400 font-black uppercase tracking-wider block">Credentials Status</span>
            <div className="flex items-center gap-2">
              {status?.isConfigured ? (
                <>
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block" />
                  <span className="text-sm font-bold text-green-700">Environment Configured</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 bg-stone-300 rounded-full inline-block" />
                  <span className="text-sm font-bold text-stone-500">Unconfigured (.env.example placeholders)</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-stone-500 font-medium">
              Credentials are loaded dynamically from <code className="bg-stone-150 px-1 py-0.5 rounded font-mono text-amber-800 text-[10px] select-all">SUPABASE_URL</code> and <code className="bg-stone-150 px-1 py-0.5 rounded font-mono text-amber-800 text-[10px] select-all">SUPABASE_ANON_KEY</code>.
            </p>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
            <span className="text-[10px] text-stone-400 font-black uppercase tracking-wider block">Active Engine Status</span>
            <div className="flex items-center gap-2">
              {status?.isConnected ? (
                <>
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block animate-pulse" />
                  <span className="text-sm font-bold text-green-700">🟢 Connected to Supabase Cloud Server</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 bg-orange-400 rounded-full inline-block" />
                  <span className="text-sm font-bold text-orange-700">⚪ Running Local Fallback (db.json)</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-stone-500 font-medium">
              {status?.isConnected
                ? "Excellent! System tables are responsive and synced directly to Supabase cloud storage."
                : "The application is currently running automatically under high-fidelity sandbox database simulation."}
            </p>
          </div>
        </div>

        {/* Database Endpoint URL showing */}
        {status?.url && (
          <div className="bg-stone-100/50 rounded-xl p-3 border border-stone-200 text-xs font-mono text-stone-600 flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-[10px] text-stone-400 uppercase font-black">Cluster Endpoint:</span>
              <span className="truncate select-all">{status.url}</span>
            </div>
          </div>
        )}

        {/* Alert message if schema is not initialized */}
        {status?.error && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 space-y-1.5">
            <strong className="font-bold flex items-center gap-1">
              ⚠️ DB SETUP REQUIRED: Schema tables missing
            </strong>
            <p className="leading-relaxed">
              If your database url is correct but no tables exist yet, Supabase queries will fail until tables are created. 
              Please copy the bootstrap SQL code below, navigate to your <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-black hover:text-amber-950">Supabase SQL Editor</a>, paste, and run <strong>"Run"</strong>.
            </p>
            <p className="font-mono text-[10px] bg-amber-100/40 p-2 rounded border border-amber-200/50 mt-1 select-all">
              {status.error}
            </p>
          </div>
        )}
      </div>

      {/* Manual Synchronizer card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table creation guides */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-stone-150 pb-3">
            <div>
              <h4 className="font-bold text-stone-900 text-sm">Issa Kitchen Bootstrap Schema</h4>
              <p className="text-[11px] text-stone-500">Run this SQL in Supabase dashboard to provision tables instantly.</p>
            </div>
            <button
              onClick={handleCopySql}
              className="p-1.5 border border-stone-255 hover:bg-stone-50 text-stone-750 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-600" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-500" /> Copy SQL
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <pre className="bg-stone-900 rounded-2xl p-4 font-mono text-[10px] text-stone-200 overflow-x-auto h-72 max-h-72 border border-stone-800 leading-relaxed select-all">
              {status?.schemaSql}
            </pre>
          </div>
        </div>

        {/* One Click Syncer Operations bar */}
        <div className="lg:col-span-1 bg-gradient-to-br from-stone-800 to-stone-950 rounded-3xl border border-stone-900 shadow-lg p-6 text-white flex flex-col justify-between">
          <div className="space-y-4 text-left">
            <div className="bg-amber-600/20 text-amber-400 border border-amber-500/20 rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest inline-block">
              One-Click Migrator
            </div>
            <h4 className="text-base font-extrabold tracking-tight font-sans text-amber-500">
              Local Data Synchronizer
            </h4>
            <p className="text-stone-300 text-[11px] leading-relaxed">
              Already have custom orders, food categories, user status, and content-analyzed reviews stored locally in your workspace simulated session?
            </p>
            <p className="text-stone-300 text-[11px] leading-relaxed">
              Click the synchronizer below to transmit your entire simulated state directly into the connected cloud SQL tables instantly.
            </p>
          </div>

          <div className="space-y-4 pt-6">
            {syncResult && (
              <div className={`p-3 rounded-xl text-xs border leading-relaxed ${
                syncResult.success 
                  ? "bg-green-950/40 border-green-800 text-green-300"
                  : "bg-red-950/40 border-red-800 text-red-300"
              }`}>
                <strong>{syncResult.success ? "🟢 Synchronization success!" : "❌ Migration failed"}</strong>
                <p className="text-[10px] mt-1 text-stone-200">{syncResult.message}</p>
              </div>
            )}

            <button
              onClick={handleSyncToCloud}
              disabled={syncLoading || !status?.isConnected}
              className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 border ${
                status?.isConnected
                  ? "bg-amber-600 hover:bg-amber-500 border-amber-700 text-white"
                  : "bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed"
              }`}
            >
              {syncLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Synchronizing...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" /> Push local data to cloud
                </>
              )}
            </button>
            
            {!status?.isConnected && (
              <span className="text-[10px] text-stone-500 text-center block italic">
                (Connect your Supabase environment credentials to enable mapping synchronizations)
              </span>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
