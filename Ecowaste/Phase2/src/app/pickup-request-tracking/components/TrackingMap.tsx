'use client';

import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import type { PickupRequest } from '@/lib/requestStore';

interface Props {
  activeRequest: PickupRequest | null;
}

export default function TrackingMap({ activeRequest }: Props) {
  // BACKEND INTEGRATION: Google Maps or Mapbox API integration
  // 1. Google Maps JS SDK (npm install @googlemaps/js-api-loader)
  // 2. Real-time updates: Use WebSocket (Socket.io) to listen for 'collector-location' events
  // 3. Smooth polyline: Calculate route from collector lat/lng to target lat/lng

  return (
    <div className="w-full h-full overflow-hidden map-placeholder">
      {/* City Mesh grid (CSS pattern in tailwind.css) */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />

      {/* Target Marker */}
      <div className="absolute top-[60%] left-[45%] transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-500">
          <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
              <div className="w-12 h-12 rounded-2xl bg-card border-4 border-primary shadow-2xl flex items-center justify-center relative">
                   <MapPin size={22} className="text-primary" />
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-foreground text-background text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-xl">
                 Your Home
              </div>
          </div>
      </div>

      {/* Collector Marker - if active */}
      {activeRequest && activeRequest.status !== 'pending' && (
          <div className="absolute top-[35%] left-[65%] transform -translate-x-1/2 -translate-y-1/2 z-20 animate-slide-in transition-all duration-1000">
             <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-accent border-4 border-white shadow-2xl flex items-center justify-center animate-pulse-dot">
                   <Navigation size={22} className="text-white" fill="currentColor" />
                </div>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-accent text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-xl">
                    Live: Collector
                </div>
                {/* Simulated route line */}
                <div className="absolute top-1/2 left-0 w-[150px] h-[3px] bg-accent/20 -rotate-[145deg] origin-left border-dashed border-t border-accent" />
             </div>
          </div>
      )}

      {/* Map Note Overlay */}
      <div className="absolute bottom-12 left-6 right-6 bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-2 flex items-center justify-center gap-2">
           <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mock Map View</span>
           <div className="w-1 h-1 rounded-full bg-muted-foreground" />
           <span className="text-[10px] font-medium text-muted-foreground italic">Google Maps integration point</span>
      </div>
    </div>
  );
}