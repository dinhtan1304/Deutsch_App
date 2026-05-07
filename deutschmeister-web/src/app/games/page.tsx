'use client';
/* eslint-disable no-restricted-syntax */

import Link from 'next/link';
import { ACCENT, STATUS } from '@/lib/tokens';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettingsStore } from '@/stores/settingsStore';
import { IconInfo } from '@/components/ui/Icons';
import {
  IconGamepad, IconTarget, IconClock, IconPenTool, IconLayers,
  IconBookOpen, IconLink, IconHeadphones, IconSpellCheck,
  IconLightbulb, IconKeyboard, IconFlame, IconZap, KBD,
  IconChevronRight,
} from '@/components/games/GameUI';

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const LEVEL_LABELS: Record<string, string> = {
  A1: 'Sơ cấp', A2: 'Cơ bản', B1: 'Trung cấp',
  B2: 'Trung cấp cao', C1: 'Nâng cao', C2: 'Thành thạo',
  all: 'Tất cả trình độ',
};

const games = [
  { id: 'gender-quiz', name: 'Gender Quiz', description: 'Chọn mạo từ đúng (der/die/das) cho mỗi từ',
    icon: IconTarget, color: ACCENT.srs, href: '/games/gender-quiz' },
  { id: 'timed-challenge', name: 'Timed Challenge', description: 'Trả lời nhanh nhất có thể trong thời gian giới hạn',
    icon: IconClock, color: STATUS.danger, href: '/games/time-challenge' },
  { id: 'fill-blank', name: 'Fill in the Blank', description: 'Điền mạo từ đúng vào chỗ trống',
    icon: IconPenTool, color: ACCENT.vocab, href: '/games/fill-blank' },
  { id: 'flashcards', name: 'Flashcards', description: 'Học từ vựng với thẻ ghi nhớ',
    icon: IconLayers, color: STATUS.success, href: '/games/flashcards' },
  { id: 'srs-review', name: 'SRS Review', description: 'Ôn tập thông minh với thuật toán SM-2',
    icon: IconBookOpen, color: ACCENT.xp, href: '/review', badge: 'SM-2' },
  { id: 'word-match', name: 'Word Match', description: 'Ghép từ với nghĩa tương ứng',
    icon: IconLink, color: ACCENT.cyan, href: '/games/word-match' },
  { id: 'listening', name: 'Listening Quiz', description: 'Nghe và chọn từ đúng',
    icon: IconHeadphones, color: ACCENT.games, href: '/games/listening' },
  { id: 'spelling', name: 'Spelling Bee', description: 'Viết đúng chính tả từ tiếng Đức',
    icon: IconSpellCheck, color: ACCENT.listening, href: '/games/spelling' },
  { id: 'typing', name: 'Luyện gõ phím', description: 'Tăng tốc độ gõ tiếng Đức · 60 giây · WPM + Accuracy',
    icon: IconKeyboard, color: ACCENT.games, href: '/games/typing' },
];

export default function GamesPage() {
  const { playClick } = useSoundEffects();
  const { settings, isLoaded } = useSettingsStore();

  const preferredLevel = settings.preferredLevel;
  const maxIdx = LEVEL_ORDER.indexOf(preferredLevel as typeof LEVEL_ORDER[number]);
  const allowedLevels =
    preferredLevel === 'all'
      ? [...LEVEL_ORDER]
      : maxIdx >= 0 ? LEVEL_ORDER.slice(0, maxIdx + 1) : ['A1'];
  const levelLabel = LEVEL_LABELS[preferredLevel] ?? preferredLevel;

  return (
    <div className="py-6 pb-12">
      {/* Hero Section */}
      <div className="relative rounded-4xl overflow-hidden mb-8 bg-slate-900 group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#4338ca,transparent)] opacity-40" />
        
        <div className="relative z-10 px-6 py-10 md:py-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mb-4 shadow-xl transform transition-transform group-hover:rotate-6">
            <IconGamepad size={28} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
            Game <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400">Center</span>
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-xl font-medium leading-relaxed">
            Học tiếng Đức qua các thử thách kịch tính và tích lũy từ vựng mỗi ngày.
          </p>
          
          <div className="flex gap-3 mt-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              9 Games
            </div>
          </div>
        </div>
      </div>

      {/* Level Info Banner */}
      {isLoaded && (
        <div
          className="mb-6 rounded-2xl border px-4 py-3 flex items-start gap-3"
          style={{
            backgroundColor: `${ACCENT.srs}0D`,
            borderColor: `${ACCENT.srs}33`,
          }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: `${ACCENT.srs}1A`, color: ACCENT.srs }}
          >
            <IconInfo size={16} />
          </div>
          <div className="min-w-0 leading-relaxed">
            <p className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Trình độ của bạn:{' '}
              <span style={{ color: ACCENT.srs }}>
                {preferredLevel === 'all' ? levelLabel : `${preferredLevel} (${levelLabel})`}
              </span>
            </p>
            <p className="text-xs font-medium mt-0.5" style={{ color: ACCENT.srs }}>
              Phạm vi từ vựng:{' '}
              <span className="font-bold">{allowedLevels.join(', ')}</span>
              {' '}— 70% từ bạn đã học + 30% từ mới
            </p>
          </div>
        </div>
      )}

      {/* Games grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game, idx) => {
          const Ic = game.icon;
          return (
            <Link key={game.id}
              href={game.href}
              onClick={() => playClick()}
              className="group relative h-full rounded-3xl border-2 p-5 transition-all duration-300 hover:-translate-y-1.5 active:scale-95 flex flex-col"
              style={{ 
                borderColor: 'var(--theme-border)', 
                backgroundColor: 'var(--theme-bg-card)',
                animation: `slideUp .4s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.05}s both`
              }}>

              {/* Hover Glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl pointer-events-none"
                style={{ boxShadow: `0 12px 30px ${game.color}10` }} />

              {/* Special Badge */}
              {game.badge && (
                <div className="absolute top-4 right-4 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest text-white shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${game.color}, ${game.color}cc)` }}>
                  {game.badge}
                </div>
              )}

              <div className="flex items-start gap-4 flex-1">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 group-hover:scale-110"
                  style={{ 
                    background: `${game.color}10`,
                    border: `1px solid ${game.color}20`
                  }}>
                  <Ic size={22} style={{ color: game.color }} />
                </div>

                <div className="min-w-0">
                  <h3 className="text-base font-black mb-1 tracking-tight truncate" style={{ color: 'var(--theme-text-primary)' }}>
                    {game.name}
                  </h3>
                  <p className="text-xs font-medium leading-relaxed opacity-60 line-clamp-2" style={{ color: 'var(--theme-text-muted)' }}>
                    {game.description}
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="mt-4 pt-4 border-t border-dashed flex items-center justify-between" style={{ borderColor: 'var(--theme-border)' }}>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-all"
                  style={{ color: game.color }}>
                  Chơi ngay <IconChevronRight size={12} />
                </div>
                <IconZap size={16} className="opacity-20 group-hover:opacity-100 transition-opacity" style={{ color: game.color }} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Tips Section */}
      <div className="mt-12 relative rounded-3xl p-8 border-2 overflow-hidden shadow-sm"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        
        {/* Background watermark */}
        <IconLightbulb size={120} className="absolute -right-10 -bottom-10 opacity-[0.02] rotate-12" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
              <IconLightbulb size={20} className="text-white" />
            </div>
            <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
              Mẹo chinh phục
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: IconKeyboard, title: 'Phím tắt', text: <>Dùng <KBD>1</KBD> <KBD>2</KBD> <KBD>3</KBD> để trả lời nhanh.</>, color: ACCENT.srs },
              { icon: IconFlame, title: 'Chuỗi Combo', text: 'Nhân điểm tối đa x4 khi trả lời đúng liên tiếp.', color: STATUS.danger },
              { icon: IconBookOpen, title: 'Kết hợp SRS', text: 'Ôn tập từ vựng trước sẽ giúp đạt điểm cao hơn.', color: ACCENT.xp },
              { icon: IconZap, title: 'Tùy chỉnh', text: 'Thay đổi số câu hỏi hoặc thời gian trong Cài đặt.', color: ACCENT.vocab },
            ].map((tip, i) => {
              const TipIcon = tip.icon;
              return (
                <div key={i} className="flex gap-4 group/tip">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${tip.color}10`, border: `1px solid ${tip.color}15` }}>
                    <TipIcon size={18} style={{ color: tip.color }} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm mb-0.5" style={{ color: 'var(--theme-text-primary)' }}>{tip.title}</h4>
                    <p className="text-xs font-medium opacity-60 leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{tip.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}

