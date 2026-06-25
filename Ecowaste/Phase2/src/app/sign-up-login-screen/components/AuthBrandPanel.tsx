import React from 'react';
import AppLogo from '@/components/ui/AppLogo';
import { Recycle, MapPin, Truck, CheckCircle } from 'lucide-react';
import type { AuthRole } from './AuthScreen';

const features = [
  {
    id: 'feat-schedule',
    icon: MapPin,
    title: 'GPS-Precise Pickup',
    desc: 'Share your exact location for seamless doorstep collection.',
  },
  {
    id: 'feat-track',
    icon: Truck,
    title: 'Live Collector Tracking',
    desc: 'Watch your collector travel to you in real time on the map.',
  },
  {
    id: 'feat-confirm',
    icon: CheckCircle,
    title: 'Instant Confirmation',
    desc: 'Get notified the moment your pickup is accepted and completed.',
  },
];

const collectorFeatures = [
  {
    id: 'col-nearby',
    icon: MapPin,
    title: 'Nearby Request Feed',
    desc: 'See all pending pickups in your area sorted by distance.',
  },
  {
    id: 'col-earn',
    icon: Recycle,
    title: 'Flexible Scheduling',
    desc: 'Accept requests on your own schedule, any time of day.',
  },
  {
    id: 'col-proof',
    icon: CheckCircle,
    title: 'Photo Proof Upload',
    desc: 'Upload collection proof to complete jobs and build your rating.',
  },
];

export default function AuthBrandPanel({ role }: { role: AuthRole }) {
  const list = role === 'collector' ? collectorFeatures : features;

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
            WastePickup
          </span>
        </div>

        <div className="mb-8">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-green-200 mb-4">
            {role === 'collector' ? 'For Collectors' : 'For Residents'}
          </span>
          <h1 className="text-white font-bold leading-tight mb-4" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
            {role === 'collector' ?'Earn by collecting plastic waste in your city' :'Schedule plastic waste pickup in minutes'}
          </h1>
          <p className="text-green-100 text-base leading-relaxed max-w-md">
            {role === 'collector' ?'Join our verified collector network. Accept nearby requests, track your earnings, and help build a cleaner city.' :'Submit a request, a nearby collector accepts it, and you can track them live until your plastic is collected.'}
          </p>
        </div>

        <div className="space-y-5">
          {list.map((f) => (
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
            <Recycle size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              2,847 kg collected this month
            </p>
            <p className="text-green-200 text-xs">
              Across 412 completed pickups in your city
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}