/**
 * Favorites Store
 * Manages user's favorite words using Zustand
 * Implements UC-2.1.07: Add to Favorites
 * Implements UC-2.1.08: Remove from Favorites
 * Implements UC-2.1.09: View Favorites List
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface FavoritesState {
  // State
  favoriteIds: string[];
  
  // Actions
  addFavorite: (wordId: string) => void;
  removeFavorite: (wordId: string) => void;
  toggleFavorite: (wordId: string) => void;
  isFavorite: (wordId: string) => boolean;
  clearFavorites: () => void;
  
  // Computed
  count: () => number;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      // Initial state
      favoriteIds: [],

      // Add a word to favorites
      addFavorite: (wordId: string) => {
        set((state) => {
          if (state.favoriteIds.includes(wordId)) {
            return state; // Already in favorites
          }
          return {
            favoriteIds: [...state.favoriteIds, wordId]
          };
        });
      },

      // Remove a word from favorites
      removeFavorite: (wordId: string) => {
        set((state) => ({
          favoriteIds: state.favoriteIds.filter(id => id !== wordId)
        }));
      },

      // Toggle favorite status
      toggleFavorite: (wordId: string) => {
        const state = get();
        if (state.favoriteIds.includes(wordId)) {
          state.removeFavorite(wordId);
        } else {
          state.addFavorite(wordId);
        }
      },

      // Check if word is favorite
      isFavorite: (wordId: string) => {
        return get().favoriteIds.includes(wordId);
      },

      // Clear all favorites
      clearFavorites: () => {
        set({ favoriteIds: [] });
      },

      // Get count of favorites
      count: () => {
        return get().favoriteIds.length;
      }
    }),
    {
      name: 'deutschmeister-favorites',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ favoriteIds: state.favoriteIds })
    }
  )
);

/**
 * Hook to get favorite status and toggle function for a specific word
 */
export function useFavorite(wordId: string) {
  const { isFavorite, toggleFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  
  return {
    isFavorite: isFavorite(wordId),
    toggle: () => toggleFavorite(wordId),
    add: () => addFavorite(wordId),
    remove: () => removeFavorite(wordId)
  };
}