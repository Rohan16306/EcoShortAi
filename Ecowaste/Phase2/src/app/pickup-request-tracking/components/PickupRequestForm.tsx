'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { MapPin, Calendar, Scale, ChevronRight, Loader2, Map as MapIcon, Send, Sparkles } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import { addRequest } from '@/lib/requestStore';
import { getAuthCookie, setAuthCookie, removeAuthCookie } from '@/lib/authStorage';


interface FormInputs {
  address: string;
  area: string;
  wasteType: string;
  estimatedKg: number;
  preferredTime: string;
  notes: string;
}

export default function PickupRequestForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const detectedCoords = useRef<{ lat: number; lng: number } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormInputs>({
    defaultValues: {
      wasteType: 'Mixed Plastics',
      estimatedKg: 5,
      preferredTime: 'Anytime Today',
    },
  });

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        detectedCoords.current = { lat: latitude, lng: longitude };

        try {
          // Reverse geocode using OpenStreetMap Nominatim (free, no API key)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`,
            { headers: { 'Accept-Language': 'en' } }
          );

          if (!res.ok) throw new Error('Geocoding failed');

          const geo = await res.json();
          const addr = geo.address || {};

          // --- Build FULL detailed street address ---
          // Line 1: Building/House No + Road/Street Name
          const buildingOrHouse = addr.building || addr.house_number || addr.amenity || '';
          const road = addr.road || addr.pedestrian || addr.footway || addr.path || '';
          const streetLine = [buildingOrHouse, road].filter(Boolean).join(', ');

          // Line 2: Neighbourhood / Sector / Locality
          const neighbourhood = addr.neighbourhood || addr.quarter || addr.residential || '';
          const suburb = addr.suburb || addr.hamlet || addr.village || '';

          // Construct full address string
          const fullAddressParts = [
            streetLine,
            neighbourhood && neighbourhood !== suburb ? neighbourhood : '',
            suburb,
          ].filter(Boolean);
          const fullAddress = fullAddressParts.length > 0
            ? fullAddressParts.join(', ')
            : geo.display_name?.split(',').slice(0, 3).join(',').trim() || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

          // --- Build FULL area/locality with City, District, State, Pincode ---
          const city = addr.city || addr.town || addr.municipality || '';
          const district = addr.county || addr.state_district || '';
          const state = addr.state || '';
          const pincode = addr.postcode || '';
          const country = addr.country || '';

          const areaParts = [
            city,
            district && district !== city ? district : '',
            state,
            pincode ? `PIN: ${pincode}` : '',
          ].filter(Boolean);
          const areaString = areaParts.length > 0
            ? areaParts.join(', ')
            : country || 'Unknown area';

          // --- Always append exact GPS coordinates for precision ---
          const coordsTag = `[GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}]`;

          setValue('address', fullAddress ? `${fullAddress} ${coordsTag}` : coordsTag);
          setValue('area', areaString);
          toast.success('Exact location detected via GPS');
        } catch {
          // Fallback: fill coordinates if geocoding fails
          setValue('address', `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`);
          setValue('area', 'Location detected (address lookup failed)');
          toast.info('GPS detected but address lookup failed. You can type your address manually.');
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Location permission denied. Please allow location access in your browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Location unavailable. Please try again or enter address manually.');
            break;
          case error.TIMEOUT:
            toast.error('Location request timed out. Please try again.');
            break;
          default:
            toast.error('Unable to detect location. Please enter address manually.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  };

  const onSubmit = async (data: FormInputs) => {
    setLoading(true);

    const authRaw = getAuthCookie();
    const auth = authRaw ? JSON.parse(authRaw) : null;

    // Use real detected coordinates if available, otherwise attempt to get them
    const coords = detectedCoords.current || { lat: 0, lng: 0 };

    const request = {
      id: `req-${Date.now().toString().slice(-6)}`,
      userName: auth?.fullName ?? 'Anonymous Resident',
      phone: auth?.phone ?? '9876543210',
      ...data,
      distance: '~Nearby',
      lat: coords.lat,
      lng: coords.lng,
      submittedAt: new Date().toISOString(),
      status: 'pending' as const,
    };

    // Simulate backend latency
    await new Promise((r) => setTimeout(r, 1200));

    addRequest(request);
    setLoading(false);
    toast.success('Pickup request submitted! Finding a collector...');
    onSuccess();
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <header className="px-6 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <AppLogo size={36} />
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">EcoSortAI</h1>
        </div>
        <div className="relative bg-primary/5 rounded-2xl p-5 border border-primary/10 overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-10">
             <Sparkles size={64} className="text-primary" />
           </div>
           <h2 className="text-lg font-bold text-foreground mb-1 leading-tight">Need a plastic pickup?</h2>
           <p className="text-sm text-muted-foreground font-medium">Fill in the details below and we&apos;ll notify nearby verified collectors.</p>
        </div>
      </header>

      {/* Form Section */}
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-24 space-y-6">
        {/* Location Group */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
             <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
               <MapPin size={12} /> Pickup Location
             </label>
             <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={locating}
                className="text-[10px] uppercase font-bold text-primary flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full hover:bg-primary/20 transition-all border border-primary/10"
             >
                {locating ? <Loader2 size={10} className="animate-spin" /> : <MapIcon size={10} />}
                {locating ? 'Locating...' : 'Use Current Location'}
             </button>
          </div>

          <div className="space-y-3">
             <div className="relative group">
                <input
                  {...register('address', { required: 'Street address is required' })}
                  placeholder="Street name, building number"
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
                {errors.address && <p className="text-[10px] text-destructive font-bold mt-1 ml-1">{errors.address.message}</p>}
             </div>
             <input
               {...register('area', { required: 'Area/Locality is required' })}
               placeholder="Area, Locality (e.g. HSR Layout)"
               className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
             />
          </div>
        </section>

        {/* Waste Details Group */}
        <section className="space-y-4">
           <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
             <Scale size={12} /> Waste Details
           </label>
           <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                 <select
                    {...register('wasteType')}
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:border-primary outline-none"
                 >
                    <option value="Mixed Plastics">Mixed Plastics</option>
                    <option value="Bottles & Cans">Bottles & Cans</option>
                    <option value="Packaging Materials">Packaging Materials</option>
                    <option value="Hard Plastics">Hard Plastics</option>
                 </select>
              </div>
              <div className="relative">
                 <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Scale size={14} className="text-muted-foreground" />
                 </div>
                 <input
                    type="number"
                    {...register('estimatedKg')}
                    placeholder="Est. KG"
                    className="w-full pl-9 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:border-primary outline-none font-bold"
                 />
                 <span className="absolute right-3 inset-y-0 flex items-center text-[10px] font-bold text-muted-foreground pointer-events-none">KG</span>
              </div>
              <div className="relative">
                 <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Calendar size={14} className="text-muted-foreground" />
                 </div>
                 <select
                    {...register('preferredTime')}
                    className="w-full pl-9 pr-4 py-3 bg-card border border-border rounded-xl text-[11px] focus:border-primary outline-none font-semibold"
                 >
                    <option value="Anytime Today">Anytime Today</option>
                    <option value="Morning (9-12)">Morning (9-12)</option>
                    <option value="Afternoon (12-4)">Afternoon (12-4)</option>
                    <option value="Evening (4-7)">Evening (4-7)</option>
                 </select>
              </div>
           </div>
        </section>

        {/* Notes */}
        <section className="space-y-2">
           <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Special Instructions (Optional)</label>
           <textarea
             {...register('notes')}
             rows={3}
             placeholder="e.g. Near the blue gate, call before arriving"
             className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:border-primary outline-none resize-none"
           />
        </section>

        {/* Submit */}
        <div className="pt-2">
           <button
             type="submit"
             disabled={loading}
             className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
           >
             {loading ? <Loader2 size={24} className="animate-spin" /> : (
                <>
                   Submit Pickup Request
                   <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
             )}
           </button>
           <p className="text-[10px] text-center text-muted-foreground mt-4 font-medium px-4">
             By submitting, you agree to make the waste available at the entrance during the chosen slot.
           </p>
        </div>
      </form>
    </div>
  );
}