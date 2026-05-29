'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/authStore';
import { WordCard } from '@/components/words/WordCard';
import { useInfiniteWords } from '@/hooks/useWords';
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites';
import { Gender, CEFRLevel, CATEGORIES, LEVELS } from '@/types';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { type TranslateLang } from '@/lib/api/translation';
import { GRADIENT, ACCENT, STATUS } from '@/lib/tokens';
import { speakGerman } from '@/lib/utils';
import { GridSkeleton } from '@/components/ui';
import {
  IconBook, IconSearch, IconLightbulb, IconStar, IconHistory, IconX,
} from '@/components/ui/Icons';

const CATEGORY_KEYS = [
  'persoenliche-angaben', 'familie-freunde', 'wohnen', 'essen-trinken',
  'einkaufen', 'koerper-gesundheit', 'arbeit-beruf', 'schule-ausbildung',
  'freizeit-hobbys', 'reisen-verkehr', 'natur-wetter', 'medien-kommunikation',
] as const;
type CategoryKey = typeof CATEGORY_KEYS[number];

function useCategoryLabel() {
  const t = useTranslations('vocabulary.words.categories');
  return (cat: string) =>
    (CATEGORY_KEYS as readonly string[]).includes(cat) ? t(cat as CategoryKey) : cat;
}

// ─── Gender pill config ───
const GENDERS: { value: Gender; article: string; color: string; bg: string; gradient: string }[] = [
  { value: 'masculine', article: 'der', color: ACCENT.srs,       bg: `${ACCENT.srs}1A`,       gradient: `linear-gradient(135deg,${ACCENT.srs},#1D4ED8)` },
  { value: 'feminine',  article: 'die', color: ACCENT.listening, bg: `${ACCENT.listening}1A`, gradient: `linear-gradient(135deg,${ACCENT.listening},#BE185D)` },
  { value: 'neuter',    article: 'das', color: ACCENT.reading,   bg: `${ACCENT.reading}1A`,   gradient: `linear-gradient(135deg,${ACCENT.reading},#15803D)` },
];

function CopyBtn({ text }: { text: string }) {
  const t = useTranslations('vocabulary.words');
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={{ backgroundColor: copied ? `${STATUS.success}26` : 'var(--theme-bg-secondary)', color: copied ? STATUS.success : 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      {copied ? t('copiedBtn') : t('copyBtn')}
    </button>
  );
}

function SpeakBtn({ text, lang }: { text: string; lang: string }) {
  const t = useTranslations('vocabulary.words');
  const speak = () => {
    if (lang === 'de-DE') {
      speakGerman(text);
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    speechSynthesis.speak(utter);
  };
  return (
    <button onClick={speak}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
      {t('speakBtn')}
    </button>
  );
}

export default function WordsPage() {
  const t = useTranslations('vocabulary.words');
  const categoryLabel = useCategoryLabel();
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

  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { data: favorites } = useFavorites();
  const { toggle: toggleFavorite } = useToggleFavorite();
  const favoriteIds = useMemo(() => new Set(favorites?.map(f => f.wordId) || []), [favorites]);
  const handleFavoriteToggle = async (wordId: string) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?returnTo=${pathname}`);
      return;
    }
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
    if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
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
            style={{ background: GRADIENT.action }}>
            <IconBook size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              {t('pageTitle')}
            </h1>
            <p className="text-body mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              {t('pageSubtitle')}
            </p>
          </div>
        </div>

        {/* Quick links + word count */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/tips"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: `${ACCENT.xp}1A`, color: ACCENT.xp, border: `1px solid ${ACCENT.xp}33` }}>
            <IconLightbulb size={14} /> {t('linkTips')}
          </Link>
          <Link href="/favorites"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: `${ACCENT.listening}1A`, color: ACCENT.listening, border: `1px solid ${ACCENT.listening}33` }}>
            <IconStar size={14} /> {t('linkFavorites')}
          </Link>
          <Link href="/history"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: `${ACCENT.vocab}1A`, color: ACCENT.vocab, border: `1px solid ${ACCENT.vocab}33` }}>
            <IconHistory size={14} /> {t('linkHistory')}
          </Link>

          {totalCount > 0 && (
            <div className="text-right hidden sm:block pl-2 border-l"
              style={{ borderColor: 'var(--theme-border)' }}>
              <div className="text-xl font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
                {totalCount}
              </div>
              <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                {hasFilters ? t('resultsLabel') : t('wordsLabel')}
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
            placeholder={t('searchPlaceholder')}
            value={searchInput}
            onChange={e => {
              const val = e.target.value;
              setSearchInput(val);
              if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
              searchDebounceRef.current = setTimeout(() => { searchDebounceRef.current = null; setSearch(val); }, 300);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none transition-all duration-200"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              borderColor: searchInput ? ACCENT.srs : 'var(--theme-border)',
              color: 'var(--theme-text-primary)',
              boxShadow: searchInput ? `0 0 0 3px ${ACCENT.srs}1F` : 'none',
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body font-semibold transition-all duration-200"
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
            className="px-3 py-1.5 rounded-lg text-body border focus:outline-none transition-all"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              borderColor: category ? ACCENT.vocab : 'var(--theme-border)',
              color: category ? ACCENT.vocab : 'var(--theme-text-secondary)',
            }}>
            <option value="">{t('categoryAll')}</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{categoryLabel(cat)}</option>)}
          </select>

          {/* Level */}
          <select value={level} onChange={e => { setLevel(e.target.value as CEFRLevel | ''); }}
            className="px-3 py-1.5 rounded-lg text-body border focus:outline-none transition-all"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              borderColor: level ? ACCENT.xp : 'var(--theme-border)',
              color: level ? ACCENT.xp : 'var(--theme-text-secondary)',
            }}>
            <option value="">{t('levelAll')}</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          {/* Clear all */}
          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all hover:bg-red-500/10"
              style={{ color: STATUS.danger }}>
              <IconX size={12} /> {t('clearFilters')}
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
            borderLeft: `3px solid ${ACCENT.srs}`,
          }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-body font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>
              <span>{tlFrom === 'vi' ? t('langVi') : t('langDe')}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: ACCENT.srs }}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              <span>{tlTo === 'de' ? t('langDe') : t('langVi')}</span>
            </div>
            <button
              onClick={swapLang}
              className="px-2.5 py-1 rounded-lg text-caption font-bold transition-all hover:scale-105"
              style={{ backgroundColor: `${ACCENT.srs}1A`, color: ACCENT.srs }}
              title={t('swapLangTooltip')}
            >
              {t('swapLang')}
            </button>
          </div>

          {/* Source text */}
          <p className="text-body mb-2 italic" style={{ color: 'var(--theme-text-muted)' }}>
            &ldquo;{searchInput.trim()}&rdquo;
          </p>

          {/* Result */}
          {isTranslating ? (
            <div className="flex items-center gap-2 py-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACCENT.srs} strokeWidth="2" strokeLinecap="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              <span className="text-body" style={{ color: 'var(--theme-text-muted)' }}>{t('translating')}</span>
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
            <div className="py-1 text-xs" style={{ color: STATUS.danger }}>
              {t('translateError')}
            </div>
          )}

          <p className="text-caption mt-3" style={{ color: 'var(--theme-text-muted)' }}>
            {t('poweredBy', { from: tlFrom, to: tlTo })}
          </p>
        </div>
      )}

      {/* ─── Loading skeleton (initial) ─── */}
      {isLoading && <GridSkeleton cols={3} count={6} rounded="rounded-2xl" gap="gap-4" />}

      {/* ─── Error ─── */}
      {error && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: `linear-gradient(135deg,${STATUS.danger}1F,${STATUS.danger}0F)` }}>
            <IconBook size={26} style={{ color: STATUS.danger }} />
          </div>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>
            {t('loadError')}
          </p>
          <p className="text-body mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            {t('loadErrorRetry')}
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
                  style={{ borderColor: 'var(--theme-border)', borderTopColor: ACCENT.srs }} />
                <span className="text-body font-medium" style={{ color: 'var(--theme-text-muted)' }}>
                  {t('loadingMore')}
                </span>
              </div>
            </div>
          )}

          {/* End of list */}
          {!hasNextPage && allWords.length > 21 && (
            <div className="text-center py-6">
              <span className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
                {t('showingAll', { total: totalCount })}
              </span>
            </div>
          )}
        </>
      )}

      {/* ─── No results ─── */}
      {!isLoading && allWords.length === 0 && !error && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
            <IconSearch size={26} style={{ color: 'var(--theme-text-muted)' }} />
          </div>
          <p className="text-base font-semibold mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
            {t('noResultsTitle')}
          </p>
          <p className="text-body mb-5" style={{ color: 'var(--theme-text-muted)' }}>
            {t('noResultsBody')}
          </p>
          <button onClick={clearFilters}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-body font-semibold text-white transition-all hover:shadow-md hover:-translate-y-0.5"
            style={{ background: GRADIENT.action }}>
            <IconX size={13} /> {t('clearFilters')}
          </button>
        </div>
      )}
    </div>
  );
}
