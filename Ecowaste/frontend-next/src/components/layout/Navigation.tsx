'use client';

import Link from 'next/link';
import { useUserStore } from '@/store/useUserStore';
import { Leaf, Moon, Sun, Coins, User, ChevronDown, PieChart, Gift, LogOut, Menu } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';

const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export default function Navigation() {
  const { user, isAuthenticated, logout } = useUserStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);

  return (
    <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <a href="/" className="flex items-center cursor-pointer">
            <Leaf className="text-green-600 w-6 h-6 mr-2" />
            <span className="font-bold text-xl tracking-tight text-gray-900">
              EcoSort<span className="text-green-600">AI</span>
            </span>
          </a>
          
          <div className="hidden md:flex space-x-8">
            <Link href="/scan" className="nav-btn text-gray-600 hover:text-green-600 font-medium transition">Scan & Earn</Link>
            <Link href="/marketplace" className="nav-btn text-gray-600 hover:text-green-600 font-medium transition">Marketplace</Link>
            <Link href="/community" className="nav-btn text-gray-600 hover:text-green-600 font-medium transition">Community</Link>
            <Link href="/leaderboard" className="nav-btn text-gray-600 hover:text-green-600 font-medium transition">Leaderboard</Link>
            <Link href="/sustain-ai" className="nav-btn flex items-center gap-1 text-green-700 bg-green-50 px-3 py-1.5 rounded-full hover:bg-green-100 hover:text-green-800 font-medium transition">
              <Leaf className="w-4 h-4" /> Sustain AI
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              type="button" 
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition hidden md:flex items-center"
            >
              {mounted && (theme === 'dark' ? <Sun className="w-4 h-4 mr-1" /> : <Moon className="w-4 h-4 mr-1" />)} 
              {mounted ? (theme === 'dark' ? 'Light' : 'Dark') : 'Theme'}
            </button>
            
            <div className="bg-yellow-100 px-3 py-1 rounded-full flex items-center space-x-2 border border-yellow-300 transition-all cursor-pointer hover:bg-yellow-200">
              <Coins className="w-4 h-4 text-yellow-600" />
              <span className="font-bold text-yellow-800">{user?.total_points || 0}</span>
            </div>
            
            {!isAuthenticated ? (
              <div className="hidden md:flex space-x-2">
                <button className="px-4 py-2 text-green-600 font-medium hover:text-green-800 transition">Log In</button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition shadow-sm">Sign Up</button>
              </div>
            ) : (
              <div className="hidden md:block relative">
                <button aria-label="User menu" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center space-x-2 focus:outline-none">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <User className="w-4 h-4" />
                  </div>
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-100">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm text-gray-500">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                    </div>
                    <Link href="/dashboard" onClick={() => setIsUserMenuOpen(false)} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <PieChart className="w-4 h-4 mr-2" /> Dashboard
                    </Link>
                    <Link href="/marketplace" onClick={() => setIsUserMenuOpen(false)} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Gift className="w-4 h-4 mr-2" /> Rewards Store
                    </Link>
                    <button onClick={logout} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <LogOut className="w-4 h-4 mr-2" /> Log Out
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <button aria-label="Toggle mobile menu" className="md:hidden text-gray-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
      
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t p-4 space-y-2">
          <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-left py-2 text-gray-600">Dashboard</Link>
          <Link href="/scan" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-left py-2 text-gray-600">Scan & Earn</Link>
          <Link href="/marketplace" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-left py-2 text-gray-600">Marketplace</Link>
          <Link href="/community" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-left py-2 text-gray-600">Community</Link>
          <Link href="/leaderboard" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-left py-2 text-gray-600">Leaderboard</Link>
          <Link href="/gallery" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-left py-2 text-gray-600">Gallery</Link>
          <Link href="/impact" className="block w-full text-left py-2 text-gray-600">Impact</Link>
          {!isAuthenticated && (
            <div className="border-t pt-2 flex gap-2">
              <button className="flex-1 py-2 text-green-600 border border-green-600 rounded-lg">Log In</button>
              <button className="flex-1 py-2 bg-green-600 text-white rounded-lg">Sign Up</button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
