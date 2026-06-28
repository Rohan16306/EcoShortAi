'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Key, Lock, ShieldCheck, Activity, CloudLightning, 
  HardDrive, Code, ServerCog, Database, ScrollText 
} from 'lucide-react';

const features = [
  { icon: Key, title: 'JWT Authentication', desc: 'Stateless, cryptographically signed tokens ensure session integrity.' },
  { icon: Lock, title: 'Role-Based Access', desc: 'Strict privilege separation between users, collectors, and admins.' },
  { icon: ShieldCheck, title: 'HTTPS Encryption', desc: 'All data in transit is protected by industry-standard TLS 1.3.' },
  { icon: Activity, title: 'Rate Limiting', desc: 'Prevents automated abuse and protects backend resources.' },
  { icon: CloudLightning, title: 'Cloudflare Protection', desc: 'Global edge network filtering malicious traffic before it hits our servers.' },
  { icon: HardDrive, title: 'Redis Cache', desc: 'In-memory data structure store for lightning-fast state retrieval.' },
  { icon: Code, title: 'Input Validation', desc: 'Rigorous sanitization of all user inputs to prevent injection attacks.' },
  { icon: ServerCog, title: 'Server-side Verification', desc: 'Zero-trust architecture where all critical logic executes securely on the backend.' },
  { icon: Database, title: 'Secure Database', desc: 'Encrypted storage of sensitive user and environmental data.' },
  { icon: ScrollText, title: 'Activity Logging', desc: 'Comprehensive audit trails for system transparency and anomaly detection.' },
];

export default function SecurityGrid() {
  return (
    <section className="py-16 w-full max-w-6xl mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Comprehensive Security Measures
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          EcoSort is fortified with multiple layers of enterprise-grade security.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -5 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feat.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {feat.desc}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
