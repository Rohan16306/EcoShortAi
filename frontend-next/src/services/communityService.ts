import pb from '@/lib/pocketbase';
import DOMPurify from 'dompurify';

// Safe sanitize for Next.js SSR
const sanitize = (text: string) => {
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(text);
  }
  return text;
};

/**
 * CommunityService — Replaces Express /api/community/posts routes
 *
 * OLD (server.js:578-628):
 *   - GET: Reads entire db.json, extracts communityPosts array, sorts in JS
 *   - POST: Reads entire db.json, unshifts new post, writes ENTIRE file back
 *   → Every new post rewrites the ENTIRE database file (event loop blocked)
 *
 * NEW (PocketBase):
 *   - GET: SQL query with ORDER BY created DESC LIMIT 50
 *   - POST: Single INSERT INTO community_posts → no file rewrite
 *   - File uploads (story images) stream to disk, no Base64
 */

export interface CommunityPost {
  id: string;
  type: 'chat' | 'story';
  author: string;
  author_user?: string;
  text: string;
  image: string;
  imageUrl: string;
  created: string;
}

export const CommunityService = {

  /**
   * Get community posts, newest first.
   * Replaces: GET /api/community/posts (server.js:578-590)
   */
  getPosts: async (page = 1, perPage = 50): Promise<{ posts: CommunityPost[]; total: number }> => {
    try {
      const records = await pb.collection('community_posts').getList(page, perPage, {
        sort: '-created',
      });

      const posts: CommunityPost[] = records.items.map((record) => ({
        id: record.id,
        type: record['type'] as 'chat' | 'story',
        author: sanitize(record['author']),
        author_user: record['author_user'] || undefined,
        text: sanitize(record['text']),
        image: record['image'] || '',
        imageUrl: record['image'] ? pb.files.getURL(record, record['image']) : '',
        created: record.created,
      }));

      return { posts, total: records.totalItems };
    } catch (err) {
      console.error('Failed to fetch community posts:', err);
      return { posts: [], total: 0 };
    }
  },

  /**
   * Create a new community post.
   * Replaces: POST /api/community/posts (server.js:592-623)
   */
  createPost: async (data: {
    type: 'chat' | 'story';
    author: string;
    text: string;
    image?: File;
  }): Promise<{ success: boolean; post?: CommunityPost; error?: string }> => {
    if (!data.author.trim() || !data.text.trim()) {
      return { success: false, error: 'Author and message are required' };
    }
    if (data.text.trim().length < 3) {
      return { success: false, error: 'Message must be at least 3 characters' };
    }

    try {
      const formData = new FormData();
      formData.append('type', data.type);
      formData.append('author', data.author.slice(0, 40));
      formData.append('text', data.text.slice(0, 500));

      // Link to auth user if logged in
      const userId = pb.authStore.record?.id;
      if (userId) formData.append('author_user', userId);

      // Stream image to disk — no Base64 CPU murder
      if (data.image) {
        formData.append('image', data.image);
      }

      const record = await pb.collection('community_posts').create(formData);

      return {
        success: true,
        post: {
          id: record.id,
          type: record['type'] as 'chat' | 'story',
          author: record['author'],
          author_user: record['author_user'] || undefined,
          text: record['text'],
          image: record['image'] || '',
          imageUrl: record['image'] ? pb.files.getURL(record, record['image']) : '',
          created: record.created,
        },
      };
    } catch (err) {
      console.error('Failed to create post:', err);
      return { success: false, error: 'Failed to create post' };
    }
  },

  /**
   * Delete a community post
   */
  deletePost: async (postId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await pb.collection('community_posts').delete(postId);
      return { success: true };
    } catch (err) {
      console.error('Failed to delete post:', err);
      return { success: false, error: 'Failed to delete post' };
    }
  },

  /**
   * Subscribe to real-time post updates (WebSocket).
   * PocketBase bonus — the old Express backend couldn't do this.
   */
  subscribeToNewPosts: (callback: (post: CommunityPost) => void): (() => void) => {
    let unsubscribe: (() => void) | null = null;

    pb.collection('community_posts').subscribe('*', (e) => {
      if (e.action === 'create') {
        callback({
          id: e.record.id,
          type: e.record['type'] as 'chat' | 'story',
          author: sanitize(e.record['author']),
          author_user: e.record['author_user'] || undefined,
          text: sanitize(e.record['text']),
          image: e.record['image'] || '',
          imageUrl: e.record['image'] ? pb.files.getURL(e.record, e.record['image']) : '',
          created: e.record.created,
        });
      } else if (e.action === 'delete') {
        // Also inform the callback about deletions with a specific type if possible,
        // or we handle deletion via a separate callback or polling. For now, 
        // the realtime subscribe only handles 'create' optimally.
        // We'll pass a special type 'deleted' if the callback supports it.
        // But to keep it simple, we will just use the frontend state removal.
      }
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  },
};
