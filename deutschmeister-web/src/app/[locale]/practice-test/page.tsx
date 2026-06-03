'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  IconPenLine, IconHeadphones, IconBookOpen, IconMic, IconZap, IconArrowRight, IconSparkles,
} from '@/components/ui/Icons';
import { ACCENT } from '@/lib/tokens';
import { SurfaceCard } from '@/components/ui';
import { MiniStats, type MiniStat } from '@/components/ui/MiniStats';
import { useAuthStore } from '@/stores/authStore';
import { useSkills } from '@/hooks/useUser';
import { useExamReadingStats } from '@/hooks/useExamReading';
import { useExamListeningStats } from '@/hooks/useExamListening';
import { useExamWritingStats } from '@/hooks/useExamWriting';
import { useExamSpeakingStats } from '@/hooks/useExamSpeaking';
import { ChooseExam } from './_sections/ChooseExam';

// One practice mode = one card. group drives the category tab + section it lands in;
// ns is the i18n sub-namespace under practice.landing holding {title, titleDe, description}.
type Group = 'skill' | 'exam' | 'ai';
type Mode = {
  key: string;
  group: Group;
  ns: 'skills' | 'exam' | 'ai';
  href: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
};

const MODES: Mode[] = [
  { key: 'reading',   group: 'skill', ns: 'skills', href: '/practice-test/reading',   icon: IconBookOpen,   color: ACCENT.reading },
  { key: 'listening', group: 'skill', ns: 'skills', href: '/practice-test/listening', icon: IconHeadphones, color: ACCENT.listening },
  { key: 'writing',   group: 'skill', ns: 'skills', href: '/practice-test/writing',   icon: IconPenLine,    color: ACCENT.writing },
  { key: 'speaking',  group: 'skill', ns: 'skills', href: '/practice-test/speaking',  icon: IconMic,        color: ACCENT.speaking },

  { key: 'reading',   group: 'exam', ns: 'exam', href: '/practice-test/reading/exam',   icon: IconBookOpen,   color: ACCENT.reading },
  { key: 'listening', group: 'exam', ns: 'exam', href: '/practice-test/listening/exam', icon: IconHeadphones, color: ACCENT.listening },
  { key: 'writing',   group: 'exam', ns: 'exam', href: '/practice-test/writing/exam',   icon: IconPenLine,    color: ACCENT.examWriting },
  { key: 'speaking',  group: 'exam', ns: 'exam', href: '/practice-test/speaking/exam',  icon: IconMic,        color: ACCENT.speaking },

  { key: 'roleplay',      group: 'ai', ns: 'ai', href: '/practice-test/roleplay',      icon: IconZap,        color: ACCENT.examWriting },
  { key: 'pronunciation', group: 'ai', ns: 'ai', href: '/practice-test/pronunciation', icon: IconMic,        color: ACCENT.listening },
  { key: 'dictation',     group: 'ai', ns: 'ai', href: '/practice-test/dictation',     icon: IconHeadphones, color: ACCENT.dictation },
];

const GROUPS: { id: Group; color: string; subKey: 'skills.subtitle' | 'exam.subtitleUnlocked' | 'ai.subtitle'; premium?: boolean }[] = [
  { id: 'skill', color: 'var(--accent)', subKey: 'skills.subtitle' },
  { id: 'exam',  color: 'var(--warn)',   subKey: 'exam.subtitleUnlocked', premium: true },
  { id: 'ai',    color: 'var(--violet)', subKey: 'ai.subtitle' },
];

// Gold "PREMIUM" pill — marks the Goethe/TELC exam track as a premium feature.
function PremiumBadge() {
  const t = useTranslations('practice.landing');
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
      style={{ background: 'color-mix(in srgb, var(--warn) 18%, transparent)', color: 'var(--warn)', border: '1px solid color-mix(in srgb, var(--warn) 38%, transparent)', letterSpacing: '.06em' }}>
      <IconSparkles size={11} /> {t('exam.premiumBadge')}
    </span>
  );
}

// Color a 0-100 score red/amber/green (like the game hub): ≥80 green, ≥60 amber, else red.
const scoreColor = (s: number) => (s >= 80 ? 'var(--success)' : s >= 60 ? 'var(--warn)' : 'var(--danger)');

// ─── Practice mode card (mirrors the game-hub GameCard) ───────────────────────
function PracticeModeCard({ mode, premium, score }: { mode: Mode; premium?: boolean; score?: number | null }) {
  const t = useTranslations('practice.landing');
  const tc = useTranslations('practice.landing.cta');
  const tHub = useTranslations('practice.landing.hub');
  const Icon = mode.icon;
  const base = `${mode.ns}.${mode.key}`;
  return (
    <Link href={mode.href} className="block h-full outline-none">
      <article className="word-card-v2 flex h-full flex-col gap-3 rounded-[13px] p-4"
        style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', ['--card-accent' as string]: mode.color, ['--gc' as string]: mode.color } as React.CSSProperties}>
        <header className="flex items-center gap-3">
          <div className="flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: `color-mix(in srgb, ${mode.color} 18%, transparent)`, color: mode.color }}>
            <Icon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-body font-bold" style={{ letterSpacing: '-.01em', color: 'var(--theme-text-primary)' }}>
              {t(`${base}.title` as 'skills.reading.title')}
            </h3>
            <div className="mono truncate text-[11px] italic" style={{ color: 'var(--theme-text-muted)' }}>
              {t(`${base}.titleDe` as 'skills.reading.titleDe')}
            </div>
          </div>
          {premium && <IconSparkles size={15} className="shrink-0" style={{ color: 'var(--warn)' }} />}
        </header>
        <p className="text-caption leading-relaxed flex-1" style={{ color: 'var(--theme-text-muted)' }}>
          {t(`${base}.description` as 'skills.reading.description')}
        </p>
        <footer className="mt-auto flex items-center justify-between gap-2 border-t border-dashed pt-3" style={{ borderColor: 'var(--theme-border)' }}>
          {score != null ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: scoreColor(score) }} />
              <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.04em' }}>{tHub('scoreLabel')}</span>
              <span className="mono text-body font-bold" style={{ color: scoreColor(score) }}>{Math.round(score)}</span>
              <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>/100</span>
            </span>
          ) : <span />}
          <span className="v2-game-cta inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[7px] px-3 text-caption font-semibold"
            style={{ ['--gc' as string]: mode.color } as React.CSSProperties}>
            {tc('start')} <IconArrowRight size={13} />
          </span>
        </footer>
      </article>
    </Link>
  );
}

// ─── Segmented category tab (mirrors the game-hub CatTab) ─────────────────────
function CatTab({ label, count, color, active, onClick }: { label: string; count: number; color?: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-[7px] px-3.5 py-1.5 text-body transition-colors"
      style={active
        ? { background: 'var(--theme-bg-tertiary)', color: 'var(--theme-text-primary)', fontWeight: 600 }
        : { background: 'transparent', color: 'var(--theme-text-secondary)', fontWeight: 500 }}>
      {color && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
      {label}
      <span className="mono text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{count}</span>
    </button>
  );
}

// Recommend hero — surfaces the user's weakest skills (from profile skill scores)
// so they jump straight into the practice that needs the most work.
function SkillRecommend() {
  const t = useTranslations('practice.landing');
  const tHub = useTranslations('practice.landing.hub');
  const tc = useTranslations('practice.landing.cta');
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const { data: skills } = useSkills(isAuth);

  if (!isAuth || !skills) return null;
  const scoreOf = (k: string): number | null =>
    (skills as unknown as Record<string, { score: number | null }>)[k]?.score ?? null;

  const skillModes = MODES.filter((m) => m.group === 'skill');
  // Only meaningful once at least one skill has a measured score.
  if (!skillModes.some((m) => scoreOf(m.key) !== null)) return null;

  const ranked = [...skillModes].sort((a, b) => {
    const sa = scoreOf(a.key), sb = scoreOf(b.key);
    if (sa === null && sb === null) return 0;
    if (sa === null) return 1; // unmeasured skills rank after measured-weak ones
    if (sb === null) return -1;
    return sa - sb; // lowest score = weakest = first
  });
  const [primary, ...rest] = ranked;
  if (!primary) return null;
  const secondary = rest.slice(0, 2);

  const nameVi = (m: Mode) => t(`skills.${m.key}.title` as 'skills.reading.title');
  const nameDe = (m: Mode) => t(`skills.${m.key}.titleDe` as 'skills.reading.titleDe');
  const reason = (m: Mode) => {
    const s = scoreOf(m.key);
    return s === null ? tHub('rec.noData') : tHub('rec.scoreReason', { score: Math.round(s) });
  };
  // Red/amber/green by score (muted when no data), matching the practice cards.
  const reasonColor = (m: Mode) => {
    const s = scoreOf(m.key);
    return s === null ? 'var(--theme-text-muted)' : scoreColor(s);
  };

  const PIcon = primary.icon;
  return (
    <section className="v2-recommend-hero relative mb-6 grid gap-3.5 overflow-hidden rounded-2xl p-5 lg:grid-cols-[1.5fr_1fr_1fr]"
      style={{ border: `1px solid color-mix(in srgb, ${primary.color} 30%, transparent)` }}>
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full opacity-60 blur-3xl"
        style={{ background: `color-mix(in srgb, ${primary.color} 15%, transparent)` }} />

      {/* Primary — weakest skill */}
      <Link href={primary.href} className="relative z-10 block outline-none">
        <div className="flex h-full flex-col gap-3 rounded-xl p-4.5"
          style={{ background: 'var(--theme-bg-card)', border: `1px solid color-mix(in srgb, ${primary.color} 40%, transparent)` }}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: primary.color }}>★ {tHub('rec.primaryLabel')}</span>
            <span className="text-[11px] font-semibold" style={{ color: reasonColor(primary) }}>{reason(primary)}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ background: primary.color, boxShadow: `0 6px 16px color-mix(in srgb, ${primary.color} 40%, transparent)` }}>
              <PIcon size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-h3 font-extrabold" style={{ letterSpacing: '-.01em', color: 'var(--theme-text-primary)' }}>{nameVi(primary)}</h3>
              <p className="mono text-caption italic" style={{ color: 'var(--theme-text-muted)' }}>{nameDe(primary)}</p>
            </div>
          </div>
          <p className="text-body leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
            {t(`skills.${primary.key}.description` as 'skills.reading.description')}
          </p>
          <span className="mt-auto inline-flex h-10 items-center justify-center gap-1.5 rounded-[7px] text-body font-bold text-white"
            style={{ background: primary.color, boxShadow: `0 4px 12px color-mix(in srgb, ${primary.color} 40%, transparent)` }}>
            {tc('start')} <IconArrowRight size={14} />
          </span>
        </div>
      </Link>

      {/* Secondary — next weakest */}
      {secondary.map((m) => {
        const SIcon = m.icon;
        return (
          <Link key={`${m.group}-${m.key}`} href={m.href} className="relative z-10 block outline-none">
            <div className="word-card-v2 flex h-full flex-col gap-2.5 rounded-xl p-4"
              style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', ['--card-accent' as string]: m.color } as React.CSSProperties}>
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: m.color }}>{tHub('rec.secondaryLabel')}</span>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]" style={{ background: `color-mix(in srgb, ${m.color} 18%, transparent)`, color: m.color }}>
                  <SIcon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{nameVi(m)}</div>
                  <div className="mono text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{nameDe(m)}</div>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between text-[11px]">
                <span className="font-semibold" style={{ color: reasonColor(m) }}>{reason(m)}</span>
                <span className="font-semibold" style={{ color: m.color }}>{tc('start')} →</span>
              </div>
            </div>
          </Link>
        );
      })}
    </section>
  );
}

export default function PracticeTestPage() {
  const t = useTranslations('practice.landing');
  const tHub = useTranslations('practice.landing.hub');
  const [cat, setCat] = useState<'all' | Group>('all');
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const { data: skills } = useSkills(isAuth);

  // Best exam score per skill (only fetched when the exam cards are on screen).
  const examEnabled = isAuth && (cat === 'all' || cat === 'exam');
  const examReading = useExamReadingStats(examEnabled);
  const examListening = useExamListeningStats(examEnabled);
  const examWriting = useExamWritingStats(examEnabled);
  const examSpeaking = useExamSpeakingStats(examEnabled);
  const examBest: Record<string, number | null> = {
    reading: examReading.data?.graded ? examReading.data.bestScore : null,
    listening: examListening.data?.graded ? examListening.data.bestScore : null,
    writing: examWriting.data?.graded ? examWriting.data.bestScore : null,
    speaking: examSpeaking.data?.graded ? examSpeaking.data.bestScore : null,
  };

  // Score shown on a card (0-100): skill modes → profile proficiency; exam modes → best exam result.
  const scoreFor = (m: Mode): number | null => {
    if (m.group === 'skill') {
      return skills ? (skills as unknown as Record<string, { score: number | null }>)[m.key]?.score ?? null : null;
    }
    if (m.group === 'exam') return examBest[m.key] ?? null;
    return null;
  };

  const countOf = (g: Group) => MODES.filter((m) => m.group === g).length;
  const statItems: MiniStat[] = [
    { label: tHub('categories.skill'), value: countOf('skill'), color: 'var(--accent)' },
    { label: tHub('categories.exam'),  value: countOf('exam'),  color: 'var(--warn)' },
    { label: tHub('categories.ai'),    value: countOf('ai'),    color: 'var(--violet)' },
  ];

  const visibleGroups = GROUPS.filter((g) => cat === 'all' || cat === g.id);

  return (
    <div className="mx-auto max-w-360 px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mono mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-text-muted)' }}>{tHub('eyebrow')}</p>
          <h1 className="text-h1 font-extrabold" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{t('title')}</h1>
          <p className="mt-1.5 text-body" style={{ color: 'var(--theme-text-muted)' }}>
            <span className="mono" style={{ color: 'var(--theme-text-primary)' }}>{MODES.length}</span> {tHub('modesUnit')} · {t('subtitle')}
          </p>
        </div>
        <MiniStats stats={statItems} className="shrink-0" />
      </header>

      {/* Recommend hero — weakest skills from the user's profile */}
      <SkillRecommend />

      {/* Category tabs — segmented pill */}
      <div className="mb-4 inline-flex flex-wrap gap-1.5 rounded-[11px] p-1" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        <CatTab label={tHub('categories.all')} count={MODES.length} active={cat === 'all'} onClick={() => setCat('all')} />
        {GROUPS.map((g) => (
          <CatTab key={g.id} label={tHub(`categories.${g.id}` as 'categories.skill')} count={countOf(g.id)} color={g.color} active={cat === g.id} onClick={() => setCat(g.id)} />
        ))}
      </div>

      {/* Grouped grid */}
      <div className="space-y-6">
        {visibleGroups.map((g) => {
          const list = MODES.filter((m) => m.group === g.id);
          return (
            <section key={g.id}>
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: g.color }} />
                  <h2 className="text-[12px] font-semibold uppercase" style={{ color: 'var(--theme-text-secondary)', letterSpacing: '.06em' }}>{tHub(`categories.${g.id}` as 'categories.skill')}</h2>
                  <span className="mono text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{list.length}</span>
                  {g.premium && <PremiumBadge />}
                </div>
                <p className="mt-1 text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t(g.subKey)}</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {list.map((m) => <PracticeModeCard key={`${m.group}-${m.key}`} mode={m} premium={g.premium} score={scoreFor(m)} />)}
              </div>
            </section>
          );
        })}
      </div>

      {/* Exam detail — Goethe/TELC comparison + B1 guide (under Exam / All) */}
      {(cat === 'all' || cat === 'exam') && (
        <section className="mt-8">
          <ChooseExam />
          <Link href="/practice-test/huong-dan-b1" className="block">
            <SurfaceCard variant="interactive" accent="examWriting">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[11px]"
                    style={{ background: 'color-mix(in srgb, var(--violet) 16%, transparent)', color: 'var(--violet)' }}>
                    <IconBookOpen size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-h3 font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('guideB1Card.title')}</h3>
                    <p className="mt-1 text-body leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{t('guideB1Card.description')}</p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[11px] px-5 py-3 text-body font-bold"
                  style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>
                  {t('guideB1Card.cta')} <IconArrowRight size={16} />
                </span>
              </div>
            </SurfaceCard>
          </Link>
        </section>
      )}
    </div>
  );
}
