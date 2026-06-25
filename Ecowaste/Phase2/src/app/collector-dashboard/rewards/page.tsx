"use client";

import React, { useState, useEffect } from 'react';
import RewardDashboard from '@/components/rewards/RewardDashboard';
import CollectorSidebar from '../components/CollectorSidebar';
import { getCollectorSession } from '@/lib/requestStore';

export default function CollectorRewardsPage() {
  const [session, setSession] = useState<any>(null);
  
  useEffect(() => {
    setSession(getCollectorSession());
  }, []);
  
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <CollectorSidebar open={true} onToggle={() => {}} collector={session} />
      <div className="flex-1 flex flex-col overflow-auto bg-gray-50/50 dark:bg-gray-900/50 p-8">
        <RewardDashboard roleName="Collector" />
      </div>
    </div>
  );
}
