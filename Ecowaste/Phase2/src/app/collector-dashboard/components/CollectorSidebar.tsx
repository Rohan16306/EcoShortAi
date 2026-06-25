'use client';

import React from 'react';
import {
  LayoutDashboard,
  Map,
  History,
  Wallet,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  ChevronLeft,
  User,
  Recycle,
  Gift,
} from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import { clearCollectorSession } from '@/lib/requestStore';
import { useRouter } from 'next/navigation';
import type { CollectorSession } from './CollectorDashboardScreen';

interface Props {
  open: boolean;
  onToggle: () => void;
  collector: CollectorSession | null;
}

const navItems = [
  { id: 'dash', icon: LayoutDashboard, label: 'Dashboard', path: '/collector-dashboard' },
  { id: 'rewards', icon: Gift, label: 'Rewards', path: '/collector-dashboard/rewards' },
  { id: 'map', icon: Map, label: 'Map View', path: '/collector-dashboard' },
  { id: 'history', icon: History, label: 'History', path: '/collector-dashboard' },
  { id: 'earnings', icon: Wallet, label: 'Earnings', path: '/collector-dashboard' },
];

const secondaryNav = [
  { id: 'settings', icon: Settings, label: 'Settings', path: '#' },
  { id: 'help', icon: HelpCircle, label: 'Support & Help', path: '#' },
];

export default function CollectorSidebar({ open, onToggle, collector }: Props) {
  const router = useRouter();

  const handleLogout = () => {
    clearCollectorSession();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wastepickup_auth');
    }
    router.replace('/sign-up-login-screen');
  };

  return (
    <aside
      className={`relative h-full bg-card border-r border-border transition-all duration-300 flex flex-col flex-shrink-0 z-50 ${
        open ? 'w-[280px]' : 'w-20'
      }`}
    >
      {/* Sidebar header */}
      <div className="h-16 flex items-center px-6 border-b border-border transition-all cursor-pointer" onClick={() => router.push('/collector-dashboard')}>
        <div className={`flex items-center gap-3 ${!open ? 'justify-center w-full' : ''}`}>
          <AppLogo size={32} />
          {open && (
            <span className="font-bold text-lg text-primary tracking-tight">WastePickup</span>
          )}
        </div>
        {open && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shadow-sm text-muted-foreground hover:text-primary transition-all"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Navigation */}
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = typeof window !== 'undefined' && window.location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                } ${!open ? 'justify-center' : ''}`}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {open && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        <div className="my-6 border-t border-border/50" />

        {/* Secondary Navigation */}
        <div className="space-y-1">
          {secondaryNav.map((item) => (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all ${
                !open ? 'justify-center' : ''
              }`}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {open && <span>{item.label}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Collector profile & Logout */}
      <div className="p-4 border-t border-border mt-auto">
        {open ? (
          <div className="bg-muted/50 rounded-xl p-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                {collector?.initials ?? 'C'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{collector?.name ?? 'Collector'}</p>
                <p className="text-xs text-muted-foreground truncate">{collector?.vehicleType ?? 'Mini Truck'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {collector?.initials ?? 'C'}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 font-semibold transition-all ${
            !open ? 'justify-center' : ''
          }`}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {open && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}