'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Users, 
  Truck, 
  ClipboardList, 
  LogOut, 
  Activity,
  Shield,
  Search,
  Bell,
  Database,
  Gift
} from 'lucide-react';
import { toast } from 'sonner';

// Import our local components from the portal folder
import AdminStats from './components/AdminStats';
import UserList from './components/UserList';
import CollectorList from './components/CollectorList';
import RequestList from './components/RequestList';
import SystemLogs from './components/SystemLogs';
import RewardDashboard from '@/components/rewards/RewardDashboard';

export type AdminTab = 'overview' | 'users' | 'collectors' | 'requests' | 'logs' | 'rewards';

export default function AdminPortalEntry() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [adminName, setAdminName] = useState('Administrator');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const authenticate = async () => {
      let token = searchParams.get('pb_token');
      
      // If found in URL, save it and clean URL
      if (token) {
        localStorage.setItem('pb_auth', JSON.stringify({ token }));
        window.history.replaceState({}, '', '/admin-dashboard');
      } else {
        // Fallback to local storage
        const stored = localStorage.getItem('pb_auth');
        if (stored) {
          try {
            token = JSON.parse(stored).token;
          } catch (e) {}
        }
      }

      if (!token) {
        toast.error('Authentication required. Redirecting...');
        window.location.href = 'https://eco-sort-ai-ochre.vercel.app/?intent=admin';
        return;
      }

      try {
        const pbUrl = process.env.NODE_ENV === 'development' 
            ? 'https://ecowaste-pocketbase.onrender.com' 
            : 'https://ecowaste-pocketbase.onrender.com';
            
        const res = await fetch(`${pbUrl}/api/collections/users/auth-refresh`, {
          method: 'POST',
          headers: {
            'Authorization': token
          }
        });

        if (!res.ok) {
          throw new Error('Invalid token');
        }

        const data = await res.json();
        if (data.record.role !== 'ROLE_ADMIN') {
          toast.error('Access denied. Admin role required.');
          window.location.href = 'https://eco-sort-ai-ochre.vercel.app/?intent=admin';
          return;
        }

        setAdminName(data.record.name || 'Administrator');
        setIsLoaded(true);
        // Refresh token in storage
        localStorage.setItem('pb_auth', JSON.stringify({ token: data.token }));
      } catch (err) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('pb_auth');
        window.location.href = 'https://eco-sort-ai-ochre.vercel.app/?intent=admin';
      }
    };

    authenticate();
  }, [searchParams]);

  const handleLogout = () => {
    localStorage.removeItem('pb_auth');
    toast.success('Logged out from Admin Portal');
    window.location.href = 'https://eco-sort-ai-ochre.vercel.app';
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar - Local to Admin Portal */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">Admin Portal</h1>
            <p className="text-xs text-slate-500">Internal System (Full Access)</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <SidebarItem 
            icon={<Activity size={20} />} 
            label="System Overview" 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
          />
          <SidebarItem 
            icon={<Users size={20} />} 
            label="User Database" 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
          />
          <SidebarItem 
            icon={<Truck size={20} />} 
            label="Collector Fleet" 
            active={activeTab === 'collectors'} 
            onClick={() => setActiveTab('collectors')} 
          />
          <SidebarItem 
            icon={<ClipboardList size={20} />} 
            label="Service Requests" 
            active={activeTab === 'requests'} 
            onClick={() => setActiveTab('requests')} 
          />
          <SidebarItem 
            icon={<Database size={20} />} 
            label="Master Logs" 
            active={activeTab === 'logs'} 
            onClick={() => setActiveTab('logs')} 
          />
          <SidebarItem 
            icon={<Gift size={20} />} 
            label="Rewards" 
            active={activeTab === 'rewards'} 
            onClick={() => setActiveTab('rewards')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-medium"
          >
            <LogOut size={20} />
            Exit Portal
          </button>
        </div>
      </aside>

      {/* Portal Main Stage */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Portal Top Bar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-full w-96 font-mono text-xs text-slate-500">
            <span className="text-emerald-500 font-bold">DATABASE CONNECTED</span>
            <span className="text-slate-300">|</span>
            <span>SECURE PROXY: 10.0.0.1</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">{adminName}</p>
                <p className="text-[10px] uppercase tracking-wider font-bold text-primary">Master Admin</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-500">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Portal Dynamic Components */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'overview' && <AdminStats onNavigate={setActiveTab} />}
          {activeTab === 'users' && <UserList />}
          {activeTab === 'collectors' && <CollectorList />}
          {activeTab === 'requests' && <RequestList />}
          {activeTab === 'logs' && <SystemLogs />}
          {activeTab === 'rewards' && <RewardDashboard roleName="Admin" />}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
        active 
          ? 'bg-primary text-white shadow-md shadow-primary/20' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <span className={active ? 'text-white' : 'text-slate-400'}>{icon}</span>
      {label}
    </button>
  );
}
