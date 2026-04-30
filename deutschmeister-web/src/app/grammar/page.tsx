'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useGrammarLessons, useGrammarProgress } from '@/hooks/useGrammar';
import { GrammarLessonCard } from '@/components/grammar/GrammarLessonCard';
import { GRADIENT, ACCENT, STATUS } from '@/lib/tokens';
import {
  IconBook, IconList,
} from '@/components/ui/Icons';

const LEVELS = ['ALL', 'A1', 'A2', 'B1'] as const;

const LEVEL_COLORS: Record<string, { color: string; gradient: string }> = {
  A1: { color: ACCENT.reading, gradient: `linear-gradient(135deg, ${ACCENT.reading}, #16A34A)` },
  A2: { color: ACCENT.srs,     gradient: `linear-gradient(135deg, ${ACCENT.srs}, #2563EB)` },
  B1: { color: ACCENT.xp,      gradient: `linear-gradient(135deg, ${ACCENT.xp}, #D97706)` },
};

export default function GrammarDashboardPage() {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const { data: lessons = [], isLoading: lessonsLoading } = useGrammarLessons();
  const { data: progress = [] } = useGrammarProgress();

  const filteredLessons = (
    filterLevel === 'ALL' ? lessons : lessons.filter(l => l.level === filterLevel)
  ).sort((a, b) => a.lessonNumber - b.lessonNumber);

  const getLessonProgress = (lessonId: string) => progress.find(p => p.lessonId === lessonId);

  const lessonsByLevel = useMemo(() => {
    const map: Record<string, typeof lessons> = { A1: [], A2: [], B1: [] };
    for (const l of filteredLessons) {
      if (!map[l.level]) map[l.level] = [];
      map[l.level].push(l);
    }
    return map;
  }, [filteredLessons]);

  const levelDescriptions: Record<string, string> = {
    A1: 'Nền tảng — Alphabet, động từ sein/haben, mạo từ, câu đơn',
    A2: 'Sơ cấp trên — Perfekt, Präteritum, câu phụ với weil/dass',
    B1: 'Trung cấp — Konjunktiv, Passiv, Nebensätze phức tạp',
  };

  const lockInfo = useMemo(() => {
    const passedSet = new Set(
      progress.filter(p => p.status === 'completed' && (p.score ?? 0) >= 80).map(p => p.lessonId)
    );
    const map: Record<string, { locked: boolean; reason: string }> = {};
    for (const lesson of lessons) {
      const prereqs = lesson.prerequisiteIds ?? [];
      if (prereqs.length === 0) {
        map[lesson.id] = { locked: false, reason: '' };
        continue;
      }
      const unmet = prereqs.filter(id => !passedSet.has(id));
      if (unmet.length === 0) {
        map[lesson.id] = { locked: false, reason: '' };
      } else {
        const names = lessons.filter(l => unmet.includes(l.id)).map(l => l.titleVi);
        map[lesson.id] = {
          locked: true,
          reason: names.length > 0
            ? `Hoàn thành "${names.join(', ')}" trước (≥80%)`
            : 'Hoàn thành bài tiên quyết trước (≥80%)',
        };
      }
    }
    return map;
  }, [lessons, progress]);

  const completedCount = progress.filter(p => p.status === 'completed').length;
  const totalCount = lessons.length;
  const overallPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const inProgressCount = progress.filter(p => p.status === 'in_progress').length;

  if (lessonsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-28 rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* ─── Hero Banner ─── */}
      <div
        className="mb-6 p-5 rounded-2xl border overflow-hidden relative"
        style={{
          borderColor: `${ACCENT.vocab}33`,
          background: `linear-gradient(135deg, ${ACCENT.vocab}14 0%, ${ACCENT.writing}0A 100%)`,
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${ACCENT.vocab}26, transparent 70%)` }} />
        <div className="absolute -bottom-8 left-20 w-24 h-24 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${ACCENT.writing}1A, transparent 70%)` }} />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          {/* Left: icon + title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: GRADIENT.writing }}>
              <IconBook size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                Ngữ pháp tiếng Đức
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                Lộ trình từ A1 đến B1 — {completedCount}/{totalCount} bài hoàn thành
              </p>
            </div>
          </div>

          {/* Center: mini stats */}
          {totalCount > 0 && (
            <div className="flex items-center gap-4">
              {[
                { label: 'Hoàn thành', value: completedCount,    color: STATUS.success, bg: `${STATUS.success}1F` },
                { label: 'Đang học',   value: inProgressCount,   color: ACCENT.srs,     bg: `${ACCENT.srs}1F` },
                { label: 'Tiến độ',    value: `${overallPct}%`,  color: ACCENT.vocab,   bg: `${ACCENT.vocab}1F` },
              ].map((s, i) => (
                <div key={i} className="hidden sm:flex flex-col items-center px-3 py-1.5 rounded-xl"
                  style={{ backgroundColor: s.bg }}>
                  <span className="text-lg font-extrabold leading-none" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</span>
                </div>
              ))}

              {/* Compact progress bar */}
              {totalCount > 0 && (
                <div className="hidden md:block w-32">
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${overallPct}%`, background: GRADIENT.writing }}
                    />
                  </div>
                  <p className="text-[10px] mt-1 text-center" style={{ color: 'var(--theme-text-muted)' }}>Tổng tiến độ</p>
                </div>
              )}
            </div>
          )}

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <Link href="/grammar/cheatsheet"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
              style={{
                background: `linear-gradient(135deg,${ACCENT.vocab}1F,${ACCENT.vocab}0F)`,
                color: ACCENT.vocab,
                border: `1px solid ${ACCENT.vocab}33`,
              }}>
              <IconList size={13} /> Cheatsheet
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Level filter (Segmented Control) ─── */}
      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
          {LEVELS.map(level => {
            const isActive = filterLevel === level;
            const lc = level !== 'ALL' ? LEVEL_COLORS[level] : null;
            return (
              <button key={level} onClick={() => setFilterLevel(level)}
                className="relative px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 z-10"
                style={isActive ? {
                  background: lc ? lc.gradient : GRADIENT.writing,
                  color: 'white',
                  boxShadow: `0 2px 8px ${lc ? lc.color : ACCENT.vocab}40`,
                } : {
                  color: 'var(--theme-text-muted)',
                  backgroundColor: 'transparent',
                }}>
                {level === 'ALL' ? 'Tất cả' : level}
              </button>
            );
          })}
        </div>

        {filterLevel !== 'ALL' && (
          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            {levelDescriptions[filterLevel]}
          </p>
        )}
      </div>

      {/* ─── Learning Path — grouped by level ─── */}
      <div className="space-y-10">
        {(['A1', 'A2', 'B1'] as const).map((lvl, lvlIdx) => {
          const levelLessons = lessonsByLevel[lvl] ?? [];
          if (levelLessons.length === 0) return null;

          const lc = LEVEL_COLORS[lvl];
          const lvlCompleted = levelLessons.filter(l => getLessonProgress(l.id)?.status === 'completed').length;
          const lvlPct = levelLessons.length > 0 ? Math.round((lvlCompleted / levelLessons.length) * 100) : 0;

          return (
            <section key={lvl} className="relative">
              {/* Connector */}
              {lvlIdx > 0 && (
                <div className="flex justify-center -mt-6 mb-6" aria-hidden>
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-5" style={{ backgroundColor: 'var(--theme-border)' }} />
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ color: 'var(--theme-text-muted)' }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Level header */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm"
                  style={{ background: lc.gradient, boxShadow: `0 4px 12px ${lc.color}40` }}>
                  {lvl}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h2 className="text-base font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                      Chặng {lvl}
                    </h2>
                    <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                      {lvlCompleted}/{levelLessons.length} bài
                    </span>
                  </div>
                  <p className="text-xs leading-snug mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                    {levelDescriptions[lvl]}
                  </p>
                  <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${lvlPct}%`, background: lc.gradient }}
                    />
                  </div>
                </div>
                <span className="text-sm font-bold shrink-0" style={{ color: lc.color }}>{lvlPct}%</span>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {levelLessons.map(lesson => (
                  <GrammarLessonCard
                    key={lesson.id}
                    lesson={lesson}
                    progress={getLessonProgress(lesson.id)}
                    locked={lockInfo[lesson.id]?.locked}
                    lockedReason={lockInfo[lesson.id]?.reason}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredLessons.length === 0 && (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
            <IconBook size={26} style={{ color: ACCENT.vocab }} />
          </div>
          <p className="text-base font-semibold mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
            Chưa có bài học nào
          </p>
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            Chọn cấp độ khác hoặc quay lại sau
          </p>
        </div>
      )}
    </div>
  );
}
