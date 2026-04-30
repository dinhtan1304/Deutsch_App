'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { AuthGate } from '@/components/ui';
import { GRADIENT, ACCENT, STATUS } from '@/lib/tokens';
import { useUserStats } from '@/hooks/useUser';
import { useXp } from '@/hooks/useXp';
import { useGrammarLessons, useGrammarProgress } from '@/hooks/useGrammar';
import type { GrammarProgress } from '@/types/grammar';
import type { ActivityHeatmap as HeatmapData } from '@/types/dashboard';
import {
  IconUser, IconGamepad, IconBook, IconArrowRight,
  IconGraduationCap, IconBookOpen, IconCheck, IconCheckCircle, IconLock, IconChevronRight,
  IconTarget, IconStar, IconBrain, IconX, IconCheckAll, IconMail, IconZap, IconPencil,
  IconTrophy,
} from '@/components/ui/Icons';
import { SkillRadar } from '@/components/profile/SkillRadar';
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap';
import { ErrorPatternsWidget } from '@/components/dashboard/ErrorPatternsWidget';
import { useActivityHeatmap } from '@/hooks/useDashboard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

type LessonStatus = 'passed' | 'needs_review' | 'not_started';

function getLessonStatus(progress: GrammarProgress | undefined): LessonStatus {
  if (!progress) return 'not_started';
  if (progress.status === 'completed' && (progress.score ?? 0) >= 80) return 'passed';
  return 'needs_review';
}

const toLocalDateStr = (date: Date): string => date.toISOString().slice(0, 10);
const getEmptyHeatmap = (): HeatmapData => {
  const data = [];
  const today = new Date();
  for (let i = 365; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({ date: toLocalDateStr(date), count: 0, level: 0 });
  }
  return { data, totalActiveDays: 0, currentStreak: 0, longestStreak: 0 };
};

const LEVELS = ['A1', 'A2', 'B1'] as const;
type Level = typeof LEVELS[number];

const LEVEL_COLORS: Record<Level, string> = {
  // eslint-disable-next-line no-restricted-syntax
  A1: '#10B981',
  A2: ACCENT.srs,
  B1: ACCENT.vocab,
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, color, icon: Icon,
}: {
  label: string; value: string | number; color: string;
  icon: React.FC<{ size?: number; style?: React.CSSProperties; className?: string }>;
}) {
  return (
    <div className="group rounded-[1.5rem] border p-5 text-center relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
        backgroundImage: `radial-gradient(circle at 50% 0%, ${color}15, transparent 70%)`
      }}>
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="w-11 h-11 rounded-2xl mx-auto flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 8px 20px ${color}33` }}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="text-2xl font-black tracking-tight mb-1" style={{ color: 'var(--theme-text-primary)' }}>{value}</div>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40" style={{ color: 'var(--theme-text-muted)' }}>{label}</div>
    </div>
  );
}

// ─── Roadmap Section ─────────────────────────────────────────────────────────

function LearningRoadmap() {
  const [selectedLevel, setSelectedLevel] = useState<Level>('A1');
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: allLessons = [], isLoading: loadingLessons } = useGrammarLessons();
  const { data: progressData = [] } = useGrammarProgress();

  const progressMap = useMemo(() => {
    const map = new Map<string, GrammarProgress>();
    progressData.forEach(p => map.set(p.lessonId, p));
    return map;
  }, [progressData]);

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
      }));
  }, [allLessons, selectedLevel, progressMap]);

  const selStats = levelStats.find(s => s.level === selectedLevel)!;
  const color = LEVEL_COLORS[selectedLevel];
  const notPassed = selectedLessons.filter(l => l.status !== 'passed');

  return (
    <div className="rounded-[2rem] border mb-8 overflow-hidden shadow-2xl backdrop-blur-md"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>

      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between"
        // eslint-disable-next-line no-restricted-syntax
        style={{ borderBottom: '1px solid var(--theme-border)', background: 'linear-gradient(to right, var(--theme-bg-secondary) 0%, transparent 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: GRADIENT.writing }}>
            <IconGraduationCap size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>Lộ trình học tập</h2>
            <p className="text-[11px] opacity-50 font-medium" style={{ color: 'var(--theme-text-muted)' }}>Tiến độ ngữ pháp theo tiêu chuẩn CEFR</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
          style={{ background: `${color}15`, color }}>
          <IconGraduationCap size={12} />
          Level: {selectedLevel}
        </span>
      </div>

      {/* Level track */}
      <div className="px-6 py-8" style={{ borderBottom: '1px solid var(--theme-border)' }}>
        <div className="flex items-start justify-between gap-4 relative">
          <div className="absolute top-6 h-[2px] mx-12"
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
                <div className="w-full max-w-[64px] h-1.5 rounded-full overflow-hidden bg-white/10">
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
            <div className="w-full max-w-[64px] h-1.5 rounded-full bg-white/5" />
          </div>
        </div>
      </div>

      {/* Grammar progress body */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <IconBookOpen size={15} style={{ color }} />
            <span className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Ngữ pháp {selectedLevel}
            </span>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
            style={{ background: `${color}12`, color }}>
            {selStats?.passed || 0}/{selStats?.total || 0} đạt qua thi
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full overflow-hidden mb-1.5"
          style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${selStats?.pct || 0}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
        </div>
        {!loadingLessons && selStats && (
          <div className="text-caption mb-4 text-right" style={{ color: 'var(--theme-text-muted)' }}>
            {selStats.passed}/{selStats.total} đã kiểm tra qua bài thi
          </div>
        )}

        {/* Summary row */}
        {!loadingLessons && selStats && (
          <div className="flex items-center gap-3 mb-4 px-1 flex-wrap">
            {[
              { dot: STATUS.success, label: 'Đạt', value: selStats.passed },
              { dot: ACCENT.xp, label: 'Cần bổ sung', value: selStats.needsReview },
              { dot: 'var(--theme-border)', label: 'Chưa thi', value: selStats.total - selStats.passed - selStats.needsReview, border: true },
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

        {/* Expand / Collapse toggle */}
        {!loadingLessons && selectedLessons.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-80"
            style={{ color: color, backgroundColor: `${color}10`, border: `1px solid ${color}20` }}
          >
            {isExpanded ? 'Thu gọn danh sách' : 'Xem chi tiết bài học'}
            <IconChevronRight
              size={14}
              style={{ transform: isExpanded ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 200ms' }}
            />
          </button>
        )}

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--theme-border)' }}>
            {/* Lesson list */}
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
                  const dotColor = st === 'passed' ? STATUS.success : st === 'needs_review' ? ACCENT.xp : 'var(--theme-border)';
                  const statusLabel = st === 'passed'
                    ? `Đạt${lesson.progress?.score ? ` ${Math.round(lesson.progress.score)}%` : ''}`
                    : st === 'needs_review'
                      ? `Cần bổ sung${lesson.progress?.score ? ` ${Math.round(lesson.progress.score)}%` : ''}`
                      : 'chưa thi';
                  const statusColor = st === 'passed' ? STATUS.success : st === 'needs_review' ? ACCENT.xp : 'var(--theme-text-muted)';

                  return (
                    <Link key={lesson.id} href={`/grammar/${lesson.slug}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
                      style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = `${color}10`)}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--theme-bg-secondary)')}>

                      {/* Status circle */}
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                        style={{
                          borderColor: dotColor,
                          backgroundColor: st === 'passed' ? `${dotColor}22` : 'transparent',
                        }}>
                        {st === 'passed' && <IconCheck size={10} style={{ color: dotColor }} />}
                      </div>

                      {/* Number */}
                      <span className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-caption font-bold"
                        style={{ backgroundColor: `${color}15`, color }}>
                        {i + 1}
                      </span>

                      <span className="flex-1 text-body font-medium truncate"
                        style={{ color: 'var(--theme-text-primary)' }}>
                        {lesson.titleVi}
                      </span>

                      <span className="text-caption font-semibold shrink-0" style={{ color: statusColor }}>
                        {statusLabel}
                      </span>

                      <IconChevronRight size={13} style={{ color: 'var(--theme-text-muted)', opacity: 0.4 }} />
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Not-passed chips */}
            {!loadingLessons && notPassed.length > 0 && (
              <div className="rounded-xl p-3.5 mb-4"
                style={{ background: `${ACCENT.xp}0F`, border: `1px solid ${ACCENT.xp}2E` }}>
                <p className="text-[11.5px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: ACCENT.xp }}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-caption"
                    style={{ background: ACCENT.xp }}>!</span>
                  Chưa đạt ({notPassed.length} bài)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {notPassed.map(l => (
                    <Link key={l.id} href={`/grammar/${l.slug}`}
                      className="px-2.5 py-1 rounded-lg text-caption font-medium hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: l.status === 'needs_review' ? `${ACCENT.xp}26` : 'var(--theme-bg-secondary)',
                        color: l.status === 'needs_review' ? ACCENT.xp : 'var(--theme-text-muted)',
                      }}>
                      {l.titleVi}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Link href="/grammar"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-body font-semibold text-white transition-all hover:-translate-y-0.5"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 12px ${color}28` }}>
                <IconBookOpen size={15} />
                Luyện tập {selectedLevel}
              </Link>
              <Link href="/practice-test"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-body font-semibold transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
                <IconGraduationCap size={15} />
                Đề kiểm tra
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const { data: stats, isLoading } = useUserStats(isAuthenticated);
  const { data: xpInfo } = useXp();
  const { data: heatmapData } = useActivityHeatmap();

  if (!_hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--theme-border)', borderTopColor: ACCENT.srs }} />
      </div>
    );
  }

  if (!isAuthenticated) return (
    <AuthGate
      icon={<IconUser size={28} className="text-white" />}
      gradient={GRADIENT.action}
      title="Đăng nhập để xem hồ sơ"
      description="Theo dõi tiến trình và thống kê học tập của bạn."
    />
  );

  const total = stats?.totalAnswers || 0;
  const correct = stats?.correctAnswers || 0;
  const wrong = stats?.wrongAnswers || 0;
  const accuracyPct = total > 0 ? Math.round((correct / total) * 100) : 0;

  const isPremium = user?.subscription?.plan === 'premium';
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';
  const points = correct;

  const statCards = [
    { label: 'Trò chơi', value: stats?.gamesPlayed ?? 0, color: ACCENT.srs, icon: IconGamepad },
    { label: 'Chính xác', value: `${stats?.accuracy ?? 0}%`, color: STATUS.success, icon: IconTarget },
    { label: 'Yêu thích', value: stats?.favorites ?? 0, color: ACCENT.xp, icon: IconStar },
    { label: 'Đã học', value: stats?.wordsLearned ?? 0, color: ACCENT.vocab, icon: IconBrain },
  ];

  const quickActions = [
    { href: '/games', label: 'Chơi game', sub: 'Luyện mạo từ', icon: IconGamepad, gradient: GRADIENT.action, shadow: `${ACCENT.srs}47` },
    { href: '/words', label: 'Từ điển', sub: 'Học từ mới', icon: IconBook, gradient: GRADIENT.reading, shadow: `${STATUS.success}47` },
    { href: '/grammar', label: 'Ngữ pháp', sub: 'Luyện bài tập', icon: IconBookOpen, gradient: GRADIENT.history, shadow: `${ACCENT.vocab}47` },
    { href: '/practice-test', label: 'Luyện thi', sub: 'Đề Goethe/TELC', icon: IconGraduationCap, gradient: GRADIENT.speaking, shadow: `${ACCENT.xp}47` },
  ];

  return (
    <div className="py-10 max-w-4xl mx-auto px-4 min-h-screen" style={{ backgroundColor: 'var(--theme-bg-body)', color: 'var(--theme-text-primary)', backgroundImage: 'radial-gradient(circle at 50% -20%, var(--color-accent-brand)12, transparent 70%)' }}>

      {/* ─── Hero Card ─── */}
      <div className="rounded-[2.5rem] border mb-8 overflow-hidden shadow-2xl relative"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        {/* Banner with mesh gradient effect */}
        <div className="h-40 relative overflow-hidden"
          // eslint-disable-next-line no-restricted-syntax
          style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E1B4B 100%)' }}>
          <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[200%] rotate-12 opacity-30"
               style={{ background: `radial-gradient(ellipse at center, ${ACCENT.writing} 0%, transparent 70%)` }} />
          <div className="absolute bottom-[-50%] right-[-10%] w-[60%] h-[150%] -rotate-12 opacity-20"
               style={{ background: `radial-gradient(ellipse at center, ${STATUS.success} 0%, transparent 70%)` }} />
          <div className="absolute top-[20%] right-[10%] w-32 h-32 blur-[80px]" style={{ backgroundColor: ACCENT.xp, opacity: 0.2 }} />
        </div>

        {/* Avatar + info */}
        <div className="px-8 pb-8 relative">
          <div className="-mt-16 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
            {/* Avatar with glowing ring */}
            <div className="relative shrink-0 group">
              <div className="rounded-full p-1 transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
                // eslint-disable-next-line no-restricted-syntax
                style={{ background: 'linear-gradient(135deg, #6366F1, #10B981, #F59E0B)' }}>
                <div className="rounded-full p-1" style={{ backgroundColor: 'var(--theme-bg-card)' }}>
                  <div className="rounded-full flex items-center justify-center text-white text-4xl font-black overflow-hidden relative"
                    style={{
                      width: 120, height: 120,
                      // eslint-disable-next-line no-restricted-syntax
                      background: user?.avatar ? undefined : 'linear-gradient(135deg, #4F46E5, #3730A3)',
                      boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)',
                    }}>
                    {user?.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatar} alt={user.name ?? ''} className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  </div>
                </div>
              </div>
              {/* Premium Badge on avatar */}
              <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center border-4 border-theme-bg-card shadow-2xl"
                // eslint-disable-next-line no-restricted-syntax
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                <IconStar size={16} className="text-white" />
              </div>
            </div>

            {/* Edit + Share buttons */}
            <div className="flex items-center gap-3 pb-2">
              <Link href="/profile/share"
                className="group flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(99,102,241,0.4)]"
                style={{ background: GRADIENT.brand }}>
                <IconZap size={14} className="group-hover:animate-pulse" />
                Share
              </Link>
              <Link href="/settings"
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:-translate-y-1 hover:bg-theme-bg-tertiary"
                style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' }}>
                <IconPencil size={14} />
                Edit
              </Link>
            </div>
          </div>

          {/* Name + Badges Row */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
              {user?.name || 'User'}
            </h1>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1.5">
                <IconZap size={11} className="animate-pulse" />
                Active
              </div>
              {isPremium && (
                <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 flex items-center gap-1.5">
                  <IconStar size={11} />
                  Premium
                </div>
              )}
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium opacity-60 mb-8"
            style={{ color: 'var(--theme-text-muted)' }}>
            <span className="flex items-center gap-2"><IconMail size={14} /> {user?.email}</span>
            <span className="w-1 h-1 rounded-full bg-current opacity-30" />
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Joined {joinedDate}
            </span>
          </div>

          {/* High-level badges grid */}
          <div className="flex flex-wrap gap-2">
            {xpInfo && (
              <div className="px-4 py-2 rounded-2xl border flex items-center gap-2 transition-colors hover:bg-theme-bg-secondary"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)44' }}>
                <IconTrophy size={14} className="text-indigo-500" />
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400">Lv.{xpInfo.level} · {xpInfo.cefr}</span>
              </div>
            )}
            <div className="px-4 py-2 rounded-2xl border flex items-center gap-2 transition-colors hover:bg-theme-bg-secondary"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)44' }}>
              <IconZap size={14} className="text-amber-500" />
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-500">{isLoading ? '—' : points} Points</span>
            </div>
            <div className="px-4 py-2 rounded-2xl border flex items-center gap-2 transition-colors hover:bg-theme-bg-secondary"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)44' }}>
              <IconCheckCircle size={14} className="text-emerald-500" />
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-500">Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <StatCard
            key={i}
            label={card.label}
            value={isLoading ? '—' : card.value}
            color={card.color}
            icon={card.icon}
          />
        ))}
      </div>

      {/* ─── Skill Proficiency Radar & Error Patterns ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <SkillRadar />
        <ErrorPatternsWidget />
      </div>

      {/* ─── Activity Heatmap ─── */}
      <div className="mb-8">
        <ActivityHeatmap data={heatmapData ?? getEmptyHeatmap()} />
      </div>

      {/* ─── Learning Roadmap ─── */}
      <LearningRoadmap />

      {/* ─── Bottom grid ─── */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Thống kê chi tiết */}
        <div className="rounded-2xl border p-5"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <h2 className="text-[15px] font-bold mb-4" style={{ color: 'var(--theme-text-primary)' }}>
            Thống kê trả lời
          </h2>

          {/* Accuracy bar */}
          <div className="mb-4 p-3.5 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-body font-medium"
                style={{ color: 'var(--theme-text-secondary)' }}>
                <IconTarget size={14} style={{ color: STATUS.success }} />
                Tỉ lệ chính xác
              </div>
              <span className="text-sm font-extrabold" style={{ color: STATUS.success }}>
                {isLoading ? '—' : `${accuracyPct}%`}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-border)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${accuracyPct}%`, background: `linear-gradient(90deg, ${STATUS.success}, ${ACCENT.teal})` }} />
            </div>
            <div className="flex justify-between mt-1.5 text-[10.5px]" style={{ color: 'var(--theme-text-muted)' }}>
              <span>{correct} đúng</span>
              <span>{wrong} sai</span>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Tổng câu trả lời', value: stats?.totalAnswers ?? 0, color: 'var(--theme-text-primary)', icon: IconBrain, accent: ACCENT.srs },
              { label: 'Trả lời đúng', value: stats?.correctAnswers ?? 0, color: STATUS.success, icon: IconCheckAll, accent: STATUS.success },
              { label: 'Trả lời sai', value: stats?.wrongAnswers ?? 0, color: STATUS.danger, icon: IconX, accent: STATUS.danger },
            ].map((row, i) => {
              const RowIcon = row.icon;
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${row.accent}15` }}>
                    <RowIcon size={14} style={{ color: row.accent }} />
                  </div>
                  <span className="flex-1 text-body" style={{ color: 'var(--theme-text-muted)' }}>{row.label}</span>
                  <span className="text-sm font-bold" style={{ color: row.color }}>
                    {isLoading ? '—' : row.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border p-5"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <h2 className="text-[15px] font-bold mb-4" style={{ color: 'var(--theme-text-primary)' }}>
            Truy cập nhanh
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map((qa, i) => {
              const QaIcon = qa.icon;
              return (
                <Link key={i} href={qa.href}
                  className="flex flex-col gap-2 p-3.5 rounded-xl text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ background: qa.gradient, boxShadow: `0 4px 12px ${qa.shadow}` }}>
                  <QaIcon size={20} style={{ color: 'white' }} />
                  <div>
                    <div className="text-body font-bold leading-tight">{qa.label}</div>
                    <div className="text-caption opacity-75 mt-0.5">{qa.sub}</div>
                  </div>
                  <div className="flex justify-end">
                    <IconArrowRight size={14} style={{ color: 'white', opacity: 0.6 }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
