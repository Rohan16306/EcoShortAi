import PocketBase from 'pocketbase';

/**
 * PocketBase Client
 * 
 * WHY THIS EXISTS (replacing apiClient.ts / Axios):
 * ─────────────────────────────────────────────────
 * Your old Express backend used fs.writeFileSync('db.json') which BLOCKS
 * the Node.js event loop. Node.js is single-threaded — when User 1's file
 * write is happening, Users 2-4 are completely frozen. 4 concurrent users
 * caused a crash.
 *
 * PocketBase solves this:
 * • SQLite with WAL mode → hundreds of concurrent writes, no file locking
 * • Go goroutines → no event loop bottleneck
 * • File uploads stream to disk → no Base64 CPU murder
 * • Built-in auth → no hand-rolled JWT
 * • Built-in rate limiting → no spam-click crashes
 */

const pb = new PocketBase(
  process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090'
);

// Disable auto-cancellation so multiple requests don't cancel each other
pb.autoCancellation(false);

export default pb;

// Re-export helper for checking auth state
export const isAuthenticated = () => pb.authStore.isValid;
export const currentUser = () => pb.authStore.record;
