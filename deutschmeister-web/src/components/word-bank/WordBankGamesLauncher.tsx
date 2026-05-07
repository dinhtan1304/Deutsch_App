'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PersonalWord } from '@/types/personalWord';
import { canPlayGame } from '@/lib/personalWordAdapter';
import { ACCENT, STATUS } from '@/lib/tokens';
import {
  IconLayers, IconTarget, IconSpellCheck, IconLink, IconZap,
  IconPenTool, IconHeadphones, IconClock, IconChevronDown,
} from '@/components/ui/Icons';

interface GameConfig {
  id: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
}

const GAMES: GameConfig[] = [
  { id: 'flashcards',    label: 'Flashcards',      Icon: IconLayers,     color: STATUS.success },
  { id: 'word-match',    label: 'Ghép từ',          Icon: IconLink,       color: ACCENT.cyan },
  { id: 'spelling',      label: 'Đánh vần',         Icon: IconSpellCheck, color: ACCENT.listening },
  { id: 'listening',     label: 'Nghe hiểu',        Icon: IconHeadphones, color: ACCENT.srs },
  { id: 'gender-quiz',   label: 'Mạo từ',           Icon: IconTarget,     color: ACCENT.vocab },
  { id: 'quick-quiz',    label: 'Trắc nghiệm',      Icon: IconZap,        color: ACCENT.games },
  { id: 'fill-blank',    label: 'Điền từ',          Icon: IconPenTool,    color: ACCENT.xp },
  { id: 'time-challenge',label: 'Đua thời gian',    Icon: IconClock,      color: STATUS.danger },
];

interface Props {
  collectionId?: string;
  words: PersonalWord[];
}

export function WordBankGamesLauncher({ collectionId, words }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const buildHref = (gameId: string) => {
    const base = `/games/${gameId}?source=wordbank`;
    return collectionId ? `${base}&collectionId=${collectionId}` : base;
  };

  return (
    <div className="rounded-2xl border mb-4 overflow-hidden"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <IconLayers size={14} style={{ color: ACCENT.vocab }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
            Luyện tập với từ này
          </span>
          {collectionId && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${ACCENT.vocab}20`, color: ACCENT.vocab }}>
              bộ sưu tập
            </span>
          )}
        </div>
        <IconChevronDown size={14}
          style={{
            color: 'var(--theme-text-muted)',
            transform: collapsed ? 'rotate(-90deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 grid grid-cols-4 sm:grid-cols-8 gap-2">
          {GAMES.map(({ id, label, Icon, color }) => {
            const { canPlay, reason } = canPlayGame(id, words);
            const href = buildHref(id);

            if (!canPlay) {
              return (
                <div key={id} title={reason} className="relative group">
                  <div
                    className="flex flex-col items-center gap-1 px-2 py-3 rounded-xl cursor-not-allowed opacity-40"
                    style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
                  >
                    <Icon size={18} style={{ color }} />
                    <span className="text-[10px] font-medium text-center leading-tight"
                      style={{ color: 'var(--theme-text-muted)' }}>
                      {label}
                    </span>
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded-lg text-[10px] text-white whitespace-nowrap
                    opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"
                    style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
                    {reason}
                  </div>
                </div>
              );
            }

            return (
              <Link key={id} href={href}>
                <div
                  className="flex flex-col items-center gap-1 px-2 py-3 rounded-xl transition-all
                    hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Icon size={18} style={{ color }} />
                  <span className="text-[10px] font-semibold text-center leading-tight"
                    style={{ color }}>
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
