'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Truck,
  ClipboardList,
  CheckCircle,
  Activity,
  Globe,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  Package,
  Loader2,
  RefreshCw,
  Coins,
  Leaf,
  Gift
} from 'lucide-react';
import { AdminDataService, type AdminPlatformStats } from '../services/AdminDataService';
import { type AdminTab } from '../PortalEntry';

export default function AdminStats({ onNavigate }: { onNavigate?: (tab: AdminTab) => void }) {
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminDataService.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to fetch admin stats:', err);
      setError(err.message || 'Failed to load stats from backend.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 animate-in fade-in duration-500">
        <Loader2 size={40} className="text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Loading platform statistics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 animate-in fade-in duration-500">
        <ShieldCheck size={48} className="text-rose-400" />
        <p className="text-slate-700 font-bold text-lg">Connection Error</p>
        <p className="text-slate-500 text-sm max-w-md text-center">{error}</p>
        <button onClick={loadStats} className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center gap-2">
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  // Build material distribution for the chart
  const materialEntries = Object.entries(stats.materialBreakdown || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);
  const totalMaterialItems = materialEntries.reduce((sum, [, count]) => sum + count, 0) || 1;
  const materialColors = ['bg-blue-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-rose-500', 'bg-amber-500', 'bg-purple-500'];

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-12 animate-in fade-in duration-700">
      {/* SECTION 1: HEADER & KEY PERFORMANCE INDICATORS */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-slate-200 pb-8 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Live Platform Data</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Infrastructure</h1>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
           <div className="px-4 py-2 border-r border-slate-100 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">CO₂ Saved</p>
              <p className="text-lg font-black text-emerald-600">{stats.co2Saved} kg</p>
           </div>
           <div className="px-4 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Node Uptime</p>
              <p className="text-lg font-black text-emerald-600">99.9%</p>
           </div>
           <button onClick={loadStats} className="p-2 text-slate-400 hover:text-primary rounded-lg transition-colors" title="Refresh Stats">
             <RefreshCw size={16} />
           </button>
        </div>
      </div>

      {/* SECTION 2: PRIMARY METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users size={20} />}
          label="Registered Users"
          value={stats.totalUsers}
          trend={`${stats.totalUsers} total`}
          onClick={() => onNavigate?.('users')}
        />
        <StatCard
          icon={<Coins size={20} />}
          label="Total Credits"
          value={stats.totalCredits.toLocaleString()}
          trend="Platform-wide"
        />
        <StatCard
          icon={<Package size={20} />}
          label="Items Recycled"
          value={stats.totalItems}
          trend={`${stats.co2Saved} kg CO₂ saved`}
        />
        <StatCard
          icon={<Gift size={20} />}
          label="Rewards Claimed"
          value={stats.totalRewards}
          trend="All time"
        />
      </div>

      {/* SECTION 3: ANALYTICS & BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Material Distribution Chart */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Material Distribution</h3>
                <p className="text-xs text-slate-500">Breakdown of all scanned items by material type</p>
              </div>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-4 px-2">
            {materialEntries.length > 0 ? (
              materialEntries.map(([material, count], i) => {
                const pct = Math.round((count / totalMaterialItems) * 100);
                return (
                  <div key={material} className="flex-1 flex flex-col items-center gap-3 group translate-y-0 hover:-translate-y-2 transition-all duration-500">
                     <div className="w-full bg-slate-50 rounded-2xl relative overflow-hidden h-64">
                        <div
                          className={`absolute bottom-0 left-0 right-0 ${materialColors[i % materialColors.length]} opacity-20 group-hover:opacity-100 transition-all duration-700 rounded-t-2xl`}
                          style={{ height: `${Math.max(pct, 5)}%` }}
                        />
                        <div className="absolute inset-x-0 bottom-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg">{count} items ({pct}%)</span>
                        </div>
                     </div>
                     <span className="text-[10px] font-bold text-slate-400 uppercase">{material}</span>
                  </div>
                );
              })
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 italic text-sm">
                No material data available yet.
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Breakdown */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-slate-900 text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl" />

              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-white/10 rounded-xl">
                  <TrendingUp size={20} className="text-primary" />
                </div>
                <h3 className="font-bold text-xl">Waste Portfolio</h3>
              </div>

              <div className="space-y-6">
                {materialEntries.slice(0, 4).map(([material, count], i) => {
                  const pct = Math.round((count / totalMaterialItems) * 100);
                  return (
                    <div key={material} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                        <span>{material}</span>
                        <span className="text-white">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${materialColors[i % materialColors.length]} shadow-[0_0_8px_white/20]`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-12 pt-8 border-t border-white/10">
                 <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <ShieldCheck className="text-emerald-500" size={24} />
                    <div>
                       <p className="text-xs font-bold">Backend Connected</p>
                       <p className="text-[10px] text-slate-400">Live data from db.json</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend, onClick }: { icon: React.ReactNode, label: string, value: string | number, trend: string, onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`group bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm hover:border-primary/30 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/5 transition-colors">
          {icon}
        </div>
        <div className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-slate-50 text-slate-400">
          {trend}
        </div>
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-2xl font-black text-slate-900">{value}</h4>
    </div>
  );
}
