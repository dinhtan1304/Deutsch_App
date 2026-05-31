'use client';

import { useState, useMemo } from 'react';
import { useAchievements } from '@/hooks/useAchievements';
import { Achievement } from '@/lib/api/achievements';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ACCENT } from '@/lib/tokens';
import { GridSkeleton } from '@/components/ui';
import {
  IconTrophy, IconLock, IconChevronLeft, IconCheck,
  IconBook, IconGamepad, IconGraduationCap, IconPenLine, IconStar,
} from '@/components/ui/Icons';

const CATEGORY_KEYS = ['vocabulary', 'games', 'exams', 'writing', 'level'] as const;
type CategoryKey = typeof CATEGORY_KEYS[number];

// Category color via CSS-var-ish tokens (kept as ACCENT tokens, used in color-mix).
const CATEGORY_COLOR: Record<string, string> = {
  vocabulary: ACCENT.reading,
  games: ACCENT.xp,
  exams: ACCENT.srs,
  writing: ACCENT.vocab,
  level: ACCENT.listening,
};
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  vocabulary: <IconBook size={13} />,
  games: <IconGamepad size={13} />,
  exams: <IconGraduationCap size={13} />,
  writing: <IconPenLine size={13} />,
  level: <IconStar size={13} />,
};

type FilterKey = 'all' | 'unlocked' | 'locked';

export default function AchievementsPage() {
  const t = useTranslations('progress.achievements');
  const tCat = useTranslations('progress.achievements.categories');
  const [filter, setFilter] = useState<FilterKey | CategoryKey>('all');
  const categoryLabel = (cat: string) => (CATEGORY_KEYS as readonly string[]).includes(cat) ? tCat(cat as CategoryKey) : cat;
  const { data: achievements, isLoading } = useAchievements();

  const all = useMemo(() => achievements ?? [], [achievements]);
  const unlockedCount = all.filter((a) => a.unlocked).length;
  const pct = all.length ? Math.round((unlockedCount / all.length) * 100) : 0;

  const filtered = useMemo(() => {
    if (filter === 'all') return all;
    if (filter === 'unlocked') return all.filter((a) => a.unlocked);
    if (filter === 'locked') return all.filter((a) => !a.unlocked);
    return all.filter((a) => a.category === filter);
  }, [all, filter]);

  const grouped = filtered.reduce<Record<string, Achievement[]>>((acc, a) => {
    (acc[a.category] ??= []).push(a);
    return acc;
  }, {});
  const isFlat = filter !== 'all' && !['unlocked', 'locked'].includes(filter);

  const FChip = ({ label, active, onClick, dot, icon }: { label: string; active: boolean; onClick: () => void; dot?: string; icon?: React.ReactNode }) => (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-caption font-semibold transition-colors"
      style={active
        ? { background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)', border: '1px solid var(--accent)' }
        : { background: 'var(--theme-bg-card)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />}
      {icon}
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <Link href="/" className="mb-3 inline-flex items-center gap-1 text-caption font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>
        <IconChevronLeft size={15} /> {t('back')}
      </Link>

      {/* Header + summary */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="v2-icongrad-warn flex h-13 w-13 shrink-0 items-center justify-center rounded-[14px] text-white" style={{ boxShadow: '0 8px 20px color-mix(in srgb, var(--warn) 40%, transparent)' }}>
            <IconTrophy size={26} />
          </div>
          <div>
            <h1 className="text-h1 font-extrabold leading-tight" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{t('pageTitle')}</h1>
            <p className="mt-0.5 text-body" style={{ color: 'var(--theme-text-muted)' }}>{t('pageSubtitle')}</p>
          </div>
        </div>
        {all.length > 0 && (
          <div className="flex shrink-0 gap-2">
            <div className="flex min-w-22 flex-col gap-0.5 rounded-[10px] px-3.5 py-2" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
              <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--success)' }} /><span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.05em' }}>{t('statUnlocked')}</span></div>
              <span className="mono text-[18px] font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>{unlockedCount}/{all.length}</span>
            </div>
            <div className="flex min-w-22 flex-col gap-0.5 rounded-[10px] px-3.5 py-2" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
              <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--warn)' }} /><span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.05em' }}>{t('statComplete')}</span></div>
              <span className="mono text-[18px] font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>{pct}%</span>
            </div>
          </div>
        )}
      </header>

      {/* Overall segmented progress */}
      {all.length > 0 && (
        <div className="mb-5 rounded-[13px] p-4" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-caption font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>{t('collectionProgress')}</span>
            <span className="mono text-caption" style={{ color: 'var(--theme-text-muted)' }}>{unlockedCount} / {all.length}</span>
          </div>
          <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
            {all.map((a) => (
              <span key={a.key} className="h-full flex-1 rounded-[1px]" style={{ background: a.unlocked ? (CATEGORY_COLOR[a.category] ?? 'var(--accent)') : 'var(--theme-bg-tertiary)' }} />
            ))}
          </div>
        </div>
      )}

      {/* Filter chips */}
      {all.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <FChip label={t('filterAll')} active={filter === 'all'} onClick={() => setFilter('all')} />
          <FChip label={t('filterUnlocked')} active={filter === 'unlocked'} onClick={() => setFilter('unlocked')} dot="var(--success)" />
          <FChip label={t('filterLocked')} active={filter === 'locked'} onClick={() => setFilter('locked')} dot="var(--theme-text-muted)" />
          <span className="mx-1 h-5 w-px self-center" style={{ background: 'var(--theme-border)' }} />
          {CATEGORY_KEYS.filter((c) => all.some((a) => a.category === c)).map((c) => (
            <FChip key={c} label={categoryLabel(c)} active={filter === c} onClick={() => setFilter(c)} icon={CATEGORY_ICONS[c]} />
          ))}
        </div>
      )}

      {isLoading ? (
        <GridSkeleton cols={4} count={8} height="h-44" rounded="rounded-[14px]" bordered gap="gap-3" />
      ) : isFlat ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((a) => <BadgeWithLabel key={a.key} a={a} earnedLabel={t('unlocked')} lockedLabel={t('locked')} />)}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => {
            const catUnlocked = items.filter((a) => a.unlocked).length;
            return (
              <section key={category}>
                <div className="mb-3 flex items-center gap-2">
                  <span style={{ color: CATEGORY_COLOR[category] }}>{CATEGORY_ICONS[category]}</span>
                  <h2 className="text-[12px] font-semibold uppercase" style={{ color: 'var(--theme-text-secondary)', letterSpacing: '.06em' }}>{categoryLabel(category)}</h2>
                  <span className="mono text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{catUnlocked}/{items.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {items.map((a) => <BadgeWithLabel key={a.key} a={a} earnedLabel={t('unlocked')} lockedLabel={t('locked')} />)}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Badge variant carrying its earned/locked labels (avoids the placeholder span).
function BadgeWithLabel({ a, earnedLabel, lockedLabel }: { a: Achievement; earnedLabel: string; lockedLabel: string }) {
  const color = CATEGORY_COLOR[a.category] ?? 'var(--theme-text-muted)';
  return (
    <article
      className={`word-card-v2 relative flex flex-col items-center gap-2.5 overflow-hidden rounded-[14px] p-4 text-center ${a.unlocked ? 'v2-badge-unlocked' : ''}`}
      style={{
        background: a.unlocked ? undefined : 'var(--theme-bg-card)',
        border: '1px solid var(--theme-border)',
        opacity: a.unlocked ? 1 : 0.85,
        ['--medal' as string]: color,
        ['--card-accent' as string]: a.unlocked ? color : 'var(--theme-border)',
      } as React.CSSProperties}
    >
      <div className={`mt-1.5 flex h-16 w-16 items-center justify-center rounded-full ${a.unlocked ? 'v2-medal text-white' : ''}`}
        style={a.unlocked
          ? { boxShadow: `0 6px 18px color-mix(in srgb, ${color} 45%, transparent)` }
          : { background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}>
        {a.unlocked ? <IconTrophy size={28} /> : <IconLock size={24} />}
      </div>
      <div>
        <h3 className="text-body font-bold" style={{ color: a.unlocked ? 'var(--theme-text-primary)' : 'var(--theme-text-secondary)' }}>{a.nameVi}</h3>
        <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{a.descriptionVi}</p>
      </div>
      <div className="mt-auto pt-1.5">
        {a.unlocked ? (
          <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10.5px] font-bold uppercase" style={{ background: 'color-mix(in srgb, var(--success) 14%, transparent)', color: 'var(--success)', letterSpacing: '.04em' }}>
            <IconCheck size={11} /> {earnedLabel}
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)', opacity: 0.6 }}>{lockedLabel}</span>
        )}
      </div>
    </article>
  );
}
