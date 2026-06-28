import { create } from 'zustand';
import { AuthService, type AuthUser } from '@/services/authService';
import pb from '@/lib/pocketbase';

/**
 * useUserStore — Global Auth & User State (Zustand)
 *
 * MIGRATION FROM OLD STORE:
 * ─────────────────────────
 * OLD: Used Axios to call Express /api/data?email=... → read db.json (blocking)
 *      Stored email/credits in localStorage manually
 *
 * NEW: Uses PocketBase authStore which auto-persists tokens in localStorage
 *      Points update reactively when pb.authStore changes
 *      No manual localStorage management needed
 */

interface UserState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  /**
   * Initialize auth state securely from API
   */
  initialize: async () => {
    const user = await AuthService.checkSession();
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    const result = await AuthService.login(email, password);

    if (result.success && result.user) {
      set({ user: result.user, isAuthenticated: true, isLoading: false });
      return { success: true };
    }

    set({ isLoading: false });
    return { success: false, error: result.error };
  },

  signup: async (name: string, email: string, password: string) => {
    set({ isLoading: true });
    const result = await AuthService.signup(name, email, password);

    if (result.success && result.user) {
      set({ user: result.user, isAuthenticated: true, isLoading: false });
      return { success: true };
    }

    set({ isLoading: false });
    return { success: false, error: result.error };
  },

  logout: async () => {
    await AuthService.logout();
    set({ user: null, isAuthenticated: false });
  },

  refreshUser: async () => {
    const user = await AuthService.checkSession();
    set({ user, isAuthenticated: !!user });
  },
}));
