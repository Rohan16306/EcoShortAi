"use client";
import { useEffect, useState } from 'react';
import pb from '@/lib/pocketbase';

export function LiveTicker() {
  const [latestScan, setLatestScan] = useState<{material: string; points_awarded: number} | null>(null);

  useEffect(() => {
    // Subscribe to real-time updates for all records in 'scans'
    pb.collection('scans').subscribe('*', (e) => {
      if (e.action === 'create') {
        setLatestScan(e.record as any);
      }
    });

    return () => {
      pb.collection('scans').unsubscribe('*');
    };
  }, []);

  if (!latestScan) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-green-900 text-white p-2 text-center text-sm z-50">
      🎉 Someone just recycled {latestScan.material} and earned {latestScan.points_awarded} credits!
    </div>
  );
}
