'use client';

import Link from 'next/link';
import {
  IconGamepad, IconCards, IconLayers, IconBook,
  IconBrain, IconArrowRight, IconZap,
} from '@/components/ui/Icons';

interface QuickActionsProps {
  wordsToReview: number;
}

const actions = [
  {
    icon: IconGamepad,
    label: 'Quick Quiz',
    description: 'Luyện Der/Die/Das',
    href: '/games/quick-quiz',
    gradient: 'linear-gradient(135deg, rgba(59,130,246,.1), rgba(99,102,241,.06))',
    iconBg: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    accent: '#3B82F6',
  },
  {
    icon: IconCards,
    label: 'Flashcards',
    description: 'Thẻ ghi nhớ',
    href: '/games/flashcards',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,.1), rgba(52,211,153,.06))',
    iconBg: 'linear-gradient(135deg, #10B981, #34D399)',
    accent: '#10B981',
  },
  {
    icon: IconLayers,
    label: 'Học chủ đề',
    description: '12 chủ đề A1',
    href: '/topics',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,.1), rgba(168,85,247,.06))',
    iconBg: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
    accent: '#8B5CF6',
  },
  {
    icon: IconBook,
    label: 'Từ điển',
    description: 'Tra cứu từ vựng',
    href: '/words',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,.1), rgba(251,191,36,.06))',
    iconBg: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
    accent: '#F59E0B',
  },
];

export function QuickActions({ wordsToReview }: QuickActionsProps) {
  return (
    <div
      className="p-5 rounded-2xl border"
      style={{
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #FBBF24, #F97316)' }}>
          <IconZap size={15} className="text-white" />
        </div>
        <h3 className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
          Hành động nhanh
        </h3>
      </div>

      {/* Review reminder */}
      {wordsToReview > 0 && (
        <Link
          href="/srs"
          className="group flex items-center gap-3 p-4 rounded-xl mb-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #F97316 0%, #FBBF24 100%)' }}
        >
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center
            transition-transform duration-300 group-hover:scale-110">
            <IconBrain size={22} className="text-white" />
          </div>
          <div className="flex-1 text-white">
            <div className="font-bold text-[15px]">Ôn tập ngay!</div>
            <div className="text-[12.5px] opacity-85">
              {wordsToReview} từ cần ôn tập hôm nay
            </div>
          </div>
          <IconArrowRight size={20} className="text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
        </Link>
      )}

      {/* Action grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <Link
              key={i}
              href={action.href}
              className="group flex items-center gap-2.5 p-3.5 rounded-xl
                transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              style={{ background: action.gradient }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                  shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                style={{ background: action.iconBg }}
              >
                <Icon size={17} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold truncate" style={{ color: action.accent }}>
                  {action.label}
                </div>
                <div className="text-[11px] truncate" style={{ color: 'var(--theme-text-muted)' }}>
                  {action.description}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}