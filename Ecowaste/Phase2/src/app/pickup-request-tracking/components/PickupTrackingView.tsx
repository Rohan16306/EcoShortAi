'use client';

import React, { useState, useEffect } from 'react';
import { Package, MapPin, Phone, MoreVertical, Star, CheckCircle2, Navigation, MessageCircle, Clock, Truck, ChevronRight } from 'lucide-react';
import TrackingMap from './TrackingMap';
import type { PickupRequest } from '@/lib/requestStore';
import { updateRequestStatus } from '@/lib/requestStore';

interface Props {
  requests: PickupRequest[];
  onNewRequest: () => void;
}

export default function PickupTrackingView({ requests, onNewRequest }: Props) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Default to the first (latest) request if none selected
  const activeRequest = selectedRequestId
    ? requests.find(r => r.id === selectedRequestId)
    : (requests.length > 0 ? requests[0] : null);

  useEffect(() => {
    if (requests.length > 0 && !selectedRequestId) {
        setSelectedRequestId(requests[0].id);
    }
  }, [requests, selectedRequestId]);

  const handleConfirmPickup = () => {
    if (activeRequest) {
      updateRequestStatus(activeRequest.id, 'completed', { completedAt: new Date().toISOString() });
    }
  };

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-8 text-center fade-in">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-8 relative">
           <Truck size={40} className="text-primary opacity-40 absolute -left-4 animate-bounce" />
           <Package size={48} className="text-primary relative z-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-foreground mb-3">No active pickups</h2>
        <p className="text-muted-foreground mb-10 leading-relaxed font-medium">Your request list is empty. Start contributing to a cleaner environment today!</p>
        <button
          onClick={onNewRequest}
          className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-green-700 active:scale-95 transition-all flex items-center gap-2 group"
        >
          Request your first pickup
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background fade-in">
      {/* Visual Tracking Area */}
      <div className="h-[45vh] relative flex-shrink-0">
        <TrackingMap activeRequest={activeRequest} />

        {/* Back and Title floating overlay */}
        <div className="absolute top-6 left-6 right-6 flex items-center gap-4 z-20">
             <button
                onClick={onNewRequest}
                className="w-10 h-10 bg-card/90 backdrop-blur-md rounded-xl border border-border flex items-center justify-center shadow-lg text-foreground active:scale-90 transition-all"
             >
                <PlusIcon size={18} />
             </button>
             <div className="flex-1 bg-card/90 backdrop-blur-md rounded-xl border border-border px-4 h-10 flex items-center justify-between shadow-lg">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Live Tracking</span>
                <span className="text-xs font-black tabular-nums text-foreground">#{activeRequest?.id}</span>
             </div>
        </div>

        {/* Multi-request carousel indicators if needed (simplified) */}
        {requests.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 z-20">
                {requests.slice(0, 5).map(r => (
                    <button
                        key={`dot-${r.id}`}
                        onClick={() => setSelectedRequestId(r.id)}
                        className={`h-1 rounded-full transition-all duration-300 ${activeRequest?.id === r.id ? 'w-8 bg-primary' : 'w-2 bg-foreground/20'}`}
                    />
                ))}
            </div>
        )}
      </div>

      {/* Details Area */}
      <div className="flex-1 bg-card rounded-t-[40px] px-8 pt-8 pb-32 -mt-10 relative z-30 shadow-[0_-20px_40px_rgba(0,0,0,0.05)] border-t border-border/50">
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-8" />

        {activeRequest && (
          <div className="slide-up">
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-6">
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${getStatusStyles(activeRequest.status)}`}>
                    <div className="w-2 h-2 rounded-full bg-current animate-pulse-dot" />
                    {activeRequest.status.replace('-', ' ')}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <Clock size={12} />
                    {activeRequest.status === 'pending' ? 'Searching...' : '12 mins away'}
                </div>
            </div>

            {/* Collector Section - conditionally show if accepted */}
            {activeRequest.status !== 'pending' ? (
                <div className="mb-8">
                   <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center overflow-hidden">
                                    <div className="w-full h-full bg-primary flex items-center justify-center text-white text-xl font-black">
                                       {activeRequest.collectorName?.split(' ').map(n => n[0]).join('') ?? 'C'}
                                    </div>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent rounded-lg border-2 border-card flex items-center justify-center text-white">
                                    <Navigation size={12} fill="currentColor" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold text-foreground">{activeRequest.collectorName}</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="flex items-center gap-0.5 text-yellow-500">
                                        <Star size={12} fill="currentColor" />
                                        <span className="text-xs font-bold text-foreground">{'4.9'}</span>
                                    </div>
                                    <span className="text-muted-foreground text-xs">•</span>
                                    <span className="text-xs font-bold text-muted-foreground tracking-tight">{activeRequest.collectorVehicle ?? 'Pickup Vehicle'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                             <a href={`tel:${activeRequest.collectorPhone}`} className="w-11 h-11 rounded-xl bg-muted border border-border-hover flex items-center justify-center text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all">
                                <Phone size={18} />
                             </a>
                             <button className="w-11 h-11 rounded-xl bg-muted border border-border-hover flex items-center justify-center text-foreground hover:bg-accent hover:text-white hover:border-accent transition-all">
                                <MessageCircle size={18} />
                             </button>
                        </div>
                   </div>

                   {/* Activity Highlight Button (Confirm) */}
                   {activeRequest.status === 'collected' && (
                       <button
                         onClick={handleConfirmPickup}
                         className="w-full mt-6 flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-lg shadow-primary/20 hover:bg-green-700 transition-all border-b-4 border-green-800"
                       >
                         <CheckCircle2 size={18} />
                         CONFIRM COLLECTION
                       </button>
                   )}
                </div>
            ) : (
                <div className="mb-10 text-center py-6 bg-muted/20 border border-dashed border-border rounded-2xl">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="font-bold text-foreground mb-1">Looking for collectors nearby</p>
                    <p className="text-xs text-muted-foreground">This usually takes less than 3 minutes.</p>
                </div>
            )}

            {/* Request Summary */}
            <div className="space-y-6">
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Request Summary</h4>
                    <div className="grid grid-cols-2 gap-3">
                         <div className="bg-muted/30 border border-border/50 rounded-2xl p-4">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Waste Category</span>
                            <span className="text-sm font-extrabold text-foreground">{activeRequest.wasteType}</span>
                         </div>
                         <div className="bg-muted/30 border border-border/50 rounded-2xl p-4">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Est. Quantity</span>
                            <span className="text-sm font-extrabold text-foreground tabular-nums">{activeRequest.estimatedKg} <span className="text-[10px] font-medium opacity-70">KG</span></span>
                         </div>
                    </div>
                 </div>

                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent flex-shrink-0">
                        <MapPin size={18} />
                    </div>
                    <div className="min-w-0">
                         <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Pickup Address</p>
                         <p className="text-sm font-bold text-foreground leading-tight">{activeRequest.address}</p>
                         <p className="text-xs text-muted-foreground mt-1">{activeRequest.area}</p>
                    </div>
                 </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlusIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

function getStatusStyles(status: string) {
    switch (status) {
        case 'pending': return 'bg-warning/10 text-warning border border-warning/20';
        case 'accepted': return 'bg-accent/10 text-accent border border-accent/20';
        case 'on-the-way': return 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20';
        case 'arrived': return 'bg-pink-500/10 text-pink-500 border border-pink-500/20';
        case 'collected': return 'bg-success/10 text-success border border-success/20';
        case 'completed': return 'bg-green-600/10 text-green-600 border border-green-600/20';
        default: return 'bg-muted text-muted-foreground';
    }
}
