"use client";

import { useState, useEffect } from 'react';
export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'data';
  content: string;
  createdAt?: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: number;
  messages: any[];
}

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ecosort-chat-history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Sort by newest first
          parsed.sort((a, b) => b.updatedAt - a.updatedAt);
          setSessions(parsed);
          if (parsed.length > 0) {
            setActiveSessionId(parsed[0].id);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
  }, []);

  // Save to localStorage whenever sessions change
  useEffect(() => {
    if (sessions.length > 0 || localStorage.getItem('ecosort-chat-history')) {
      localStorage.setItem('ecosort-chat-history', JSON.stringify(sessions));
    }
  }, [sessions]);

  const updateSession = (id: string, messages: any[]) => {
    setSessions(prev => {
      const existingIdx = prev.findIndex(s => s.id === id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          messages,
          updatedAt: Date.now(),
          // Generate title from first user message if it's currently generic
          title: updated[existingIdx].title === 'New Chat' && messages.find(m => m.role === 'user') 
            ? messages.find(m => m.role === 'user')?.content.slice(0, 30) + '...' 
            : updated[existingIdx].title
        };
        // Sort
        return updated.sort((a, b) => b.updatedAt - a.updatedAt);
      } else {
        const title = messages.find(m => m.role === 'user')?.content.slice(0, 30) + '...' || 'New Chat';
        const newSession = {
          id,
          title,
          updatedAt: Date.now(),
          messages
        };
        return [newSession, ...prev];
      }
    });
  };

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Chat',
      updatedAt: Date.now(),
      messages: []
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    return newId;
  };

  const deleteSession = (id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (activeSessionId === id) {
        setActiveSessionId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };
  
  const clearAll = () => {
    setSessions([]);
    setActiveSessionId(null);
    localStorage.removeItem('ecosort-chat-history');
  }

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  return {
    sessions,
    activeSessionId,
    activeSession,
    setActiveSessionId,
    updateSession,
    createNewSession,
    deleteSession,
    clearAll
  };
}
