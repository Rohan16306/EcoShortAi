'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, ShieldCheck, CloudLightning, Activity, 
  Key, Lock, ServerCog, DatabaseZap, Database 
} from 'lucide-react';

const flowSteps = [
  { id: 1, icon: User, title: 'User', desc: 'Secure Client Connection' },
  { id: 2, icon: ShieldCheck, title: 'HTTPS Encryption', desc: 'TLS 1.3 End-to-End Encryption' },
  { id: 3, icon: CloudLightning, title: 'Web Application Firewall', desc: 'Cloudflare Edge Protection' },
  { id: 4, icon: Activity, title: 'API Rate Limiter', desc: 'DDoS & Brute Force Prevention' },
  { id: 5, icon: Key, title: 'JWT Authentication', desc: 'Cryptographically Verified Sessions' },
  { id: 6, icon: Lock, title: 'Role-Based Access Control', desc: 'Strict Privilege Isolation' },
  { id: 7, icon: ServerCog, title: 'Server-side Business Logic', desc: 'Protected Un-cloneable Core' },
  { id: 8, icon: DatabaseZap, title: 'Redis Cache', desc: 'Sub-millisecond Data Retrieval' },
  { id: 9, icon: Database, title: 'PostgreSQL Database', desc: 'Encrypted at Rest' },
];

export default function SecurityArchitecture() {
  return (
    <section className="py-16 w-full max-w-5xl mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Interactive Security Architecture
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Trace the secure lifecycle of every request made on the EcoSort platform.
        </p>
      </div>

      <div className="relative flex flex-col items-center">
        {/* Vertical Line Connecting Cards */}
        <div className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-green-600 rounded" />

        {flowSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="relative z-10 flex items-center mb-8 w-full max-w-lg group"
            >
              <div className="flex-1 text-right pr-6 md:pr-12">
                {index % 2 === 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{step.desc}</p>
                  </div>
                )}
              </div>

              <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full border-4 border-emerald-500 flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/50 transition-shadow">
                <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>

              <div className="flex-1 pl-6 md:pl-12">
                {index % 2 !== 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{step.desc}</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
