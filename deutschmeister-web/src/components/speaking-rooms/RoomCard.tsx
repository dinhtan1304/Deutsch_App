'use client';

import { useTranslations } from 'next-intl';
import type { SpeakingRoom, SpeakingRoomStatus } from '@/lib/api/speakingRooms';
import { ACCENT } from '@/lib/tokens';

interface Props {
  room: SpeakingRoom;
  onJoin?: () => void;
  onReopen?: () => void;
  loading?: boolean;
  variant?: 'public' | 'mine';
}

const STATUS_STYLE: Record<SpeakingRoomStatus, { labelKey: string; bg: string; color: string }> = {
  WAITING: { labelKey: 'statusWaiting', bg: '#22C55E1A', color: '#16A34A' },
  ACTIVE: { labelKey: 'statusActive', bg: '#A855F71A', color: '#9333EA' },
  CLOSED: { labelKey: 'statusClosed', bg: '#9CA3AF1A', color: '#6B7280' },
};

export function RoomCard({ room, onJoin, onReopen, loading, variant = 'public' }: Props) {
  const t = useTranslations('speakingRooms.components');
  const activeCount = room.participants.filter((p) => !p.leftAt).length;
  const isFull = activeCount >= room.maxSeats;
  const isClosed = room.status === 'CLOSED';
  const showStatusBadge = variant === 'mine';
  const status = STATUS_STYLE[room.status];

  const handleClick = () => {
    if (isClosed && onReopen) {
      onReopen();
    } else if (onJoin) {
      onJoin();
    }
  };

  const buttonLabel = isClosed
    ? t('reopen')
    : variant === 'mine'
      ? t('rejoin')
      : isFull
        ? t('full')
        : t('join');

  const buttonDisabled = loading || (!isClosed && isFull) || (isClosed ? !onReopen : !onJoin);

  return (
    <div
      className="p-4 rounded-2xl border flex items-center gap-3"
      style={{
        backgroundColor: 'var(--theme-bg-card)',
        borderColor: 'var(--theme-border)',
        opacity: isClosed ? 0.85 : 1,
      }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${ACCENT.speaking}1A`, color: ACCENT.speaking }}
      >
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span
            className="px-2 py-0.5 rounded text-xs font-bold"
            style={{ backgroundColor: `${ACCENT.speaking}1A`, color: ACCENT.speaking }}
          >
            {room.cefrLevel}
          </span>
          {showStatusBadge && (
            <span
              className="px-2 py-0.5 rounded text-xs font-bold"
              style={{ backgroundColor: status.bg, color: status.color }}
            >
              {t(status.labelKey as 'statusWaiting')}
            </span>
          )}
          <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
            {t('seats', { count: activeCount, max: room.maxSeats })}
          </span>
        </div>
        <p className="font-bold truncate" style={{ color: 'var(--theme-text-primary)' }}>
          {room.title}
        </p>
        <p className="text-caption truncate" style={{ color: 'var(--theme-text-muted)' }}>
          {t('topicPrefix', { topic: room.topic })}
        </p>
      </div>
      <button
        onClick={handleClick}
        disabled={buttonDisabled}
        className="px-4 py-2 rounded-lg font-bold text-sm text-white disabled:opacity-50 whitespace-nowrap"
        style={{ backgroundColor: ACCENT.speaking }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
