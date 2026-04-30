'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/stores/authStore';
import { AuthGate } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { WordBankCard } from '@/components/word-bank/WordBankCard';
import { WordDetailModal } from '@/components/word-bank/WordDetailModal';

const ImportModal = dynamic(
  () => import('@/components/word-bank/ImportModal').then(m => ({ default: m.ImportModal })),
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
  useCollections,
  useCreateCollection,
  useDeleteCollection,
} from '@/hooks/usePersonalWords';
import {
  WordType, Level, Gender,
  WordTypeInfo, GenderInfo, WordBankFilters, ImportRow,
} from '@/types/personalWord';
import {
  IconNotebook, IconSearch, IconStar, IconRefresh, IconChevronLeft, IconChevronRight,
  IconDownload, IconUpload, IconFilter, IconBrain, IconTarget, IconFlame,
  IconPlus, IconX,
} from '@/components/ui/Icons';

const wordTypes: WordType[] = ['nomen', 'verb', 'adjektiv', 'adverb', 'praposition', 'konjunktion', 'pronomen', 'partikel', 'andere'];
const levels: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
const genders: Gender[] = ['masculine', 'feminine', 'neuter'];

export default function WordBankPage() {
  const { isAuthenticated } = useAuthStore();
  const { filters, page, limit, setFilters, resetFilters, setPage, getApiParams } = useWordBankUI();
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedWord, setSelectedWord] = useState<any | null>(null);
  const [selectedView, setSelectedView] = useState<string>('all'); // 'all' | 'favorites' | collectionId
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [collectionError, setCollectionError] = useState<string | null>(null);

  const { data: collections = [] } = useCollections();
  const createCollection = useCreateCollection();
  const deleteCollection = useDeleteCollection();

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
  const { data: srsStats } = useSRSStats();

  const words = wordsData?.data ?? [];
  const total = wordsData?.total ?? 0;
  const totalPages = wordsData?.totalPages ?? 1;

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
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

  const handleExport = () => exportMutation.mutate();
  const statTotal = stats?.total ?? 0;
  const statFavorites = stats?.favorites ?? 0;

  const handleSelectAll = () => {
    setSelectedView('all');
    setFilters({ favoritesOnly: false });
  };

  const handleSelectFavorites = () => {
    setSelectedView('favorites');
    setFilters({ favoritesOnly: true });
  };

  const handleSelectCollection = (id: string) => {
    setSelectedView(id);
    setFilters({ favoritesOnly: false });
  };

  const handleCreateCollection = async () => {
    const name = newCollectionName.trim();
    if (!name) return;
    try {
      setCollectionError(null);
      await createCollection.mutateAsync({ name });
      setNewCollectionName('');
      setShowNewCollection(false);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } } | undefined)?.response?.data?.message || (err as Error | undefined)?.message || '';
      setCollectionError(msg.includes('Conflict') || msg.includes('duplicate') || msg.includes('exists')
        ? 'Tên thư mục đã tồn tại'
        : 'Tạo thư mục thất bại. Vui lòng thử lại.');
    }
  };

  const handleDeleteCollection = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Xoá thư mục này? Các từ trong thư mục sẽ không bị xoá.')) return;
    if (selectedView === id) setSelectedView('all');
    await deleteCollection.mutateAsync(id);
  };

  if (!isAuthenticated) return (
    <AuthGate
      icon={<IconNotebook size={28} className="text-white" />}
      gradient={GRADIENT.writing}
      title="Đăng nhập để dùng Sổ tay"
      description="Lưu từ vựng cá nhân, phân loại theo chủ đề và ôn tập với SRS."
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
      <div className="py-6">

        {/* ─── Header ─── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: GRADIENT.history }}>
              <IconNotebook size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                Sổ từ vựng cá nhân
              </h1>
              <p className="text-body mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                {statTotal} từ • {statFavorites} yêu thích
                {isFetching && <span className="ml-2 text-blue-500 text-caption">đang tải...</span>}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-body font-semibold text-white
                transition-all hover:shadow-md hover:-translate-y-0.5"
              // eslint-disable-next-line no-restricted-syntax
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
              <IconDownload size={15} /> Import
            </button>
            <button onClick={handleExport} disabled={statTotal === 0 || exportMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-body font-medium border
                transition-all hover:-translate-y-0.5 disabled:opacity-40"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
              <IconUpload size={15} /> Export
            </button>
          </div>
        </div>

        {/* ─── SRS Review Banner ─── */}
        {statTotal > 0 && srsStats && (
          <div className="mb-6 p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-all hover:shadow-md"
            style={{
              borderColor: srsStats.due > 0 ? `${STATUS.danger}30` : `${STATUS.success}30`,
              backgroundColor: srsStats.due > 0 ? `${STATUS.danger}0D` : `${STATUS.success}0D`,
            }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: srsStats.due > 0
                    ? `linear-gradient(135deg, ${STATUS.danger}26, ${STATUS.danger}14)`
                    : `linear-gradient(135deg, ${STATUS.success}26, ${STATUS.success}14)`,
                }}>
                <IconBrain size={20} style={{ color: srsStats.due > 0 ? STATUS.danger : STATUS.success }} />
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                  {srsStats.due > 0 ? (
                    <>Có <span className="font-bold" style={{ color: STATUS.danger }}>{srsStats.due}</span> từ cần ôn tập hôm nay</>
                  ) : (
                    <span className="font-medium" style={{ color: STATUS.success }}>Tuyệt vời! Bạn đã ôn hết từ cho hôm nay.</span>
                  )}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  <span>{srsStats.mature} / {statTotal} đã thuộc ({Math.round((srsStats.mature / statTotal) * 100)}%)</span>
                  {srsStats.new > 0 && <span>• {srsStats.new} từ mới</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/word-bank/review?mode=weak"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs transition-all hover:scale-105"
                style={{ background: `${STATUS.danger}1A`, color: STATUS.danger }}>
                <IconTarget size={14} /> Từ yếu
              </Link>
              <Link href="/word-bank/review"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs text-white transition-all hover:scale-105"
                style={{
                  background: srsStats.due > 0
                    // eslint-disable-next-line no-restricted-syntax
                    ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                    : GRADIENT.action,
                }}>
                <IconRefresh size={14} /> {srsStats.due > 0 ? 'Ôn ngay' : 'Học thêm'}
              </Link>
            </div>
          </div>
        )}



        {/* ─── Two-column layout: Sidebar + Main ─── */}
        <div className="flex gap-5 items-start">

          {/* ── Collections Sidebar ── */}
          <div className="hidden md:flex flex-col w-52 shrink-0 rounded-2xl border overflow-hidden"
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>

            {/* Static nav items */}
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-body font-medium transition-all text-left"
              style={{
                backgroundColor: selectedView === 'all' ? `${ACCENT.writing}1A` : 'transparent',
                color: selectedView === 'all' ? ACCENT.writing : 'var(--theme-text-secondary)',
              }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
              <span className="flex-1">Tất cả</span>
              <span className="text-caption font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: selectedView === 'all' ? `${ACCENT.writing}26` : 'var(--theme-bg-secondary)',
                  color: selectedView === 'all' ? ACCENT.writing : 'var(--theme-text-muted)',
                }}>
                {statTotal}
              </span>
            </button>

            <button
              onClick={handleSelectFavorites}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-body font-medium transition-all text-left"
              style={{
                backgroundColor: selectedView === 'favorites' ? `${ACCENT.xp}1A` : 'transparent',
                color: selectedView === 'favorites' ? ACCENT.xp : 'var(--theme-text-secondary)',
              }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              <span className="flex-1">Yêu thích</span>
              <span className="text-caption font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: selectedView === 'favorites' ? `${ACCENT.xp}26` : 'var(--theme-bg-secondary)',
                  color: selectedView === 'favorites' ? ACCENT.xp : 'var(--theme-text-muted)',
                }}>
                {statFavorites}
              </span>
            </button>

            {/* Divider */}
            {collections.length > 0 && (
              <div className="mx-3 my-1 h-px" style={{ backgroundColor: 'var(--theme-border)' }} />
            )}

            {/* Collection items */}
            {collections.map(col => (
              <div
                key={col.id}
                onClick={() => handleSelectCollection(col.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleSelectCollection(col.id); }}
                className="group flex items-center gap-2.5 px-3.5 py-2.5 text-body font-medium transition-all text-left cursor-pointer"
                style={{
                  backgroundColor: selectedView === col.id ? `${col.color}18` : 'transparent',
                  color: selectedView === col.id ? col.color : 'var(--theme-text-secondary)',
                }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={col.color || 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                <span className="flex-1 truncate">{col.name}</span>
                <span className="text-caption font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: selectedView === col.id ? `${col.color}22` : 'var(--theme-bg-secondary)',
                    color: selectedView === col.id ? col.color : 'var(--theme-text-muted)',
                  }}>
                  {col.wordCount}
                </span>
                <button
                  onClick={(e) => handleDeleteCollection(col.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 hover:text-red-500 shrink-0"
                  title="Xoá thư mục">
                  <IconX size={12} />
                </button>
              </div>
            ))}

            {/* Divider before create */}
            <div className="mx-3 my-1 h-px" style={{ backgroundColor: 'var(--theme-border)' }} />

            {/* Create new collection */}
            {showNewCollection ? (
              <div className="px-3 py-2">
                <input
                  autoFocus
                  value={newCollectionName}
                  onChange={e => { setNewCollectionName(e.target.value); setCollectionError(null); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateCollection();
                    if (e.key === 'Escape') { setShowNewCollection(false); setNewCollectionName(''); }
                  }}
                  placeholder="Tên thư mục..."
                  maxLength={50}
                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  style={{
                    borderColor: 'var(--theme-border)',
                    backgroundColor: 'var(--theme-bg-secondary)',
                    color: 'var(--theme-text-primary)',
                  }}
                />
                {collectionError && (
                  <p className="text-caption mt-1 px-0.5" style={{ color: STATUS.danger }}>{collectionError}</p>
                )}
                <div className="flex gap-1.5 mt-1.5">
                  <button
                    onClick={handleCreateCollection}
                    disabled={!newCollectionName.trim() || createCollection.isPending}
                    className="flex-1 py-1 rounded-lg text-caption font-semibold text-white transition-all disabled:opacity-40"
                    style={{ background: GRADIENT.writing }}>
                    Tạo
                  </button>
                  <button
                    onClick={() => { setShowNewCollection(false); setNewCollectionName(''); setCollectionError(null); }}
                    className="px-2 py-1 rounded-lg text-caption transition-all"
                    style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
                    Huỷ
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewCollection(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium transition-all hover:opacity-80"
                style={{ color: 'var(--theme-text-muted)' }}>
                <IconPlus size={13} /> Tạo thư mục mới
              </button>
            )}
          </div>

          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0">

            {/* Search + Filter Bar */}
            {statTotal > 0 && (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="flex-1 min-w-50 relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--theme-text-muted)' }}>
                      <IconSearch size={16} />
                    </span>
                    <input
                      value={filters.search}
                      onChange={e => setFilters({ search: e.target.value })}
                      placeholder="Tìm từ, nghĩa, ghi chú..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-body
                        focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                      style={{
                        borderColor: 'var(--theme-border)',
                        backgroundColor: 'var(--theme-bg-card)',
                        color: 'var(--theme-text-primary)',
                      }}
                    />
                  </div>

                  <button onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-body font-medium transition-all"
                    style={{
                      borderColor: showFilters ? ACCENT.srs : 'var(--theme-border)',
                      backgroundColor: showFilters ? `${ACCENT.srs}14` : 'var(--theme-bg-card)',
                      color: showFilters ? ACCENT.srs : 'var(--theme-text-secondary)',
                    }}>
                    <IconFilter size={14} /> Lọc
                  </button>

                  {selectedView !== 'favorites' && (
                    <button onClick={() => setFilters({ favoritesOnly: !filters.favoritesOnly })}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-body font-medium transition-all"
                      style={{
                        borderColor: filters.favoritesOnly ? ACCENT.xp : 'var(--theme-border)',
                        backgroundColor: filters.favoritesOnly ? `${ACCENT.xp}14` : 'var(--theme-bg-card)',
                        color: filters.favoritesOnly ? ACCENT.xp : 'var(--theme-text-secondary)',
                      }}>
                      <IconStar size={14} style={filters.favoritesOnly ? { fill: ACCENT.xp } : {}} /> Yêu thích
                    </button>
                  )}

                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={e => {
                      const [sortBy, sortOrder] = e.target.value.split('-') as [WordBankFilters['sortBy'], 'asc' | 'desc'];
                      setFilters({ sortBy, sortOrder });
                    }}
                    className="px-3 py-2.5 rounded-xl border text-body
                      focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                    style={{
                      borderColor: 'var(--theme-border)',
                      backgroundColor: 'var(--theme-bg-card)',
                      color: 'var(--theme-text-primary)',
                    }}>
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
                  <div className="p-4 rounded-2xl border mb-4 space-y-4 shadow-sm"
                    style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                    
                    {/* Word Type inside filters */}
                    {stats && (
                      <div>
                        <label className="block text-caption font-semibold mb-2" style={{ color: 'var(--theme-text-muted)' }}>Từ loại</label>
                        <div className="flex flex-wrap gap-2">
                          {wordTypes.map(t => {
                            const info = WordTypeInfo[t];
                            const count = stats.byType[t] || 0;
                            const active = filters.wordType === t;
                            if (count === 0 && !active) return null; // hide empty types inside filter to save space
                            return (
                              <button key={t}
                                onClick={() => setFilters({ wordType: active ? 'all' : t })}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border"
                                style={{
                                  backgroundColor: active ? info.color : 'var(--theme-bg-secondary)',
                                  color: active ? 'white' : 'var(--theme-text-secondary)',
                                  borderColor: active ? info.color : 'transparent',
                                }}>
                                <span>{info.icon} {info.labelDe}</span>
                                <span className="opacity-70 text-[10px]">({count})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-5">
                      {/* Level */}
                      <div>
                        <label className="block text-caption font-semibold mb-1.5"
                          style={{ color: 'var(--theme-text-muted)' }}>Cấp độ</label>
                        <div className="flex gap-1">
                          <button onClick={() => setFilters({ level: 'all' })}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                            style={{
                              backgroundColor: filters.level === 'all' ? ACCENT.srs : 'var(--theme-bg-secondary)',
                              color: filters.level === 'all' ? 'white' : 'var(--theme-text-secondary)',
                            }}>
                            Tất cả
                          </button>
                          {levels.map(l => (
                            <button key={l}
                              onClick={() => setFilters({ level: filters.level === l ? 'all' : l })}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                              style={{
                                backgroundColor: filters.level === l ? ACCENT.srs : 'var(--theme-bg-secondary)',
                                color: filters.level === l ? 'white' : 'var(--theme-text-secondary)',
                              }}>
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-caption font-semibold mb-1.5"
                          style={{ color: 'var(--theme-text-muted)' }}>Giống (Nomen)</label>
                        <div className="flex gap-1">
                          <button onClick={() => setFilters({ gender: 'all' })}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                            style={{
                              backgroundColor: filters.gender === 'all' ? 'var(--theme-text-muted)' : 'var(--theme-bg-secondary)',
                              color: filters.gender === 'all' ? 'white' : 'var(--theme-text-secondary)',
                            }}>
                            Tất cả
                          </button>
                          {genders.map(g => {
                            const info = GenderInfo[g];
                            return (
                              <button key={g}
                                onClick={() => setFilters({ gender: filters.gender === g ? 'all' : g })}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                                style={{
                                  backgroundColor: filters.gender === g ? info.color : 'var(--theme-bg-secondary)',
                                  color: filters.gender === g ? 'white' : 'var(--theme-text-secondary)',
                                }}>
                                {info.article}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Category */}
                      {categories.length > 0 && (
                        <div>
                          <label className="block text-caption font-semibold mb-1.5"
                            style={{ color: 'var(--theme-text-muted)' }}>Chủ đề</label>
                          <select value={filters.category}
                            onChange={e => setFilters({ category: e.target.value })}
                            className="px-2.5 py-1 rounded-lg text-xs border transition-all
                              focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            style={{
                              borderColor: 'var(--theme-border)',
                              backgroundColor: 'var(--theme-bg-secondary)',
                              color: 'var(--theme-text-primary)',
                            }}>
                            <option value="">Tất cả</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                    <button onClick={resetFilters}
                      className="flex items-center gap-1.5 text-xs font-medium transition-all hover:opacity-70"
                      style={{ color: ACCENT.srs }}>
                      <IconRefresh size={13} /> Reset bộ lọc
                    </button>
                  </div>
                )}

                <p className="text-xs mb-3" style={{ color: 'var(--theme-text-muted)' }}>
                  Hiển thị {words.length} / {total} từ
                  {totalPages > 1 && ` • Trang ${page} / ${totalPages}`}
                </p>
              </>
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
                      Sổ từ vựng trống
                    </h3>
                    <p className="text-body mb-6 max-w-md mx-auto" style={{ color: 'var(--theme-text-muted)' }}>
                      Import danh sách từ vựng để bắt đầu. Từ đã có sẵn sẽ được tự động bỏ qua.
                    </p>
                    <button onClick={() => setShowImportModal(true)}
                      className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-semibold text-sm text-white
                        transition-all hover:shadow-md hover:-translate-y-0.5"
                      // eslint-disable-next-line no-restricted-syntax
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                      <IconDownload size={17} /> Import từ vựng
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
                      style={{ background: `linear-gradient(135deg, ${ACCENT.srs}1F, ${ACCENT.srs}0F)` }}>
                      <IconSearch size={26} style={{ color: ACCENT.srs }} />
                    </div>
                    <h3 className="text-base font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                      Không tìm thấy từ nào
                    </h3>
                    <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>Thử thay đổi bộ lọc</p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="border border-black/5 dark:border-white/5 rounded-2xl shadow-sm overflow-x-auto"
                  style={{ backgroundColor: 'var(--theme-bg-card)' }}>
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                      <tr>
                        <th className="px-4 py-3 font-semibold" style={{ color: 'var(--theme-text-muted)' }}>TỪ VỰNG</th>
                        <th className="px-4 py-3 font-semibold" style={{ color: 'var(--theme-text-muted)' }}>NGHĨA</th>
                        <th className="px-4 py-3 font-semibold" style={{ color: 'var(--theme-text-muted)' }}>PHÂN LOẠI</th>
                        <th className="px-4 py-3 font-semibold" style={{ color: 'var(--theme-text-muted)' }}>ĐẶC TÍNH</th>
                        <th className="px-4 py-3 font-semibold" style={{ color: 'var(--theme-text-muted)' }}>VÍ DỤ</th>
                        <th className="px-4 py-3 font-semibold text-right" style={{ color: 'var(--theme-text-muted)' }}>THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {words.map(w => (
                        <WordBankCard
                          key={w.id}
                          word={w}
                          onClick={() => setSelectedWord(w)}
                          onToggleFavorite={id => toggleFavoriteMutation.mutate(id)}
                          onSpeak={speak}
                          collections={collections}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button onClick={() => setPage(page - 1)} disabled={page <= 1}
                      className="w-9 h-9 rounded-lg flex items-center justify-center border
                        transition-all duration-200 disabled:opacity-30"
                      style={{
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-text-secondary)',
                        backgroundColor: 'var(--theme-bg-card)',
                      }}>
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
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-body font-semibold
                            transition-all duration-200"
                          style={pageNum === page ? {
                            background: GRADIENT.history,
                            color: 'white',
                          } : {
                            color: 'var(--theme-text-secondary)',
                          }}>
                          {pageNum}
                        </button>
                      );
                    })}

                    <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}
                      className="w-9 h-9 rounded-lg flex items-center justify-center border
                        transition-all duration-200 disabled:opacity-30"
                      style={{
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-text-secondary)',
                        backgroundColor: 'var(--theme-bg-card)',
                      }}>
                      <IconChevronRight size={16} />
                    </button>
                    <span className="ml-2 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                      / {totalPages} trang
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
