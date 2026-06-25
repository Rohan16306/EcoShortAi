"use client";

import React, { useState, useEffect } from 'react';
import { Gift, Coins, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { getRewardsCatalog, getUserCredits, claimReward, getUserClaimedRewards, Reward, ClaimedReward } from '@/lib/requestStore';

export default function RewardDashboard({ roleName }: { roleName: string }) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [history, setHistory] = useState<ClaimedReward[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // Poll for changes since we are using localStorage
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [roleName]);

  const loadData = () => {
    try {
      const authRaw = localStorage.getItem('wastepickup_auth');
      let userId = 'current';
      let role = roleName.toLowerCase() === 'collector' ? 'collector' : 'user';
      if (authRaw) {
        try {
          const auth = JSON.parse(authRaw);
          userId = auth.email || auth.id || 'current';
          if (auth.role) role = auth.role;
        } catch { /* ignore */ }
      }

      setRewards(getRewardsCatalog(role));
      setCredits(getUserCredits(userId));
      setHistory(getUserClaimedRewards(userId).reverse());
    } catch (err: any) {
      setError(err.message || 'Failed to load rewards data');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = (rewardId: string) => {
    try {
      setError(null);
      setSuccessMsg(null);
      const authRaw = localStorage.getItem('wastepickup_auth');
      let userId = 'current';
      if (authRaw) {
        try {
          const auth = JSON.parse(authRaw);
          userId = auth.email || auth.id || 'current';
        } catch { /* ignore */ }
      }

      const success = claimReward(userId, rewardId);
      if (success) {
        setSuccessMsg(`Successfully redeemed! View your history below.`);
        loadData();
      } else {
        setError('Failed to redeem reward. Insufficient credits.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during redemption');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading rewards...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {roleName} Rewards
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Redeem your earned credits for exclusive benefits.
          </p>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl p-4 text-white shadow-lg flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-white/80">Available Balance</div>
            <motion.div 
              key={credits}
              initial={{ scale: 1.5, color: '#4ade80' }}
              animate={{ scale: 1, color: '#ffffff' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="text-2xl font-bold tracking-tight"
            >
              {credits} Credits
            </motion.div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-xl flex items-center gap-3 border border-green-200 dark:border-green-800">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium">{successMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
        {rewards.length === 0 ? (
          <div className="col-span-full text-center p-12 bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
            <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Rewards Available</h3>
            <p className="text-gray-500 mt-1">There are currently no rewards configured for your role.</p>
          </div>
        ) : (
          rewards.map((reward, i) => (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{reward.icon}</span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{reward.name}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{reward.description}</p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="font-bold text-yellow-600 flex items-center gap-1">
                  <Coins className="w-4 h-4" />
                  {reward.creditsCost}
                </div>
                <button
                  onClick={() => handleRedeem(reward.id)}
                  disabled={credits < reward.creditsCost}
                  className={`px-4 py-2 rounded-xl font-medium transition ${
                    credits < reward.creditsCost
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30'
                  }`}
                >
                  {credits < reward.creditsCost ? 'Need Credits' : 'Redeem'}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {history.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Redemption History</h3>
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {history.map((item) => (
                <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl text-green-600 dark:text-green-400">
                      <Gift className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{item.rewardName}</h4>
                      <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.claimedAt).toLocaleDateString()}
                        <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-500 rounded-md text-xs font-medium ml-2">
                          -{item.creditsCost} Credits
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
