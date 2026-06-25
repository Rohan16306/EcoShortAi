"use client";

import React from 'react';
import RewardDashboard from '@/components/rewards/RewardDashboard';

export default function AdminRewardsPage() {
  return (
    <div className="max-w-7xl mx-auto py-8">
      <RewardDashboard roleName="Admin" />
    </div>
  );
}
