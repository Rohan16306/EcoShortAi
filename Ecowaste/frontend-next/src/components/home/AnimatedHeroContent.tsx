"use client";

import Link from 'next/link';
import { Camera, Play, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export function AnimatedHeroContent() {
  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="inline-flex items-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-md px-5 py-2.5 rounded-full mb-8 border border-white/40 dark:border-gray-700/50 shadow-sm"
      >
        <Globe className="text-green-600 dark:text-green-400 w-4 h-4 mr-2 animate-pulse" />
        <span className="text-green-800 dark:text-green-200 font-semibold text-sm tracking-wide">Join 50,000+ Eco-Warriors Worldwide</span>
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
        className="text-6xl md:text-8xl font-display font-black tracking-tight mb-8 text-gray-900 dark:text-white drop-shadow-sm"
      >
        Turn Waste Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-teal-500 dark:from-green-400 dark:to-teal-300">Worth</span>.<br />
        Save Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">Planet</span>.
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        className="mt-6 max-w-3xl mx-auto text-xl md:text-2xl text-gray-700 dark:text-gray-300 leading-relaxed font-medium"
      >
        Every piece of plastic you recycle saves 2.5 metric tons of CO₂ emissions. 
        Join the revolution that's already diverted <strong className="text-green-700 dark:text-green-400">40 billion waste objects</strong> from landfills using AI-powered sorting.
      </motion.p>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
        className="mt-12 flex justify-center gap-6 flex-wrap"
      >
        <Link href="/scan" className="px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full font-bold text-lg shadow-xl shadow-green-500/30 hover:shadow-2xl hover:shadow-green-500/40 hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center group">
          <Camera className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" /> Start Scanning
        </Link>
        <Link href="#impact" className="px-10 py-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-full font-bold text-lg shadow-lg hover:bg-white dark:hover:bg-gray-800 hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center group">
          <Play className="w-6 h-6 mr-3 group-hover:text-green-500 transition-colors" /> Learn More
        </Link>
      </motion.div>
    </>
  );
}
