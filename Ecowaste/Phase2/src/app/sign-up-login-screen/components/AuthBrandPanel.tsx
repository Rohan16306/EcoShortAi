import React from 'react';
import AppLogo from '@/components/ui/AppLogo';
import { Shield, Activity, Users, Lock } from 'lucide-react';
import type { AuthRole } from './AuthScreen';

const adminFeatures = [
  {
    id: 'feat-secure',
    icon: Lock,
    title: 'Secure Access',
    desc: 'Authorized personnel only. Your connection is encrypted and monitored.',
  },
  {
    id: 'feat-track',
    icon: Activity,
    title: 'Platform Monitoring',
    desc: 'Oversee all recycling activities, credits, and platform health in real-time.',
  },
  {
    id: 'feat-manage',
    icon: Users,
    title: 'User Management',
    desc: 'Control user accounts, investigate issues, and maintain community standards.',
  },
];

export default function AuthBrandPanel({ role }: { role: AuthRole }) {
  return (
    <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative bg-primary flex-col justify-between p-10 xl:p-14 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-80 h-80 blob-green opacity-60" />
      <div className="absolute bottom-0 right-0 w-96 h-96 blob-green opacity-40" />
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-14">
          <AppLogo size={40} />
          <span className="font-bold text-xl text-white tracking-tight">
            EcoSortAI
          </span>
        </div>

        <div className="mb-8">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-green-200 mb-4">
            System Administration
          </span>
          <h1 className="text-white font-bold leading-tight mb-4" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
            EcoSortAI Admin Portal
          </h1>
          <p className="text-green-100 text-base leading-relaxed max-w-md">
            Welcome to the command center. Authenticate to manage users, monitor platform statistics, and oversee the city-wide recycling network.
          </p>
        </div>

        <div className="space-y-5">
          {adminFeatures.map((f) => (
            <div key={f.id} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <f.icon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-green-200 text-sm mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
          <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              Secured Connection
            </p>
            <p className="text-green-200 text-xs">
              Connected to backend infrastructure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}