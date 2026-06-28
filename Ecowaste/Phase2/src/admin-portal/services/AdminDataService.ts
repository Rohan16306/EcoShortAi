'use client';

// ─── ADMIN DATA SERVICE ──────────────────────────────────────────────────
// Fetches real data from the Phase 1 Express backend (/api/admin/*)
// instead of using localStorage mock data.

const API_BASE = 'http://localhost:3002';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  credits: number;
  totalScans: number;
  badges: string[];
  history: AdminHistoryItem[];
}

export interface AdminHistoryItem {
  id: number;
  name: string;
  material: string;
  credits: number;
  date: string;
  isDuplicate: boolean;
  geoTag?: { lat: number; lng: number; accuracy: number; timestamp: string } | null;
}

export interface AdminPlatformStats {
  totalUsers: number;
  totalCredits: number;
  totalItems: number;
  totalRewards: number;
  co2Saved: number;
  materialBreakdown: Record<string, number>;
}

/**
 * Gets the PocketBase auth token from localStorage.
 * This is the same token the Phase 1 frontend stores after login.
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    // Try the PocketBase token stored by Phase 1 (app.js)
    const pbAuth = localStorage.getItem('pb_auth');
    if (pbAuth) {
      const parsed = JSON.parse(pbAuth);
      if (parsed.token) return parsed.token;
    }
    // Try the wastepickup_auth bridge token
    const bridgeAuth = localStorage.getItem('wastepickup_auth');
    if (bridgeAuth) {
      const parsed = JSON.parse(bridgeAuth);
      if (parsed.token) return parsed.token;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchAdmin<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errBody.error || `API Error ${res.status}`);
  }

  return res.json();
}

export const AdminDataService = {
  /**
   * Fetch all users with their credits and history from the backend db.json
   */
  getUsers: async (): Promise<AdminUser[]> => {
    const data = await fetchAdmin<{ users: AdminUser[]; total: number }>('/api/admin/users');
    return data.users;
  },

  /**
   * Delete a user from the backend db.json
   */
  deleteUser: async (userId: string): Promise<void> => {
    await fetchAdmin<{ ok: boolean }>(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get aggregated platform stats from the backend
   */
  getStats: async (): Promise<AdminPlatformStats> => {
    return fetchAdmin<AdminPlatformStats>('/api/admin/stats');
  },
};
