'use client';

import React from 'react';
import { Package, MapPin, Clock, ArrowRight, User, Phone, CheckCircle, XCircle } from 'lucide-react';
import type { PickupRequest } from './CollectorDashboardScreen';

interface Props {
  requests: PickupRequest[];
  selectedRequest: PickupRequest | null;
  onSelect: (r: PickupRequest) => void;
  onAccept: (r: PickupRequest) => void;
  onReject: (r: PickupRequest) => void;
}

export default function NearbyRequestsPanel({ requests, selectedRequest, onSelect, onAccept, onReject }: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex-items-center justify-between flex-shrink-0">
        <h2 className="text-sm font-bold text-foreground">Nearby Requests</h2>
        <span className="text-xs font-bold tabular-nums text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {requests.length} found
        </span>
      </div>

      {/* Request Scroll Area */}
      <div className="flex-1 overflow-y-auto">
        {requests.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Package size={24} className="text-muted-foreground" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1">No pending requests</h3>
            <p className="text-xs text-muted-foreground">New plastic pickup requests in your area will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {requests.map((req) => {
              const isSelected = selectedRequest?.id === req.id;
              return (
                <div
                  key={req.id}
                  onClick={() => onSelect(req)}
                  className={`px-4 py-4 cursor-pointer transition-all ${
                    isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center shadow-sm">
                        <User size={14} className="text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{req.userName}</h4>
                        <p className="text-[10px] text-muted-foreground">{req.area}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-accent tabular-nums">{req.distance} away</span>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-start gap-2">
                      <MapPin size={13} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-foreground line-clamp-2">{req.address}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 bg-primary/5 px-1.5 py-0.5 rounded">
                          {req.wasteType}
                        </span>
                        <span className="text-xs font-semibold text-foreground tabular-nums">{req.estimatedKg} kg</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock size={11} />
                        <span className="text-[10px] font-medium">{req.preferredTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions on select */}
                  {isSelected && (
                    <div className="space-y-2 slide-up">
                      {/* Navigate button */}
                      {req.lat && req.lng && req.lat !== 0 && req.lng !== 0 && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${req.lat},${req.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"
                        >
                          <ArrowRight size={14} />
                          Navigate in Google Maps
                        </a>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAccept(req);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-green-700 transition-all shadow-sm shadow-primary/20"
                        >
                          <CheckCircle size={14} />
                          Accept Job
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onReject(req);
                          }}
                          className="w-10 flex items-center justify-center border border-border rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
                          aria-label="Reject"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-muted/20 border-t border-border flex-shrink-0">
        <div className="bg-card/50 rounded-lg p-3 border border-border/50">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Collection Tip</p>
          <p className="text-[11px] text-foreground leading-relaxed">
            Requests with clear &apos;Waste Type&apos; and &apos;Estimated weight&apos; are usually ready for immediate pickup.
          </p>
        </div>
      </div>
    </div>
  );
}
