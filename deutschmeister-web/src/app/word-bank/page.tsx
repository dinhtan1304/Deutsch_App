'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
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
import {
  IconNotebook, IconSearch, IconStar, IconRefresh, IconChevronLeft, IconChevronRight,
  IconDownload, IconUpload, IconFilter, IconBrain, IconTarget, IconFlame,
} from '@/components/ui/Icons';

const wordTypes: WordType[] = ['nomen', 'verb', 'adjektiv', 'adverb', 'praposition', 'konjunktion', 'pronomen', 'partikel', 'andere'];
const levels: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
const genders: Gender[] = ['masculine', 'feminine', 'neuter'];

export default function WordBankPage() {
  const { filters, page, limit, setFilters, resetFilters, setPage, getApiParams } = useWordBankUI();
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const apiParams = getApiParams();
  const { data: wordsData, isLoading, isFetching } = usePersonalWords(apiParams);
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

  if (isLoading) {
    return (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
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
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
              <IconNotebook size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                Sổ từ vựng cá nhân
              </h1>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                {statTotal} từ • {statFavorites} yêu thích
                {isFetching && <span className="ml-2 text-blue-500 text-[11px]">đang tải...</span>}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white
                transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
              <IconDownload size={15} /> Import
            </button>
            <button onClick={handleExport} disabled={statTotal === 0 || exportMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium border
                transition-all hover:-translate-y-0.5 disabled:opacity-40"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
              <IconUpload size={15} /> Export
            </button>
          </div>
        </div>

        {/* ─── SRS Review Card ─── */}
        {statTotal > 0 && srsStats && (
          <div className="mb-6 p-5 rounded-2xl border-2 transition-all hover:shadow-md"
            style={{
              borderColor: srsStats.due > 0 ? '#EF4444' : '#22C55E',
              backgroundColor: srsStats.due > 0 ? 'rgba(239,68,68,.04)' : 'rgba(34,197,94,.04)',
            }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: srsStats.due > 0
                      ? 'linear-gradient(135deg, rgba(239,68,68,.15), rgba(239,68,68,.08))'
                      : 'linear-gradient(135deg, rgba(34,197,94,.15), rgba(34,197,94,.08))',
                  }}>
                  <IconBrain size={24} style={{ color: srsStats.due > 0 ? '#EF4444' : '#22C55E' }} />
                </div>
                <div>
                  <h3 className="font-bold text-[16px]" style={{ color: 'var(--theme-text-primary)' }}>
                    Ôn tập SRS
                  </h3>
                  <p className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
                    {srsStats.due > 0 ? (
                      <>
                        <span className="font-bold" style={{ color: '#EF4444' }}>{srsStats.due}</span> từ cần ôn
                        {srsStats.new > 0 && (
                          <> • <span style={{ color: '#3B82F6' }}>{srsStats.new}</span> từ mới</>
                        )}
                      </>
                    ) : (
                      'Tuyệt vời! Bạn đã ôn hết cho hôm nay'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex gap-2 text-[12px]">
                  {[
                    { label: srsStats.learning, color: '#F59E0B', bg: 'rgba(245,158,11,.1)', icon: IconFlame, title: 'Đang học' },
                    { label: srsStats.mature,   color: '#22C55E', bg: 'rgba(34,197,94,.1)',  icon: IconTarget, title: 'Thuộc lòng' },
                    { label: `${srsStats.retentionRate}%`, color: '#3B82F6', bg: 'rgba(59,130,246,.1)', icon: IconBrain, title: 'Retention' },
                  ].map((s, i) => {
                    const Ic = s.icon;
                    return (
                      <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium"
                        style={{ backgroundColor: s.bg, color: s.color }}
                        title={s.title}>
                        <Ic size={12} />
                        {s.label}
                      </span>
                    );
                  })}
                </div>

                <Link href="/word-bank/review"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-[13px] text-white
                    transition-all hover:shadow-md hover:-translate-y-0.5"
                  style={{
                    background: srsStats.due > 0
                      ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                      : 'linear-gradient(135deg, #3B82F6, #6366F1)',
                  }}>
                  <IconRefresh size={15} />
                  {srsStats.due > 0 ? 'Ôn ngay' : 'Học thêm'}
                </Link>
              </div>
            </div>

            {/* Progress bar */}
            {statTotal > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-[11px] mb-1.5"
                  style={{ color: 'var(--theme-text-muted)' }}>
                  <span>Đã ôn hôm nay: {srsStats.reviewedToday} từ</span>
                  <span>{srsStats.mature} / {statTotal} đã thuộc ({Math.round((srsStats.mature / statTotal) * 100)}%)</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (srsStats.mature / statTotal) * 100)}%`,
                      background: 'linear-gradient(90deg, #F59E0B, #22C55E, #10B981)',
                    }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Word Type Chips ─── */}
        {statTotal > 0 && stats && (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 mb-6">
            {wordTypes.map(t => {
              const info = WordTypeInfo[t];
              const count = stats.byType[t] || 0;
              const active = filters.wordType === t;
              return (
                <button key={t}
                  onClick={() => setFilters({ wordType: active ? 'all' : t })}
                  className="p-2.5 rounded-xl text-center transition-all duration-200 border hover:-translate-y-0.5"
                  style={{
                    backgroundColor: active ? info.color : 'var(--theme-bg-card)',
                    color: active ? 'white' : 'var(--theme-text-secondary)',
                    borderColor: active ? info.color : 'var(--theme-border)',
                    opacity: count === 0 && !active ? 0.4 : 1,
                  }}>
                  <div className="text-[14px]">{info.icon}</div>
                  <div className="text-[11px] font-medium mt-0.5">{info.label}</div>
                  <div className="text-[11px] font-bold">{count}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* ─── Search + Filter Bar ─── */}
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-[13px]
                    focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  style={{
                    borderColor: 'var(--theme-border)',
                    backgroundColor: 'var(--theme-bg-card)',
                    color: 'var(--theme-text-primary)',
                  }}
                />
              </div>

              <button onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-medium transition-all"
                style={{
                  borderColor: showFilters ? '#3B82F6' : 'var(--theme-border)',
                  backgroundColor: showFilters ? 'rgba(59,130,246,.08)' : 'var(--theme-bg-card)',
                  color: showFilters ? '#3B82F6' : 'var(--theme-text-secondary)',
                }}>
                <IconFilter size={14} /> Lọc
              </button>

              <button onClick={() => setFilters({ favoritesOnly: !filters.favoritesOnly })}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-medium transition-all"
                style={{
                  borderColor: filters.favoritesOnly ? '#EAB308' : 'var(--theme-border)',
                  backgroundColor: filters.favoritesOnly ? 'rgba(234,179,8,.08)' : 'var(--theme-bg-card)',
                  color: filters.favoritesOnly ? '#EAB308' : 'var(--theme-text-secondary)',
                }}>
                <IconStar size={14} style={filters.favoritesOnly ? { fill: '#EAB308' } : {}} /> Yêu thích
              </button>

              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={e => {
                  const [sortBy, sortOrder] = e.target.value.split('-') as [WordBankFilters['sortBy'], 'asc' | 'desc'];
                  setFilters({ sortBy, sortOrder });
                }}
                className="px-3 py-2.5 rounded-xl border text-[13px]
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
              <div className="p-4 rounded-2xl border mb-4 space-y-3"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                <div className="flex flex-wrap gap-5">
                  {/* Level */}
                  <div>
                    <label className="block text-[11px] font-semibold mb-1.5"
                      style={{ color: 'var(--theme-text-muted)' }}>Cấp độ</label>
                    <div className="flex gap-1">
                      <button onClick={() => setFilters({ level: 'all' })}
                        className="px-2.5 py-1 rounded-lg text-[12px] font-medium transition-all"
                        style={{
                          backgroundColor: filters.level === 'all' ? '#3B82F6' : 'var(--theme-bg-secondary)',
                          color: filters.level === 'all' ? 'white' : 'var(--theme-text-secondary)',
                        }}>
                        Tất cả
                      </button>
                      {levels.map(l => (
                        <button key={l}
                          onClick={() => setFilters({ level: filters.level === l ? 'all' : l })}
                          className="px-2.5 py-1 rounded-lg text-[12px] font-medium transition-all"
                          style={{
                            backgroundColor: filters.level === l ? '#3B82F6' : 'var(--theme-bg-secondary)',
                            color: filters.level === l ? 'white' : 'var(--theme-text-secondary)',
                          }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-[11px] font-semibold mb-1.5"
                      style={{ color: 'var(--theme-text-muted)' }}>Giống (Nomen)</label>
                    <div className="flex gap-1">
                      <button onClick={() => setFilters({ gender: 'all' })}
                        className="px-2.5 py-1 rounded-lg text-[12px] font-medium transition-all"
                        style={{
                          backgroundColor: filters.gender === 'all' ? '#6B7280' : 'var(--theme-bg-secondary)',
                          color: filters.gender === 'all' ? 'white' : 'var(--theme-text-secondary)',
                        }}>
                        Tất cả
                      </button>
                      {genders.map(g => {
                        const info = GenderInfo[g];
                        return (
                          <button key={g}
                            onClick={() => setFilters({ gender: filters.gender === g ? 'all' : g })}
                            className="px-2.5 py-1 rounded-lg text-[12px] font-medium transition-all"
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
                      <label className="block text-[11px] font-semibold mb-1.5"
                        style={{ color: 'var(--theme-text-muted)' }}>Chủ đề</label>
                      <select value={filters.category}
                        onChange={e => setFilters({ category: e.target.value })}
                        className="px-2.5 py-1 rounded-lg text-[12px] border transition-all
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
                  className="flex items-center gap-1.5 text-[12px] font-medium transition-all hover:opacity-70"
                  style={{ color: '#3B82F6' }}>
                  <IconRefresh size={13} /> Reset bộ lọc
                </button>
              </div>
            )}

            <p className="text-[12px] mb-3" style={{ color: 'var(--theme-text-muted)' }}>
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
                  style={{ background: 'linear-gradient(135deg, rgba(139,92,246,.12), rgba(139,92,246,.06))' }}>
                  <IconNotebook size={30} style={{ color: '#8B5CF6' }} />
                </div>
                <h3 className="text-[18px] font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                  Sổ từ vựng trống
                </h3>
                <p className="text-[13px] mb-6 max-w-md mx-auto" style={{ color: 'var(--theme-text-muted)' }}>
                  Import danh sách từ vựng để bắt đầu. Từ đã có sẵn sẽ được tự động bỏ qua.
                </p>
                <button onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-semibold text-[14px] text-white
                    transition-all hover:shadow-md hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                  <IconDownload size={17} /> Import từ vựng
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(59,130,246,.12), rgba(59,130,246,.06))' }}>
                  <IconSearch size={26} style={{ color: '#3B82F6' }} />
                </div>
                <h3 className="text-[16px] font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                  Không tìm thấy từ nào
                </h3>
                <p className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>Thử thay đổi bộ lọc</p>
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
                  onToggleFavorite={id => toggleFavoriteMutation.mutate(id)}
                  onSpeak={speak}
                />
              ))}
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
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-semibold
                        transition-all duration-200"
                      style={pageNum === page ? {
                        background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
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
                <span className="ml-2 text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
                  / {totalPages} trang
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />
    </>
  );
}
