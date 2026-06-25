"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Star } from 'lucide-react';
import { subscribeToBroadcast } from '@/lib/requestStore';

export default function CreditAnimation() {
  const [show, setShow] = useState(false);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    // Listen for broadcast events from requestStore
    const unsubscribe = subscribeToBroadcast((msg) => {
      if (msg.type === 'STATUS_CHANGED' && msg.request.status === 'completed') {
        // Determine credits for current user based on role
        let role = '';
        const authRaw = localStorage.getItem('wastepickup_auth');
        if (authRaw) {
          try {
            const auth = JSON.parse(authRaw);
            role = auth.role ?? '';
          } catch { /* ignore */ }
        }

        let awarded = 0;
        if (role === 'collector' || role === 'ROLE_RECEIVER') {
          awarded = msg.request.collectorCreditsAwarded ?? 0;
        } else {
          awarded = msg.request.creditsAwarded ?? 0;
        }

        if (awarded > 0) {
          setCredits(awarded);
          setShow(true);
          setTimeout(() => setShow(false), 4000);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
            className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-8 rounded-3xl shadow-[0_0_50px_rgba(234,179,8,0.5)] flex flex-col items-center border border-yellow-300/50 relative overflow-hidden"
          >
            {/* Confetti particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
                animate={{ 
                  opacity: 0, 
                  x: (Math.random() - 0.5) * 200, 
                  y: (Math.random() - 0.5) * 200,
                  scale: Math.random() * 1.5 + 0.5,
                  rotate: Math.random() * 360
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute left-1/2 top-1/2 -ml-3 -mt-3 text-yellow-200"
              >
                <Star className="w-6 h-6 fill-current" />
              </motion.div>
            ))}

            <motion.div 
              animate={{ rotateY: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="bg-white p-4 rounded-full shadow-inner mb-4 relative z-10"
            >
              <Coins className="w-16 h-16 text-yellow-500" />
            </motion.div>
            
            <h2 className="text-3xl font-black text-white mb-2 drop-shadow-md relative z-10">
              +{credits} Credits!
            </h2>
            <p className="text-yellow-100 font-medium text-lg relative z-10">
              Added to your balance
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
