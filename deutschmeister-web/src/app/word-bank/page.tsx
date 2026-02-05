'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { WordBankCard } from '@/components/word-bank/WordBankCard';
import { ImportModal } from '@/components/word-bank/ImportModal';
import { useWordBankUI } from '@/stores/wordBankStore';
import {
  usePersonalWords,
  usePersonalWordStats,
  usePersonalWordCategories,
  useToggleFavorite,
  useImportPersonalWords,
  useExportPersonalWords,
  useSRSStats,
} from '@/hooks/usePersonalWords';
import {
  WordType, Level, Gender,
  WordTypeInfo, GenderInfo, WordBankFilters, ImportRow,
} from '@/types/personalWord';

const wordTypes: WordType[] = ['nomen', 'verb', 'adjektiv', 'adverb', 'praposition', 'konjunktion', 'pronomen', 'partikel', 'andere'];
const levels: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
const genders: Gender[] = ['masculine', 'feminine', 'neuter'];

export default function WordBankPage() {
  const { filters, page, limit, setFilters, resetFilters, setPage, getApiParams } = useWordBankUI();

  const [showImportModal, setShowImportModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // React Query
  const apiParams = getApiParams();
  const { data: wordsData, isLoading, isFetching } = usePersonalWords(apiParams);
  const { data: stats } = usePersonalWordStats();
  const { data: categories = [] } = usePersonalWordCategories();

  const toggleFavoriteMutation = useToggleFavorite();
  const importMutation = useImportPersonalWords();
  const exportMutation = useExportPersonalWords();
  
  // SRS Stats
  const { data: srsStats } = useSRSStats();

  const words = wordsData?.data ?? [];
  const total = wordsData?.total ?? 0;
  const totalPages = wordsData?.totalPages ?? 1;

  // TTS
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }, []);

  // Import handler — chuyển ImportRow[] → API format
  const handleImport = (rows: ImportRow[]) => {
    const mapped = rows.map(row => ({
      word: row.word,
      wordType: row.wordType,
      translationEn: row.translationEn,
      translationVi: row.translationVi,
      article: row.article,
      plural: row.plural,
      partizipII: row.partizipII,
      hilfsverb: row.hilfsverb,
      komparativ: row.komparativ,
      superlativ: row.superlativ,
      kasus: row.kasus,
      examples: row.examples,
      level: row.level,
      category: row.category,
      tags: row.tags,
      notes: row.notes,
    }));

    return importMutation.mutateAsync({ words: mapped });
  };

  // Export handler
  const handleExport = () => exportMutation.mutate();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin text-4xl">📚</div>
        </div>
      </MainLayout>
    );
  }

  const statTotal = stats?.total ?? 0;
  const statFavorites = stats?.favorites ?? 0;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--theme-text-primary, #111827)' }}>
              📒 Sổ từ vựng cá nhân
            </h1>
            <p className="text-gray-500 mt-1">
              {statTotal} từ • {statFavorites} yêu thích
              {isFetching && <span className="ml-2 text-blue-500 text-xs">đang tải...</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowImportModal(true)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-all">
              📥 Import
            </button>
            <button onClick={handleExport} disabled={statTotal === 0 || exportMutation.isPending}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
              📤 Export
            </button>
          </div>
        </div>

        {/* SRS Review Card */}
        {statTotal > 0 && srsStats && (
          <div 
            className="mb-6 p-4 rounded-2xl border-2 transition-all hover:shadow-lg"
            style={{ 
              borderColor: srsStats.due > 0 ? '#ef4444' : '#22c55e',
              backgroundColor: srsStats.due > 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(34, 197, 94, 0.05)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: srsStats.due > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)' }}
                >
                  {srsStats.due > 0 ? '🔥' : '✨'}
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: 'var(--theme-text-primary)' }}>
                    Ôn tập SRS
                  </h3>
                  <p className="text-sm text-gray-500">
                    {srsStats.due > 0 ? (
                      <>
                        <span className="font-bold text-red-500">{srsStats.due}</span> từ cần ôn
                        {srsStats.new > 0 && (
                          <> • <span className="text-blue-500">{srsStats.new}</span> từ mới</>
                        )}
                      </>
                    ) : (
                      'Tuyệt vời! Bạn đã ôn hết tất cả các từ cho hôm nay 🎉'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Quick stats */}
                <div className="hidden sm:flex gap-3 text-sm">
                  <div className="px-3 py-1.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                    <span className="text-yellow-600 dark:text-yellow-400">📖 {srsStats.learning}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <span className="text-green-600 dark:text-green-400">🎯 {srsStats.mature}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <span className="text-blue-600 dark:text-blue-400">📊 {srsStats.retentionRate}%</span>
                  </div>
                </div>

                <Link
                  href="/word-bank/review"
                  className="px-5 py-2.5 rounded-xl font-medium text-white transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: srsStats.due > 0 ? '#ef4444' : '#3b82f6',
                  }}
                >
                  {srsStats.due > 0 ? 'Ôn ngay →' : 'Học thêm →'}
                </Link>
              </div>
            </div>

            {/* Progress bar */}
            {statTotal > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Tiến độ hôm nay: {srsStats.reviewedToday} từ đã ôn</span>
                  <span>
                    {srsStats.mature} / {statTotal} từ đã thuộc ({Math.round((srsStats.mature / statTotal) * 100)}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-linear-to-r from-yellow-400 via-green-400 to-green-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (srsStats.mature / statTotal) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats by word type */}
        {statTotal > 0 && stats && (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 mb-6">
            {wordTypes.map(t => {
              const info = WordTypeInfo[t];
              const count = stats.byType[t] || 0;
              const active = filters.wordType === t;
              return (
                <button key={t}
                  onClick={() => setFilters({ wordType: active ? 'all' : t })}
                  className="p-2 rounded-xl text-center transition-all"
                  style={{
                    backgroundColor: active ? info.color : 'var(--theme-bg-card, #ffffff)',
                    color: active ? 'white' : 'var(--theme-text-secondary)',
                    border: `1px solid ${active ? info.color : 'var(--theme-border, #e5e7eb)'}`,
                    opacity: count === 0 && !active ? 0.5 : 1,
                  }}>
                  <div className="text-lg">{info.icon}</div>
                  <div className="text-xs font-medium">{info.label}</div>
                  <div className="text-xs font-bold">{count}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* Search + Filter Bar */}
        {statTotal > 0 && (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex-1 min-w-50">
                <input
                  value={filters.search}
                  onChange={e => setFilters({ search: e.target.value })}
                  placeholder="🔍 Tìm từ, nghĩa, ghi chú..."
                  className="w-full p-3 rounded-xl border"
                  style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)' }}
                />
              </div>

              <button onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 rounded-xl border font-medium text-sm"
                style={{
                  borderColor: 'var(--theme-border)',
                  backgroundColor: showFilters ? '#3b82f6' : 'var(--theme-bg-card)',
                  color: showFilters ? 'white' : 'var(--theme-text-secondary)',
                }}>
                🎛️ Lọc
              </button>

              <button onClick={() => setFilters({ favoritesOnly: !filters.favoritesOnly })}
                className="px-4 py-3 rounded-xl border font-medium text-sm"
                style={{
                  borderColor: filters.favoritesOnly ? '#eab308' : 'var(--theme-border)',
                  backgroundColor: filters.favoritesOnly ? 'rgba(234,179,8,0.1)' : 'var(--theme-bg-card)',
                  color: filters.favoritesOnly ? '#eab308' : 'var(--theme-text-secondary)',
                }}>
                {filters.favoritesOnly ? '⭐' : '☆'} Yêu thích
              </button>

              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={e => {
                  const [sortBy, sortOrder] = e.target.value.split('-') as [WordBankFilters['sortBy'], 'asc' | 'desc'];
                  setFilters({ sortBy, sortOrder });
                }}
                className="px-3 py-3 rounded-xl border text-sm"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)' }}>
                <option value="createdAt-desc">Mới nhất</option>
                <option value="createdAt-asc">Cũ nhất</option>
                <option value="word-asc">A → Z</option>
                <option value="word-desc">Z → A</option>
                <option value="level-asc">Level ↑</option>
                <option value="wordType-asc">Từ loại</option>
              </select>
            </div>

            {/* Extended filters */}
            {showFilters && (
              <div className="p-4 rounded-xl border mb-4 space-y-3"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                <div className="flex flex-wrap gap-4">
                  {/* Level */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Cấp độ</label>
                    <div className="flex gap-1">
                      <button onClick={() => setFilters({ level: 'all' })}
                        className="px-2.5 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: filters.level === 'all' ? '#3b82f6' : 'var(--theme-bg-secondary)', color: filters.level === 'all' ? 'white' : 'var(--theme-text-secondary)' }}>
                        Tất cả
                      </button>
                      {levels.map(l => (
                        <button key={l}
                          onClick={() => setFilters({ level: filters.level === l ? 'all' : l })}
                          className="px-2.5 py-1 rounded text-xs font-medium"
                          style={{ backgroundColor: filters.level === l ? '#3b82f6' : 'var(--theme-bg-secondary)', color: filters.level === l ? 'white' : 'var(--theme-text-secondary)' }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Giống (Nomen)</label>
                    <div className="flex gap-1">
                      <button onClick={() => setFilters({ gender: 'all' })}
                        className="px-2.5 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: filters.gender === 'all' ? '#6b7280' : 'var(--theme-bg-secondary)', color: filters.gender === 'all' ? 'white' : 'var(--theme-text-secondary)' }}>
                        Tất cả
                      </button>
                      {genders.map(g => {
                        const info = GenderInfo[g];
                        return (
                          <button key={g}
                            onClick={() => setFilters({ gender: filters.gender === g ? 'all' : g })}
                            className="px-2.5 py-1 rounded text-xs font-medium"
                            style={{ backgroundColor: filters.gender === g ? info.color : 'var(--theme-bg-secondary)', color: filters.gender === g ? 'white' : 'var(--theme-text-secondary)' }}>
                            {info.article}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category */}
                  {categories.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Chủ đề</label>
                      <select value={filters.category}
                        onChange={e => setFilters({ category: e.target.value })}
                        className="px-2.5 py-1 rounded text-xs border"
                        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)' }}>
                        <option value="">Tất cả</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <button onClick={resetFilters} className="text-xs text-blue-500 hover:underline">↺ Reset bộ lọc</button>
              </div>
            )}

            <p className="text-sm text-gray-400 mb-3">
              Hiển thị {words.length} / {total} từ
              {totalPages > 1 && ` • Trang ${page} / ${totalPages}`}
            </p>
          </>
        )}

        {/* Word List */}
        {words.length === 0 ? (
          <div className="text-center py-16">
            {statTotal === 0 ? (
              <>
                <div className="text-6xl mb-4">📒</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                  Sổ từ vựng trống
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Import danh sách từ vựng để bắt đầu. Từ đã có sẵn trong hệ thống sẽ được tự động bỏ qua.
                </p>
                <button onClick={() => setShowImportModal(true)}
                  className="px-6 py-3 rounded-xl font-medium text-white bg-green-600 hover:bg-green-700 transition-all">
                  📥 Import từ vựng
                </button>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                  Không tìm thấy từ nào
                </h3>
                <p className="text-gray-500">Thử thay đổi bộ lọc</p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {words.map(w => (
                <WordBankCard
                  key={w.id}
                  word={w}
                  onToggleFavorite={(id) => toggleFavoriteMutation.mutate(id)}
                  onSpeak={speak}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button onClick={() => setPage(page - 1)} disabled={page <= 1}
                  className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40"
                  style={{ borderColor: 'var(--theme-border)' }}>
                  ← Trước
                </button>
                <span className="text-sm text-gray-500">
                  Trang {page} / {totalPages}
                </span>
                <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}
                  className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40"
                  style={{ borderColor: 'var(--theme-border)' }}>
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />
    </MainLayout>
  );
}