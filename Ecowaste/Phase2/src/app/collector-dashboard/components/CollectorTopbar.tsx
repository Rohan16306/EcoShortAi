'use client';

import React, { useEffect, useState } from 'react';
import { Search, Bell, MapPin, RefreshCcw, Menu } from 'lucide-react';

interface Props {
  onMenuToggle: () => void;
  locationSharing: boolean;
  setLocationSharing: (v: boolean) => void;
  pendingCount: number;
  onRefresh: () => void;
}

export default function CollectorTopbar({ onMenuToggle, locationSharing, setLocationSharing, pendingCount, onRefresh }: Props) {
  const [locationLabel, setLocationLabel] = useState('Detecting...');

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationLabel('Location N/A');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (!res.ok) throw new Error('Geocoding failed');
          const geo = await res.json();
          const addr = geo.address || {};
          const area = addr.suburb || addr.neighbourhood || addr.village || addr.hamlet || '';
          const city = addr.city || addr.town || addr.municipality || '';
          const state = addr.state || '';
          const short = [area, city, state].filter(Boolean).slice(0, 3).join(', ');
          setLocationLabel(short || 'Location detected');
        } catch {
          setLocationLabel(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
        }
      },
      () => {
        setLocationLabel('Location unavailable');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    );
  }, []);

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 flex-shrink-0 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-muted-foreground hover:bg-muted rounded-lg"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Search pickup ID, address..."
            className="h-10 w-64 lg:w-80 pl-10 pr-4 rounded-lg bg-muted/50 border border-transparent focus:bg-card focus:border-border text-sm transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-5">
        {/* On-Duty / Off-Duty Toggle */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
            <div className={`w-2 h-2 rounded-full animate-pulse ${locationSharing ? 'bg-primary' : 'bg-destructive'}`} />
            <span className="text-xs font-bold uppercase tracking-tight text-foreground">
                {locationSharing ? 'Online' : 'Offline'}
            </span>
            <button
                onClick={() => setLocationSharing(!locationSharing)}
                className={`w-8 h-4 rounded-full transition-all duration-200 relative ${locationSharing ? 'bg-primary/40' : 'bg-muted-foreground/30'}`}
            >
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-card shadow transition-all duration-200 ${locationSharing ? 'left-4.5' : 'left-0.5'}`} />
            </button>
        </div>

        <button
          onClick={onRefresh}
          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg relative transition-all"
          title="Refresh Request Feed"
        >
          <RefreshCcw size={20} />
        </button>

        <button className="p-2 text-muted-foreground hover:bg-muted rounded-lg relative">
          <Bell size={20} />
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-destructive text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>

        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border h-8">
          <MapPin size={16} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">{locationLabel}</span>
        </div>
      </div>
    </header>
  );
}