'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Clock, CheckCircle2, ChevronRight, Package, ArrowRight, X } from 'lucide-react';
import { getNotifications, markNotificationsRead, type AppNotification } from '@/lib/requestStore';

interface Props {
  activeRequestId?: string;
}

export default function NotificationFeed({ activeRequestId }: Props) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const fetchNotifs = () => {
      const all = getNotifications(activeRequestId);
      setNotifications(all);
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 3000);
    return () => clearInterval(interval);
  }, [activeRequestId]);

  const handleMarkRead = () => {
    if (activeRequestId) {
      markNotificationsRead(activeRequestId);
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'accepted': return <CheckCircle2 className="text-blue-500" size={18} />;
      case 'on-the-way': return <ChevronRight className="text-indigo-500" size={18} />;
      case 'arrived': return <MapPinIcon className="text-pink-500" size={18} />;
      case 'collected': return <Package className="text-green-500" size={18} />;
      case 'completed': return <CheckCircle2 className="text-green-600" size={18} />;
      default: return <Bell className="text-primary" size={18} />;
    }
  };

  const MapPinIcon = ({ className, size }: { className: string, size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );

  return (
    <div className="mt-8 px-6 pb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
        <button
          onClick={handleMarkRead}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Mark all as read
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 border border-dashed border-border flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bell size={24} className="text-muted-foreground opacity-50" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">Your request updates and activity will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`group bg-card border rounded-2xl p-4 transition-all duration-300 hover:shadow-md ${
                n.read ? 'border-border/50' : 'border-primary/20 bg-primary/[0.02]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  n.read ? 'bg-muted' : 'bg-primary/10'
                }`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h3 className={`text-sm font-bold truncate ${n.read ? 'text-foreground/80' : 'text-foreground'}`}>
                      {n.title}
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                      <Clock size={10} />
                      {n.time}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {n.desc}
                  </p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 animate-pulse" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 p-4 bg-muted/30 rounded-2xl border border-border">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <CheckCircle2 size={16} />
            </div>
            <p className="text-xs text-muted-foreground leading-tight">
               Don&apos;t forget to confirm the collection once your collector arrives at your location.
            </p>
         </div>
      </div>
    </div>
  );
}