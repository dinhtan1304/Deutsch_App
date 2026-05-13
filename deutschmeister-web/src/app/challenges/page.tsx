'use client';
/* eslint-disable no-restricted-syntax */

import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  useDailyMissions,
  useWeeklyChallenges,
  useChallengeHistory,
} from '@/hooks/useChallenges';
import type { ChallengeProgress, DailyMission } from '@/lib/api/challenges';
import { ACCENT, STATUS } from '@/lib/tokens';
import { GridSkeleton } from '@/components/ui';
import {
  IconChevronLeft,
  IconCheck,
  IconZap,
  IconFlame,
  IconTarget,
  IconUsers,
  IconBookOpen,
  IconRotateCcw,
} from '@/components/ui/Icons';

const EVENT_COLORS = {
  STREAK: ACCENT.xp,
  WORDS: ACCENT.srs,
  GAMES: ACCENT.vocab,
  COMMUNITY: ACCENT.listening,
  LEARNING: STATUS.success,
} as const;

type EventType = keyof typeof EVENT_COLORS;

const EVENT_ICONS: Record<EventType, ReactNode> = {
  STREAK: <IconFlame size={18} />,
  WORDS: <IconTarget size={18} />,
  GAMES: <IconRotateCcw size={18} />,
  COMMUNITY: <IconUsers size={18} />,
  LEARNING: <IconBookOpen size={18} />,
};

const CHALLENGE_DESCRIPTIONS: Record<string, string> = {
  learn_words_30: 'Mở rộng vốn từ vựng bằng cách học thêm 30 từ mới trong tuần này.',
  streak_5: 'Duy trì thói quen học tập liên tục trong ít nhất 5 ngày để nhận thưởng.',
  game_sessions_10: 'Tham gia các trò chơi ôn tập để củng cố kiến thức.',
  complete_exams_2: 'Hoàn thành các bài kiểm tra đánh giá để theo dõi trình độ.',
  writing_sessions_3: 'Luyện viết qua nhiều chủ đề để cải thiện khả năng diễn đạt.',
  grammar_lessons_3: 'Nắm vững cấu trúc câu qua các bài học ngữ pháp.',
};

function getEventType(key: string): EventType {
  if (key.includes('streak')) return 'STREAK';
  if (key.includes('word') || key.includes('review') || key.includes('daily')) return 'WORDS';
  if (key.includes('game') || key.includes('quiz')) return 'GAMES';
  if (key.includes('friend') || key.includes('community')) return 'COMMUNITY';
  return 'LEARNING';
}

function ProgressBar({ current, target, color }: { current: number; target: number; color: string }) {
  const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-40">
        <span>Tiến độ</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 rounded-full bg-theme-bg-secondary overflow-hidden border border-theme-border/50">
        <div
          className="h-full transition-all duration-1000 ease-out rounded-full"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${color}dd, ${color})`,
            boxShadow: `0 0 10px ${color}33`,
          }}
        />
      </div>
    </div>
  );
}

function DailyMissionCard({ mission }: { mission: DailyMission }) {
  const eventType = getEventType(mission.missionKey);
  const color = EVENT_COLORS[eventType];
  const href = mission.metadata?.href ?? '/dashboard';
  const description = mission.metadata?.description ?? 'Hoàn thành nhiệm vụ hôm nay để nhận XP.';
  const unit = mission.metadata?.unit ?? 'mục tiêu';

  return (
    <Link
      href={href}
      className="group block p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1"
      style={{
        backgroundColor: 'var(--theme-bg-card)',
        borderColor: mission.completed ? `${STATUS.success}55` : 'var(--theme-border)',
        boxShadow: mission.completed ? `0 10px 30px -18px ${STATUS.success}` : 'none',
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: '#fff' }}
        >
          {EVENT_ICONS[eventType]}
        </div>
        {mission.completed ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest border border-green-500/20">
            <IconCheck size={12} /> Đã xong
          </div>
        ) : (
          <div className="text-[10px] font-black opacity-40 uppercase tracking-widest bg-theme-bg-secondary px-3 py-1 rounded-full border border-theme-border">
            {mission.current} / {mission.target} {unit}
          </div>
        )}
      </div>

      <h3 className="text-lg font-black mb-1.5 leading-tight">{mission.titleVi}</h3>
      <p className="text-sm opacity-55 font-medium mb-5 line-clamp-2 leading-relaxed">{description}</p>

      <ProgressBar current={mission.current} target={mission.target} color={color} />

      <div className="flex items-center justify-between pt-4 mt-5 border-t border-theme-border/50">
        <div className="flex items-center gap-1.5 text-amber-500 font-black text-sm">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <IconZap size={14} />
          </div>
          <span>+{mission.xpReward} XP</span>
        </div>
        <div className="text-[10px] font-bold opacity-35 uppercase tracking-tighter">
          Random theo ngày
        </div>
      </div>
    </Link>
  );
}

function ChallengeCard({ challenge }: { challenge: ChallengeProgress }) {
  const eventType = getEventType(challenge.challengeKey);
  const color = EVENT_COLORS[eventType];
  const description = CHALLENGE_DESCRIPTIONS[challenge.challengeKey] || 'Hoàn thành thử thách để nhận thưởng XP.';

  return (
    <div
      className="group relative p-6 rounded-3xl border transition-all duration-500 hover:scale-[1.02] overflow-hidden"
      style={{
        backgroundColor: 'var(--theme-bg-card)',
        borderColor: challenge.completed ? `${color}44` : 'var(--theme-border)',
        boxShadow: challenge.completed ? `0 10px 40px -15px ${color}22` : 'none',
      }}
    >
      <div
        aria-hidden
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-5 pointer-events-none"
        style={{ backgroundColor: color }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12 duration-500"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: '#fff' }}
          >
            {EVENT_ICONS[eventType]}
          </div>
          {challenge.completed ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest border border-green-500/20">
              <IconCheck size={12} /> Hoàn thành
            </div>
          ) : (
            <div className="text-[10px] font-black opacity-30 uppercase tracking-widest bg-theme-bg-secondary px-3 py-1 rounded-full border border-theme-border">
              {challenge.current} / {challenge.target} mục tiêu
            </div>
          )}
        </div>

        <h3 className="text-lg font-black mb-1.5 leading-tight">{challenge.titleVi}</h3>
        <p className="text-sm opacity-50 font-medium mb-6 line-clamp-2 leading-relaxed">{description}</p>

        <ProgressBar current={challenge.current} target={challenge.target} color={color} />

        <div className="flex items-center justify-between pt-4 mt-6 border-t border-theme-border/50">
          <div className="flex items-center gap-1.5 text-amber-500 font-black text-sm">
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <IconZap size={14} />
            </div>
            <span>+{challenge.xpReward} XP</span>
          </div>
          {!challenge.completed && (
            <div className="text-[10px] font-bold opacity-30 uppercase tracking-tighter">Hết hạn vào Chủ Nhật</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChallengesPage() {
  const { data: daily, isLoading: isDailyLoading } = useDailyMissions();
  const { data: weekly, isLoading: isWeeklyLoading } = useWeeklyChallenges();
  const { data: history, isLoading: isHistoryLoading } = useChallengeHistory();
  const isLoading = isDailyLoading || isWeeklyLoading || isHistoryLoading;

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--theme-bg-body)',
        color: 'var(--theme-text-primary)',
        backgroundImage: 'radial-gradient(circle at 50% -20%, var(--color-accent-brand)10, transparent 70%)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
            >
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
              <IconTarget size={28} className="text-white relative z-10" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-0.5">Nhiệm vụ</h1>
              <p className="text-sm opacity-50 font-medium">Hoàn thành nhiệm vụ hằng ngày và thử thách tuần để nhận XP</p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest border transition-all hover:bg-white/5"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}
          >
            <IconChevronLeft size={14} /> Quay lại Dashboard
          </Link>
        </div>

        {isLoading ? (
          <GridSkeleton cols={2} count={4} height="h-64" rounded="rounded-3xl" bordered gap="gap-6" />
        ) : (
          <div className="space-y-16 animate-[slideUp_0.5s_ease-out_both]">
            <section className="space-y-6">
              <div className="flex items-center justify-between gap-4 px-2">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-35">Nhiệm vụ hôm nay</h2>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-35">
                  Theo giờ Việt Nam
                </span>
              </div>
              <div className="grid md:grid-cols-3 gap-5">
                {daily && daily.length > 0 ? (
                  daily.map((mission) => <DailyMissionCard key={mission.id} mission={mission} />)
                ) : (
                  <div className="md:col-span-3 py-20 text-center opacity-40 font-bold uppercase tracking-widest text-xs">
                    Đang chuẩn bị nhiệm vụ hôm nay...
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-35 px-2">Thử thách tuần</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {weekly && weekly.length > 0 ? (
                  weekly.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} />)
                ) : (
                  <div className="md:col-span-2 py-20 text-center opacity-40 font-bold uppercase tracking-widest text-xs">
                    Đang chuẩn bị thử thách...
                  </div>
                )}
              </div>
            </section>

            {history && history.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-35 px-2 whitespace-nowrap">Lịch sử thử thách</h2>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {history.map((challenge) => {
                    const eventType = getEventType(challenge.challengeKey);
                    const color = EVENT_COLORS[eventType];
                    return (
                      <div key={challenge.id} className="flex items-center gap-4 px-5 py-4 rounded-2xl border bg-theme-bg-secondary/30 border-theme-border transition-all hover:bg-theme-bg-secondary/50">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-theme-border"
                          style={{ background: `${color}15`, color }}
                        >
                          {EVENT_ICONS[eventType]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold truncate opacity-80">{challenge.titleVi}</div>
                          <div className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-0.5">
                            Tuần {new Date(challenge.weekStart).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-[10px] font-black text-green-500/60 uppercase tracking-widest">
                            <IconCheck size={11} /> Đã xong
                          </div>
                          <div className="flex items-center gap-0.5 justify-end text-amber-500/50 text-[10px] font-black">
                            <IconZap size={10} /> +{challenge.xpReward} XP
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
