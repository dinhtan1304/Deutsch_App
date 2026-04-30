'use client';
/* eslint-disable no-restricted-syntax */

import { useWeeklyChallenges, useChallengeHistory } from '@/hooks/useChallenges';
import type { ChallengeProgress } from '@/lib/api/challenges';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import Link from 'next/link';
import { GridSkeleton } from '@/components/ui';
import {
  IconTrophy, IconChevronLeft, IconCheck, IconZap,
  IconFlame, IconTarget, IconUsers, IconBookOpen, IconRotateCcw, IconSettings
} from '@/components/ui/Icons';

const EVENT_COLORS: Record<string, string> = {
  STREAK: ACCENT.xp,
  WORDS: ACCENT.srs,
  GAMES: ACCENT.vocab,
  COMMUNITY: ACCENT.listening,
  LEARNING: STATUS.success,
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  STREAK: <IconFlame size={18} />,
  WORDS: <IconTarget size={18} />,
  GAMES: <IconRotateCcw size={18} />,
  COMMUNITY: <IconUsers size={18} />,
  LEARNING: <IconBookOpen size={18} />,
};

const CHALLENGE_DESCRIPTIONS: Record<string, string> = {
  'learn_words_30': 'Mở rộng vốn từ vựng của bạn bằng cách học thêm 30 từ mới trong tuần này.',
  'streak_5': 'Duy trì thói quen học tập liên tục trong ít nhất 5 ngày để nhận phần thưởng.',
  'game_sessions_10': 'Tham gia các trò chơi ôn tập để củng cố kiến thức một cách thú vị.',
  'complete_exams_2': 'Vượt qua các bài kiểm tra đánh giá để chứng minh trình độ của bạn.',
  'writing_sessions_3': 'Luyện tập kỹ năng viết qua các chủ đề đa dạng để cải thiện khả năng diễn đạt.',
  'grammar_lessons_3': 'Nắm vững cấu trúc câu qua các bài học ngữ pháp chuyên sâu.',
};

function getEventType(key: string) {
  if (key.includes('streak')) return 'STREAK';
  if (key.includes('words') || key.includes('daily')) return 'WORDS';
  if (key.includes('game')) return 'GAMES';
  if (key.includes('friend') || key.includes('community')) return 'COMMUNITY';
  return 'LEARNING';
}

function ChallengeCard({ challenge }: { challenge: ChallengeProgress }) {
  const eventType = getEventType(challenge.challengeKey);
  const color = EVENT_COLORS[eventType];
  const progress = Math.min(100, (challenge.current / challenge.target) * 100);
  const description = CHALLENGE_DESCRIPTIONS[challenge.challengeKey] || 'Hoàn thành nhiệm vụ để nhận phần thưởng XP hấp dẫn.';

  return (
    <div className="group relative p-6 rounded-[1.5rem] border transition-all duration-500 hover:scale-[1.02] overflow-hidden"
      style={{ 
        backgroundColor: 'var(--theme-bg-card)', 
        borderColor: challenge.completed ? `${color}44` : 'var(--theme-border)',
        boxShadow: challenge.completed ? `0 10px 40px -15px ${color}22` : 'none'
      }}>
      
      {/* Background decoration */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-5 pointer-events-none"
        style={{ backgroundColor: color }} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12 duration-500"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: '#fff' }}>
            {EVENT_ICONS[eventType]}
          </div>
          {challenge.completed ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest border border-green-500/20">
              <IconCheck size={12} /> Hoàn thành
            </div>
          ) : (
            <div className="text-[10px] font-black opacity-30 uppercase tracking-widest bg-theme-bg-secondary px-3 py-1 rounded-full border border-theme-border">
              {challenge.current} / {challenge.target} Mục tiêu
            </div>
          )}
        </div>

        <h3 className="text-lg font-black mb-1.5 leading-tight">{challenge.titleVi}</h3>
        <p className="text-sm opacity-50 font-medium mb-6 line-clamp-2 leading-relaxed">{description}</p>

        {/* Progress Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-40">
            <span>Tiến độ</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-theme-bg-secondary overflow-hidden border border-theme-border/50">
            <div className="h-full transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${color}dd, ${color})`, boxShadow: `0 0 10px ${color}33` }} />
          </div>
        </div>

        {/* Reward */}
        <div className="flex items-center justify-between pt-4 border-t border-theme-border/50">
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
  const { data: weekly, isLoading: isWeeklyLoading } = useWeeklyChallenges();
  const { data: history, isLoading: isHistoryLoading } = useChallengeHistory();

  const isLoading = isWeeklyLoading || isHistoryLoading;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-bg-body)', color: 'var(--theme-text-primary)', backgroundImage: 'radial-gradient(circle at 50% -20%, var(--color-accent-brand)10, transparent 70%)' }}>
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
              <IconTarget size={28} className="text-white relative z-10" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-0.5">Nhiệm vụ tuần</h1>
              <p className="text-sm opacity-50 font-medium">Hoàn thành để nhận thêm XP</p>
            </div>
          </div>

          <Link href="/" 
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest border transition-all hover:bg-white/5"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
            <IconChevronLeft size={14} /> Quay lại Dashboard
          </Link>
        </div>

        {isLoading ? (
          <GridSkeleton cols={2} count={4} height="h-64" rounded="rounded-3xl" bordered gap="gap-6" />
        ) : (
          <div className="space-y-16 animate-[slideUp_0.5s_ease-out_both]">
            {/* Current Missions */}
            <div className="space-y-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 px-2">Nhiệm vụ hiện tại</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {weekly && weekly.length > 0 ? (
                  weekly.map((c) => <ChallengeCard key={c.id} challenge={c} />)
                ) : (
                  <div className="col-span-2 py-20 text-center opacity-40 font-bold uppercase tracking-widest text-xs">Đang chuẩn bị nhiệm vụ...</div>
                )}
              </div>
            </div>

            {/* History */}
            {history && history.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 px-2 whitespace-nowrap">Lịch sử nhiệm vụ</h2>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {history.map((c) => {
                    const eventType = getEventType(c.challengeKey);
                    const color = EVENT_COLORS[eventType];
                    return (
                      <div key={c.id} className="flex items-center gap-4 px-5 py-4 rounded-2xl border bg-theme-bg-secondary/30 border-theme-border transition-all hover:bg-theme-bg-secondary/50">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-theme-border"
                          style={{ background: `${color}15`, color }}>
                          {EVENT_ICONS[eventType]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold truncate opacity-80">{c.titleVi}</div>
                          <div className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-0.5">
                            Hoàn thành tuần {new Date(c.weekStart).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-[10px] font-black text-green-500/60 uppercase tracking-widest">
                            <IconCheck size={11} /> Đã xong
                          </div>
                          <div className="flex items-center gap-0.5 justify-end text-amber-500/50 text-[10px] font-black">
                            <IconZap size={10} /> +{c.xpReward} XP
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
