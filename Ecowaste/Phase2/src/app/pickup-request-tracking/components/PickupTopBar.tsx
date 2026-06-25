'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { Bell, User, LogOut, Phone } from 'lucide-react';
import { getNotifications, markNotificationsRead, subscribeToBroadcast, type AppNotification } from '@/lib/requestStore';

interface UserAuth {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export default function PickupTopbar() {
  const router = useRouter();
  const [user, setUser] = useState<UserAuth | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load user auth
    const raw = localStorage.getItem('wastepickup_auth');
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { /* ignore */ }
    }
    // Load notifications
    setNotifications(getNotifications());

    // Subscribe to new notifications
    const unsub = subscribeToBroadcast((msg) => {
      if (msg.type === 'NOTIFICATION_ADDED' || msg.type === 'STATUS_CHANGED') {
        setNotifications(getNotifications());
      }
    });
    const interval = setInterval(() => setNotifications(getNotifications()), 5000);
    return () => { unsub(); clearInterval(interval); };
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wastepickup_auth');
    }
    router.push('/sign-up-login-screen');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleBellClick = () => {
    setShowNotifs((v) => !v);
    if (!showNotifs) {
      // Mark all as read when opening
      notifications.forEach((n) => markNotificationsRead(n.requestId));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  if (!mounted) return null;

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-card border-b border-border flex-shrink-0 relative z-30">
      <Link href="/pickup-request-tracking" className="flex items-center gap-2.5">
        <AppLogo size={34} />
        <span className="font-bold text-base text-primary tracking-tight">WastePickup</span>
      </Link>

      <nav className="hidden md:flex items-center gap-1">
        <Link
          href="/pickup-request-tracking"
          className="px-3 py-2 rounded-lg text-sm font-semibold text-primary bg-primary/10 transition-colors"
        >
          My Pickups
        </Link>
        {user?.role === 'collector' && (
          <Link
            href="/collector-dashboard"
            className="px-3 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
          >
            Collector Portal
          </Link>
        )}
      </nav>

      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={handleBellClick}
            className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <span className="text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">Notifications</span>
                <button onClick={() => setShowNotifs(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell size={24} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-border last:border-0 ${!n.read ? 'bg-primary/5' : ''}`}
                    >
                      <p className="text-xs font-semibold text-foreground leading-snug">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.desc}</p>
                      <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User info + logout */}
        <div className="flex items-center gap-2">
          {user?.phone && (
            <a
              href={`tel:${user.phone}`}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-border transition-all"
              title="Your phone number"
            >
              <Phone size={14} />
              <span className="hidden lg:inline text-xs">{user.phone}</span>
            </a>
          )}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm font-semibold text-foreground">
            <User size={16} />
            <span className="hidden sm:inline max-w-[120px] truncate">{user?.fullName ?? 'My Account'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            title="Logout"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}