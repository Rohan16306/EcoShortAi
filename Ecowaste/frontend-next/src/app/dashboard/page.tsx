"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Leaf, Award, Recycle, Flame, ArrowUpRight, Target, Activity } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { getUserCredits, getAllRequests } from '@/lib/requestStore';

// Mock Data
const weeklyData = [
  { name: 'Mon', scans: 12, carbon: 2.4 },
  { name: 'Tue', scans: 19, carbon: 3.8 },
  { name: 'Wed', scans: 15, carbon: 3.0 },
  { name: 'Thu', scans: 22, carbon: 4.4 },
  { name: 'Fri', scans: 28, carbon: 5.6 },
  { name: 'Sat', scans: 35, carbon: 7.0 },
  { name: 'Sun', scans: 31, carbon: 6.2 },
];

export default function DashboardPage() {
  const { user, isAuthenticated } = useUserStore();
  const [credits, setCredits] = useState(0);
  const [itemsRecycled, setItemsRecycled] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get real stats
    const authRaw = localStorage.getItem('wastepickup_auth');
    let userId = 'current';
    let userPhone = '';
    if (authRaw) {
      try {
        const auth = JSON.parse(authRaw);
        userId = auth.email || auth.id || 'current';
        userPhone = auth.phone || '';
      } catch { /* ignore */ }
    }
    
    setCredits(getUserCredits(userId));
    
    const all = getAllRequests();
    const myCompleted = all.filter(
      (r) => r.status === 'completed' && (r.userName === user?.name || (userPhone && r.phone === userPhone))
    );
    setItemsRecycled(myCompleted.length);

    // Poll for real-time updates
    const interval = setInterval(() => {
      setCredits(getUserCredits(userId));
      const newAll = getAllRequests();
      const newCompleted = newAll.filter(
        (r) => r.status === 'completed' && (r.userName === user?.name || (userPhone && r.phone === userPhone))
      );
      setItemsRecycled(newCompleted.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [user]);

  if (!mounted) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="uppercase tracking-widest text-xs text-green-600 dark:text-green-400 mb-2 font-bold flex items-center gap-2">
              <Activity className="w-4 h-4" /> Eco Dashboard
            </p>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-gray-900 dark:text-white">
              Welcome back, {user?.name || 'Eco Warrior'}!
            </h1>
            <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-2xl text-lg">
              Here is your personal impact report. Keep scanning to level up your green rank.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-4 rounded-3xl border border-white/40 dark:border-gray-700/50 shadow-organic"
          >
            <div className="relative w-16 h-16">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="8" />
                <motion.circle 
                  cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-green-500" strokeWidth="8"
                  strokeDasharray="283"
                  initial={{ strokeDashoffset: 283 }}
                  animate={{ strokeDashoffset: 283 * (1 - 0.75) }} // 75% progress
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">14 Days</p>
            </div>
          </motion.div>
        </header>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Total Points", value: credits.toString(), icon: Award, trend: "+12%", color: "text-yellow-500", bg: "bg-yellow-500/10" },
            { label: "Items Recycled", value: itemsRecycled.toString(), icon: Recycle, trend: "+8%", color: "text-green-500", bg: "bg-green-500/10" },
            { label: "CO₂ Saved (kg)", value: (itemsRecycled * 0.2).toFixed(1), icon: Leaf, trend: "+24%", color: "text-emerald-500", bg: "bg-emerald-500/10" }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-6 rounded-3xl border border-white/40 dark:border-gray-700/50 shadow-sm relative overflow-hidden group hover:shadow-organic transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-bold bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  <ArrowUpRight className="w-4 h-4 mr-1" /> {stat.trend}
                </div>
              </div>
              <h3 className="text-gray-500 dark:text-gray-400 font-medium text-sm mb-1">{stat.label}</h3>
              <p className="text-3xl font-display font-bold text-gray-900 dark:text-white">{stat.value}</p>
              
              {/* Decorative background icon */}
              <stat.icon className={`absolute -bottom-4 -right-4 w-32 h-32 ${stat.color} opacity-5 group-hover:scale-110 transition-transform duration-500`} />
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-white/40 dark:border-gray-700/50 shadow-sm"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Scanning Activity</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your weekly recycling trends.</p>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#22c55e', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="scans" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Right Column: Goal/Target */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-gradient-to-br from-green-500 to-emerald-700 p-8 rounded-3xl shadow-lg text-white relative overflow-hidden"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] [background-size:20px_20px]"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                  <Target className="w-4 h-4" /> Next Milestone
                </div>
                <h3 className="text-3xl font-display font-bold mb-2">Zero Waste Hero</h3>
                <p className="text-green-100 mb-8">You are in the top 15% of recyclers in your area. Reach 3,000 points to unlock this exclusive badge.</p>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span>{credits} pts</span>
                  <span>3,000 pts</span>
                </div>
                <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((credits / 3000) * 100, 100)}%` }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.8 }}
                    className="h-full bg-white rounded-full relative"
                  >
                    <div className="absolute inset-0 bg-white/50 animate-pulse"></div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
