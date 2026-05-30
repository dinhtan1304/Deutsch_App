'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { User } from '@/lib/api/auth';
import type { SpeakingRoomStats } from '@/lib/api/speakingRooms';
import { ACCENT } from '@/lib/tokens';
import { CommunityRules } from './CommunityRules';

function formatDuration(seconds = 0) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function StatItem({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 px-2 text-center">
      <div
        className="mb-1 flex h-8 w-8 items-center justify-center rounded-full border"
        style={{ borderColor: `${ACCENT.speaking}80`, color: ACCENT.speaking, backgroundColor: `${ACCENT.speaking}12` }}
      >
        {icon}
      </div>
      <div className="text-xl font-extrabold leading-none" style={{ color: 'var(--theme-text-primary)' }}>
        {value}
      </div>
      <div className="text-caption" style={{ color: ACCENT.speaking }}>
        {label}
      </div>
    </div>
  );
}

export function SpeakingRoomsActivityBar({ stats }: { stats?: SpeakingRoomStats }) {
  const t = useTranslations('speakingRooms.components');
  return (
    <div className="my-4 flex flex-wrap items-center justify-center gap-3 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
      <div className="inline-flex items-center gap-2">
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ACCENT.speaking} strokeWidth={2}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <strong style={{ color: ACCENT.speaking }}>{stats?.onlineCount ?? 0}</strong>
        <span>{t('chatting')}</span>
      </div>
      <span className="hidden h-4 w-px sm:block" style={{ backgroundColor: 'var(--theme-border)' }} />
      <div className="inline-flex items-center gap-2">
        <strong style={{ color: ACCENT.speaking }}>{stats?.waitingRooms ?? 0}</strong>
        <span>{t('waitingRooms')}</span>
      </div>
      <span className="hidden h-4 w-px sm:block" style={{ backgroundColor: 'var(--theme-border)' }} />
      <CommunityRules />
    </div>
  );
}

export function SpeakingRoomStatsCard({ stats, user }: { stats?: SpeakingRoomStats; user?: User | null }) {
  const t = useTranslations('speakingRooms.components');
  const name = user?.name || t('you');
  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      className="my-4 rounded-2xl border p-4"
      style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: `${ACCENT.speaking}40` }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border text-sm font-bold"
          style={{ borderColor: `${ACCENT.speaking}55`, color: ACCENT.speaking, backgroundColor: `${ACCENT.speaking}14` }}
        >
          {user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt={name} className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <div>
          <p className="font-bold leading-tight" style={{ color: 'var(--theme-text-primary)' }}>
            {name}
          </p>
          <p className="text-caption" style={{ color: ACCENT.speaking }}>
            {t('yourStats')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'var(--theme-border)' }}>
        <StatItem
          icon={<svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.19 19 19.5 19.5 0 0 1 5 12.81 19.79 19.79 0 0 1 2.11 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.61a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.47-1.19a2 2 0 0 1 2.11-.45c.84.29 1.71.5 2.61.62A2 2 0 0 1 22 16.92z" /></svg>}
          value={stats?.my.sessions ?? 0}
          label={t('statSessions')}
        />
        <StatItem
          icon={<svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
          value={formatDuration(stats?.my.roomSeconds ?? 0)}
          label={t('statRoomTime')}
        />
        <StatItem
          icon={<svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /></svg>}
          value={stats?.my.messages ?? 0}
          label={t('statMessages')}
        />
      </div>
    </div>
  );
}
