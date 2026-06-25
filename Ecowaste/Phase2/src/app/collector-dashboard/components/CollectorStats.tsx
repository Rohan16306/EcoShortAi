'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, Star, TrendingUp } from 'lucide-react';
import { getCollectorStats } from '@/lib/requestStore';

interface Props {
  collectorId?: string;
}

export default function CollectorStatsBar({ collectorId }: Props) {
  const [stats, setStats] = useState({
    todayPickups: 0,
    totalCompleted: 0,
    totalKg: 0,
    rating: 4.8,
  });

  useEffect(() => {
    if (!collectorId) return;
    const s = getCollectorStats(collectorId);
    setStats((prev) => ({ ...prev, ...s }));
  }, [collectorId]);

  const statItems = [
    {
      id: 'stat-today',
      label: "Today\'s Pickups",
      value: String(stats.todayPickups),
      sub: 'Completed today',
      icon: CheckCircle,
    },
    {
      id: 'stat-total',
      label: 'Total Completed',
      value: String(stats.totalCompleted),
      sub: 'All time',
      icon: Clock,
    },
    {
      id: 'stat-rating',
      label: 'Collector Rating',
      value: `${stats.rating} ★`,
      sub: 'Your rating',
      icon: Star,
    },
    {
      id: 'stat-kg',
      label: 'Total Collected',
      value: `${stats.totalKg} kg`,
      sub: 'Plastic waste',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="flex items-stretch gap-0 border-b border-border bg-card flex-shrink-0 overflow-x-auto">
      {statItems.map((s, i) => (
        <div
          key={s.id}
          className={`flex items-center gap-3 px-4 py-3 flex-1 min-w-[140px] ${
            i < statItems.length - 1 ? 'border-r border-border' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <s.icon size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
            <p className="text-sm font-bold text-foreground tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}