'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { WordCard } from '@/components/words/WordCard';
import { useInfiniteWords } from '@/hooks/useWords';
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites';
import { Gender, CEFRLevel, CATEGORIES, LEVELS } from '@/types';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { type TranslateLang } from '@/lib/api/translation';
import {
  IconBook, IconSearch, IconLightbulb, IconStar, IconHistory, IconX,
} from '@/components/ui/Icons';

// ─── Category display names (Vietnamese) ───
const CATEGORY_VI: Record<string, string> = {
  'persoenliche-angaben': 'Thông tin cá nhân',
  'familie-freunde': 'Gia đình & Bạn bè',
  'wohnen': 'Nhà ở',
  'essen-trinken': 'Ăn & Uống',
  'einkaufen': 'Mua sắm',
  'koerper-gesundheit': 'Cơ thể & Sức khỏe',
  'arbeit-beruf': 'Công việc & Nghề nghiệp',
  'schule-ausbildung': 'Trường học & Đào tạo',
  'freizeit-hobbys': 'Giải trí & Sở thích',
  'reisen-verkehr': 'Du lịch & Giao thông',
  'natur-wetter': 'Thiên nhiên & Thời tiết',
  'medien-kommunikation': 'Truyền thông & Liên lạc',
};

// ─── Gender pill config ───
const GENDERS: { value: Gender; article: string; color: string; bg: string; gradient: string }[] = [
  { value: 'masculine', article: 'der', color: '#3B82F6', bg: 'rgba(59,130,246,.1)', gradient: 'linear-gradient(135deg,#3B82F6,#1D4ED8)' },
  { value: 'feminine',  article: 'die', color: '#EC4899', bg: 'rgba(236,72,153,.1)', gradient: 'linear-gradient(135deg,#EC4899,#BE185D)' },
  { value: 'neuter',    article: 'das', color: '#22C55E', bg: 'rgba(34,197,94,.1)',  gradient: 'linear-gradient(135deg,#22C55E,#15803D)' },
];

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
      style={{ backgroundColor: copied ? 'rgba(34,197,94,.15)' : 'var(--theme-bg-secondary)', color: copied ? '#22C55E' : 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      {copied ? 'Đã copy' : 'Copy'}
    </button>
  );
}

function SpeakBtn({ text, lang }: { text: string; lang: string }) {
  const speak = () => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    speechSynthesis.speak(utter);
  };
  return (
    <button onClick={speak}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
      style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
      Phát âm
    </button>
  );
}

export default function WordsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); }, []);

  const [gender, setGender] = useState<Gender | ''>('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState<CEFRLevel | ''>('');
  const [langOverride, setLangOverride] = useState<TranslateLang | undefined>(undefined);

  const { data: translated, isLoading: isTranslating, isPhrase, from: tlFrom, to: tlTo } =
    useAutoTranslate(searchInput, langOverride);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteWords({
    search: search || undefined,
    gender: gender || undefined,
    category: category || undefined,
    level: level || undefined,
    limit: 21,
  });

  const allWords = useMemo(() => data?.pages.flatMap(p => p.data) ?? [], [data]);
  const totalCount = data?.pages[0]?.total ?? 0;

  const { data: favorites } = useFavorites();
  const { toggle: toggleFavorite } = useToggleFavorite();
  const favoriteIds = useMemo(() => new Set(favorites?.map(f => f.wordId) || []), [favorites]);
  const handleFavoriteToggle = async (wordId: string) => {
    try { await toggleFavorite(wordId, favoriteIds.has(wordId)); } catch { /* ignore */ }
  };

  const hasFilters = !!(searchInput || gender || category || level);

  const clearFilters = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchInput(''); setSearch(''); setGender(''); setCategory(''); setLevel('');
    setLangOverride(undefined);
  };

  const swapLang = () => {
    setLangOverride(prev => {
      const current = prev ?? tlFrom;
      return current === 'vi' ? 'de' : 'vi';
    });
  };

  const toggleGender = (g: Gender) => { setGender(prev => prev === g ? '' : g); };

  // ─── Infinite scroll sentinel ───
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(([entry]: IntersectionObserverEntry[]) => {
    if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  return (
    <div className="py-6">

      {/* ─── Header ─── */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
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

        {/* Quick links + word count */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/tips"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(245,158,11,.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,.2)' }}>
            <IconLightbulb size={14} /> Mẹo nhớ
          </Link>
          <Link href="/favorites"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(236,72,153,.1)', color: '#EC4899', border: '1px solid rgba(236,72,153,.2)' }}>
            <IconStar size={14} /> Yêu thích
          </Link>
          <Link href="/history"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(139,92,246,.1)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,.2)' }}>
            <IconHistory size={14} /> Lịch sử
          </Link>

          {totalCount > 0 && (
            <div className="text-right hidden sm:block pl-2 border-l"
              style={{ borderColor: 'var(--theme-border)' }}>
              <div className="text-xl font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
                {totalCount}
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

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--theme-text-muted)' }}>
            <IconSearch size={17} />
          </span>
          <input
            type="text"
            placeholder="Tìm từ vựng tiếng Đức hoặc nghĩa..."
            value={searchInput}
            onChange={e => {
              const val = e.target.value;
              setSearchInput(val);
              if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
              searchDebounceRef.current = setTimeout(() => { searchDebounceRef.current = null; setSearch(val); }, 300);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[14px] border focus:outline-none transition-all duration-200"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              borderColor: searchInput ? '#3B82F6' : 'var(--theme-border)',
              color: 'var(--theme-text-primary)',
              boxShadow: searchInput ? '0 0 0 3px rgba(59,130,246,.12)' : 'none',
            }}
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setSearch(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
              style={{ backgroundColor: 'var(--theme-text-muted)', color: 'var(--theme-bg-card)' }}>
              <IconX size={11} />
            </button>
          )}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Gender pills */}
          <div className="flex gap-1.5">
            {GENDERS.map(g => {
              const active = gender === g.value;
              return (
                <button key={g.value} onClick={() => toggleGender(g.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200"
                  style={active ? {
                    background: g.gradient, color: 'white',
                    boxShadow: `0 4px 10px ${g.color}30`,
                  } : {
                    backgroundColor: 'var(--theme-bg-secondary)',
                    color: 'var(--theme-text-secondary)',
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: active ? 'white' : g.color }} />
                  {g.article}
                </button>
              );
            })}
          </div>

          <div className="w-px h-5 hidden sm:block" style={{ backgroundColor: 'var(--theme-border)' }} />

          {/* Category */}
          <select value={category} onChange={e => { setCategory(e.target.value); }}
            className="px-3 py-1.5 rounded-lg text-[13px] border focus:outline-none transition-all"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              borderColor: category ? '#8B5CF6' : 'var(--theme-border)',
              color: category ? '#8B5CF6' : 'var(--theme-text-secondary)',
            }}>
            <option value="">Chủ đề</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{CATEGORY_VI[cat] || cat}</option>)}
          </select>

          {/* Level */}
          <select value={level} onChange={e => { setLevel(e.target.value as CEFRLevel | ''); }}
            className="px-3 py-1.5 rounded-lg text-[13px] border focus:outline-none transition-all"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              borderColor: level ? '#F59E0B' : 'var(--theme-border)',
              color: level ? '#F59E0B' : 'var(--theme-text-secondary)',
            }}>
            <option value="">Cấp độ</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          {/* Clear all */}
          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all hover:bg-red-500/10"
              style={{ color: '#EF4444' }}>
              <IconX size={12} /> Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* ─── Translation card ─── */}
      {isPhrase && (
        <div
          className="rounded-2xl p-4 mb-5"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            border: '1px solid var(--theme-border)',
            borderLeft: '3px solid #3B82F6',
          }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>
              <span>{tlFrom === 'vi' ? '🇻🇳 Tiếng Việt' : '🇩🇪 Tiếng Đức'}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: '#3B82F6' }}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              <span>{tlTo === 'de' ? '🇩🇪 Tiếng Đức' : '🇻🇳 Tiếng Việt'}</span>
            </div>
            <button
              onClick={swapLang}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all hover:scale-105"
              style={{ backgroundColor: 'rgba(59,130,246,.1)', color: '#3B82F6' }}
              title="Đổi chiều dịch"
            >
              ⇄ Đổi chiều
            </button>
          </div>

          {/* Source text */}
          <p className="text-[13px] mb-2 italic" style={{ color: 'var(--theme-text-muted)' }}>
            &ldquo;{searchInput.trim()}&rdquo;
          </p>

          {/* Result */}
          {isTranslating ? (
            <div className="flex items-center gap-2 py-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              <span className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>Đang dịch...</span>
            </div>
          ) : translated ? (
            <div className="flex items-start justify-between gap-3 py-1">
              <p className="text-[15px] font-semibold flex-1 leading-snug" style={{ color: 'var(--theme-text-primary)' }}>
                {translated}
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                <CopyBtn text={translated} />
                <SpeakBtn text={translated} lang={tlTo === 'de' ? 'de-DE' : 'vi-VN'} />
              </div>
            </div>
          ) : (
            <div className="py-1 text-[12px]" style={{ color: '#EF4444' }}>
              Không dịch được. Thử lại hoặc kiểm tra kết nối.
            </div>
          )}

          <p className="text-[10px] mt-3" style={{ color: 'var(--theme-text-muted)' }}>
            Powered by MyMemory · {tlFrom} → {tlTo}
          </p>
        </div>
      )}

      {/* ─── Loading skeleton (initial) ─── */}
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
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg,rgba(239,68,68,.12),rgba(239,68,68,.06))' }}>
            <IconBook size={26} style={{ color: '#EF4444' }} />
          </div>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>
            Không thể tải từ vựng
          </p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            Vui lòng thử lại sau
          </p>
        </div>
      )}

      {/* ─── Word grid ─── */}
      {allWords.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allWords.map(word => (
              <WordCard
                key={word.id}
                word={word}
                isFavorite={favoriteIds.has(word.id)}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-10" />

          {/* Loading more indicator */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                <div className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'var(--theme-border)', borderTopColor: '#3B82F6' }} />
                <span className="text-[13px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>
                  Đang tải thêm...
                </span>
              </div>
            </div>
          )}

          {/* End of list */}
          {!hasNextPage && allWords.length > 21 && (
            <div className="text-center py-6">
              <span className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
                Đã hiển thị tất cả {totalCount} từ
              </span>
            </div>
          )}
        </>
      )}

      {/* ─── No results ─── */}
      {!isLoading && allWords.length === 0 && !error && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg,rgba(107,114,128,.12),rgba(107,114,128,.06))' }}>
            <IconSearch size={26} style={{ color: 'var(--theme-text-muted)' }} />
          </div>
          <p className="text-[16px] font-semibold mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
            Không tìm thấy từ nào
          </p>
          <p className="text-[13px] mb-5" style={{ color: 'var(--theme-text-muted)' }}>
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
          </p>
          <button onClick={clearFilters}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold text-white transition-all hover:shadow-md hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
            <IconX size={13} /> Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}
