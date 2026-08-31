import pb from '@/lib/pocketbase';
import type { RecordModel } from 'pocketbase';

/**
 * AuthService — Replaces Express /api/auth/* routes
 *
 * OLD WAY (server.js lines 410-483):
 *   - Hand-rolled bcrypt password hashing
 *   - Manual JWT generation with a hardcoded secret
 *   - Reading/writing users to db.json (blocks event loop)
 *
 * NEW WAY (PocketBase):
 *   - Password hashing handled by PocketBase (bcrypt under the hood)
 *   - Token management handled by pb.authStore (auto-persisted in localStorage)
 *   - SQLite WAL mode handles concurrent signups without crashing
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  total_points: number;
  current_streak: number;
  badges: string[];
  avatar: string;
  created: string;
}

export const AuthService = {

  /**
   * Sign up a new user.
   * Replaces: POST /api/auth/signup (server.js:410-449)
   */
  signup: async (name: string, email: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    try {
      const record = await pb.collection('users').create({
        name,
        email,
        password,
        passwordConfirm: password,
        total_points: 0,
        current_streak: 0,
        badges: [],
      });

      // Auto-login after signup
      await pb.collection('users').authWithPassword(email, password);

      return { success: true, user: record as unknown as AuthUser };
    } catch (err: unknown) {
      const error = err as { data?: { data?: Record<string, { message: string }> }; message?: string };
      const fieldErrors = error?.data?.data;
      if (fieldErrors?.email?.message) {
        return { success: false, error: fieldErrors.email.message };
      }
      return { success: false, error: error?.message || 'Signup failed' };
    }
  },

  /**
   * Log in an existing user using the secure API route.
   */
  login: async (email: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
          return { success: false, error: 'Invalid email or password' };
      }

      const data = await res.json();
      return { success: true, user: data.user as AuthUser };
    } catch {
      return { success: false, error: 'Invalid email or password' };
    }
  },

  /**
   * Log out the current user via secure API route.
   */
  logout: async (): Promise<void> => {
    await fetch('/api/auth/logout', { method: 'POST' });
    pb.authStore.clear();
  },

  /**
   * Get the currently authenticated user.
   * Replaces: GET /api/auth/me (server.js:478-483)
   * 
   * KEY DIFFERENCE: This is instant (reads from local authStore).
   * The old way made an HTTP request to the server on every page load.
   */
  getCurrentUser: (): AuthUser | null => {
    if (!pb.authStore.isValid || !pb.authStore.record) return null;
    return pb.authStore.record as unknown as AuthUser;
  },

  /**
   * Verify session securely via API route
   */
  checkSession: async (): Promise<AuthUser | null> => {
    try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
            const data = await res.json();
            return data.user as AuthUser;
        }
        return null;
    } catch (err) {
        return null;
    }
  },

  /**
   * Check if a user is currently authenticated.
   */
  isAuthenticated: (): boolean => {
    return pb.authStore.isValid;
  },

  /**
   * Listen for auth state changes (login/logout).
   */
  onAuthChange: (callback: (isValid: boolean, user: RecordModel | null) => void): (() => void) => {
    return pb.authStore.onChange((_, model) => {
      callback(pb.authStore.isValid, model);
    });
  },
};
