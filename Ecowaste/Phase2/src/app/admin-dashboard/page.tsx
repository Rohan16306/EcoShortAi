'use client';

import { Suspense } from 'react';
import AdminPortalEntry from '@/admin-portal/PortalEntry';

/**
 * ADMIN DASHBOARD ROUTE
 * This route just exposes the main Admin Portal folder.
 */
export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Admin Portal...</div>}>
      <AdminPortalEntry />
    </Suspense>
  );
}
