'use client';

import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { WordCard } from '@/components/words/WordCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useWords } from '@/hooks/useWords';
import { useFavorites } from '@/hooks/useFavorites';
import { Gender, CEFRLevel, CATEGORIES, LEVELS } from '@/types';

export default function WordsPage() {
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState<CEFRLevel | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useWords({
    search: search || undefined,
    gender: gender || undefined,
    category: category || undefined,
    level: level || undefined,
    page,
    limit: 20,
  });

  const { data: favorites } = useFavorites();
  
  const favoriteIds = useMemo(() => 
    new Set(favorites?.map(f => f.wordId) || []),
    [favorites]
  );

  const clearFilters = () => {
    setSearch('');
    setGender('');
    setCategory('');
    setLevel('');
    setPage(1);
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📚 German Words
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse and learn German nouns with their articles
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Search words..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />

            <select
              value={gender}
              onChange={(e) => {
                setGender(e.target.value as Gender | '');
                setPage(1);
              }}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Genders</option>
              <option value="masculine">der (Maskulin)</option>
              <option value="feminine">die (Feminin)</option>
              <option value="neuter">das (Neutrum)</option>
            </select>

            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={level}
              onChange={(e) => {
                setLevel(e.target.value as CEFRLevel | '');
                setPage(1);
              }}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Levels</option>
              {LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>

            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Results count */}
        {data && (
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Found {data.total} words
            {(search || gender || category || level) && ' matching filters'}
          </p>
        )}

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
            Error loading words. Please try again.
          </div>
        )}

        {/* Words grid */}
        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {data.data.map((word) => (
                <WordCard
                  key={word.id}
                  word={word}
                  isFavorite={favoriteIds.has(word.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="px-4 text-gray-600 dark:text-gray-400">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* No results */}
        {data && data.data.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500 dark:text-gray-400 mb-4">
              No words found matching your filters
            </p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
