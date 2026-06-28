import pb from '@/lib/pocketbase';

/**
 * ContactService — Replaces Express POST /api/contact
 *
 * OLD (server.js:630-664):
 *   - Reads entire db.json
 *   - Pushes contact to array
 *   - Writes ENTIRE db.json back to disk (blocks event loop)
 *
 * NEW (PocketBase):
 *   - Single INSERT INTO contacts → no file rewrite
 *   - PocketBase API rules: contacts are admin-only for viewing (privacy)
 */

export const ContactService = {

  /**
   * Submit a contact form message.
   * Replaces: POST /api/contact (server.js:630-664)
   */
  submitContact: async (data: {
    name: string;
    email: string;
    message: string;
  }): Promise<{ success: boolean; error?: string }> => {
    // Client-side validation (same rules as old server.js:635-646)
    if (!data.name.trim() || !data.email.trim() || !data.message.trim()) {
      return { success: false, error: 'Name, email, and message are required' };
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(data.email)) {
      return { success: false, error: 'Enter a valid email address' };
    }

    if (data.message.trim().length < 10) {
      return { success: false, error: 'Message must be at least 10 characters' };
    }

    try {
      await pb.collection('contacts').create({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        message: data.message.trim(),
      });

      return { success: true };
    } catch (err) {
      console.error('Contact submission failed:', err);
      return { success: false, error: 'Failed to send message. Please try again.' };
    }
  },
};
