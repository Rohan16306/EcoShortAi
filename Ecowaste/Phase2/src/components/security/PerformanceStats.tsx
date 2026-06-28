'use client';

import React from 'react';
import { motion } from 'framer-motion';

const stats = [
  { value: '99.9%', label: 'Availability' },
  { value: '<150ms', label: 'Cached Response' },
  { value: '100%', label: 'Enterprise Security' },
  { value: 'Redis', label: 'Accelerated' },
  { value: 'Infinite', label: 'Scalable Architecture' },
];

export default function PerformanceStats() {
  return (
    <section className="py-16 w-full max-w-6xl mx-auto px-4">
      <div className="bg-emerald-600 dark:bg-emerald-900 rounded-3xl p-8 md:p-12 shadow-xl shadow-emerald-500/20 text-white overflow-hidden relative">
        {/* Background Decorative Circles */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500 dark:bg-emerald-800 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-700 dark:bg-emerald-950 rounded-full blur-3xl opacity-50" />

        <div className="relative z-10 grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, type: "spring" }}
              className="flex flex-col items-center justify-center"
            >
              <div className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                {stat.value}
              </div>
              <div className="text-emerald-100 dark:text-emerald-300 font-medium text-sm md:text-base uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
