'use client';

// ─── ADMIN BACKEND SERVICE ──────────────────────────────────────────────────
// This service acts as the "Backend" layer for the Admin Portal.
// It manages the "Separate Database" (System Logs) and Admin-only actions.

/**
 * LOG TYPES
 * These represent the entities in our administrative "database"
 */
export interface SystemLog {
  id: string;
  action: string;
  timestamp: string;
  performedBy: string;
  details: any;
  type: 'info' | 'warning' | 'error' | 'success';
}

const ADMIN_DB_KEY = 'wastepickup_admin_audit_trail';

/**
 * THE "SEPARATE DATABASE" SERVICE
 */
export const AdminBackendService = {
  /**
   * Fetch all data from the administrative audit table
   */
  getAuditTrail: (): SystemLog[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(ADMIN_DB_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Commits a new log to the administrative database
   */
  logAction: (log: Omit<SystemLog, 'id' | 'timestamp'>): void => {
    if (typeof window === 'undefined') return;
    const history = AdminBackendService.getAuditTrail();
    const newEntry: SystemLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
    };
    
    // Database optimization: keep only last 1000 entries
    const updatedHistory = [newEntry, ...history].slice(0, 1000);
    localStorage.setItem(ADMIN_DB_KEY, JSON.stringify(updatedHistory));
    
    // Broadcast to other tabs for real-time reactivity
    if (typeof window !== 'undefined') {
       const channel = new BroadcastChannel('admin_realtime_db');
       channel.postMessage({ type: 'DB_COMMIT', entry: newEntry });
       channel.close();
    }
  },

  /**
   * Nuclear option: Clears the entire admin database
   */
  purgeDatabase: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ADMIN_DB_KEY, JSON.stringify([]));
  },

  /**
   * Export database to JSON (Simulating a DB Dump)
   */
  dumpDatabase: (): string => {
    const data = AdminBackendService.getAuditTrail();
    return JSON.stringify(data, null, 2);
  },

  /**
   * Subscribe to live database changes
   */
  subscribeToLiveStream: (callback: (entry: SystemLog) => void): (() => void) => {
    if (typeof window === 'undefined') return () => {};
    const channel = new BroadcastChannel('admin_realtime_db');
    channel.onmessage = (e) => {
      if (e.data.type === 'DB_COMMIT') {
        callback(e.data.entry);
      }
    };
    return () => channel.close();
  }
};
