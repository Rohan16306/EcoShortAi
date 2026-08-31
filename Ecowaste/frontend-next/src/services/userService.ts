import pb from '@/lib/pocketbase';

export interface UserResponse {
  email: string;
  points: number;
}

export const UserService = {
  getUserData: async (email: string): Promise<UserResponse> => {
    try {
      const record = await pb.collection('users').getFirstListItem(`email="${email}"`);
      return { email: record.email, points: record['total_points'] || 0 };
    } catch (err) {
      return { email, points: 0 };
    }
  },
  
  addPoints: async (email: string, points: number): Promise<{ success: boolean; totalPoints: number }> => {
    try {
      const record = await pb.collection('users').getFirstListItem(`email="${email}"`);
      const newPoints = (record['total_points'] || 0) + points;
      await pb.collection('users').update(record.id, { total_points: newPoints });
      return { success: true, totalPoints: newPoints };
    } catch (err) {
      return { success: false, totalPoints: 0 };
    }
  },
  
  getLeaderboard: async (): Promise<Array<{ email: string; points: number }>> => {
    try {
      const records = await pb.collection('users').getList(1, 100, {
        sort: '-total_points',
      });
      return records.items.map(r => ({ email: r.email, points: r['total_points'] || 0 }));
    } catch (err) {
      return [];
    }
  }
};
