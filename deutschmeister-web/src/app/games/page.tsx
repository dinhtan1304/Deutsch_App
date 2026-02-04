'use client';

import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { useSoundEffects } from '@/hooks/useSoundEffects';

const games = [
  {
    id: 'gender-quiz',
    name: 'Gender Quiz',
    description: 'Chọn mạo từ đúng (der/die/das) cho mỗi từ',
    icon: '🎯',
    color: '#3b82f6',
    href: '/games/gender-quiz',
  },
  {
    id: 'timed-challenge',
    name: 'Timed Challenge',
    description: 'Trả lời nhanh nhất có thể trong thời gian giới hạn',
    icon: '⏱️',
    color: '#ef4444',
    href: '/games/timed-challenge',
  },
  {
    id: 'fill-blank',
    name: 'Fill in the Blank',
    description: 'Điền mạo từ đúng vào chỗ trống',
    icon: '✍️',
    color: '#8b5cf6',
    href: '/games/fill-blank',
  },
  {
    id: 'flashcards',
    name: 'Flashcards',
    description: 'Học từ vựng với thẻ ghi nhớ',
    icon: '🃏',
    color: '#10b981',
    href: '/games/flashcards',
  },
  {
    id: 'srs-review',
    name: 'SRS Review',
    description: 'Ôn tập thông minh với thuật toán SM-2',
    icon: '📚',
    color: '#f59e0b',
    href: '/review',
    badge: 'SM-2',
  },
  {
    id: 'word-match',
    name: 'Word Match',
    description: 'Ghép từ với nghĩa tương ứng',
    icon: '🔗',
    color: '#06b6d4',
    href: '/games/word-match',
    comingSoon: true,
  },
  {
    id: 'listening',
    name: 'Listening Quiz',
    description: 'Nghe và chọn từ đúng',
    icon: '👂',
    color: '#f97316',
    href: '/games/listening',
    comingSoon: true,
  },
  {
    id: 'spelling',
    name: 'Spelling Bee',
    description: 'Viết đúng chính tả từ tiếng Đức',
    icon: '✏️',
    color: '#ec4899',
    href: '/games/spelling',
    comingSoon: true,
  },
];

export default function GamesPage() {
  const { playClick } = useSoundEffects();

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🎮 Trò chơi
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Học tiếng Đức qua các trò chơi thú vị
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <Link
              key={game.id}
              href={game.comingSoon ? '#' : game.href}
              onClick={() => !game.comingSoon && playClick()}
              className={`group relative p-6 rounded-2xl transition-all duration-300 ${
                game.comingSoon 
                  ? 'cursor-not-allowed opacity-60' 
                  : 'hover:scale-105 hover:shadow-xl'
              }`}
              style={{ 
                backgroundColor: 'var(--theme-bg-card, #ffffff)',
                borderLeft: `4px solid ${game.color}`,
              }}
            >
              {/* Coming Soon Badge */}
              {game.comingSoon && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-gray-500 text-white text-xs rounded-full">
                  Sắp ra mắt
                </div>
              )}

              {/* Special Badge */}
              {game.badge && !game.comingSoon && (
                <div 
                  className="absolute top-3 right-3 px-2 py-1 text-white text-xs rounded-full font-bold"
                  style={{ backgroundColor: game.color }}
                >
                  {game.badge}
                </div>
              )}

              {/* Icon */}
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${game.color}20` }}
              >
                {game.icon}
              </div>

              {/* Title */}
              <h3 
                className="text-xl font-bold mb-2"
                style={{ color: 'var(--theme-text-primary, #111827)' }}
              >
                {game.name}
              </h3>

              {/* Description */}
              <p 
                className="text-sm"
                style={{ color: 'var(--theme-text-secondary, #6b7280)' }}
              >
                {game.description}
              </p>

              {/* Play hint */}
              {!game.comingSoon && (
                <div 
                  className="mt-4 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: game.color }}
                >
                  Chơi ngay →
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* Tips */}
        <div 
          className="mt-8 p-4 rounded-xl"
          style={{ 
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}
        >
          <h3 className="font-bold text-blue-600 dark:text-blue-400 mb-2">💡 Mẹo</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Dùng phím <kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded">1</kbd> <kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded">2</kbd> <kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded">3</kbd> để trả lời nhanh</li>
            <li>• Combo liên tiếp sẽ được nhân điểm (tối đa x4)</li>
            <li>• <strong>SRS Review</strong> dùng thuật toán SM-2 giúp nhớ từ lâu hơn</li>
            <li>• Thay đổi số câu hỏi và thời gian trong Settings</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}