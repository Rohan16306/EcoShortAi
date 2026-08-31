import pb from '@/lib/pocketbase';

/**
 * LeaderboardService — Replaces Express GET /api/leaderboard
 *
 * OLD (server.js:524-567):
 *   - Reads ALL users from db.json into memory
 *   - Maps over ALL userData entries
 *   - Sorts the entire array
 *   - Returns top N
 *   → With 1000 users, this loads 1000 records into RAM on EVERY request
 *
 * NEW (PocketBase):
 *   - Single SQL query: SELECT ... ORDER BY total_points DESC LIMIT 10
 *   - SQLite handles indexing and sorting at the database level
 *   - Only the top N records ever leave the database
 */

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  total_points: number;
  current_streak: number;
  avatar: string;
  badges: string[];
}

export const LeaderboardService = {

  /**
   * Get the top users by points.
   * Replaces: GET /api/leaderboard (server.js:524-567)
   */
  getLeaderboard: async (limit = 10): Promise<LeaderboardEntry[]> => {
    try {
      const safeLimit = Math.min(Math.max(1, limit), 100);

      const records = await pb.collection('users').getList(1, safeLimit, {
        sort: '-total_points',
        fields: 'id,name,total_points,current_streak,avatar,badges',
      });

      return records.items.map((record, index) => ({
        rank: index + 1,
        id: record.id,
        name: record['name'] || 'Anonymous',
        total_points: record['total_points'] || 0,
        current_streak: record['current_streak'] || 0,
        avatar: record['avatar'] ? pb.files.getURL(record, record['avatar']) : '',
        badges: Array.isArray(record['badges']) ? record['badges'] : [],
      }));
    } catch (err) {
      console.error('Leaderboard fetch failed:', err);
      return [];
    }
  },

  /**
   * Get the current user's rank.
   */
  getCurrentUserRank: async (): Promise<number | null> => {
    const userId = pb.authStore.record?.id;
    if (!userId) return null;

    try {
      const userPoints = pb.authStore.record?.['total_points'] || 0;

      // Count how many users have MORE points than the current user
      const result = await pb.collection('users').getList(1, 1, {
        filter: `total_points > ${userPoints}`,
      });

      return result.totalItems + 1;
    } catch {
      return null;
    }
  },
};
