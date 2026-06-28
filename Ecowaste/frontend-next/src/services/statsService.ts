import pb from '@/lib/pocketbase';

/**
 * StatsService — Replaces Express GET /api/stats/global
 *
 * OLD (server.js:506-522):
 *   - Loads ALL userData from db.json into memory
 *   - Iterates over EVERY user to sum credits, items, rewards
 *   → With 500 users, this reads 500 user records on EVERY stats request
 *
 * NEW (PocketBase):
 *   - Uses getList with minimal fields
 *   - For production, you'd create a PocketBase "view" collection for aggregation
 */

export interface GlobalStats {
  totalUsers: number;
  totalCredits: number;
  totalScans: number;
  totalRewards: number;
  co2Saved: number;
}

export const StatsService = {

  /**
   * Get global platform statistics.
   * Replaces: GET /api/stats/global (server.js:506-522)
   */
  getGlobalStats: async (): Promise<GlobalStats> => {
    try {
      // Get total users and sum of points
      const users = await pb.collection('users').getList(1, 1, {
        fields: 'id',
      });

      // Get total scans
      const scans = await pb.collection('scans').getList(1, 1, {
        fields: 'id',
      });

      // Sum total points across all users
      // (fetch all users with just their points field)
      const allUsers = await pb.collection('users').getFullList({
        fields: 'total_points',
      });

      const totalCredits = allUsers.reduce(
        (sum, user) => sum + (Number(user['total_points']) || 0),
        0
      );

      const totalScans = scans.totalItems;
      const co2Saved = Math.round(totalScans * 0.5);

      return {
        totalUsers: users.totalItems,
        totalCredits,
        totalScans,
        totalRewards: 0, // TODO: Add rewards collection if needed
        co2Saved,
      };
    } catch (err) {
      console.error('Stats fetch failed:', err);
      return {
        totalUsers: 0,
        totalCredits: 0,
        totalScans: 0,
        totalRewards: 0,
        co2Saved: 0,
      };
    }
  },
};
