'use client';

import React, { useState, useEffect, useCallback } from 'react';
import CollectorSidebar from './CollectorSidebar';
import CollectorTopbar from './CollectorTopbar';
import NearbyRequestsPanel from './NearbyRequestsPanel';
import CollectorMapPanel from './CollectorMapPanel';
import ActiveJobPanel from './ActiveJobPanel';
import CollectorStatsBar from './CollectorStatsBar';
import {
  getAllRequests,
  getPendingRequests,
  updateRequestStatus,
  subscribeToBroadcast,
  getCollectorSession,
  setCollectorSession,
  type PickupRequest,
  type RequestStatus,
  type CollectorSession,
} from '@/lib/requestStore';
import { useRouter } from 'next/navigation';
import { getAuthCookie, setAuthCookie, removeAuthCookie } from '@/lib/authStorage';


export type { RequestStatus, PickupRequest };

export default function CollectorDashboardScreen() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<PickupRequest[]>([]);
  const [activeJob, setActiveJob] = useState<PickupRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PickupRequest | null>(null);
  const [locationSharing, setLocationSharing] = useState(false);
  const [collector, setCollector] = useState<CollectorSession | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Load real data on mount
  const refreshRequests = useCallback(() => {
    const pending = getPendingRequests();
    setPendingRequests(pending);

    // Also refresh active job if it exists
    setActiveJob((prev) => {
      if (!prev) return null;
      const all = getAllRequests();
      const updated = all.find((r) => r.id === prev.id);
      return updated ?? null;
    });
  }, []);

  useEffect(() => {
    setMounted(true);

    // ── Role guard: only collectors can access this page ──────────────────────
    const authRaw = typeof window !== 'undefined' ? getAuthCookie() : null;
    if (!authRaw) {
      router.replace('/sign-up-login-screen');
      return;
    }
    let auth: { role?: string; id?: string; name?: string; fullName?: string; phone?: string; vehicleType?: string; serviceArea?: string } | null = null;
    try { auth = JSON.parse(authRaw); } catch { /* ignore */ }
    if (!auth || auth.role !== 'collector') {
      if (auth?.role === 'admin') {
        router.replace('/admin-dashboard');
      } else {
        router.replace('/pickup-request-tracking');
      }
      return;
    }

    // Load or create collector session
    let session = getCollectorSession();
    if (!session) {
      session = {
        id: auth?.id ?? `collector-${Date.now()}`,
        name: auth?.fullName ?? auth?.name ?? 'Collector',
        phone: auth?.phone ?? '',
        rating: 4.8,
        totalPickups: 0,
        vehicleType: auth?.vehicleType ?? 'Auto Rickshaw',
        serviceArea: auth?.serviceArea ?? 'Local Area',
        initials: (auth?.fullName ?? auth?.name ?? 'C')
          .split(' ')
          .map((w: string) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
      };
      setCollectorSession(session);
    }
    setCollector(session);

    // Load initial data
    refreshRequests();

    // Subscribe to real-time updates via BroadcastChannel
    const unsubscribe = subscribeToBroadcast((msg) => {
      if (
        msg.type === 'REQUEST_ADDED' ||
        msg.type === 'REQUEST_UPDATED' ||
        msg.type === 'STATUS_CHANGED'
      ) {
        refreshRequests();
      }
    });

    // Also poll every 5 seconds as fallback for same-tab updates
    const interval = setInterval(refreshRequests, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [refreshRequests, router]);

  const handleAccept = (req: PickupRequest) => {
    if (!collector) return;
    // Atomic accept — only one collector can accept
    const updated = updateRequestStatus(req.id, 'accepted', {
      collectorId: collector.id,
      collectorName: collector.name,
      collectorPhone: collector.phone,
      collectorRating: collector.rating,
      collectorVehicle: collector.vehicleType,
      acceptedAt: new Date().toISOString(),
    });
    if (updated) {
      setActiveJob(updated);
      setSelectedRequest(null);
      refreshRequests();
    }
  };

  const handleReject = (req: PickupRequest) => {
    // Mark as rejected so it disappears from this collector's view
    updateRequestStatus(req.id, 'rejected');
    refreshRequests();
    setSelectedRequest(null);
  };

  const handleStatusUpdate = (newStatus: RequestStatus) => {
    if (!activeJob) return;
    const updated = updateRequestStatus(
      activeJob.id,
      newStatus,
      newStatus === 'completed' ? { completedAt: new Date().toISOString() } : {}
    );
    if (updated) {
      setActiveJob(updated);
      if (newStatus === 'completed') {
        setTimeout(() => {
          setActiveJob(null);
          refreshRequests();
        }, 2000);
      }
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <CollectorSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        collector={collector}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <CollectorTopbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          locationSharing={locationSharing}
          setLocationSharing={setLocationSharing}
          pendingCount={pendingRequests.length}
          onRefresh={refreshRequests}
        />

        <div className="flex-1 overflow-hidden flex flex-col">
          <CollectorStatsBar collectorId={collector?.id} />

          <div className="flex-1 flex overflow-hidden">
            {/* Map panel */}
            <div className="flex-1 relative overflow-hidden">
              <CollectorMapPanel
                requests={pendingRequests}
                selectedRequest={selectedRequest}
                activeJob={activeJob}
                onSelectRequest={setSelectedRequest}
                locationSharing={locationSharing}
              />
            </div>

            {/* Right panel */}
            <div className="w-[380px] xl:w-[420px] flex-shrink-0 flex flex-col border-l border-border overflow-hidden bg-card">
              {activeJob ? (
                <ActiveJobPanel
                  job={activeJob}
                  onStatusUpdate={handleStatusUpdate}
                  locationSharing={locationSharing}
                  setLocationSharing={setLocationSharing}
                />
              ) : (
                <NearbyRequestsPanel
                  requests={pendingRequests}
                  selectedRequest={selectedRequest}
                  onSelect={setSelectedRequest}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}