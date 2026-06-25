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
  Package
} from 'lucide-react';
import { getAllAccounts, getAllRequests, type PickupRequest } from '@/lib/requestStore';
import { type AdminTab } from '../PortalEntry';

export default function AdminStats({ onNavigate }: { onNavigate?: (tab: AdminTab) => void }) {
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    setRequests(getAllRequests());
    setAccounts(getAllAccounts());
  }, []);

  const usersCount = accounts.filter(a => a.role === 'user').length;
  const collectorsCount = accounts.filter(a => a.role === 'collector').length;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const totalKg = requests.reduce((sum, r) => sum + r.estimatedKg, 0);

  const wasteTypes = ['Plastic', 'Organic', 'Paper', 'Electronic', 'Metal', 'Glass'];
  const distribution = wasteTypes.map(type => {
    const count = requests.filter(r => r.wasteType.toLowerCase().includes(type.toLowerCase())).length;
    return { label: type, count };
  });
  
  const totalRecs = requests.length || 1;
  const sortedDistribution = distribution
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map(item => ({
      label: item.label,
      percentage: Math.round((item.count / totalRecs) * 100),
      color: item.label === 'Plastic' ? 'bg-blue-500' : item.label === 'Organic' ? 'bg-emerald-500' : item.label === 'Paper' ? 'bg-indigo-500' : 'bg-rose-500'
    }));

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-12 animate-in fade-in duration-700">
      {/* SECTION 1: HEADER & KEY PERFORMANCE INDICATORS */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-slate-200 pb-8 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Live Mission Overvview</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Infrastructure</h1>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
           <div className="px-4 py-2 border-r border-slate-100 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Recovery Rate</p>
              <p className="text-lg font-black text-primary">94.2%</p>
           </div>
           <div className="px-4 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Node Uptime</p>
              <p className="text-lg font-black text-emerald-600">99.9%</p>
           </div>
        </div>
      </div>

      {/* SECTION 2: PRIMARY METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users size={20} />} 
          label="Registered Users" 
          value={usersCount} 
          trend="+12%" 
          onClick={() => onNavigate?.('users')} 
        />
        <StatCard 
          icon={<Truck size={20} />} 
          label="Active Fleet" 
          value={collectorsCount} 
          trend="Live" 
          onClick={() => onNavigate?.('collectors')} 
        />
        <StatCard 
          icon={<Package size={20} />} 
          label="Pending Queue" 
          value={pendingRequests} 
          trend="-2.4%" 
          onClick={() => onNavigate?.('requests')} 
        />
        <StatCard 
          icon={<Zap size={20} />} 
          label="Recovered Volume" 
          value={`${totalKg}kg`} 
          trend="+18%" 
        />
      </div>

      {/* SECTION 3: ANALYTICS & BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Distribution Map / Chart */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Regional Performance</h3>
                <p className="text-xs text-slate-500">Processing efficiency per metropolitan sector</p>
              </div>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-4 px-2">
            {[78, 45, 92, 64, 55, 88, 40, 72].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group translate-y-0 hover:-translate-y-2 transition-all duration-500">
                 <div className="w-full bg-slate-50 rounded-2xl relative overflow-hidden h-64">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-indigo-500/10 group-hover:bg-primary transition-all duration-700 rounded-t-2xl" 
                      style={{ height: `${val}%` }}
                    />
                    <div className="absolute inset-x-0 bottom-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg">{val}%</span>
                    </div>
                 </div>
                 <span className="text-[10px] font-bold text-slate-400">ZONE {i+1}</span>
              </div>
            ))}
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
                {sortedDistribution.map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                      <span>{item.label}</span>
                      <span className="text-white">{item.percentage}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} shadow-[0_0_8px_white/20]`} style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 pt-8 border-t border-white/10">
                 <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <ShieldCheck className="text-emerald-500" size={24} />
                    <div>
                       <p className="text-xs font-bold">System Health</p>
                       <p className="text-[10px] text-slate-400">Verified & Authenticated</p>
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
        <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
          {trend}
        </div>
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-2xl font-black text-slate-900">{value}</h4>
    </div>
  );
}

function MetricCard({ icon, label, value, trend, onClick }: { icon: React.ReactNode, label: string, value: string | number, trend: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`group bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all duration-500 relative overflow-hidden ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[40px] -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500 mb-6">
        {icon}
      </div>
      <div>
         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
         <h4 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h4>
         <div className="flex items-center gap-1.5 mt-3">
            <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
              {trend}
            </div>
            {trend.startsWith('+') && <ArrowUpRight size={12} className="text-emerald-500" />}
         </div>
      </div>
    </div>
  );
}

function ZoneData(label: string, val: number) {
  return { label, val };
}

