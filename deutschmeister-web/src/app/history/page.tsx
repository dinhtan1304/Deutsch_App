'use client';

import { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { WordCard } from '@/components/words/WordCard';
import { Button } from '@/components/ui/Button';
import { useHistory, useClearHistory } from '@/hooks/useHistory';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuthStore } from '@/stores/authStore';
import { formatTimeAgo } from '@/lib/utils';
import Link from 'next/link';

export default function HistoryPage() {
  const { isAuthenticated } = useAuthStore();
  const { data: history, isLoading, error } = useHistory();
  const { data: favorites } = useFavorites();
  const clearHistory = useClearHistory();

  const favoriteIds = useMemo(() => 
    new Set(favorites?.map(f => f.wordId) || []),
    [favorites]
  );

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear all history?')) {
      await clearHistory.mutateAsync();
    }
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-6">📋</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sign in to view history
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Create an account to track your learning history.
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              📋 View History
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Words you've recently viewed ({history?.length || 0} words)
            </p>
          </div>
          {history && history.length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleClearHistory}
              isLoading={clearHistory.isPending}
            >
              Clear History
            </Button>
          )}
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
            Error loading history. Please try again.
          </div>
        )}

        {/* History grid */}
        {history && history.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((item) => (
              <div key={item.id} className="relative">
                <div className="absolute -top-2 right-2 z-10 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-500 dark:text-gray-400">
                  {formatTimeAgo(item.viewedAt)}
                </div>
                <WordCard
                  word={item.word}
                  isFavorite={favoriteIds.has(item.wordId)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && history && history.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No history yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Words you view will appear here for easy reference.
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