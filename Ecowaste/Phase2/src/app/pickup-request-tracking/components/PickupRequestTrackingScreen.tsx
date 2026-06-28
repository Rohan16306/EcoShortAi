'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PickupTabBar from './PickupTabBar';
import PickupTrackingView from './PickupTrackingView';
import PickupRequestForm from './PickupRequestForm';
import NotificationFeed from './NotificationFeed';
import RewardDashboard from '@/components/rewards/RewardDashboard';
import {
import { getAuthCookie, setAuthCookie, removeAuthCookie } from '@/lib/authStorage';

    getAllRequests,
    subscribeToBroadcast,
    type PickupRequest,
} from '@/lib/requestStore';

export default function PickupRequestTrackingScreen() {
    const [activeTab, setActiveTab] = useState<'request' | 'track' | 'notifications' | 'rewards'>('request');
    const [requests, setRequests] = useState<PickupRequest[]>([]);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    const fetchRequests = () => {
        const all = getAllRequests();
        setRequests(all);
    };

    useEffect(() => {
        setMounted(true);
        // Authentication check
        const authRaw = typeof window !== 'undefined' ? getAuthCookie() : null;
        if (!authRaw) {
            router.replace('/sign-up-login-screen');
            return;
        }

        try {
            JSON.parse(authRaw);
        } catch {
            router.replace('/sign-up-login-screen');
            return;
        }

        fetchRequests();

        // Subscribe to real-time updates
        const unsubscribe = subscribeToBroadcast((msg) => {
            if (msg.type === 'REQUEST_ADDED' || msg.type === 'STATUS_CHANGED') {
                fetchRequests();
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (!mounted) return null;

    const latestRequest = requests[0] ?? null;

    return (
        <div className="min-h-screen bg-background flex flex-col max-w-[500px] mx-auto shadow-xl relative overflow-hidden">
            {/* Main Content Area */}
            <main className="flex-1 relative overflow-y-auto pb-24">
                {activeTab === 'request' && (
                    <PickupRequestForm onSuccess={() => setActiveTab('track')} />
                )}
                {activeTab === 'track' && (
                    <PickupTrackingView requests={requests} onNewRequest={() => setActiveTab('request')} />
                )}
                {activeTab === 'notifications' && (
                    <NotificationFeed activeRequestId={latestRequest?.id} />
                )}
                {activeTab === 'rewards' && (
                    <div className="p-6">
                        <RewardDashboard roleName={(typeof window !== 'undefined' ? JSON.parse(getAuthCookie() || '{}').role === 'collector' ? 'Collector' : 'User' : 'User')} />
                    </div>
                )}
            </main>

            {/* Floating Navigation */}
            <PickupTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
    );
}