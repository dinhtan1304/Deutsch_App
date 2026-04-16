'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUserStats } from '@/hooks/useUser';
import { useXp } from '@/hooks/useXp';
import { useGrammarLessons, useGrammarProgress } from '@/hooks/useGrammar';
import type { GrammarProgress } from '@/types/grammar';
import {
  IconUser, IconGamepad, IconBook, IconLogIn, IconArrowRight,
  IconGraduationCap, IconBookOpen, IconCheck, IconCheckCircle, IconLock, IconChevronRight,
  IconTarget, IconStar, IconBrain, IconX, IconCheckAll, IconMail, IconZap, IconPencil,
} from '@/components/ui/Icons';
import { SkillRadar } from '@/components/profile/SkillRadar';

// ─── Helpers ─────────────────────────────────────────────────────────────────

type LessonStatus = 'passed' | 'needs_review' | 'not_started';

function getLessonStatus(progress: GrammarProgress | undefined): LessonStatus {
  if (!progress) return 'not_started';
  if (progress.status === 'completed' && (progress.score ?? 0) >= 80) return 'passed';
  return 'needs_review';
}

const LEVELS = ['A1', 'A2', 'B1'] as const;
type Level = typeof LEVELS[number];

const LEVEL_COLORS: Record<Level, string> = {
  A1: '#22C55E',
  A2: '#3B82F6',
  B1: '#8B5CF6',
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, color, icon: Icon,
}: {
  label: string; value: string | number; color: string;
  icon: React.FC<{ size?: number; style?: React.CSSProperties }>;
}) {
  return (
    <div className="rounded-xl border p-4 text-center relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{
        borderColor: 'var(--theme-border)',
        background: `linear-gradient(135deg, ${color}12, ${color}06)`,
      }}>
      <div className="absolute -top-5 -right-5 w-14 h-14 rounded-full"
        style={{ backgroundColor: color, opacity: 0.06 }} />
      <div className="w-9 h-9 rounded-xl mx-auto flex items-center justify-center mb-2.5"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
        <Icon size={17} style={{ color: 'white' }} />
      </div>
      <div className="text-[22px] font-extrabold leading-none mb-1" style={{ color }}>{value}</div>
      <div className="text-[11px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{label}</div>
    </div>
  );
}

// ─── Roadmap Section ─────────────────────────────────────────────────────────

function LearningRoadmap() {
  const [selectedLevel, setSelectedLevel] = useState<Level>('A1');

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
    <div className="rounded-2xl border mb-6 overflow-hidden"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>

      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--theme-border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
            <IconGraduationCap size={16} style={{ color: 'white' }} />
          </div>
          <div>
            <h2 className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>Lộ trình học tập</h2>
            <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>Theo dõi tiến độ ngữ pháp từng trình độ</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
          style={{ background: `${color}18`, color }}>
          <IconGraduationCap size={12} />
          Trình độ: {selectedLevel}
        </span>
      </div>

      {/* Level track */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--theme-border)' }}>
        <div className="flex items-start justify-between gap-2 relative">
          <div className="absolute top-5 h-px mx-10"
            style={{ left: 0, right: 0, backgroundColor: 'var(--theme-border)', zIndex: 0 }} />

          {LEVELS.map(level => {
            const stat = levelStats.find(s => s.level === level)!;
            const isSel = level === selectedLevel;
            const lColor = LEVEL_COLORS[level];
            return (
              <button key={level} onClick={() => setSelectedLevel(level)}
                className="flex-1 flex flex-col items-center gap-2 relative z-10 outline-none">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-extrabold transition-all duration-200"
                  style={{
                    background: isSel ? `linear-gradient(135deg, ${lColor}, ${lColor}cc)` : 'var(--theme-bg-secondary)',
                    color: isSel ? 'white' : 'var(--theme-text-muted)',
                    boxShadow: isSel ? `0 4px 12px ${lColor}40` : undefined,
                    border: `2px solid ${isSel ? lColor : 'var(--theme-border)'}`,
                    transform: isSel ? 'scale(1.1)' : undefined,
                  }}>
                  {level}
                </div>
                <div className="text-[12px] font-bold" style={{ color: stat.pct > 0 ? lColor : 'var(--theme-text-muted)' }}>
                  {loadingLessons ? '—' : `${stat.pct}%`}
                </div>
                <div className="w-full max-w-16 h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${stat.pct}%`, background: `linear-gradient(90deg, ${lColor}, ${lColor}cc)` }} />
                </div>
                <div className="text-[10.5px] font-medium"
                  style={{ color: isSel ? lColor : 'var(--theme-text-muted)' }}>
                  {stat.passed}/{stat.total} bài
                </div>
              </button>
            );
          })}

          {/* B2 locked */}
          <div className="flex-1 flex flex-col items-center gap-2 relative z-10 opacity-35">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'var(--theme-bg-secondary)', border: '2px solid var(--theme-border)' }}>
              <IconLock size={15} style={{ color: 'var(--theme-text-muted)' }} />
            </div>
            <div className="text-[12px] font-bold" style={{ color: 'var(--theme-text-muted)' }}>B2</div>
            <div className="w-full max-w-16 h-1.5 rounded-full" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
            <div className="text-[10.5px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>Sắp ra mắt</div>
          </div>
        </div>
      </div>

      {/* Grammar progress body */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <IconBookOpen size={15} style={{ color }} />
            <span className="text-[14px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Ngữ pháp {selectedLevel}
            </span>
          </div>
          <span className="text-[12px] font-semibold px-2 py-0.5 rounded-md"
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
          <div className="text-[11px] mb-4 text-right" style={{ color: 'var(--theme-text-muted)' }}>
            {selStats.passed}/{selStats.total} đã kiểm tra qua bài thi
          </div>
        )}

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
              const dotColor = st === 'passed' ? '#22C55E' : st === 'needs_review' ? '#F59E0B' : 'var(--theme-border)';
              const statusLabel = st === 'passed'
                ? `Đạt${lesson.progress?.score ? ` ${Math.round(lesson.progress.score)}%` : ''}`
                : st === 'needs_review'
                  ? `Cần bổ sung${lesson.progress?.score ? ` ${Math.round(lesson.progress.score)}%` : ''}`
                  : 'chưa thi';
              const statusColor = st === 'passed' ? '#22C55E' : st === 'needs_review' ? '#F59E0B' : 'var(--theme-text-muted)';

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
                  <span className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold"
                    style={{ backgroundColor: `${color}15`, color }}>
                    {i + 1}
                  </span>

                  <span className="flex-1 text-[13px] font-medium truncate"
                    style={{ color: 'var(--theme-text-primary)' }}>
                    {lesson.titleVi}
                  </span>

                  <span className="text-[11px] font-semibold shrink-0" style={{ color: statusColor }}>
                    {statusLabel}
                  </span>

                  <IconChevronRight size={13} style={{ color: 'var(--theme-text-muted)', opacity: 0.4 }} />
                </Link>
              );
            })}
          </div>
        )}

        {/* Summary row */}
        {!loadingLessons && selStats && (
          <div className="flex items-center gap-3 mb-4 px-1 flex-wrap">
            {[
              { dot: '#22C55E', label: 'Đạt', value: selStats.passed },
              { dot: '#F59E0B', label: 'Cần bổ sung', value: selStats.needsReview },
              { dot: 'var(--theme-border)', label: 'Chưa thi', value: selStats.total - selStats.passed - selStats.needsReview, border: true },
            ].map(s => (
              <span key={s.label} className="flex items-center gap-1.5 text-[12px]">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 border"
                  style={{ backgroundColor: s.border ? 'transparent' : s.dot, borderColor: s.dot }} />
                <span style={{ color: 'var(--theme-text-secondary)' }}>
                  {s.label}: <b style={{ color: 'var(--theme-text-primary)' }}>{s.value}</b>
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Not-passed chips */}
        {!loadingLessons && notPassed.length > 0 && (
          <div className="rounded-xl p-3.5 mb-4"
            style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.18)' }}>
            <p className="text-[11.5px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: '#F59E0B' }}>
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px]"
                style={{ background: '#F59E0B' }}>!</span>
              Chưa đạt ({notPassed.length} bài)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {notPassed.map(l => (
                <Link key={l.id} href={`/grammar/${l.slug}`}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: l.status === 'needs_review' ? 'rgba(245,158,11,.15)' : 'rgba(107,114,128,.1)',
                    color: l.status === 'needs_review' ? '#F59E0B' : 'var(--theme-text-muted)',
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
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 12px ${color}28` }}>
            <IconBookOpen size={15} />
            Luyện tập {selectedLevel}
          </Link>
          <Link href="/practice-test"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
            <IconGraduationCap size={15} />
            Đề kiểm tra
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const { data: stats, isLoading } = useUserStats(isAuthenticated);
  const { data: xpInfo } = useXp();

  if (!_hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--theme-border)', borderTopColor: '#3B82F6' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-24 text-center">
        <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-5"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', boxShadow: '0 8px 24px rgba(59,130,246,.3)' }}>
          <IconUser size={32} style={{ color: 'white' }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
          Đăng nhập để xem hồ sơ
        </h1>
        <p className="text-[14px] mb-8" style={{ color: 'var(--theme-text-muted)' }}>
          Theo dõi tiến trình và thống kê học tập của bạn
        </p>
        <Link href="/auth/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', boxShadow: '0 4px 16px rgba(59,130,246,.35)' }}>
          <IconLogIn size={16} />
          Đăng nhập
        </Link>
      </div>
    );
  }

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
    { label: 'Trò chơi', value: stats?.gamesPlayed ?? 0, color: '#3B82F6', icon: IconGamepad },
    { label: 'Chính xác', value: `${stats?.accuracy ?? 0}%`, color: '#22C55E', icon: IconTarget },
    { label: 'Yêu thích', value: stats?.favorites ?? 0, color: '#F59E0B', icon: IconStar },
    { label: 'Đã học', value: stats?.wordsLearned ?? 0, color: '#8B5CF6', icon: IconBrain },
  ];

  const quickActions = [
    { href: '/games', label: 'Chơi game', sub: 'Luyện mạo từ', icon: IconGamepad, gradient: 'linear-gradient(135deg, #3B82F6, #6366F1)', shadow: 'rgba(59,130,246,.28)' },
    { href: '/words', label: 'Từ điển', sub: 'Học từ mới', icon: IconBook, gradient: 'linear-gradient(135deg, #22C55E, #14B8A6)', shadow: 'rgba(34,197,94,.28)' },
    { href: '/grammar', label: 'Ngữ pháp', sub: 'Luyện bài tập', icon: IconBookOpen, gradient: 'linear-gradient(135deg, #8B5CF6, #6366F1)', shadow: 'rgba(139,92,246,.28)' },
    { href: '/practice-test', label: 'Luyện thi', sub: 'Đề Goethe/TELC', icon: IconGraduationCap, gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)', shadow: 'rgba(245,158,11,.28)' },
  ];

  return (
    <div className="py-6 max-w-3xl mx-auto">

      {/* ─── Hero Card ─── */}
      <div className="rounded-2xl border mb-6 overflow-hidden"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        {/* Banner */}
        <div className="h-20 relative"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,.22) 0%, rgba(139,92,246,.18) 50%, rgba(34,197,94,.14) 100%)' }}>
          <div className="absolute top-2 left-10 w-16 h-16 rounded-full opacity-15" style={{ background: '#3B82F6' }} />
          <div className="absolute bottom-1 right-20 w-10 h-10 rounded-full opacity-10" style={{ background: '#8B5CF6' }} />
          <div className="absolute top-6 right-6 w-8 h-8 rounded-full opacity-10" style={{ background: '#22C55E' }} />
        </div>

        {/* Avatar + info */}
        <div className="px-6 pb-5">
          <div className="-mt-12 mb-4 flex items-end justify-between gap-3">
            {/* Avatar with gradient frame */}
            <div className="relative shrink-0">
              <div className="rounded-full p-[3px]"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6, #22C55E)' }}>
                <div className="rounded-full p-[3px]" style={{ backgroundColor: 'var(--theme-bg-card)' }}>
                  <div className="rounded-full flex items-center justify-center text-white text-[28px] font-extrabold overflow-hidden"
                    style={{
                      width: 86, height: 86,
                      background: user?.avatar ? undefined : 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                      boxShadow: '0 6px 20px rgba(59,130,246,.35)',
                    }}>
                    {user?.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatar} alt={user.name ?? ''} className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                </div>
              </div>
              {/* Verify sub-badge on avatar */}
              <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6, #0EA5E9)',
                  border: '3px solid var(--theme-bg-card)',
                  boxShadow: '0 2px 8px rgba(59,130,246,.4)',
                }}>
                <IconCheck size={12} style={{ color: 'white' }} />
              </div>
            </div>

            {/* Edit + Share buttons */}
            <div className="flex items-center gap-2 mb-1">
              <Link href="/profile/share"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                  boxShadow: '0 4px 12px rgba(99,102,241,.3)',
                }}>
                <IconZap size={13} />
                Chia sẻ
              </Link>
              <Link href="/settings"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-semibold transition-all hover:-translate-y-0.5"
                style={{
                  backgroundColor: 'var(--theme-bg-secondary)',
                  color: 'var(--theme-text-primary)',
                  border: '1px solid var(--theme-border)',
                }}>
                <IconPencil size={13} />
                Sửa hồ sơ
              </Link>
            </div>
          </div>

          {/* Name + inline badges */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: 'var(--theme-text-primary)' }}>
              {user?.name || 'User'}
            </h1>
            {/* Blue verify checkmark */}
            <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, #3B82F6, #0EA5E9)',
                boxShadow: '0 2px 6px rgba(59,130,246,.35)',
              }}>
              <IconCheck size={11} style={{ color: 'white' }} />
            </span>
            {/* ACTIVE pill */}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider text-white"
              style={{
                background: 'linear-gradient(135deg, #22C55E, #14B8A6)',
                boxShadow: '0 2px 6px rgba(34,197,94,.3)',
              }}>
              ACTIVE
            </span>
          </div>

          {/* Email + join date */}
          <div className="flex items-center gap-2 flex-wrap text-[12.5px] mb-4"
            style={{ color: 'var(--theme-text-muted)' }}>
            <span className="flex items-center gap-1.5">
              <IconMail size={13} />
              {user?.email}
            </span>
            <span style={{ opacity: .5 }}>•</span>
            <span>Tham gia: {joinedDate}</span>
          </div>

          {/* Bottom badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Level + CEFR */}
            {xpInfo && (
              <span
                title="Mức ước tính dựa trên XP — làm placement test để xác định chính xác"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11.5px] font-bold"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,.14), rgba(139,92,246,.1))',
                  color: '#6366F1',
                  border: '1px solid rgba(99,102,241,.28)',
                }}>
                <IconGraduationCap size={12} />
                Lv.{xpInfo.level} · ≈ {xpInfo.cefr}
              </span>
            )}
            {/* Points */}
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11.5px] font-bold"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,.15), rgba(234,88,12,.1))',
                color: '#F59E0B',
                border: '1px solid rgba(245,158,11,.28)',
              }}>
              <IconZap size={12} />
              {isLoading ? '—' : points} Points
            </span>
            {/* Email verified */}
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold tracking-wide uppercase"
              style={{
                background: 'rgba(34,197,94,.12)',
                color: '#22C55E',
                border: '1px solid rgba(34,197,94,.25)',
              }}>
              <IconCheckCircle size={12} />
              Email Verified
            </span>
            {/* Plan */}
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold tracking-wide uppercase"
              style={{
                background: isPremium ? 'rgba(139,92,246,.14)' : 'rgba(107,114,128,.12)',
                color: isPremium ? '#A855F7' : 'var(--theme-text-muted)',
                border: isPremium ? '1px solid rgba(139,92,246,.28)' : '1px solid var(--theme-border)',
              }}>
              <IconStar size={12} />
              {isPremium ? 'Premium' : 'Free Plan'}
            </span>
            {/* Placement retake */}
            <Link href="/placement"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all hover:opacity-80"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,.12), rgba(139,92,246,.08))',
                color: '#3B82F6',
                border: '1px solid rgba(59,130,246,.25)',
              }}>
              <IconTarget size={12} />
              Kiểm tra lại trình độ
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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

      {/* ─── Skill Proficiency Radar ─── */}
      <div className="mb-6">
        <SkillRadar />
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
              <div className="flex items-center gap-1.5 text-[13px] font-medium"
                style={{ color: 'var(--theme-text-secondary)' }}>
                <IconTarget size={14} style={{ color: '#22C55E' }} />
                Tỉ lệ chính xác
              </div>
              <span className="text-[14px] font-extrabold" style={{ color: '#22C55E' }}>
                {isLoading ? '—' : `${accuracyPct}%`}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-border)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${accuracyPct}%`, background: 'linear-gradient(90deg, #22C55E, #14B8A6)' }} />
            </div>
            <div className="flex justify-between mt-1.5 text-[10.5px]" style={{ color: 'var(--theme-text-muted)' }}>
              <span>{correct} đúng</span>
              <span>{wrong} sai</span>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Tổng câu trả lời', value: stats?.totalAnswers ?? 0, color: 'var(--theme-text-primary)', icon: IconBrain, accent: '#3B82F6' },
              { label: 'Trả lời đúng', value: stats?.correctAnswers ?? 0, color: '#22C55E', icon: IconCheckAll, accent: '#22C55E' },
              { label: 'Trả lời sai', value: stats?.wrongAnswers ?? 0, color: '#EF4444', icon: IconX, accent: '#EF4444' },
            ].map((row, i) => {
              const RowIcon = row.icon;
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${row.accent}15` }}>
                    <RowIcon size={14} style={{ color: row.accent }} />
                  </div>
                  <span className="flex-1 text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>{row.label}</span>
                  <span className="text-[14px] font-bold" style={{ color: row.color }}>
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
                    <div className="text-[13px] font-bold leading-tight">{qa.label}</div>
                    <div className="text-[11px] opacity-75 mt-0.5">{qa.sub}</div>
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
