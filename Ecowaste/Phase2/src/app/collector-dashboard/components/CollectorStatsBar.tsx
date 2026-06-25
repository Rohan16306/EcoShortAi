'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Truck, Package, Star } from 'lucide-react';
import { getCollectorStats, getUserCredits } from '@/lib/requestStore';

interface Props {
  collectorId?: string;
}

export default function CollectorStatsBar({ collectorId }: Props) {
  const [stats, setStats] = useState({
    todayPickups: 0,
    totalCompleted: 0,
    totalKg: 0,
  });

  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (!collectorId) return;
    const fetchStats = () => {
      setStats(getCollectorStats(collectorId));
      setCredits(getUserCredits(collectorId));
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [collectorId]);

  const cards = [
    { label: 'Today Pickups', value: stats.todayPickups, icon: Truck, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Completed', value: stats.totalCompleted, icon: Package, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Total Plastic', value: `${stats.totalKg} kg`, icon: TrendingUp, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Total Credits', value: credits, icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ];

  return (
    <div className="px-6 py-4 border-b border-border bg-card/50">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl">
        {cards.map((card, i) => (
          <div key={`stat-${i}`} className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
              <card.icon size={20} className={card.color} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{card.label}</p>
              <p className="text-lg font-bold text-foreground tabular-nums">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
