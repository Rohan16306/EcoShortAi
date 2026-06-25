'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Mail, Phone, MapPin, Search, Filter, Star, Trash2, ShieldAlert, Navigation, Package, Clock } from 'lucide-react';
import { getAllAccounts, getAllRequests, deleteAccount, type PickupRequest } from '@/lib/requestStore';
import { toast } from 'sonner';
import Modal from './Modal';

export default function CollectorList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewingRouteCollector, setViewingRouteCollector] = useState<any | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setAccounts(getAllAccounts().filter(a => a.role === 'collector'));
    setRequests(getAllRequests());
  };

  const filteredCollectors = accounts.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCollectorStats = (collectorId: string) => {
    const collReqs = requests.filter(r => r.collectorId === collectorId);
    return {
      total: collReqs.length,
      completed: collReqs.filter(r => r.status === 'completed').length,
      active: collReqs.filter(r => ['accepted', 'on-the-way', 'arrived'].includes(r.status)).length,
      rating: 4.8 // Mocked rating
    };
  };

  const handleDelete = (id: string) => {
    deleteAccount(id);
    toast.success('Collector removed from fleet');
    setDeleteConfirmId(null);
    refreshData();
  };

  const getCollectorRequests = (collectorId: string) => {
    return requests.filter(r => r.collectorId === collectorId);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Collector Management</h2>
          <p className="text-slate-500">Track collector performance, service areas, and vehicle assignments.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search collectors..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm w-64 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter size={18} />
            Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCollectors.length > 0 ? (
          filteredCollectors.map((collector) => {
            const stats = getCollectorStats(collector.id);
            const isConfirming = deleteConfirmId === collector.id;

            return (
              <div key={collector.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl uppercase">
                    {collector.fullName.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  
                  {isConfirming ? (
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => handleDelete(collector.id)}
                        className="p-1 px-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-colors text-[10px] font-bold"
                      >
                        CONFIRM
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(null)}
                        className="p-1 px-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-[10px] font-bold"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setDeleteConfirmId(collector.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="space-y-1 mb-4">
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">{collector.fullName}</h3>
                  <p className="text-sm font-medium text-primary flex items-center gap-1">
                    <Star size={14} className="fill-primary" />
                    {stats.rating} | {stats.completed} Success Pickups
                  </p>
                </div>

                <div className="space-y-3 pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Truck size={16} />
                    </div>
                    <span>{collector.vehicleType || 'Mini Truck'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <MapPin size={16} />
                    </div>
                    <span>{collector.serviceArea || 'Zonal Service'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Contact</span>
                    <span className="text-sm font-medium text-slate-700">{collector.phone}</span>
                  </div>
                  <button 
                    onClick={() => setViewingRouteCollector(collector)}
                    className="px-4 py-2 bg-slate-50 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <Navigation size={14} />
                    View Route
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center text-slate-400">
            <Truck size={64} className="mx-auto mb-4 text-slate-200" />
            <p>No collectors found in the system.</p>
          </div>
        )}
      </div>

      {/* ROUTE MODAL */}
      <Modal 
        isOpen={!!viewingRouteCollector} 
        onClose={() => setViewingRouteCollector(null)} 
        title={`Logistics Route: ${viewingRouteCollector?.fullName}`}
        maxWidth="max-w-4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* Mock Map */}
            <div className="aspect-video bg-slate-100 rounded-3xl border-4 border-white shadow-inner relative overflow-hidden flex items-center justify-center group">
               <div className="absolute inset-0 bg-grid-pattern opacity-10" />
               <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-primary animate-bounce">
                     <Navigation size={32} fill="currentColor" className="text-primary/20 absolute opacity-50" />
                     <Truck size={28} className="relative" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live GPS Telemetry</p>
               </div>

               {/* Simulated Route Line */}
               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <path d="M 20 80 Q 40 10 70 30 T 90 20" fill="transparent" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="text-primary" />
               </svg>
            </div>

            <div className="space-y-4">
               <h4 className="font-bold text-slate-900 flex items-center gap-2">
                 <Package size={18} className="text-primary" />
                 Assigned Pickups on this Route
               </h4>
               <div className="space-y-3">
                 {getCollectorRequests(viewingRouteCollector?.id).length > 0 ? (
                   getCollectorRequests(viewingRouteCollector?.id).map((req, idx) => (
                     <div key={req.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xs font-bold text-slate-400">
                             {idx + 1}
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-900">{req.address}</p>
                              <p className="text-[10px] text-slate-500">{req.wasteType} • {req.estimatedKg}kg</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                             req.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                           }`}>
                             {req.status}
                           </span>
                        </div>
                     </div>
                   ))
                 ) : (
                   <div className="py-10 text-center text-slate-400 italic text-sm">
                     No active requests assigned to this collector yet.
                   </div>
                 )}
               </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Route Efficiency</h4>
                <div className="space-y-4">
                   <div>
                      <p className="text-[10px] text-slate-500 mb-1 uppercase font-bold">Today's Distance</p>
                      <p className="text-2xl font-bold">14.2 <span className="text-xs text-slate-500">KM</span></p>
                   </div>
                   <div>
                      <p className="text-[10px] text-slate-500 mb-1 uppercase font-bold">Fuel Used</p>
                      <p className="text-2xl font-bold">2.4 <span className="text-xs text-slate-500">LTR</span></p>
                   </div>
                   <div className="pt-4 border-t border-slate-800">
                      <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                        <span>Capacity</span>
                        <span>75%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[75%]"></div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-white border border-slate-200 p-6 rounded-3xl">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Live Telemetry</h4>
                <div className="space-y-3">
                   <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-500">Last Ping</span>
                      <span className="text-slate-900">2 mins ago</span>
                   </div>
                   <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-500">Current Speed</span>
                      <span className="text-slate-900">22 km/h</span>
                   </div>
                   <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-500">Signal Strength</span>
                      <span className="text-emerald-500 font-bold">EXCELLENT</span>
                   </div>
                </div>
             </div>
             
             <button className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:opacity-90 transition-opacity">
                Contact Collector
             </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
