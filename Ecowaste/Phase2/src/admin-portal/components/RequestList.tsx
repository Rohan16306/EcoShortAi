'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  ArrowRight, 
  Clock, 
  MapPin, 
  Truck, 
  User,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
  Trash2
} from 'lucide-react';
import { getAllRequests, updateRequestStatus, type PickupRequest, type RequestStatus } from '@/lib/requestStore';
import { toast } from 'sonner';
import Modal from './Modal';

export default function RequestList() {
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<PickupRequest | null>(null);

  useEffect(() => {
    setRequests(getAllRequests());
    
    // Simple polling for real-time updates in this demo
    const interval = setInterval(() => {
      setRequests(getAllRequests());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const filteredRequests = requests.filter(r => {
    const matchesSearch = 
      r.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.id.includes(searchTerm) ||
      r.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = statusFilter === 'all' || r.status === statusFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusInfo = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700', icon: <Clock size={12} /> };
      case 'accepted': return { label: 'Accepted', bg: 'bg-blue-100', text: 'text-blue-700', icon: <Truck size={12} /> };
      case 'on-the-way': return { label: 'On Way', bg: 'bg-indigo-100', text: 'text-indigo-700', icon: <Activity size={12} /> };
      case 'arrived': return { label: 'Arrived', bg: 'bg-purple-100', text: 'text-purple-700', icon: <MapPin size={12} /> };
      case 'collected': return { label: 'Collected', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <CheckCircle2 size={12} /> };
      case 'completed': return { label: 'Completed', bg: 'bg-primary/20', text: 'text-primary', icon: <CheckCircle2 size={12} /> };
      case 'rejected': return { label: 'Rejected', bg: 'bg-rose-100', text: 'text-rose-700', icon: <XCircle size={12} /> };
      default: return { label: status, bg: 'bg-slate-100', text: 'text-slate-700', icon: <AlertCircle size={12} /> };
    }
  };

  const forceStatusChange = (id: string, status: RequestStatus) => {
    const updated = updateRequestStatus(id, status);
    if (updated) {
      setRequests(getAllRequests());
      toast.success(`Request ${id} status forced to ${status}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pickup Overwatch</h2>
          <p className="text-slate-500">Monitor and intervene in all active and past pickup requests.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search ID, User, Address..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm w-64 transition-all"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All States</option>
            <option value="pending">Pending Only</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((req) => {
            const status = getStatusInfo(req.status);
            return (
              <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-all">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left: Request Basic Info */}
                  <div className="lg:w-1/4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{req.id.slice(-8)}</span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${status.bg} ${status.text}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-tight">{req.userName}</p>
                        <p className="text-[10px] text-slate-500">{req.phone}</p>
                      </div>
                    </div>
                    <div className="pt-2">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Waste Info</p>
                       <p className="text-sm text-slate-700 font-medium">{req.wasteType} • {req.estimatedKg}kg</p>
                    </div>
                  </div>

                  {/* Middle: Connection Info */}
                  <div className="hidden lg:flex flex-1 items-center justify-center px-6">
                    <div className="flex flex-col items-center gap-1 flex-1 max-w-[150px]">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <User size={14} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase truncate w-full text-center">{req.userName}</span>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div className={`h-[2px] w-full ${req.collectorId ? 'bg-primary' : 'bg-slate-200 bg-dashed'} relative`}>
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-1 border rounded-full text-[10px] font-bold ${req.collectorId ? 'text-primary border-primary/20' : 'text-slate-400 border-slate-100'}`}>
                          {req.status === 'completed' ? 'DELIVERED' : req.collectorId ? 'LINKED' : 'WAITING'}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-1 flex-1 max-w-[150px]">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${req.collectorId ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-50 text-slate-200'}`}>
                        <Truck size={14} />
                      </div>
                      <span className={`text-[10px] font-bold uppercase truncate w-full text-center ${req.collectorId ? 'text-indigo-500' : 'text-slate-300'}`}>
                        {req.collectorName || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions and Details */}
                  <div className="lg:w-1/3 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6 pt-4 lg:pt-0">
                    <div className="space-y-2">
                       <div className="flex items-center gap-2 text-xs text-slate-600">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="truncate">{req.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Clock size={14} className="text-slate-400" />
                        <span>Submitted {new Date(req.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      {req.status === 'pending' && (
                        <button 
                          onClick={() => forceStatusChange(req.id, 'rejected')}
                          className="flex-1 px-3 py-2 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors"
                        >
                          Reject
                        </button>
                      )}
                      {(req.status === 'accepted' || req.status === 'on-the-way') && (
                        <button 
                          onClick={() => forceStatusChange(req.id, 'completed')}
                          className="flex-1 px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors"
                        >
                          Force Complete
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedRequest(req)}
                        className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-primary transition-colors"
                        title="View Details"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Delete this request permanentely?')) {
                             const all = JSON.parse(localStorage.getItem('wastepickup_requests') || '[]');
                             const filtered = all.filter((r: any) => r.id !== req.id);
                             localStorage.setItem('wastepickup_requests', JSON.stringify(filtered));
                             setRequests(filtered);
                             toast.success('Request deleted');
                          }
                        }}
                        className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-rose-600 transition-colors"
                        title="Delete Request"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl">
            <ClipboardList size={64} className="mx-auto mb-4 text-slate-200" />
            <p>No requests found matching your current filters.</p>
          </div>
        )}
      </div>

      {/* REQUEST DETAIL MODAL */}
      <Modal 
        isOpen={!!selectedRequest} 
        onClose={() => setSelectedRequest(null)} 
        title={`Request Intelligence: #${selectedRequest?.id?.slice(-8)}`}
      >
        <div className="space-y-8">
           <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-16 -mt-16" />
              <div className="relative z-10">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Live Status Terminal</p>
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary border border-white/10">
                       <Activity size={24} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-bold uppercase tracking-tight">{selectedRequest?.status}</h3>
                       <p className="text-xs text-slate-400 font-mono">ENCRYPTED_ID: {selectedRequest?.id}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Metadata</h4>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-500">Waste Type</span>
                       <span className="font-bold text-slate-900">{selectedRequest?.wasteType}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-500">Estimated Weight</span>
                       <span className="font-bold text-slate-900">{selectedRequest?.estimatedKg} KG</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-500">Distance</span>
                       <span className="font-bold text-slate-900">{selectedRequest?.distance || '2.4 KM'}</span>
                    </div>
                 </div>
              </div>
              <div className="space-y-4">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stakeholders</h4>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-500">Resident</span>
                       <span className="font-bold text-primary underline cursor-pointer">{selectedRequest?.userName}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-500">Collector</span>
                       <span className="font-bold text-slate-900">{selectedRequest?.collectorName || 'Pending Assignment'}</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Geographical Data</h4>
              <div className="flex items-center gap-4 text-sm text-slate-900 font-medium">
                 <MapPin size={18} className="text-slate-400" />
                 {selectedRequest?.address}
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">LATITUDE</p>
                    <p className="font-mono text-xs">{selectedRequest?.lat || '28.6139'}</p>
                 </div>
                 <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">LONGITUDE</p>
                    <p className="font-mono text-xs">{selectedRequest?.lng || '77.2090'}</p>
                 </div>
              </div>
           </div>
        </div>
      </Modal>
    </div>
  );
}

