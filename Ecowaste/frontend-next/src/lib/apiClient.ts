/**
 * @deprecated — This file is no longer used.
 * 
 * The Axios-based API client has been replaced by the PocketBase SDK.
 * See: src/lib/pocketbase.ts
 *
 * WHY:
 * The old apiClient talked to an Express server (server.js) that used
 * fs.writeFileSync('db.json') — which blocks the Node.js event loop
 * and crashes with just 4 concurrent users.
 *
 * PocketBase replaces the entire Express server with a single Go binary
 * that handles concurrent writes using SQLite WAL mode.
 *
 * All API calls now go through the PocketBase SDK in these service files:
 *   - src/services/authService.ts
 *   - src/services/scanService.ts
 *   - src/services/communityService.ts
 *   - src/services/leaderboardService.ts
 *   - src/services/contactService.ts
 *   - src/services/statsService.ts
 */

// Re-export the PocketBase client for backward compatibility
export { default as apiClient } from './pocketbase';
