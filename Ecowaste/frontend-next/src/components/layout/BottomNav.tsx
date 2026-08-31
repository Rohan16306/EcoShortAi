'use client';

import Link from 'next/link';
import { Home, Camera, Gift, User } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 z-50 flex justify-around items-center h-16 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <a href="/" className={`flex flex-col items-center justify-center w-full h-full transition ${pathname === '/' ? 'text-green-600' : 'text-gray-500 hover:text-green-600'}`}>
        <Home className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">Home</span>
      </a>
      
      <Link href="/scan" className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-green-600 transition">
        <div className="bg-green-600 text-white rounded-full w-14 h-14 flex items-center justify-center -mt-6 shadow-lg border-4 border-white">
          <Camera className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-medium mt-1">Scan</span>
      </Link>
      
      <Link href="/marketplace" className={`flex flex-col items-center justify-center w-full h-full transition ${pathname === '/marketplace' ? 'text-green-600' : 'text-gray-500 hover:text-green-600'}`}>
        <Gift className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">Rewards</span>
      </Link>
      
      <Link href="/dashboard" className={`flex flex-col items-center justify-center w-full h-full transition ${pathname === '/dashboard' ? 'text-green-600' : 'text-gray-500 hover:text-green-600'}`}>
        <User className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">Dashboard</span>
      </Link>
    </div>
  );
}
