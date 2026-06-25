'use client';

import React from 'react';
import { MapPin, Navigation, Layers } from 'lucide-react';
import type { PickupRequest } from './CollectorDashboardScreen';

interface Props {
  requests: PickupRequest[];
  selectedRequest: PickupRequest | null;
  activeJob: PickupRequest | null;
  onSelectRequest: (r: PickupRequest) => void;
  locationSharing: boolean;
}

// Mock pin positions on the visual map (percentage-based)
const pinPositions: Record<string, { top: string; left: string }> = {
  'req-001': { top: '32%', left: '55%' },
  'req-002': { top: '58%', left: '42%' },
  'req-003': { top: '68%', left: '60%' },
  'req-004': { top: '28%', left: '72%' },
  'req-005': { top: '62%', left: '30%' },
};

// Collector mock position
const COLLECTOR_POS = { top: '45%', left: '50%' };

export default function CollectorMapPanel({ requests, selectedRequest, activeJob, onSelectRequest, locationSharing }: Props) {
  // BACKEND INTEGRATION: Google Maps API — replace this mock panel with <GoogleMap> component
  // Use Maps JavaScript API to render pickup pins and collector live location
  // WebSocket subscription for real-time collector position updates

  return (
    <div className="relative w-full h-full map-placeholder">
      {/* Map label */}
      <div className="absolute top-4 left-4 z-10 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm">
        <Layers size={14} className="text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">Bengaluru, Karnataka</span>
        <span className="text-xs text-muted-foreground">· Live view</span>
      </div>

      {/* Collector pin */}
      <div
        className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2"
        style={{ top: COLLECTOR_POS.top, left: COLLECTOR_POS.left }}
      >
        <div className="relative">
          <div className={`w-10 h-10 rounded-full bg-accent border-2 border-white shadow-lg flex items-center justify-center ${locationSharing ? 'animate-pulse-dot' : ''}`}>
            <Navigation size={18} className="text-white" />
          </div>
          {locationSharing && (
            <div className="absolute -inset-2 rounded-full bg-accent/20 animate-ping" />
          )}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-foreground text-background text-xs font-semibold px-2 py-0.5 rounded-md">
            You
          </div>
        </div>
      </div>

      {/* Request pins */}
      {requests.map((req) => {
        const pos = pinPositions[req.id];
        if (!pos) return null;
        const isSelected = selectedRequest?.id === req.id;
        const isActive = activeJob?.id === req.id;
        return (
          <button
            key={`map-pin-${req.id}`}
            onClick={() => onSelectRequest(req)}
            className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 group"
            style={{ top: pos.top, left: pos.left }}
            aria-label={`Select request from ${req.userName}`}
          >
            <div
              className={`relative flex flex-col items-center transition-all duration-200 ${
                isSelected ? 'scale-125' : 'hover:scale-110'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-colors ${
                  isActive
                    ? 'bg-warning'
                    : isSelected
                    ? 'bg-primary' :'bg-destructive'
                }`}
              >
                <MapPin size={14} className="text-white" />
              </div>
              {/* Popup on selected */}
              {isSelected && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 bg-card border border-border rounded-lg p-2.5 shadow-lg text-left slide-up">
                  <p className="text-xs font-bold text-foreground truncate">{req.userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{req.address}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-primary">{req.wasteType}</span>
                    <span className="text-xs text-muted-foreground">{req.estimatedKg} kg</span>
                  </div>
                  <p className="text-xs font-semibold text-accent mt-0.5">{req.distance} away</p>
                </div>
              )}
            </div>
          </button>
        );
      })}

      {/* Map note */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/80 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5">
        <p className="text-xs text-muted-foreground text-center">
          Mock map — Google Maps API integration point
        </p>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-2.5 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <span className="text-xs text-foreground font-medium">Pending pickup</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <span className="text-xs text-foreground font-medium">Your location</span>
        </div>
      </div>
    </div>
  );
}