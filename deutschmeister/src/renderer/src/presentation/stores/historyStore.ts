/**
 * History Store
 * Manages recently viewed words using Zustand
 * Implements UC-2.1.10: View Recent History
 * Implements UC-2.1.11: Clear History
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface HistoryEntry {
  wordId: string;
  viewedAt: number; // timestamp
}

interface HistoryState {
  // State
  history: HistoryEntry[];
  maxHistorySize: number;
  
  // Actions
  addToHistory: (wordId: string) => void;
  removeFromHistory: (wordId: string) => void;
  clearHistory: () => void;
  
  // Getters
  getRecentWordIds: (limit?: number) => string[];
  isInHistory: (wordId: string) => boolean;
  getHistoryCount: () => number;
}

const MAX_HISTORY_SIZE = 50;

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      // Initial state
      history: [],
      maxHistorySize: MAX_HISTORY_SIZE,

      // Add word to history (or move to top if already exists)
      addToHistory: (wordId: string) => {
        set((state) => {
          // Remove if already exists (to move to top)
          const filtered = state.history.filter(h => h.wordId !== wordId);
          
          // Add to beginning
          const newEntry: HistoryEntry = {
            wordId,
            viewedAt: Date.now()
          };
          
          // Keep only maxHistorySize items
          const newHistory = [newEntry, ...filtered].slice(0, state.maxHistorySize);
          
          return { history: newHistory };
        });
      },

      // Remove specific word from history
      removeFromHistory: (wordId: string) => {
        set((state) => ({
          history: state.history.filter(h => h.wordId !== wordId)
        }));
      },

      // Clear all history
      clearHistory: () => {
        set({ history: [] });
      },

      // Get recent word IDs
      getRecentWordIds: (limit?: number) => {
        const { history } = get();
        const ids = history.map(h => h.wordId);
        return limit ? ids.slice(0, limit) : ids;
      },

      // Check if word is in history
      isInHistory: (wordId: string) => {
        return get().history.some(h => h.wordId === wordId);
      },

      // Get history count
      getHistoryCount: () => {
        return get().history.length;
      }
    }),
    {
      name: 'deutschmeister-history',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        history: state.history,
        maxHistorySize: state.maxHistorySize
      })
    }
  )
);

/**
 * Hook to get formatted history with timestamps
 */
export function useFormattedHistory() {
  const history = useHistoryStore(state => state.history);
  
  return history.map(entry => ({
    ...entry,
    viewedAtFormatted: formatTimeAgo(entry.viewedAt)
  }));
}

/**
 * Format timestamp as "time ago" string
 */
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}