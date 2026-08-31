'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

const features = [
  { name: 'AI Waste Classification', wrapper: true, ecosort: true },
  { name: 'Server-side Business Logic', wrapper: false, ecosort: true },
  { name: 'Reward Calculation Engine', wrapper: false, ecosort: true },
  { name: 'Recycling Verification', wrapper: false, ecosort: true },
  { name: 'Environmental Impact Calculator', wrapper: false, ecosort: true },
  { name: 'Fraud Detection', wrapper: false, ecosort: true },
  { name: 'Secure Authentication', wrapper: false, ecosort: true },
  { name: 'Redis Caching', wrapper: false, ecosort: true },
  { name: 'Protected APIs', wrapper: false, ecosort: true },
  { name: 'Analytics Engine', wrapper: false, ecosort: true },
];

export default function CompetitiveAdvantage() {
  return (
    <section className="py-16 w-full max-w-5xl mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Why EcoSort Cannot Be Easily Cloned
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          EcoSort performs all critical processing securely on the server, making simple API wrapper cloning completely ineffective.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-4 border-b-2 border-gray-200 dark:border-gray-700 text-lg font-semibold text-gray-900 dark:text-white">Feature</th>
              <th className="p-4 border-b-2 border-gray-200 dark:border-gray-700 text-lg font-semibold text-gray-500 dark:text-gray-400 text-center bg-gray-50 dark:bg-gray-800/50 rounded-tl-xl">Simple API Wrapper App</th>
              <th className="p-4 border-b-2 border-emerald-500 text-lg font-bold text-emerald-600 dark:text-emerald-400 text-center bg-emerald-50 dark:bg-emerald-900/20 rounded-tr-xl">EcoSort Platform</th>
            </tr>
          </thead>
          <tbody>
            {features.map((feat, idx) => (
              <motion.tr 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="p-4 text-gray-800 dark:text-gray-200 font-medium">{feat.name}</td>
                <td className="p-4 text-center bg-gray-50/50 dark:bg-gray-800/30">
                  {feat.wrapper ? (
                    <CheckCircle2 className="w-6 h-6 text-gray-400 mx-auto" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400 mx-auto opacity-50" />
                  )}
                </td>
                <td className="p-4 text-center bg-emerald-50/50 dark:bg-emerald-900/10">
                  {feat.ecosort ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500 mx-auto" />
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
