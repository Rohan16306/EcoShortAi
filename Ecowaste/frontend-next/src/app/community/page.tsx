"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Image as ImageIcon, Send, User, Trash2 } from 'lucide-react';
import { CommunityService, CommunityPost } from '@/services/communityService';
import { useUserStore } from '@/store/useUserStore';

export default function CommunityPage() {
  const { user } = useUserStore();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Initial fetch
    CommunityService.getPosts(1, 50).then((data) => {
      setPosts(data.posts);
      setIsLoading(false);
    });

    // Subscribe to real-time updates
    const unsubscribe = CommunityService.subscribeToNewPosts((newPost) => {
      setPosts((prev) => [newPost, ...prev]);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    // Default author name from logged in user, or anonymous
    const authorName = user?.name || 'Anonymous Eco-Warrior';

    const result = await CommunityService.createPost({
      type: 'chat',
      author: authorName,
      text: text,
    });

    if (result.success && result.post) {
      // Optistic UI update handles by real-time subscription,
      // but if subscription is delayed, we can prepend here (with a check to avoid dupes).
      setPosts((prev) => {
        if (prev.find((p) => p.id === result.post!.id)) return prev;
        return [result.post!, ...prev];
      });
      setText('');
    } else {
      alert(result.error || 'Failed to post message');
    }
    
    setIsSubmitting(false);
  };

  const handleDelete = async (postId: string) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      const result = await CommunityService.deletePost(postId);
      if (result.success) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } else {
        alert(result.error || 'Failed to delete message');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 pt-24 pb-20 relative z-10">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center p-3 bg-green-100 dark:bg-green-900/40 rounded-full mb-4"
          >
            <MessageSquare className="w-8 h-8 text-green-600 dark:text-green-400" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-display font-black text-gray-900 dark:text-white"
          >
            Community Feed
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 dark:text-gray-400 mt-2"
          >
            Share your recycling tips, ask questions, and connect with other Eco-Warriors.
          </motion.p>
        </div>

        {/* Input Box */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-sm border border-gray-200 dark:border-gray-800 mb-8"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind? Share a recycling win!"
              className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 text-gray-800 dark:text-gray-200 resize-none outline-none focus:ring-2 focus:ring-green-500 border-none min-h-[100px] transition-all"
            />
            <div className="flex justify-between items-center px-2">
              <button 
                type="button" 
                className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-gray-800 rounded-full transition-all active:scale-95"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting || !text.trim()}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 transition-all active:scale-95"
              >
                {isSubmitting ? 'Posting...' : 'Post'} <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </motion.div>

        {/* Feed */}
        <div className="space-y-4">
          {isLoading ? (
            // Skeleton for feed
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 animate-pulse flex gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-3 pt-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                </div>
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
              <p className="text-gray-500 dark:text-gray-400">No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            <AnimatePresence>
              {posts.map((post) => (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.95, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-inner">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 dark:text-white">{post.author}</h3>
                          <span className="text-xs text-gray-500">
                            {new Date(post.created).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {(user && (user.id === post.author_user || user.name === post.author)) && (
                          <button 
                            onClick={() => handleDelete(post.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{post.text}</p>
                      
                      {post.imageUrl && (
                        <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                          <img src={post.imageUrl} alt="Community Post" className="w-full object-cover max-h-96" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
