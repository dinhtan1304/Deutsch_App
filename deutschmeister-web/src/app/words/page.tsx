'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { WordCard } from '@/components/words/WordCard';
import { useWords } from '@/hooks/useWords';
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites';
import { Gender, CEFRLevel, CATEGORIES, LEVELS } from '@/types';
import { IconBook, IconSearch, IconChevronLeft, IconChevronRight } from '@/components/ui/Icons';

// ─── Category display names (Vietnamese) ───
const CATEGORY_VI: Record<string, string> = {
  animals: 'Động vật', body: 'Cơ thể', clothing: 'Quần áo', colors: 'Màu sắc',
  education: 'Giáo dục', family: 'Gia đình', food: 'Thực phẩm', health: 'Sức khỏe',
  home: 'Nhà cửa', nature: 'Thiên nhiên', numbers: 'Số đếm', occupations: 'Nghề nghiệp',
  places: 'Địa điểm', sports: 'Thể thao', technology: 'Công nghệ', time: 'Thời gian',
  transport: 'Giao thông', travel: 'Du lịch', weather: 'Thời tiết', other: 'Khác',
};

// ─── Gender pill config ───
const GENDERS: { value: Gender; article: string; label: string; color: string; bg: string }[] = [
  { value: 'masculine', article: 'der', label: 'Maskulin', color: '#3B82F6', bg: 'rgba(59,130,246,.1)' },
  { value: 'feminine', article: 'die', label: 'Feminin', color: '#EC4899', bg: 'rgba(236,72,153,.1)' },
  { value: 'neuter', article: 'das', label: 'Neutrum', color: '#22C55E', bg: 'rgba(34,197,94,.1)' },
];

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
    limit: 21,
  });

  const { data: favorites } = useFavorites();
  const { toggle: toggleFavorite } = useToggleFavorite();
  const favoriteIds = useMemo(() => new Set(favorites?.map(f => f.wordId) || []), [favorites]);
  const handleFavoriteToggle = async (wordId: string) => {
    try {
      await toggleFavorite(wordId, favoriteIds.has(wordId));
    } catch { /* ignore duplicate/not-found errors */ }
  };

  const hasFilters = !!(search || gender || category || level);

  const clearFilters = () => {
    setSearch(''); setGender(''); setCategory(''); setLevel(''); setPage(1);
  };

  const toggleGender = (g: Gender) => {
    setGender(prev => prev === g ? '' : g);
    setPage(1);
  };

  return (
    <MainLayout>
      <div className="py-6">

        {/* ─── Header ─── */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
              <IconBook size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                Từ điển tiếng Đức
              </h1>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                Tra cứu danh từ với mạo từ Der / Die / Das
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Tips link */}
            <Link href="/tips"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #F59E0B18, #F59E0B08)', color: '#F59E0B', border: '1px solid rgba(245,158,11,.2)' }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                <path d="M9 18h6" /><path d="M10 22h4" />
              </svg>
              Mẹo nhớ
            </Link>

            {/* Favorites link */}
            <Link href="/favorites"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #EC489918, #EC489908)', color: '#EC4899', border: '1px solid rgba(236,72,153,.2)' }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Yêu thích
            </Link>
            {/* History link */}
            <Link href="/history"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #8B5CF618, #8B5CF608)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,.2)' }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              Lịch sử
            </Link>

            {/* Word count */}
            {data && (
              <div className="text-right hidden sm:block">
                <div className="text-2xl font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
                  {data.total}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                  {hasFilters ? 'kết quả' : 'từ vựng'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Filter Bar ─── */}
        <div className="rounded-2xl border p-4 mb-6 space-y-3"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>

          {/* Search row */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--theme-text-muted)' }}>
              <IconSearch size={18} />
            </span>
            <input
              type="text"
              placeholder="Tìm từ vựng tiếng Đức hoặc nghĩa..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl text-[14px] border
                focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50
                transition-all duration-200"
              style={{
                backgroundColor: 'var(--theme-bg-secondary)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-primary)',
              }}
            />
          </div>

          {/* Gender pills + Dropdowns row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Gender pills */}
            <div className="flex gap-1.5">
              {GENDERS.map(g => {
                const active = gender === g.value;
                return (
                  <button
                    key={g.value}
                    onClick={() => toggleGender(g.value)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium
                      transition-all duration-200 border"
                    style={active ? {
                      backgroundColor: g.bg,
                      borderColor: g.color,
                      color: g.color,
                    } : {
                      backgroundColor: 'transparent',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-text-secondary)',
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                    {g.article}
                  </button>
                );
              })}
            </div>

            <div className="w-px h-6 mx-1 hidden sm:block" style={{ backgroundColor: 'var(--theme-border)' }} />

            {/* Category */}
            <select
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-[13px] border
                focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              style={{
                backgroundColor: 'var(--theme-bg-secondary)',
                borderColor: category ? '#8B5CF6' : 'var(--theme-border)',
                color: category ? '#8B5CF6' : 'var(--theme-text-secondary)',
              }}
            >
              <option value="">Chủ đề</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{CATEGORY_VI[cat] || cat}</option>
              ))}
            </select>

            {/* Level */}
            <select
              value={level}
              onChange={e => { setLevel(e.target.value as CEFRLevel | ''); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-[13px] border
                focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              style={{
                backgroundColor: 'var(--theme-bg-secondary)',
                borderColor: level ? '#F59E0B' : 'var(--theme-border)',
                color: level ? '#F59E0B' : 'var(--theme-text-secondary)',
              }}
            >
              <option value="">Cấp độ</option>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            {/* Clear */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all
                  hover:bg-red-500/10"
                style={{ color: '#EF4444' }}
              >
                ✕ Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* ─── Loading ─── */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl h-40 animate-pulse"
                style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
            ))}
          </div>
        )}

        {/* ─── Error ─── */}
        {error && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">😥</div>
            <p className="text-[15px] font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
              Không thể tải từ vựng
            </p>
            <p className="text-[13px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>
              Vui lòng thử lại sau
            </p>
          </div>
        )}

        {/* ─── Words Grid ─── */}
        {data && data.data.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {data.data.map(word => (
                <WordCard
                  key={word.id}
                  word={word}
                  isFavorite={favoriteIds.has(word.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 rounded-lg flex items-center justify-center border
                    transition-all duration-200 disabled:opacity-30"
                  style={{
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-secondary)',
                    backgroundColor: 'var(--theme-bg-card)',
                  }}
                >
                  <IconChevronLeft size={16} />
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (data.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= data.totalPages - 2) {
                    pageNum = data.totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  const isActive = pageNum === page;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-semibold
                        transition-all duration-200"
                      style={isActive ? {
                        background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                        color: 'white',
                      } : {
                        color: 'var(--theme-text-secondary)',
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="w-9 h-9 rounded-lg flex items-center justify-center border
                    transition-all duration-200 disabled:opacity-30"
                  style={{
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-secondary)',
                    backgroundColor: 'var(--theme-bg-card)',
                  }}
                >
                  <IconChevronRight size={16} />
                </button>

                <span className="ml-2 text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
                  / {data.totalPages} trang
                </span>
              </div>
            )}
          </>
        )}

        {/* ─── No results ─── */}
        {data && data.data.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-[16px] font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>
              Không tìm thấy từ nào
            </p>
            <p className="text-[13px] mt-1 mb-4" style={{ color: 'var(--theme-text-muted)' }}>
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </p>
            <button
              onClick={clearFilters}
              className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white transition-all
                hover:shadow-md hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}