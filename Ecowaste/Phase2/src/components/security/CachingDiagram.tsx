'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Layout, HardDrive, Database, Globe } from 'lucide-react';

const cachingLevels = [
  {
    icon: Globe,
    title: 'Browser',
    desc: 'Client-side interface requesting data.',
    color: 'bg-blue-500'
  },
  {
    icon: Layout,
    title: 'Local Cache',
    desc: 'Local cache stores frequently accessed UI data (Session State).',
    color: 'bg-emerald-500'
  },
  {
    icon: HardDrive,
    title: 'Redis Cache',
    desc: 'Caches AI results, leaderboard data, user points, recycling locations, and frequently requested information.',
    color: 'bg-red-500'
  },
  {
    icon: Database,
    title: 'Database (PocketBase)',
    desc: 'Only queried when data is absolutely necessary or not available in cache.',
    color: 'bg-gray-700'
  }
];

const badges = [
  { icon: '⚡', text: 'Faster Response' },
  { icon: '🚀', text: 'Reduced Database Load' },
  { icon: '📈', text: 'Better Scalability' },
  { icon: '💾', text: 'Intelligent Caching' }
];

export default function CachingDiagram() {
  return (
    <section className="py-16 w-full max-w-6xl mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Left Side: Explanations & Badges */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Multi-Tier Data Caching
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            EcoSort employs a robust caching architecture to guarantee lightning-fast response times and minimal database overhead. By resolving queries at the edge or in-memory, we achieve enterprise-grade scalability.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {badges.map((badge, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
              >
                <span className="text-2xl">{badge.icon}</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{badge.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Side: Animated Diagram */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-3xl border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col items-center">
            {cachingLevels.map((level, idx) => (
              <React.Fragment key={idx}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex items-center space-x-4"
                >
                  <div className={`p-3 rounded-lg text-white ${level.color}`}>
                    <level.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{level.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{level.desc}</p>
                  </div>
                </motion.div>

                {idx !== cachingLevels.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.2 + 0.1 }}
                    className="my-3 text-gray-400 dark:text-gray-500 animate-bounce"
                  >
                    <ArrowDown className="w-6 h-6" />
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
