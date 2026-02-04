'use client';

import { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { WordCard } from '@/components/words/WordCard';
import { Button } from '@/components/ui/Button';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';

export default function FavoritesPage() {
  const { isAuthenticated } = useAuthStore();
  const { data: favorites, isLoading, error } = useFavorites();

  const favoriteIds = useMemo(() => 
    new Set(favorites?.map(f => f.wordId) || []),
    [favorites]
  );

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-6">⭐</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sign in to view favorites
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Create an account to save your favorite words and access them anytime.
          </p>
          <Link href="/auth/login">
            <Button size="lg">Sign In</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ⭐ Favorite Words
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your saved words for quick review ({favorites?.length || 0} words)
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-40 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12 text-red-500">
            Error loading favorites. Please try again.
          </div>
        )}

        {/* Favorites grid */}
        {favorites && favorites.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((fav) => (
              <WordCard
                key={fav.id}
                word={fav.word}
                isFavorite={true}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && favorites && favorites.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No favorites yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start adding words to your favorites by clicking the star icon on any word card.
            </p>
            <Link href="/words">
              <Button>Browse Words</Button>
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
}