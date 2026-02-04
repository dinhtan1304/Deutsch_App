'use client';

import Link from 'next/link';

interface QuickActionsProps {
  wordsToReview: number;
}

const actions = [
  {
    icon: '🎮',
    label: 'Chơi Quick Quiz',
    description: 'Luyện tập Der/Die/Das',
    href: '/games/quick-quiz',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
  },
  {
    icon: '🃏',
    label: 'Flashcards',
    description: 'Học với thẻ ghi nhớ',
    href: '/games/flashcards',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
  },
  {
    icon: '📚',
    label: 'Học chủ đề',
    description: '12 chủ đề A1',
    href: '/topics',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
  },
  {
    icon: '📖',
    label: 'Từ điển',
    description: 'Tra cứu từ vựng',
    href: '/dictionary',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
];

export function QuickActions({ wordsToReview }: QuickActionsProps) {
  return (
    <div
      className="p-6 rounded-2xl border"
      style={{
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
      }}
    >
      {/* Header */}
      <h3
        className="text-lg font-bold mb-4"
        style={{ color: 'var(--theme-text-primary)' }}
      >
        ⚡ Hành động nhanh
      </h3>

      {/* Review reminder */}
      {wordsToReview > 0 && (
        <Link
          href="/srs"
          className="flex items-center gap-3 p-4 rounded-xl mb-4 transition-all hover:scale-[1.02]"
          style={{
            background: 'linear-gradient(135deg, #F97316 0%, #FBBF24 100%)',
          }}
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
            🧠
          </div>
          <div className="flex-1 text-white">
            <div className="font-bold text-lg">Ôn tập ngay!</div>
            <div className="text-sm opacity-90">
              {wordsToReview} từ cần ôn tập hôm nay
            </div>
          </div>
          <div className="text-white text-2xl">→</div>
        </Link>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.02] hover:shadow-md"
            style={{ backgroundColor: action.bgColor }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: `${action.color}20` }}
            >
              {action.icon}
            </div>
            <div>
              <div className="font-medium text-sm" style={{ color: action.color }}>
                {action.label}
              </div>
              <div className="text-xs text-gray-500">{action.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}