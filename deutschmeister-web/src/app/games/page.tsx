'use client';

import Link from 'next/link';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import {
  IconGamepad, IconTarget, IconClock, IconPenTool, IconLayers,
  IconBookOpen, IconLink, IconHeadphones, IconSpellCheck,
  IconLightbulb, IconKeyboard, IconFlame, IconZap, KBD,
} from '@/components/games/GameUI';

const games = [
  { id: 'gender-quiz', name: 'Gender Quiz', description: 'Chọn mạo từ đúng (der/die/das) cho mỗi từ',
    icon: IconTarget, color: '#3B82F6', href: '/games/gender-quiz' },
  { id: 'timed-challenge', name: 'Timed Challenge', description: 'Trả lời nhanh nhất có thể trong thời gian giới hạn',
    icon: IconClock, color: '#EF4444', href: '/games/time-challenge' },
  { id: 'fill-blank', name: 'Fill in the Blank', description: 'Điền mạo từ đúng vào chỗ trống',
    icon: IconPenTool, color: '#8B5CF6', href: '/games/fill-blank' },
  { id: 'flashcards', name: 'Flashcards', description: 'Học từ vựng với thẻ ghi nhớ',
    icon: IconLayers, color: '#22C55E', href: '/games/flashcards' },
  { id: 'srs-review', name: 'SRS Review', description: 'Ôn tập thông minh với thuật toán SM-2',
    icon: IconBookOpen, color: '#F59E0B', href: '/review', badge: 'SM-2' },
  { id: 'word-match', name: 'Word Match', description: 'Ghép từ với nghĩa tương ứng',
    icon: IconLink, color: '#06B6D4', href: '/games/word-match' },
  { id: 'listening', name: 'Listening Quiz', description: 'Nghe và chọn từ đúng',
    icon: IconHeadphones, color: '#F97316', href: '/games/listening' },
  { id: 'spelling', name: 'Spelling Bee', description: 'Viết đúng chính tả từ tiếng Đức',
    icon: IconSpellCheck, color: '#EC4899', href: '/games/spelling' },
];

export default function GamesPage() {
  const { playClick } = useSoundEffects();

  return (
      <div className="py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
            <IconGamepad size={22} style={{ color: 'white' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>Trò chơi</h1>
            <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
              Học tiếng Đức qua các trò chơi thú vị
            </p>
          </div>
        </div>

        {/* Games grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map(game => {
            const Ic = game.icon;
            return (
              <Link key={game.id}
                href={game.href}
                onClick={() => playClick()}
                className="group relative overflow-hidden rounded-card border shadow-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-hero"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>

                {/* Hover overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(135deg, ${game.color}06, ${game.color}03)` }} />

                {/* Decorative circle */}
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: game.color, opacity: 0.04 }} />

                {/* Special Badge */}
                {game.badge && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-caption font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${game.color}, ${game.color}cc)` }}>
                    {game.badge}
                  </div>
                )}

                {/* Icon */}
                <div className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-3
                  transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${game.color}20, ${game.color}10)` }}>
                  <Ic size={22} style={{ color: game.color }} />
                </div>

                {/* Content */}
                <h3 className="relative text-base font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
                  {game.name}
                </h3>
                <p className="relative text-xs leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                  {game.description}
                </p>

                {/* Play hint */}
                <div className="relative mt-3 text-xs font-semibold opacity-0 group-hover:opacity-100
                  transition-all duration-300 translate-y-1 group-hover:translate-y-0"
                  style={{ color: game.color }}>
                  Chơi ngay →
                </div>
              </Link>
            );
          })}
        </div>

        {/* Tips */}
        <div className="mt-8 p-5 rounded-card border shadow-card"
          style={{ backgroundColor: 'rgba(59,130,246,.03)', borderColor: 'rgba(59,130,246,.1)' }}>
          <h3 className="text-title font-bold mb-4 flex items-center gap-2"
            style={{ color: 'var(--theme-text-primary)' }}>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,.15), rgba(245,158,11,.08))' }}>
              <IconLightbulb size={15} style={{ color: '#F59E0B' }} />
            </span>
            Mẹo
          </h3>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {[
              { icon: IconKeyboard, text: <>Dùng phím <KBD>1</KBD> <KBD>2</KBD> <KBD>3</KBD> để trả lời nhanh</>, color: '#3B82F6' },
              { icon: IconFlame, text: 'Combo liên tiếp sẽ được nhân điểm (tối đa x4)', color: '#EF4444' },
              { icon: IconBookOpen, text: 'SRS Review dùng thuật toán SM-2 giúp nhớ từ lâu hơn', color: '#F59E0B' },
              { icon: IconZap, text: 'Thay đổi số câu hỏi và thời gian trong Settings', color: '#8B5CF6' },
            ].map((tip, i) => {
              const TipIcon = tip.icon;
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${tip.color}12` }}>
                    <TipIcon size={13} style={{ color: tip.color }} />
                  </span>
                  <span className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>{tip.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
  );
}

