'use client';

import React from 'react';
import { PlusCircle, MapPin, Bell, Gift } from 'lucide-react';

interface Props {
  activeTab: 'request' | 'track' | 'notifications' | 'rewards';
  setActiveTab: (tab: 'request' | 'track' | 'notifications' | 'rewards') => void;
}

export default function PickupTabBar({ activeTab, setActiveTab }: Props) {
  const tabs = [
    { id: 'request', label: 'Request', icon: PlusCircle },
    { id: 'track', label: 'Track', icon: MapPin },
    { id: 'notifications', label: 'Activity', icon: Bell },
    { id: 'rewards', label: 'Rewards', icon: Gift },
  ] as const;

  return (
    <nav className="absolute bottom-0 left-0 right-0 z-50 px-6 pb-6 pt-2 bg-gradient-to-t from-background via-background/95 to-transparent">
      <div className="flex items-center justify-around bg-card border border-border rounded-2xl p-2 shadow-xl backdrop-blur-md">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 flex-1 py-1.5 transition-all duration-300 relative ${
                isActive ? 'text-primary scale-110' : 'text-muted-foreground'
              }`}
            >
              <tab.icon size={22} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -top-1 w-8 h-1 bg-primary rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}