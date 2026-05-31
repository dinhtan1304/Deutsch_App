'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useGrammarLessons, useGrammarProgress } from '@/hooks/useGrammar';
import { GrammarProgress } from '@/types/grammar';
import GrammarLessonCard from '@/components/grammar/GrammarLessonCard';
import { GRADIENT, ACCENT, STATUS } from '@/lib/tokens';
import { FilterChip } from '@/components/ui/FilterChip';

const LEVELS = ['ALL', 'A1', 'A2', 'B1'] as const;

const LEVEL_COLORS = {
  A1: { color: ACCENT.reading, gradient: `linear-gradient(135deg, ${ACCENT.reading}, #16A34A)`, shadow: 'rgba(34,197,94,0.3)' },
  A2: { color: ACCENT.srs,     gradient: `linear-gradient(135deg, ${ACCENT.srs}, #2563EB)`,     shadow: 'rgba(59,130,246,0.3)' },
  B1: { color: ACCENT.xp,      gradient: `linear-gradient(135deg, ${ACCENT.xp}, #D97706)`,      shadow: 'rgba(245,158,11,0.3)' },
};

const LEVEL_DESC_KEYS = { A1: 'levelDescA1', A2: 'levelDescA2', B1: 'levelDescB1' } as const;

function IconBook({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function IconList({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
function IconArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
function IconCheck({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconFlame({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
function IconTarget({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export default function GrammarDashboardPage() {
  const t = useTranslations('vocabulary.grammar');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const { data: lessons = [], isLoading: lessonsLoading } = useGrammarLessons();
  const { data: progress = [] } = useGrammarProgress();

  const filteredLessons = useMemo(() => {
    return (filterLevel === 'ALL' ? lessons : lessons.filter(l => l.level === filterLevel))
      .sort((a, b) => a.lessonNumber - b.lessonNumber);
  }, [lessons, filterLevel]);

  const progressMap = useMemo(() => {
    const map: Record<string, GrammarProgress> = {};
    for (const p of progress) map[p.lessonId] = p;
    return map;
  }, [progress]);

  const lessonsByLevel = useMemo(() => {
    const map: Record<string, typeof lessons> = { A1: [], A2: [], B1: [] };
    for (const l of filteredLessons) {
      if (!map[l.level]) map[l.level] = [];
      map[l.level]!.push(l);
    }
    return map;
  }, [filteredLessons]);

  const lockInfo = useMemo(() => {
    const passedSet = new Set(
      progress.filter(p => p.status === 'completed' && (p.score ?? 0) >= 80).map(p => p.lessonId)
    );
    const lessonMap = new Map(lessons.map(l => [l.id, l]));
    const map: Record<string, { locked: boolean; reason: string }> = {};
    for (const lesson of lessons) {
      const prereqs = lesson.prerequisiteIds ?? [];
      if (prereqs.length === 0) { map[lesson.id] = { locked: false, reason: '' }; continue; }
      const unmet = prereqs.filter(id => !passedSet.has(id));
      if (unmet.length === 0) {
        map[lesson.id] = { locked: false, reason: '' };
      } else {
        const names = unmet.map(id => lessonMap.get(id)?.titleVi).filter(Boolean);
        map[lesson.id] = {
          locked: true,
          reason: names.length > 0 ? t('lockReason', { titles: names.join(', ') }) : t('lockReasonGeneric'),
        };
      }
    }
    return map;
  }, [lessons, progress, t]);

  const completedCount = progress.filter(p => p.status === 'completed').length;
  const totalCount = lessons.length;
  const overallPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const inProgressCount = progress.filter(p => p.status === 'in_progress').length;

  // CTA: find resume lesson or first available
  const resumeLesson = useMemo(() => {
    const inProg = progress.find(p => p.status === 'in_progress');
    if (inProg) return lessons.find(l => l.id === inProg.lessonId) ?? null;
    return null;
  }, [progress, lessons]);
  const firstUnlocked = useMemo(
    () => lessons.find(l => !lockInfo[l.id]?.locked && progressMap[l.id]?.status !== 'completed') ?? null,
    [lessons, lockInfo, progressMap]
  );
  const ctaLesson = resumeLesson ?? firstUnlocked;

  if (lessonsLoading) {
    return (
      <div className="max-w-300 mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-32 rounded-[2.5rem]" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
          <div className="grid grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-[2.5rem]" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
            ))}
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-[2.5rem]" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-300 mx-auto px-4 py-2 pb-24">

      {/* ─── Header ─── */}
      <header className="flex items-end justify-between gap-5 flex-wrap mb-6">
        <div>
          <div className="text-caption font-medium uppercase mb-1.5" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.08em' }}>
            {t('eyebrow')}
          </div>
          <h1 className="font-bold" style={{ fontSize: 30, letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>
            {t('pageTitle')}
          </h1>
          <p className="mt-1.5 text-body" style={{ color: 'var(--theme-text-secondary)' }}>
            {t('pageSubtitle', { done: completedCount, total: totalCount })}
            {' · '}
            <span className="mono" style={{ color: 'var(--accent)' }}>{overallPct}%</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/grammar/cheatsheet"
            className="inline-flex items-center gap-1.5 h-9.5 px-3.5 rounded-[10px] text-caption font-medium border transition-transform hover:-translate-y-0.5"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)', background: 'var(--theme-bg-card)' }}>
            <IconList size={13} /> {t('cheatsheet')}
          </Link>
          {ctaLesson && (
            <Link href={`/grammar/${ctaLesson.slug}`}
              className="inline-flex items-center gap-2 h-9.5 px-4 rounded-[10px] text-body font-bold transition-transform hover:-translate-y-0.5"
              style={{ background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent)' }}>
              {resumeLesson ? t('resumeStudying') : t('startNow')}
              <IconArrowRight size={15} />
            </Link>
          )}
        </div>
      </header>

      {/* ─── Stats (practice style) ─── */}
      {totalCount > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: t('statCompleted'), value: completedCount, color: STATUS.success,  icon: <IconCheck size={20} /> },
            { label: t('statInProgress'),   value: inProgressCount, color: ACCENT.srs,     icon: <IconFlame size={20} /> },
            { label: t('statOverallProgress'), value: `${overallPct}%`, color: ACCENT.vocab, icon: <IconTarget size={20} /> },
          ].map((s, i) => (
            <div key={i}
              className="relative overflow-hidden rounded-2xl px-5 py-4 border flex items-center gap-4 transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: 'var(--theme-bg-card)',
                borderColor: 'var(--theme-border)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
              }}>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 blur-2xl opacity-20" style={{ backgroundColor: s.color }} />
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${s.color}18`, color: s.color }}>
                {s.icon}
              </div>
              <div className="relative z-10 min-w-0">
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40"
                  style={{ color: 'var(--theme-text-primary)' }}>
                  {s.label}
                </div>
                <div className="text-2xl font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
                  {s.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Level filter ─── */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-8">
        {LEVELS.map(level => (
          <FilterChip key={level} active={filterLevel === level} onClick={() => setFilterLevel(level)}>
            {level === 'ALL' ? t('filterAll') : <span className="mono">{level}</span>}
          </FilterChip>
        ))}
      </div>

      {/* ─── Lesson cards grouped by level ─── */}
      <div className="space-y-12">
        {(['A1', 'A2', 'B1'] as const).map(lvl => {
          const levelLessons = lessonsByLevel[lvl] ?? [];
          if (levelLessons.length === 0) return null;

          const lc = LEVEL_COLORS[lvl];
          const lvlCompleted = levelLessons.filter(l => progressMap[l.id]?.status === 'completed').length;
          const lvlPct = levelLessons.length > 0 ? Math.round((lvlCompleted / levelLessons.length) * 100) : 0;

          return (
            <section key={lvl}>
              {/* Level header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg"
                  style={{ background: lc.gradient, boxShadow: `0 4px 12px ${lc.shadow}` }}>
                  {lvl}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h2 className="text-base font-black" style={{ color: 'var(--theme-text-primary)' }}>
                      {t('stageHeader', { level: lvl })}
                    </h2>
                    <span className="text-xs font-bold" style={{ color: 'var(--theme-text-muted)' }}>
                      {t('lessonsCount', { done: lvlCompleted, total: levelLessons.length })}
                    </span>
                  </div>
                  <p className="text-[11px] leading-snug mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                    {t(LEVEL_DESC_KEYS[lvl])}
                  </p>
                  <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${lvlPct}%`, background: lc.gradient }} />
                  </div>
                </div>
                <span className="text-sm font-black shrink-0" style={{ color: lc.color }}>{lvlPct}%</span>
              </div>

              {/* Lesson path */}
              <div>
                {levelLessons.map((lesson, idx) => (
                  <GrammarLessonCard
                    key={lesson.id}
                    lesson={lesson}
                    progress={progressMap[lesson.id]}
                    locked={lockInfo[lesson.id]?.locked}
                    lockedReason={lockInfo[lesson.id]?.reason}
                    isLast={idx === levelLessons.length - 1}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredLessons.length === 0 && (
        <div className="text-center py-28 rounded-[3.5rem] border-2 border-dashed" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="w-24 h-24 rounded-4xl mx-auto flex items-center justify-center mb-8 shadow-2xl text-white"
            style={{ background: GRADIENT.writing }}>
            <IconBook size={40} />
          </div>
          <h3 className="text-2xl font-black mb-3" style={{ color: 'var(--theme-text-primary)' }}>
            {t('emptyTitle')}
          </h3>
          <p className="text-base mb-10 max-w-xs mx-auto font-medium"
            style={{ color: 'var(--theme-text-muted)', opacity: 0.6 }}>
            {t('emptyBody')}
          </p>
        </div>
      )}
    </div>
  );
}
