'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/authStore';
import { WordCard } from '@/components/words/WordCard';
import { useInfiniteWords } from '@/hooks/useWords';
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites';
import { useProgressStats } from '@/hooks/useProgress';
import { Gender, CEFRLevel, CATEGORIES, LEVELS } from '@/types';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { type TranslateLang } from '@/lib/api/translation';
import { STATUS } from '@/lib/tokens';
import { speakGerman } from '@/lib/utils';
import { GridSkeleton } from '@/components/ui';
import { FilterChip } from '@/components/ui/FilterChip';
import {
  IconBook, IconSearch, IconLightbulb, IconStar, IconHistory, IconX, IconArrowRight,
  IconFlame, IconSparkles,
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

// ─── Article (gender) filter config — v2 color-code via CSS vars ───
const ARTICLE_FILTERS: { value: Gender; article: string; color: string }[] = [
  { value: 'masculine', article: 'der', color: 'var(--der)' },
  { value: 'feminine', article: 'die', color: 'var(--die)' },
  { value: 'neuter', article: 'das', color: 'var(--das)' },
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
    if (lang === 'de-DE') { speakGerman(text); return; }
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

// ─── Featured quick-jump card (v2 strip) ───
function FeaturedCard({ href, icon, color, value, sub, label }: {
  href: string; icon: React.ReactNode; color: string; value?: number; sub: string; label: string;
}) {
  return (
    <Link href={href}
      className="word-card-v2 flex items-center gap-3.5 rounded-xl px-4 py-3"
      style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', ['--card-accent' as string]: color } as React.CSSProperties}>
      <span className="w-9.5 h-9.5 rounded-[10px] flex items-center justify-center shrink-0"
        style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          {value != null
            ? <span className="mono font-bold" style={{ fontSize: 20, letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{value}</span>
            : <span className="font-bold text-body" style={{ color: 'var(--theme-text-primary)' }}>{label}</span>}
          <span className="text-caption truncate" style={{ color: 'var(--theme-text-muted)' }}>{sub}</span>
        </div>
        {value != null && <div className="text-caption" style={{ color: 'var(--theme-text-secondary)' }}>{label}</div>}
      </div>
      <IconArrowRight size={14} style={{ color: 'var(--theme-text-muted)' }} />
    </Link>
  );
}

// v2 header stat card (dot + label + mono value).
function Stat({ label, value, color, total, pulse }: { label: string; value: number; color: string; total?: number; pulse?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[10px] px-3.5 py-2.5" style={{ minWidth: 104, background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${pulse ? 'animate-pulse' : ''}`} style={{ background: color, boxShadow: pulse ? `0 0 8px ${color}` : undefined }} />
        <span className="text-caption uppercase font-medium" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.04em' }}>{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="mono font-bold" style={{ fontSize: 22, letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{value.toLocaleString('de-DE')}</span>
        {total != null && <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>/ {total}</span>}
      </div>
    </div>
  );
}

export default function WordsPage() {
  const t = useTranslations('vocabulary.words');
  const categoryLabel = useCategoryLabel();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); }, []);

  const [gender, setGender] = useState<Gender | ''>('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState<CEFRLevel | ''>('');
  const [langOverride, setLangOverride] = useState<TranslateLang | undefined>(undefined);

  const { data: translated, isLoading: isTranslating, isPhrase, from: tlFrom, to: tlTo } =
    useAutoTranslate(searchInput, langOverride);

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteWords({
    search: search || undefined,
    gender: gender || undefined,
    category: category || undefined,
    level: level || undefined,
    limit: 21,
  });

  const [sort, setSort] = useState<'default' | 'az' | 'za'>('default');

  const allWords = useMemo(() => data?.pages.flatMap(p => p.data) ?? [], [data]);
  const displayWords = useMemo(() => {
    if (sort === 'default') return allWords;
    const arr = [...allWords];
    arr.sort((a, b) => sort === 'az' ? a.word.localeCompare(b.word) : b.word.localeCompare(a.word));
    return arr;
  }, [allWords, sort]);
  const totalCount = data?.pages[0]?.total ?? 0;

  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { data: favorites } = useFavorites();
  const { data: progressStats } = useProgressStats(isAuthenticated);
  const favCount = favorites?.length ?? 0;
  const { toggle: toggleFavorite } = useToggleFavorite();
  const favoriteIds = useMemo(() => new Set(favorites?.map(f => f.wordId) || []), [favorites]);
  const handleFavoriteToggle = async (wordId: string) => {
    if (!isAuthenticated) { router.push(`/auth/login?returnTo=${pathname}`); return; }
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

  const toggleGender = (g: Gender) => setGender(prev => prev === g ? '' : g);
  const toggleLevel = (l: CEFRLevel) => setLevel(prev => prev === l ? '' : l);

  // ─── Infinite scroll sentinel ───
  const sentinelRef = useRef<HTMLDivElement>(null);
  const handleIntersect = useCallback(([entry]: IntersectionObserverEntry[]) => {
    if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  return (
    <div className="flex flex-col gap-4.5 max-w-360 mx-auto">

      {/* ─── Header ─── */}
      <header className="flex items-end justify-between gap-5 flex-wrap">
        <div>
          <div className="text-caption font-medium uppercase mb-1.5" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.08em' }}>
            {t('eyebrow')}
          </div>
          <h1 className="font-bold" style={{ fontSize: 30, letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>
            {t('pageTitle')}
          </h1>
          <p className="mt-1.5 text-body flex items-center gap-1.5 flex-wrap" style={{ color: 'var(--theme-text-secondary)' }}>
            {t('pageSubtitle')}
            <span className="inline-flex items-center gap-1.5">
              <b style={{ color: 'var(--der)' }}>der</b>
              <span style={{ color: 'var(--theme-text-muted)' }}>·</span>
              <b style={{ color: 'var(--die)' }}>die</b>
              <span style={{ color: 'var(--theme-text-muted)' }}>·</span>
              <b style={{ color: 'var(--das)' }}>das</b>
            </span>
          </p>
        </div>

        {isAuthenticated && progressStats ? (
          <div className="flex gap-2 flex-wrap">
            <Stat label={t('statLearned')} value={progressStats.mastered} color="var(--m-learned)" total={progressStats.total} />
            <Stat label={t('statLearning')} value={progressStats.learning} color="var(--m-learning)" />
            <Stat label={t('statDue')} value={progressStats.due} color="var(--streak)" pulse />
            <Stat label={t('statFav')} value={favCount} color="var(--die)" />
          </div>
        ) : totalCount > 0 ? (
          <div className="rounded-xl px-4 py-2.5" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
            <div className="mono font-extrabold" style={{ fontSize: 22, letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>
              {totalCount.toLocaleString('de-DE')}
            </div>
            <div className="text-caption uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.04em' }}>
              {hasFilters ? t('resultsLabel') : t('wordsLabel')}
            </div>
          </div>
        ) : null}
      </header>

      {/* ─── Featured strip ─── */}
      {isAuthenticated && progressStats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <FeaturedCard href="/word-bank/review" icon={<IconFlame size={18} />} color="var(--streak)"
            value={progressStats.due} sub={t('featuredDueSub')} label={t('featuredDue')} />
          <FeaturedCard href="/review" icon={<IconSparkles size={18} />} color="var(--m-learned)"
            value={progressStats.new} sub={t('featuredNewSub')} label={t('featuredNew')} />
          <FeaturedCard href="/favorites" icon={<IconStar size={18} />} color="var(--die)"
            value={favCount} sub={t('favoritesSub')} label={t('linkFavorites')} />
          <FeaturedCard href="/tips" icon={<IconLightbulb size={18} />} color="var(--v2-warn, #F5C249)"
            sub={t('tipsSub')} label={t('linkTips')} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <FeaturedCard href="/favorites" icon={<IconStar size={18} />} color="var(--die)"
            value={favCount} sub={t('favoritesSub')} label={t('linkFavorites')} />
          <FeaturedCard href="/tips" icon={<IconLightbulb size={18} />} color="var(--v2-warn, #F5C249)"
            sub={t('tipsSub')} label={t('linkTips')} />
          <FeaturedCard href="/history" icon={<IconHistory size={18} />} color="var(--v2-violet, #A78BFA)"
            sub={t('historySub')} label={t('linkHistory')} />
        </div>
      )}

      {/* ─── Filter Bar ─── */}
      <div className="rounded-[14px] border p-3.5 flex flex-col gap-3"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>

        {/* Search */}
        <div className="relative flex items-center h-10.5 rounded-[10px] px-3.5 gap-2.5"
          style={{ background: 'var(--theme-bg-secondary)', border: `1px solid ${searchInput ? 'var(--accent)' : 'var(--theme-border)'}` }}>
          <span style={{ color: 'var(--theme-text-muted)' }}><IconSearch size={16} /></span>
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
            className="flex-1 h-full bg-transparent text-sm outline-none"
            style={{ color: 'var(--theme-text-primary)' }}
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(''); setSearch(''); }}
              className="w-5 h-5 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity shrink-0"
              style={{ color: 'var(--theme-text-muted)' }}>
              <IconX size={13} />
            </button>
          )}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
          {/* Article chips */}
          <div className="flex items-center gap-2">
            {ARTICLE_FILTERS.map(g => {
              const active = gender === g.value;
              return (
                <button key={g.value} onClick={() => toggleGender(g.value)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body font-semibold transition-colors"
                  style={{
                    background: active ? `color-mix(in srgb, ${g.color} 14%, transparent)` : 'var(--theme-bg-secondary)',
                    border: `1px solid ${active ? g.color : 'var(--theme-border)'}`,
                    color: active ? g.color : 'var(--theme-text-secondary)',
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: g.color }} />
                  {g.article}
                </button>
              );
            })}
          </div>

          <span className="w-px h-5 hidden sm:block" style={{ background: 'var(--theme-border)' }} />

          {/* Level chips */}
          <div className="flex items-center gap-1.5">
            {LEVELS.map(l => (
              <FilterChip key={l} active={level === l} size="sm" onClick={() => toggleLevel(l as CEFRLevel)}>
                <span className="mono">{l}</span>
              </FilterChip>
            ))}
          </div>

          <div className="flex-1" />

          {/* Category select */}
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="h-8 px-3 rounded-lg text-[12.5px] border outline-none cursor-pointer"
            style={{
              background: 'var(--theme-bg-secondary)',
              borderColor: category ? 'var(--accent)' : 'var(--theme-border)',
              color: category ? 'var(--accent)' : 'var(--theme-text-secondary)',
            }}>
            <option value="">{t('categoryAll')}</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{categoryLabel(cat)}</option>)}
          </select>

          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
            className="h-8 px-3 rounded-lg text-[12.5px] border outline-none cursor-pointer"
            style={{
              background: 'var(--theme-bg-secondary)',
              borderColor: sort !== 'default' ? 'var(--accent)' : 'var(--theme-border)',
              color: sort !== 'default' ? 'var(--accent)' : 'var(--theme-text-secondary)',
            }}
            aria-label={t('sortLabel')}>
            <option value="default">{t('sortLabel')}: {t('sortDefault')}</option>
            <option value="az">{t('sortLabel')}: {t('sortAZ')}</option>
            <option value="za">{t('sortLabel')}: {t('sortZA')}</option>
          </select>

          {/* View toggle */}
          <div className="flex p-0.5 rounded-lg" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
            <button onClick={() => setView('grid')} aria-label={t('viewGrid')} title={t('viewGrid')}
              className="w-7 h-6.5 rounded-md flex items-center justify-center"
              style={{ background: view === 'grid' ? 'var(--theme-bg-tertiary)' : 'transparent', color: view === 'grid' ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)' }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h6v6H3V3Zm8 0h6v6h-6V3Zm0 8h6v6h-6v-6Zm-8 0h6v6H3v-6Z"/></svg>
            </button>
            <button onClick={() => setView('list')} aria-label={t('viewList')} title={t('viewList')}
              className="w-7 h-6.5 rounded-md flex items-center justify-center"
              style={{ background: view === 'list' ? 'var(--theme-bg-tertiary)' : 'transparent', color: view === 'list' ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)' }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h2m4 0h8M3 10h2m4 0h8M3 15h2m4 0h8"/></svg>
            </button>
          </div>
        </div>

        {/* Active filter pills */}
        {hasFilters && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1" style={{ borderTop: '1px solid var(--theme-border)' }}>
            <span className="text-caption uppercase font-medium mr-1" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.04em' }}>
              {t('resultsLabel')}:
            </span>
            {gender && (
              <ActivePill label={ARTICLE_FILTERS.find(a => a.value === gender)?.article ?? gender}
                color={ARTICLE_FILTERS.find(a => a.value === gender)?.color} onRemove={() => setGender('')} />
            )}
            {level && <ActivePill label={level} onRemove={() => setLevel('')} />}
            {category && <ActivePill label={categoryLabel(category)} onRemove={() => setCategory('')} />}
            {searchInput && <ActivePill label={`"${searchInput}"`} onRemove={() => { setSearchInput(''); setSearch(''); }} />}
            <button onClick={clearFilters}
              className="ml-1 text-[12.5px] underline" style={{ color: STATUS.danger }}>
              {t('clearFilters')}
            </button>
          </div>
        )}
      </div>

      {/* ─── Translation card ─── */}
      {isPhrase && (
        <div className="rounded-2xl p-4"
          style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', borderLeft: '3px solid var(--accent)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-body font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>
              <span>{tlFrom === 'vi' ? t('langVi') : t('langDe')}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: 'var(--accent)' }}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              <span>{tlTo === 'de' ? t('langDe') : t('langVi')}</span>
            </div>
            <button onClick={swapLang}
              className="px-2.5 py-1 rounded-lg text-caption font-bold transition-all hover:scale-105"
              style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}
              title={t('swapLangTooltip')}>
              {t('swapLang')}
            </button>
          </div>
          <p className="text-body mb-2 italic" style={{ color: 'var(--theme-text-muted)' }}>
            &ldquo;{searchInput.trim()}&rdquo;
          </p>
          {isTranslating ? (
            <div className="flex items-center gap-2 py-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              <span className="text-body" style={{ color: 'var(--theme-text-muted)' }}>{t('translating')}</span>
            </div>
          ) : translated ? (
            <div className="flex items-start justify-between gap-3 py-1">
              <p className="text-[15px] font-semibold flex-1 leading-snug" style={{ color: 'var(--theme-text-primary)' }}>{translated}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <CopyBtn text={translated} />
                <SpeakBtn text={translated} lang={tlTo === 'de' ? 'de-DE' : 'vi-VN'} />
              </div>
            </div>
          ) : (
            <div className="py-1 text-xs" style={{ color: STATUS.danger }}>{t('translateError')}</div>
          )}
          <p className="text-caption mt-3" style={{ color: 'var(--theme-text-muted)' }}>{t('poweredBy', { from: tlFrom, to: tlTo })}</p>
        </div>
      )}

      {/* ─── Results count ─── */}
      {allWords.length > 0 && (
        <div className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>
          {t('showingCount', { shown: allWords.length, total: totalCount })}
        </div>
      )}

      {/* ─── Loading skeleton (initial) ─── */}
      {isLoading && <GridSkeleton cols={3} count={6} rounded="rounded-2xl" gap="gap-3.5" />}

      {/* ─── Error ─── */}
      {error && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: `color-mix(in srgb, ${STATUS.danger} 14%, transparent)` }}>
            <IconBook size={26} style={{ color: STATUS.danger }} />
          </div>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>{t('loadError')}</p>
          <p className="text-body mt-1" style={{ color: 'var(--theme-text-muted)' }}>{t('loadErrorRetry')}</p>
        </div>
      )}

      {/* ─── Word grid / list ─── */}
      {allWords.length > 0 && (
        <>
          {view === 'grid' ? (
            <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {displayWords.map(word => (
                <WordCard key={word.id} word={word} isFavorite={favoriteIds.has(word.id)} onFavoriteToggle={handleFavoriteToggle} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {displayWords.map(word => (
                <WordCard key={word.id} word={word} compact isFavorite={favoriteIds.has(word.id)} onFavoriteToggle={handleFavoriteToggle} />
              ))}
            </div>
          )}

          <div ref={sentinelRef} className="h-10" />

          {isFetchingNextPage && (
            <div className="flex justify-center py-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--theme-border)', borderTopColor: 'var(--accent)' }} />
                <span className="text-body font-medium" style={{ color: 'var(--theme-text-muted)' }}>{t('loadingMore')}</span>
              </div>
            </div>
          )}

          {!hasNextPage && allWords.length > 21 && (
            <div className="text-center py-6">
              <span className="text-body" style={{ color: 'var(--theme-text-muted)' }}>{t('showingAll', { total: totalCount })}</span>
            </div>
          )}
        </>
      )}

      {/* ─── No results ─── */}
      {!isLoading && allWords.length === 0 && !error && (
        <div className="text-center py-16 rounded-[14px]" style={{ background: 'var(--theme-bg-card)', border: '1px dashed var(--theme-border)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
            <IconSearch size={26} style={{ color: 'var(--theme-text-muted)' }} />
          </div>
          <p className="text-base font-semibold mb-1" style={{ color: 'var(--theme-text-secondary)' }}>{t('noResultsTitle')}</p>
          <p className="text-body mb-5" style={{ color: 'var(--theme-text-muted)' }}>{t('noResultsBody')}</p>
          <button onClick={clearFilters}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-body font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--accent)' }}>
            <IconX size={13} /> {t('clearFilters')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Active filter pill ───
function ActivePill({ label, color, onRemove }: { label: string; color?: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-0.5 rounded-md text-[11.5px] font-semibold"
      style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)', color: color ?? 'var(--theme-text-secondary)' }}>
      {label}
      <button onClick={onRemove} className="w-4 h-4 flex items-center justify-center rounded opacity-60 hover:opacity-100" style={{ color: 'currentColor' }}>
        <IconX size={10} />
      </button>
    </span>
  );
}
