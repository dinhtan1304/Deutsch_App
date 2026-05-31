'use client';

import { useMemo, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ACCENT, STATUS } from '@/lib/tokens';
import { IPA_CHART, IPA_CATEGORY_LABELS, IPA_VIDEOS } from '@/lib/data/ipaChart';
import type { IpaCategory, IpaSymbol } from '@/lib/data/ipaChart';
import { IpaSymbolCard } from '@/components/ipa/IpaSymbolCard';
import { IpaDetailPanel } from '@/components/ipa/IpaDetailPanel';
import { FilterChip } from '@/components/ui/FilterChip';

type Filter = 'all' | IpaCategory;
type DiffFilter = 'all' | 'low' | 'medium' | 'high';

const FILTER_CATEGORIES: IpaCategory[] = ['vowel-short', 'vowel-long', 'diphthong', 'consonant', 'affricate'];
const DIFF_DOT: Record<Exclude<DiffFilter, 'all'>, string> = { high: STATUS.danger, medium: STATUS.warning, low: STATUS.success };
// Per-category dot color (matches IpaSymbolCard group colors).
const CAT_DOT: Record<IpaCategory, string> = {
  'vowel-short': 'var(--v2-cyan)',
  'vowel-long': 'var(--v2-violet)',
  'diphthong': 'var(--die)',
  'consonant': 'var(--v2-warn)',
  'affricate': 'var(--streak)',
};

export default function IpaChartPage() {
  const t = useTranslations('learn.ipa');
  const tIpa = useTranslations('practice.pronunciation.ipa');
  const [filter, setFilter] = useState<Filter>('all');
  const [diff, setDiff] = useState<DiffFilter>('all');

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: t('filterAll') },
    ...FILTER_CATEGORIES.map((c) => ({ key: c, label: IPA_CATEGORY_LABELS[c] })),
  ];
  const diffFilters: { key: DiffFilter; label: string }[] = [
    { key: 'all', label: t('filterAll') },
    { key: 'high', label: tIpa('diffShortHigh') },
    { key: 'medium', label: tIpa('diffShortMed') },
    { key: 'low', label: tIpa('diffShortLow') },
  ];
  const [selected, setSelected] = useState<IpaSymbol | null>(null);

  const countByDiff = (d: Exclude<DiffFilter, 'all'>) => IPA_CHART.filter(s => s.difficultyForVi === d).length;

  const groups = useMemo(() => {
    const visible = IPA_CHART.filter(s =>
      (filter === 'all' || s.category === filter) && (diff === 'all' || s.difficultyForVi === diff)
    );
    const map = new Map<IpaCategory, IpaSymbol[]>();
    for (const s of visible) {
      const arr = map.get(s.category) ?? [];
      arr.push(s);
      map.set(s.category, arr);
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }, [filter, diff]);

  // Detail opens in a modal — close on Escape, lock body scroll while open.
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [selected]);


  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-bg-body)' }}>
      <div className="max-w-360 mx-auto py-2">
        {/* Header */}
        <header className="flex items-end justify-between gap-5 flex-wrap mb-5">
          <div>
            <div className="text-caption font-medium uppercase mb-1.5" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.08em' }}>
              {t('eyebrow')}
            </div>
            <h1 className="font-bold" style={{ fontSize: 30, letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>
              {t('title')}
            </h1>
            <p className="mt-1.5 text-body" style={{ color: 'var(--theme-text-secondary)' }}>
              <span className="mono" style={{ color: 'var(--theme-text-primary)' }}>{IPA_CHART.length}</span> {t('subtitleUnit')}
              {' · '}
              <span className="mono" style={{ color: STATUS.danger }}>{countByDiff('high')}</span> {t('hardForVi')}
            </p>
          </div>
          <div className="flex gap-2">
            {([['high', STATUS.danger], ['medium', STATUS.warning], ['low', STATUS.success]] as const).map(([d, c]) => (
              <div key={d} className="flex flex-col gap-0.5 rounded-[10px] px-3.5 py-2.5" style={{ minWidth: 92, background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                  <span className="text-caption uppercase font-medium" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.04em' }}>{tIpa(d === 'high' ? 'diffShortHigh' : d === 'medium' ? 'diffShortMed' : 'diffShortLow')}</span>
                </div>
                <span className="mono font-bold" style={{ fontSize: 20, color: 'var(--theme-text-primary)' }}>{countByDiff(d)}</span>
              </div>
            ))}
          </div>
        </header>

        {/* Video tutorials */}
        <section className="mb-6">
          <h2
            className="text-sm font-bold mb-3 flex items-center gap-2"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: ACCENT.examWriting }} aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
            {t('videosTitle')}
            <span
              className="text-caption font-normal px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--theme-bg-secondary)',
                color: 'var(--theme-text-muted)',
              }}
            >
              {IPA_VIDEOS.length}
            </span>
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {IPA_VIDEOS.map(v => (
              <div
                key={v.id}
                className="rounded-xl border overflow-hidden"
                style={{
                  borderColor: 'var(--theme-border)',
                  backgroundColor: 'var(--theme-bg-card)',
                }}
              >
                <div className="relative w-full aspect-video bg-black">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${v.id}`}
                    title={v.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                  />
                </div>
                <div className="px-3 py-2 text-xs font-medium truncate" style={{ color: 'var(--theme-text-primary)' }}>
                  {v.title}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Filter bar (type + difficulty) */}
        <div className="rounded-[14px] border p-3 mb-5 flex flex-wrap items-center gap-x-3 gap-y-2.5"
          style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
          <div className="flex items-center gap-1.5 flex-wrap">
            {filters.map(f => (
              <FilterChip key={f.key} active={filter === f.key} size="sm" onClick={() => setFilter(f.key)}>
                {f.key !== 'all' && <span className="w-1.5 h-1.5 rounded-full" style={{ background: CAT_DOT[f.key as IpaCategory] }} />}
                {f.label}
              </FilterChip>
            ))}
          </div>
          <span className="w-px h-5 hidden sm:block" style={{ background: 'var(--theme-border)' }} />
          <div className="flex items-center gap-1.5">
            {diffFilters.map(f => (
              <FilterChip key={f.key} active={diff === f.key} size="sm" onClick={() => setDiff(f.key)}>
                {f.key !== 'all' && <span className="w-1.5 h-1.5 rounded-full" style={{ background: DIFF_DOT[f.key as Exclude<DiffFilter, 'all'>] }} />}
                {f.label}
              </FilterChip>
            ))}
          </div>
        </div>

        {/* Grid grouped by category */}
        <div className="space-y-6">
          {groups.map(g => (
            <section key={g.category}>
              <h3
                className="text-sm font-bold mb-3 flex items-center gap-2"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                {IPA_CATEGORY_LABELS[g.category]}
                <span
                  className="text-caption font-normal px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'var(--theme-bg-secondary)',
                    color: 'var(--theme-text-muted)',
                  }}
                >
                  {g.items.length}
                </span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {g.items.map(s => (
                  <IpaSymbolCard
                    key={s.ipa + s.category}
                    symbol={s}
                    active={selected?.ipa === s.ipa && selected?.category === s.category}
                    onSelect={setSelected}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer note */}
        <div
          className="mt-10 rounded-xl border p-4 text-xs leading-relaxed"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: 'var(--theme-bg-card)',
            color: 'var(--theme-text-muted)',
          }}
        >
          <strong style={{ color: ACCENT.examWriting }}>{t('noteLabel')}</strong> {t('noteBody')}
        </div>
      </div>

      {/* Detail modal — opens on phoneme click */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto animate-[bounceIn_.18s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <IpaDetailPanel symbol={selected} onClose={() => setSelected(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
