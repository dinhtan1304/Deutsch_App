'use client';
/* eslint-disable no-restricted-syntax */

import Link from 'next/link';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import {
  IconLayers, IconBook,
  IconBrain, IconArrowRight, IconZap, IconGraduationCap, IconRotateCcw,
} from '@/components/ui/Icons';

interface QuickActionsProps {
  wordsToReview: number;
}

const actions = [
  {
    icon: IconLayers,
    label: 'Học chủ đề',
    description: '12 chủ đề A1',
    href: '/topics',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,.1), rgba(168,85,247,.06))',
    iconBg: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
    accent: ACCENT.vocab,
  },
  {
    icon: IconBook,
    label: 'Từ điển',
    description: 'Tra cứu từ vựng',
    href: '/words',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,.1), rgba(251,191,36,.06))',
    iconBg: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
    accent: ACCENT.xp,
  },
  {
    icon: IconGraduationCap,
    label: 'Luyện đề',
    description: 'Goethe & TELC',
    href: '/practice-test',
    gradient: 'linear-gradient(135deg, rgba(236,72,153,.1), rgba(168,85,247,.06))',
    iconBg: 'linear-gradient(135deg, #EC4899, #A855F7)',
    accent: ACCENT.listening,
  },
  {
    icon: IconRotateCcw,
    label: 'SRS',
    description: 'Ôn tập thẻ nhớ',
    href: '/srs',
    gradient: 'linear-gradient(135deg, rgba(6,182,212,.1), rgba(14,165,233,.06))',
    iconBg: 'linear-gradient(135deg, #06B6D4, #0EA5E9)',
    accent: ACCENT.cyan,
  },
];

export function QuickActions({ wordsToReview }: QuickActionsProps) {
  return (
    <div
      className="p-5 rounded-card border shadow-card flex flex-col h-full"
      style={{
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #FBBF24, #F97316)' }}>
          <IconZap size={15} className="text-white" />
        </div>
        <h3 className="text-title font-bold m-0" style={{ color: 'var(--theme-text-primary)' }}>
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
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0
            transition-transform duration-300 group-hover:scale-110">
            <IconBrain size={22} className="text-white" />
          </div>
          <div className="flex-1 text-white min-w-0">
            <div className="font-bold text-[15px] truncate">Ôn tập ngay!</div>
            <div className="text-[12.5px] opacity-85 truncate">
              {wordsToReview} từ cần ôn tập
            </div>
          </div>
          <IconArrowRight size={20} className="text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 shrink-0" />
        </Link>
      )}

      {/* Action grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 mt-auto">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <Link
              key={i}
              href={action.href}
              className="group flex items-center gap-3 p-3 rounded-xl
                transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md border border-transparent hover:border-black/5 dark:hover:border-white/5"
              style={{ background: action.gradient }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                  shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                style={{ background: action.iconBg }}
              >
                <Icon size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-body font-semibold truncate" style={{ color: action.accent }}>
                  {action.label}
                </div>
                <div className="text-[11px] leading-tight opacity-80" style={{ color: 'var(--theme-text-muted)' }}>
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