'use client';

import { STATUS } from '@/lib/tokens';

function getScoreColor(s: number) {
  if (s >= 80) return STATUS.success;
  if (s >= 60) return STATUS.warning;
  return STATUS.danger;
}

function getScoreEmoji(s: number) {
  if (s >= 90) return '🌟';
  if (s >= 80) return '✨';
  if (s >= 60) return '👍';
  return '💪';
}

interface Props {
  score: number;
  size?: 'sm' | 'md';
}

export function PhraseScoreBadge({ score, size = 'md' }: Props) {
  const color = getScoreColor(score);
  const emoji = getScoreEmoji(score);
  const isSm = size === 'sm';

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-black ${isSm ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'}`}
      style={{
        backgroundColor: `${color}1A`,
        color,
        border: `1px solid ${color}33`,
      }}
    >
      <span>{emoji}</span>
      <span className="tabular-nums">{Math.round(score)}</span>
      <span className="opacity-50">/100</span>
    </div>
  );
}
