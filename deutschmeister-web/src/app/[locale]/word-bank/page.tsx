'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/authStore';
import { AuthGate } from '@/components/ui';
import { CapacityBanner } from '@/components/subscription/CapacityBanner';
import { aiVocabApi } from '@/lib/api/personal-words';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { speakGerman } from '@/lib/utils';
import { WordBankCard } from '@/components/word-bank/WordBankCard';
import { WordDetailModal } from '@/components/word-bank/WordDetailModal';
import { SRSBanner } from '@/components/word-bank/SRSBanner';
import { CollectionsSidebar } from '@/components/word-bank/CollectionsSidebar';
import { WordBankFiltersBar } from '@/components/word-bank/WordBankFiltersBar';
import { WordBankGamesLauncher } from '@/components/word-bank/WordBankGamesLauncher';
import {
  IconNotebook, IconSearch, IconChevronLeft, IconChevronRight, IconDownload, IconUpload, IconSparkles,
  IconCheck, IconStar, IconX, IconTrash,
} from '@/components/ui/Icons';

const ImportModal = dynamic(
  () => import('@/components/word-bank/ImportModal').then(m => ({ default: m.ImportModal })),
  { ssr: false }
);

const AIVocabModal = dynamic(
  () => import('@/components/word-bank/AIVocabModal').then(m => ({ default: m.AIVocabModal })),
  { ssr: false }
);
import { useWordBankUI } from '@/stores/wordBankStore';
import {
  usePersonalWords,
  usePersonalWordStats,
  usePersonalWordCategories,
  useToggleFavorite,
  useImportPersonalWords,
  useExportPersonalWords,
  useSRSStats,
  useBatchDeletePersonalWords,
} from '@/hooks/usePersonalWords';
import { ImportRow, PersonalWord } from '@/types/personalWord';

export default function WordBankPage() {
  const t = useTranslations('vocabulary.wordBank');
  const { isAuthenticated } = useAuthStore();
  const { filters, page, setFilters, resetFilters, setPage, getApiParams } = useWordBankUI();
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedWord, setSelectedWord] = useState<PersonalWord | null>(null);
  const [selectedView, setSelectedView] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const baseApiParams = getApiParams();
  const finalApiParams = (selectedView !== 'all' && selectedView !== 'favorites')
    ? { ...baseApiParams, collectionId: selectedView }
    : baseApiParams;

  const { data: wordsData, isLoading, isFetching } = usePersonalWords(finalApiParams);
  const { data: stats } = usePersonalWordStats();
  const { data: categories = [] } = usePersonalWordCategories();
  const toggleFavoriteMutation = useToggleFavorite();
  const importMutation = useImportPersonalWords();
  const exportMutation = useExportPersonalWords();
  const batchDelete = useBatchDeletePersonalWords();
  const { data: srsStats } = useSRSStats();
  const { data: capacity } = useQuery({
    queryKey: ['word-bank-capacity'],
    queryFn: () => aiVocabApi.getCapacity(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  const words = wordsData?.data ?? [];
  const total = wordsData?.total ?? 0;
  const totalPages = wordsData?.totalPages ?? 1;

  // ── Bulk selection ──
  const selectedCount = selectedIds.size;
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
  const allOnPageSelected = words.length > 0 && words.every((w) => selectedIds.has(w.id));
  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (words.every((w) => prev.has(w.id))) {
        const next = new Set(prev);
        words.forEach((w) => next.delete(w.id));
        return next;
      }
      const next = new Set(prev);
      words.forEach((w) => next.add(w.id));
      return next;
    });
  };
  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(t('bulk.deleteConfirm', { count: ids.length }))) return;
    try { await batchDelete.mutateAsync(ids); clearSelection(); } catch { /* ignore */ }
  };
  const handleBatchFavorite = () => {
    selectedIds.forEach((id) => toggleFavoriteMutation.mutate(id));
    clearSelection();
  };

  const speak = useCallback((text: string) => {
    speakGerman(text);
  }, []);

  const handleImport = (rows: ImportRow[]) => {
    const mapped = rows.map(r => ({
      word: r.word, wordType: r.wordType, translationEn: r.translationEn,
      translationVi: r.translationVi, article: r.article, plural: r.plural,
      partizipII: r.partizipII, hilfsverb: r.hilfsverb, komparativ: r.komparativ,
      superlativ: r.superlativ, kasus: r.kasus, examples: r.examples,
      level: r.level, category: r.category, tags: r.tags, notes: r.notes,
    }));
    return importMutation.mutateAsync({ rows: mapped });
  };

  const statTotal = stats?.total ?? 0;
  const statFavorites = stats?.favorites ?? 0;
  const statLearned = srsStats?.mature ?? 0;

  const handleSelectAll = () => { setSelectedView('all'); setFilters({ favoritesOnly: false }); };
  const handleSelectFavorites = () => { setSelectedView('favorites'); setFilters({ favoritesOnly: true }); };
  const handleSelectCollection = (id: string) => { setSelectedView(id); setFilters({ favoritesOnly: false }); };
  const handleDeleteCollection = (id: string) => { if (selectedView === id) setSelectedView('all'); };

  if (!isAuthenticated) return (
    <AuthGate
      icon={<IconNotebook size={28} className="text-white" />}
      gradient={GRADIENT.writing}
      title={t('authGateTitle')}
      description={t('authGateBody')}
    />
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse"
          style={{ background: GRADIENT.history }}>
          <IconNotebook size={24} className="text-white" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="py-6 max-w-360 mx-auto">

        {/* ─── Header ─── */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-caption font-medium uppercase mb-1.5" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.08em' }}>
              {t('eyebrow')}
            </div>
            <h1 className="font-bold" style={{ fontSize: 30, letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>
              {t('pageTitle')}
            </h1>
            <p className="text-body mt-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
              {t('pageSubtitle', { total: statTotal, favorites: statFavorites, learned: statLearned })}
              {isFetching && <span className="ml-2 text-caption" style={{ color: 'var(--accent)' }}>{t('fetching')}</span>}
            </p>
          </div>
          <div className="flex gap-2">
            {selectedView !== 'all' && selectedView !== 'favorites' && (
              <button
                onClick={() => setShowAIModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-body font-semibold text-white transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ background: GRADIENT.vocab }}
              >
                <IconSparkles size={15} /> {t('aiGenerate')}
              </button>
            )}
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-body font-semibold text-white transition-all hover:shadow-md hover:-translate-y-0.5"
              // eslint-disable-next-line no-restricted-syntax
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
            >
              <IconDownload size={15} /> {t('import')}
            </button>
            <button
              onClick={() => exportMutation.mutate()}
              disabled={statTotal === 0 || exportMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-body font-medium border transition-all hover:-translate-y-0.5 disabled:opacity-40"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}
            >
              <IconUpload size={15} /> {t('export')}
            </button>
          </div>
        </div>

        {/* ─── Free-tier capacity counter ─── */}
        {capacity && !capacity.isPaid && (
          <CapacityBanner
            used={capacity.used}
            limit={capacity.limit}
            isPaid={capacity.isPaid}
            label={t('capacityLabel')}
            featureContext="word-bank-capacity"
          />
        )}

        {/* ─── SRS Banner ─── */}
        {statTotal > 0 && srsStats && (
          <SRSBanner srsStats={srsStats} statTotal={statTotal} />
        )}

        {/* ─── Two-column layout: Sidebar + Main ─── */}
        <div className="flex gap-5 items-start">

          <CollectionsSidebar
            selectedView={selectedView}
            statTotal={statTotal}
            statFavorites={statFavorites}
            srsStats={srsStats}
            onSelectAll={handleSelectAll}
            onSelectFavorites={handleSelectFavorites}
            onSelectCollection={handleSelectCollection}
            onDeleteCollection={handleDeleteCollection}
          />

          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0">

            {statTotal > 0 && (
              <WordBankGamesLauncher
                collectionId={selectedView !== 'all' && selectedView !== 'favorites' ? selectedView : undefined}
                words={words}
              />
            )}

            {statTotal > 0 && (
              <WordBankFiltersBar
                filters={filters}
                setFilters={setFilters}
                resetFilters={resetFilters}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                selectedView={selectedView}
                stats={stats}
                categories={categories}
                total={total}
                shown={words.length}
                page={page}
                totalPages={totalPages}
              />
            )}

            {/* ─── Word List ─── */}
            {words.length === 0 ? (
              <div className="text-center py-16">
                {statTotal === 0 ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
                      style={{ background: `linear-gradient(135deg, ${ACCENT.vocab}1F, ${ACCENT.vocab}0F)` }}>
                      <IconNotebook size={30} style={{ color: ACCENT.vocab }} />
                    </div>
                    <h3 className="text-title font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                      {t('emptyTitle')}
                    </h3>
                    <p className="text-body mb-6 max-w-md mx-auto" style={{ color: 'var(--theme-text-muted)' }}>
                      {t('emptyBody')}
                    </p>
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:shadow-md hover:-translate-y-0.5"
                      // eslint-disable-next-line no-restricted-syntax
                      style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                    >
                      <IconDownload size={17} /> {t('importBtn')}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
                      style={{ background: `linear-gradient(135deg, ${ACCENT.srs}1F, ${ACCENT.srs}0F)` }}>
                      <IconSearch size={26} style={{ color: ACCENT.srs }} />
                    </div>
                    <h3 className="text-base font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                      {t('noFoundTitle')}
                    </h3>
                    <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>{t('noFoundBody')}</p>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Bulk actions bar */}
                {selectedCount > 0 && (
                  <div className="flex items-center gap-2 mb-3 px-3.5 py-2.5 rounded-xl sticky top-20 z-10 backdrop-blur-md"
                    style={{ background: 'color-mix(in srgb, var(--accent) 10%, var(--theme-bg-card))', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}>
                    <span className="text-body font-semibold" style={{ color: 'var(--accent)' }}>
                      {t('bulk.selected', { count: selectedCount })}
                    </span>
                    <span className="w-px h-4" style={{ background: 'color-mix(in srgb, var(--accent) 30%, transparent)' }} />
                    <button onClick={handleBatchFavorite}
                      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-caption font-medium transition-colors hover:bg-(--theme-overlay-soft)"
                      style={{ color: 'var(--theme-text-secondary)' }}>
                      <IconStar size={14} /> {t('bulk.favorite')}
                    </button>
                    <button onClick={handleBatchDelete} disabled={batchDelete.isPending}
                      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-caption font-medium transition-colors disabled:opacity-50"
                      style={{ color: STATUS.danger }}>
                      <IconTrash size={14} /> {t('bulk.delete')}
                    </button>
                    <div className="flex-1" />
                    <button onClick={clearSelection}
                      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-caption font-medium border"
                      style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                      <IconX size={12} /> {t('bulk.clear')}
                    </button>
                  </div>
                )}

                {/* Select-all toggle */}
                <div className="flex justify-end mb-2">
                  <button onClick={toggleSelectAll}
                    className="inline-flex items-center gap-1.5 text-caption font-medium transition-colors"
                    style={{ color: 'var(--theme-text-muted)' }}>
                    <span className="w-4 h-4 rounded-xs flex items-center justify-center"
                      style={{ border: `1.5px solid ${allOnPageSelected ? 'var(--accent)' : 'var(--theme-text-muted)'}`, background: allOnPageSelected ? 'var(--accent)' : 'transparent', color: 'var(--accent-on)' }}>
                      {allOnPageSelected && <IconCheck size={10} />}
                    </span>
                    {allOnPageSelected ? t('bulk.deselectAll') : t('bulk.selectAll')}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {words.map(w => (
                    <WordBankCard
                      key={w.id}
                      word={w}
                      onClick={() => setSelectedWord(w)}
                      onToggleFavorite={id => toggleFavoriteMutation.mutate(id)}
                      onSpeak={speak}
                      selected={selectedIds.has(w.id)}
                      onToggleSelect={() => toggleSelect(w.id)}
                      anySelected={selectedCount > 0}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button onClick={() => setPage(page - 1)} disabled={page <= 1}
                      className="w-9 h-9 rounded-lg flex items-center justify-center border transition-all duration-200 disabled:opacity-30"
                      style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)', backgroundColor: 'var(--theme-bg-card)' }}>
                      <IconChevronLeft size={16} />
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (page <= 3) pageNum = i + 1;
                      else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = page - 2 + i;
                      return (
                        <button key={pageNum} onClick={() => setPage(pageNum)}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-body font-semibold transition-all duration-200"
                          style={pageNum === page
                            ? { background: GRADIENT.history, color: 'white' }
                            : { color: 'var(--theme-text-secondary)' }}>
                          {pageNum}
                        </button>
                      );
                    })}

                    <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}
                      className="w-9 h-9 rounded-lg flex items-center justify-center border transition-all duration-200 disabled:opacity-30"
                      style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)', backgroundColor: 'var(--theme-bg-card)' }}>
                      <IconChevronRight size={16} />
                    </button>
                    <span className="ml-2 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                      {t('pagesSuffix', { total: totalPages })}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />

      {showAIModal && (
        <AIVocabModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          collectionId={selectedView !== 'all' && selectedView !== 'favorites' ? selectedView : undefined}
        />
      )}

      {selectedWord && (
        <WordDetailModal
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
          onSpeak={speak}
          onToggleFavorite={id => toggleFavoriteMutation.mutate(id)}
        />
      )}
    </>
  );
}
