import React from 'react';
import SecurityArchitecture from '@/components/security/SecurityArchitecture';
import CachingDiagram from '@/components/security/CachingDiagram';
import CompetitiveAdvantage from '@/components/security/CompetitiveAdvantage';
import SecurityGrid from '@/components/security/SecurityGrid';
import PerformanceStats from '@/components/security/PerformanceStats';

export const metadata = {
  title: 'Security & Architecture | EcoSort',
  description: 'Learn about EcoSort\'s enterprise-grade security and intelligent caching architecture.',
};

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-x-hidden selection:bg-emerald-500/30">
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-full text-sm font-semibold mb-6">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span>System Status: Fully Operational & Secure</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-gray-900 dark:text-white">
          Enterprise-Grade Security <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-600">
            & Intelligent Architecture
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl mx-auto">
          EcoSort protects your sensitive user data while delivering lightning-fast, highly secure AI-powered waste classification at a global scale.
        </p>
      </section>

      {/* Components Assembled */}
      <PerformanceStats />
      
      <div className="bg-white dark:bg-gray-950 py-8">
        <SecurityArchitecture />
      </div>

      <CachingDiagram />

      <div className="bg-white dark:bg-gray-950 py-8">
        <CompetitiveAdvantage />
      </div>

      <SecurityGrid />

    </main>
  );
}
