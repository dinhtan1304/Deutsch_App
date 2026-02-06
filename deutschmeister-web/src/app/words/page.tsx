'use client';

import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { WordCard } from '@/components/words/WordCard';
import { useWords } from '@/hooks/useWords';
import { useFavorites } from '@/hooks/useFavorites';
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
  const favoriteIds = useMemo(() => new Set(favorites?.map(f => f.wordId) || []), [favorites]);

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

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