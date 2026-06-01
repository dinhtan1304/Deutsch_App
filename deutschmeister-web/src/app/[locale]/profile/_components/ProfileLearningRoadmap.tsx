'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { pickField } from '@/i18n/pickLocale';
import { ACCENT, STATUS } from '@/lib/tokens';
import { useGrammarLessons, useGrammarProgress } from '@/hooks/useGrammar';
import type { GrammarProgress } from '@/types/grammar';
import {
  IconGraduationCap, IconBookOpen, IconCheck, IconLock, IconChevronRight,
} from '@/components/ui/Icons';

type LessonStatus = 'passed' | 'needs_review' | 'not_started';

function getLessonStatus(progress: GrammarProgress | undefined): LessonStatus {
  if (!progress) return 'not_started';
  if (progress.status === 'completed' && (progress.score ?? 0) >= 80) return 'passed';
  return 'needs_review';
}

const LEVELS = ['A1', 'A2', 'B1'] as const;
type Level = typeof LEVELS[number];

const LEVEL_COLORS = {
  // eslint-disable-next-line no-restricted-syntax
  A1: '#10B981',
  A2: ACCENT.srs,
  B1: ACCENT.vocab,
};

export function ProfileLearningRoadmap() {
  const t = useTranslations('progress.profile.roadmap');
  const locale = useLocale();
  const [selectedLevel, setSelectedLevel] = useState<Level>('A1');
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: allLessons = [], isLoading: loadingLessons } = useGrammarLessons();
  const { data: progressData = [] } = useGrammarProgress();

  const progressMap = useMemo(() => {
    const map = new Map<string, GrammarProgress>();
    progressData.forEach(p => map.set(p.lessonId, p));
    return map;
  }, [progressData]);

  const lockInfo = useMemo(() => {
    const passedSet = new Set(
      progressData.filter(p => p.status === 'completed' && (p.score ?? 0) >= 80).map(p => p.lessonId)
    );
    const lessonMap = new Map(allLessons.map(l => [l.id, l]));
    const map = new Map<string, { locked: boolean; reason: string }>();
    for (const lesson of allLessons) {
      const prereqs = lesson.prerequisiteIds ?? [];
      if (prereqs.length === 0) { map.set(lesson.id, { locked: false, reason: '' }); continue; }
      const unmet = prereqs.filter(id => !passedSet.has(id));
      if (unmet.length === 0) {
        map.set(lesson.id, { locked: false, reason: '' });
      } else {
        const names = unmet.map(id => {
          const l = lessonMap.get(id);
          return l ? pickField(l, 'title', locale) : '';
        }).filter(Boolean);
        map.set(lesson.id, {
          locked: true,
          reason: names.length > 0 ? t('lockReason', { names: names.join(', ') }) : t('lockReasonGeneric'),
        });
      }
    }
    return map;
  }, [allLessons, progressData, locale, t]);

  const levelStats = useMemo(() => {
    return LEVELS.map(level => {
      const lessons = allLessons.filter(l => l.level === level);
      const passed = lessons.filter(l => getLessonStatus(progressMap.get(l.id)) === 'passed').length;
      const needsReview = lessons.filter(l => getLessonStatus(progressMap.get(l.id)) === 'needs_review').length;
      const pct = lessons.length > 0 ? Math.round((passed / lessons.length) * 100) : 0;
      return { level, total: lessons.length, passed, needsReview, pct };
    });
  }, [allLessons, progressMap]);

  const selectedLessons = useMemo(() => {
    return allLessons
      .filter(l => l.level === selectedLevel)
      .map(lesson => ({
        ...lesson,
        progress: progressMap.get(lesson.id),
        status: getLessonStatus(progressMap.get(lesson.id)),
        locked: lockInfo.get(lesson.id)?.locked ?? false,
        lockReason: lockInfo.get(lesson.id)?.reason ?? '',
      }));
  }, [allLessons, selectedLevel, progressMap, lockInfo]);

  const selStats = levelStats.find(s => s.level === selectedLevel)!;
  const color = LEVEL_COLORS[selectedLevel];
  const notPassed = selectedLessons.filter(l => l.status !== 'passed');

  return (
    <div className="rounded-lg border overflow-hidden shadow-sm"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>

      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--theme-border)' }}>
        <div className="flex items-center gap-3">
          <div className="v2-match-grad w-10 h-10 rounded-[11px] flex items-center justify-center shadow-lg">
            <IconGraduationCap size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>{t('title')}</h2>
            <p className="text-[11px] opacity-50 font-medium" style={{ color: 'var(--theme-text-muted)' }}>{t('subtitle')}</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
          style={{ background: `${color}15`, color }}>
          <IconGraduationCap size={12} />
          {t('levelBadge', { level: selectedLevel })}
        </span>
      </div>

      {/* Level track */}
      <div className="px-6 py-8" style={{ borderBottom: '1px solid var(--theme-border)' }}>
        <div className="flex items-start justify-between gap-4 relative">
          <div className="absolute top-6 h-0.5 mx-12"
            style={{ left: 0, right: 0, backgroundColor: 'var(--theme-border)', opacity: 0.3, zIndex: 0 }} />

          {LEVELS.map(level => {
            const stat = levelStats.find(s => s.level === level)!;
            const isSel = level === selectedLevel;
            const lColor = LEVEL_COLORS[level];
            return (
              <button key={level} onClick={() => { setSelectedLevel(level); setIsExpanded(false); }}
                className="flex-1 flex flex-col items-center gap-3 relative z-10 outline-none group">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300"
                  style={{
                    background: isSel ? `linear-gradient(135deg, ${lColor}, ${lColor}cc)` : 'var(--theme-bg-secondary)',
                    color: isSel ? 'white' : 'var(--theme-text-muted)',
                    boxShadow: isSel ? `0 8px 24px ${lColor}55` : undefined,
                    border: `3px solid ${isSel ? 'white' : 'var(--theme-border)'}`,
                    transform: isSel ? 'scale(1.2)' : 'scale(1)',
                  }}>
                  {level}
                </div>
                <div className="text-[11px] font-black" style={{ color: stat.pct > 0 ? lColor : 'var(--theme-text-muted)' }}>
                  {loadingLessons ? '—' : `${stat.pct}%`}
                </div>
                <div className="w-full max-w-16 h-1.5 rounded-full overflow-hidden bg-white/10">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${stat.pct}%`, background: `linear-gradient(90deg, ${lColor}, ${lColor}cc)` }} />
                </div>
              </button>
            );
          })}

          {/* B2 locked */}
          <div className="flex-1 flex flex-col items-center gap-3 relative z-10 opacity-20 grayscale">
            <div className="w-12 h-12 rounded-full flex items-center justify-center border-3 border-dashed border-white/20"
              style={{ background: 'var(--theme-bg-secondary)' }}>
              <IconLock size={16} className="text-white/40" />
            </div>
            <div className="text-[11px] font-black text-white/20">B2</div>
            <div className="w-full max-w-16 h-1.5 rounded-full bg-white/5" />
          </div>
        </div>
      </div>

      {/* Grammar progress body */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <IconBookOpen size={15} style={{ color }} />
            <span className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              {t('grammarLevel', { level: selectedLevel })}
            </span>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
            style={{ background: `${color}12`, color }}>
            {t('passedOfTotal', { passed: selStats?.passed || 0, total: selStats?.total || 0 })}
          </span>
        </div>

        <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${selStats?.pct || 0}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
        </div>
        {!loadingLessons && selStats && (
          <div className="text-caption mb-4 text-right" style={{ color: 'var(--theme-text-muted)' }}>
            {t('testedOfTotal', { passed: selStats.passed, total: selStats.total })}
          </div>
        )}

        {!loadingLessons && selStats && (
          <div className="flex items-center gap-3 mb-4 px-1 flex-wrap">
            {[
              { dot: STATUS.success, label: t('legendPassed'), value: selStats.passed },
              { dot: ACCENT.xp, label: t('legendNeedsReview'), value: selStats.needsReview },
              { dot: 'var(--theme-border)', label: t('legendNotTested'), value: selStats.total - selStats.passed - selStats.needsReview, border: true },
            ].map(s => (
              <span key={s.label} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 border"
                  style={{ backgroundColor: s.border ? 'transparent' : s.dot, borderColor: s.dot }} />
                <span style={{ color: 'var(--theme-text-secondary)' }}>
                  {s.label}: <b style={{ color: 'var(--theme-text-primary)' }}>{s.value}</b>
                </span>
              </span>
            ))}
          </div>
        )}

        {!loadingLessons && selectedLessons.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-80"
            style={{ color: color, backgroundColor: `${color}10`, border: `1px solid ${color}20` }}
          >
            {isExpanded ? t('collapse') : t('expand')}
            <IconChevronRight
              size={14}
              style={{ transform: isExpanded ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 200ms' }}
            />
          </button>
        )}

        {isExpanded && (
          <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--theme-border)' }}>
            {loadingLessons ? (
              <div className="space-y-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 rounded-xl animate-pulse"
                    style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
                ))}
              </div>
            ) : (
              <div className="space-y-1 mb-4">
                {selectedLessons.map((lesson, i) => {
                  const st = lesson.status;
                  const isLocked = lesson.locked;
                  const dotColor = st === 'passed' ? STATUS.success : st === 'needs_review' ? ACCENT.xp : 'var(--theme-border)';
                  const scoreSuffix = lesson.progress?.score ? ` ${Math.round(lesson.progress.score)}%` : '';
                  const statusLabel = isLocked
                    ? t('statusLocked')
                    : st === 'passed'
                      ? `${t('statusPassed')}${scoreSuffix}`
                      : st === 'needs_review'
                        ? `${t('statusNeedsReview')}${scoreSuffix}`
                        : t('statusNotTested');
                  const statusColor = isLocked
                    ? 'var(--theme-text-muted)'
                    : st === 'passed' ? STATUS.success : st === 'needs_review' ? ACCENT.xp : 'var(--theme-text-muted)';

                  const rowContent = (
                    <>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                        style={{ borderColor: isLocked ? 'var(--theme-border)' : dotColor, backgroundColor: st === 'passed' && !isLocked ? `${dotColor}22` : 'transparent' }}>
                        {isLocked
                          ? <IconLock size={10} style={{ color: 'var(--theme-text-muted)' }} />
                          : st === 'passed' && <IconCheck size={10} style={{ color: dotColor }} />}
                      </div>
                      <span className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-caption font-bold"
                        style={{ backgroundColor: isLocked ? 'var(--theme-bg-tertiary)' : `${color}15`, color: isLocked ? 'var(--theme-text-muted)' : color }}>
                        {i + 1}
                      </span>
                      <span className="flex-1 text-body font-medium truncate"
                        style={{ color: isLocked ? 'var(--theme-text-muted)' : 'var(--theme-text-primary)' }}>
                        {pickField(lesson, 'title', locale)}
                      </span>
                      <span className="text-caption font-semibold shrink-0" style={{ color: statusColor }}>
                        {statusLabel}
                      </span>
                      {isLocked
                        ? <IconLock size={13} style={{ color: 'var(--theme-text-muted)', opacity: 0.5 }} />
                        : <IconChevronRight size={13} style={{ color: 'var(--theme-text-muted)', opacity: 0.4 }} />}
                    </>
                  );

                  if (isLocked) {
                    return (
                      <div key={lesson.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-not-allowed"
                        title={lesson.lockReason}
                        style={{ backgroundColor: 'var(--theme-bg-secondary)', opacity: 0.55 }}>
                        {rowContent}
                      </div>
                    );
                  }

                  return (
                    <Link key={lesson.id} href={`/grammar/${lesson.slug}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
                      style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = `${color}10`)}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--theme-bg-secondary)')}>
                      {rowContent}
                    </Link>
                  );
                })}
              </div>
            )}

            {!loadingLessons && notPassed.length > 0 && (
              <div className="rounded-xl p-3.5 mb-4"
                style={{ background: `${ACCENT.xp}0F`, border: `1px solid ${ACCENT.xp}2E` }}>
                <p className="text-[11.5px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: ACCENT.xp }}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-caption"
                    style={{ background: ACCENT.xp }}>!</span>
                  {t('notPassedHeader', { count: notPassed.length })}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {notPassed.map(l => {
                    const baseClass = 'px-2.5 py-1 rounded-lg text-caption font-medium transition-opacity flex items-center gap-1';
                    const baseStyle = {
                      backgroundColor: l.status === 'needs_review' ? `${ACCENT.xp}26` : 'var(--theme-bg-secondary)',
                      color: l.status === 'needs_review' ? ACCENT.xp : 'var(--theme-text-muted)',
                    };
                    if (l.locked) {
                      return (
                        <span key={l.id} title={l.lockReason}
                          className={`${baseClass} cursor-not-allowed`}
                          style={{ ...baseStyle, opacity: 0.55 }}>
                          <IconLock size={10} />
                          {pickField(l, 'title', locale)}
                        </span>
                      );
                    }
                    return (
                      <Link key={l.id} href={`/grammar/${l.slug}`}
                        className={`${baseClass} hover:opacity-80`}
                        style={baseStyle}>
                        {pickField(l, 'title', locale)}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Link href="/grammar"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-body font-semibold text-white transition-all hover:-translate-y-0.5"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 12px ${color}28` }}>
                <IconBookOpen size={15} />
                {t('practiceLevel', { level: selectedLevel })}
              </Link>
              <Link href="/practice-test"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-body font-semibold transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
                <IconGraduationCap size={15} />
                {t('testButton')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
