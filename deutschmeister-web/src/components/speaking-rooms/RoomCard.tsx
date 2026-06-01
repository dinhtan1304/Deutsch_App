'use client';

import { useTranslations, useNow } from 'next-intl';
import type { SpeakingRoom } from '@/lib/api/speakingRooms';

// Real topic ids (speakingRooms.topics.*) → accent CSS var.
const TOPIC_COLOR: Record<string, string> = {
  dailyLife: 'var(--cyan)', work: 'var(--streak)', travel: 'var(--success)',
  study: 'var(--der)', family: 'var(--die)', hobbies: 'var(--violet)',
  shopping: 'var(--warn)', health: 'var(--success)', food: 'var(--streak)',
};

interface Props {
  room: SpeakingRoom;
  onJoin?: () => void;
  onReopen?: () => void;
  loading?: boolean;
  variant?: 'public' | 'mine';
}

function IconArrowRight({ size = 11 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
}
function IconClock({ size = 11 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M10 5v5l3 2M3 10a7 7 0 1 0 14 0 7 7 0 0 0-14 0Z" /></svg>;
}

export function RoomCard({ room, onJoin, onReopen, loading, variant = 'public' }: Props) {
  const t = useTranslations('speakingRooms.components');
  const tTopics = useTranslations('speakingRooms.topics');
  const now = useNow();

  const activeCount = room.participants.filter((p) => !p.leftAt).length;
  const isFull = activeCount >= room.maxSeats;
  const isClosed = room.status === 'CLOSED';
  const tColor = TOPIC_COLOR[room.topic] ?? 'var(--accent)';

  // Display status priority: closed > full > active/waiting.
  const sColor = isClosed ? 'var(--theme-text-muted)' : isFull ? 'var(--danger)' : room.status === 'ACTIVE' ? 'var(--success)' : 'var(--warn)';
  const sLabel = isClosed ? t('statusClosed') : isFull ? t('full') : room.status === 'ACTIVE' ? t('statusActive') : t('statusWaiting');
  const pulse = room.status === 'ACTIVE' && !isFull && !isClosed;

  const host = room.participants.find((p) => p.userId === room.ownerId)?.user;
  const topicLabel = (() => { try { return tTopics(room.topic as 'dailyLife'); } catch { return room.topic; } })();

  const startRef = room.startedAt ?? room.createdAt;
  const minutes = Math.max(0, Math.round((now.getTime() - new Date(startRef).getTime()) / 60000));

  const handleClick = () => { if (isClosed && onReopen) onReopen(); else if (onJoin) onJoin(); };
  const buttonLabel = isClosed ? t('reopen') : variant === 'mine' ? t('rejoin') : isFull ? t('full') : t('join');
  const buttonDisabled = loading || (!isClosed && isFull) || (isClosed ? !onReopen : !onJoin);

  return (
    <article
      className="word-card-v2 relative flex h-full flex-col gap-3 overflow-hidden rounded-[13px] p-4"
      style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', opacity: isClosed ? 0.7 : 1, ['--card-accent' as string]: tColor } as React.CSSProperties}
    >
      {/* header: level + topic + status */}
      <header className="flex flex-wrap items-center gap-1.5">
        <span className="mono rounded-[5px] px-1.5 py-0.5 text-[10.5px] font-bold" style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>{room.cefrLevel}</span>
        <span className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 text-[11px] font-medium" style={{ background: `color-mix(in srgb, ${tColor} 16%, transparent)`, color: tColor }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: tColor }} />{topicLabel}
        </span>
        <span className="flex-1" />
        <span className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: `color-mix(in srgb, ${sColor} 16%, transparent)`, color: sColor, letterSpacing: '.04em' }}>
          <span className={`h-1.5 w-1.5 rounded-full ${pulse ? 'v2-pulse' : ''}`} style={{ background: sColor }} />{sLabel}
        </span>
      </header>

      {/* title */}
      <h3 className="text-h3 font-bold leading-snug" style={{ letterSpacing: '-.01em', color: 'var(--theme-text-primary)' }}>{room.title}</h3>

      {/* host */}
      {variant === 'public' && host && (
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold text-white" style={{ background: `linear-gradient(135deg, ${tColor}, color-mix(in srgb, ${tColor} 65%, transparent))` }}>
            {(host.name ?? '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-caption font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{host.name ?? '—'}</div>
            <div className="text-[10.5px]" style={{ color: 'var(--theme-text-muted)' }}>Host · {room.cefrLevel}</div>
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* footer: participant dots + duration + join */}
      <footer className="flex items-center justify-between gap-2 border-t border-dashed pt-3" style={{ borderColor: 'var(--theme-border)' }}>
        <div className="flex items-center gap-2.5 text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>
          <span className="inline-flex items-center gap-1.5">
            <span className="flex gap-0.5">
              {Array.from({ length: Math.min(room.maxSeats, 8) }).map((_, i) => (
                <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: i < activeCount ? (room.status === 'ACTIVE' ? 'var(--success)' : 'var(--warn)') : 'var(--theme-bg-tertiary)' }} />
              ))}
            </span>
            <span className="mono">{activeCount}/{room.maxSeats}</span>
          </span>
          <span className="h-2.5 w-px" style={{ background: 'var(--theme-border)' }} />
          <span className="mono inline-flex items-center gap-1"><IconClock size={11} />{minutes} {t('minutesShort')}</span>
        </div>
        <button
          onClick={handleClick}
          disabled={buttonDisabled}
          className="v2-game-cta inline-flex h-8 items-center gap-1.5 rounded-[7px] px-3 text-caption font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          style={{ ['--gc' as string]: tColor } as React.CSSProperties}
        >
          {buttonLabel}{!buttonDisabled && <IconArrowRight size={11} />}
        </button>
      </footer>
    </article>
  );
}
