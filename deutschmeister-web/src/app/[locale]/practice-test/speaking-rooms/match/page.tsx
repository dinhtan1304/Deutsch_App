'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { ACCENT, GRADIENT } from '@/lib/tokens';
import { useAuthStore } from '@/stores/authStore';
import { useEnqueueMatch, useDequeueMatch, useMyQueueEntry, useSpeakingRoomStats } from '@/hooks/useSpeakingRooms';
import { useSpeakingRoomPresence } from '@/hooks/useSpeakingRoomSocket';
import { getApiErrorMessage } from '@/lib/api/client';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
const TOPIC_KEYS = ['travel', 'family', 'work', 'hobbies', 'food', 'study'] as const;
const TOPIC_KEY_COLOR: Record<string, string> = {
  travel: 'var(--success)', family: 'var(--die)', work: 'var(--streak)',
  hobbies: 'var(--violet)', food: 'var(--die)', study: 'var(--der)',
};
const MATCH_QUEUE_TTL_SECONDS = 180;

function fmtDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function IconUsers({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M7 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm0 1.5a4 4 0 0 0-4 4M14 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm0 1.5a4 4 0 0 1 4 4M11 14.5a4 4 0 0 0-4-4 4 4 0 0 0-4 4" /></svg>;
}
function IconClock({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M10 5v5l3 2M3 10a7 7 0 1 0 14 0 7 7 0 0 0-14 0Z" /></svg>;
}
function IconChat({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8l-4 3V5a1 1 0 0 1 1-1Z" /></svg>;
}
function StatCell({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>{icon}</div>
      <span className="mono text-h2 font-extrabold" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{value}</span>
      <span className="text-[10.5px] font-semibold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.04em' }}>{label}</span>
    </div>
  );
}

export default function MatchmakingPage() {
  const t = useTranslations('speakingRooms');
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [cefrLevel, setCefrLevel] = useState<string>('B1');
  const [topic, setTopic] = useState<string>(() => t('topics.travel'));
  const [searching, setSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const searchingRef = useRef(false);

  const enqueueMut = useEnqueueMatch();
  const dequeueMut = useDequeueMatch();
  const { data: stats } = useSpeakingRoomStats();
  const { data: queueEntry, isFetched: queueFetched } = useMyQueueEntry(searching);

  // Connect socket without joining a room - just to receive 'match:found'.
  const socket = useSpeakingRoomPresence(searching);

  useEffect(() => {
    searchingRef.current = searching;
  }, [searching]);

  useEffect(() => {
    if (!searching) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [searching]);

  useEffect(() => {
    if (!searching || elapsed < MATCH_QUEUE_TTL_SECONDS) return;
    dequeueMut.mutate();
    setSearching(false);
    setElapsed(0);
    setErrorMsg(t('match.timeout'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dequeueMut, elapsed, searching]);

  useEffect(() => {
    if (!searching || !queueFetched || queueEntry !== null) return;
    setSearching(false);
    setElapsed(0);
    setErrorMsg(t('match.expired'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueEntry, queueFetched, searching]);

  useEffect(() => {
    if (!socket) return;
    const onMatchFound = ({ roomId }: { roomId: string }) => {
      router.push(`/practice-test/speaking-rooms/${roomId}`);
    };
    socket.on('match:found', onMatchFound);
    return () => {
      socket.off('match:found', onMatchFound);
    };
  }, [socket, router]);

  useEffect(() => {
    return () => {
      if (searchingRef.current) dequeueMut.mutate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = async () => {
    setErrorMsg('');
    setElapsed(0);
    try {
      const result = await enqueueMut.mutateAsync({ cefrLevel, topic });
      if (result.matched && result.roomId) {
        router.push(`/practice-test/speaking-rooms/${result.roomId}`);
      } else {
        setSearching(true);
      }
    } catch (err) {
      setSearching(false);
      setErrorMsg(getApiErrorMessage(err, t('match.startError')));
    }
  };

  const handleStop = async () => {
    await dequeueMut.mutateAsync();
    setSearching(false);
    setElapsed(0);
  };

  if (searching) {
    return (
      <div className="max-w-360 mx-auto px-4 py-6">
        <PageHeader title={t('match.searchingTitle')} accent="speaking" />
        <div className="my-8 flex flex-col items-center">
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center mb-4 animate-pulse"
            style={{ background: GRADIENT.speaking }}
          >
            <svg width={64} height={64} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
              <path d="M12 1v22M5 8l7-7 7 7M5 16l7 7 7-7" />
            </svg>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--theme-text-muted)' }}>
            {t('match.topicLabel')} <strong>{queueEntry?.topic ?? topic}</strong> · {queueEntry?.cefrLevel ?? cefrLevel}
          </p>
          <p className="text-caption mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            {t('match.matchingNote')}
          </p>
        </div>
        <button
          onClick={handleStop}
          className="w-full py-3 rounded-2xl font-bold border-2"
          style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
        >
          {t('match.cancelSearch')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-360 mx-auto px-4 py-6">
      <PageHeader
        backHref="/practice-test/speaking-rooms"
        title={t('match.title')}
        subtitle={t('match.subtitle')}
        accent="speaking"
      />

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* Left: setup form */}
        <div>
          <div className="mb-6">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--theme-text-muted)' }}>{t('match.level')}</p>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((lvl) => (
                <button key={lvl} onClick={() => setCefrLevel(lvl)}
                  className="mono flex-1 rounded-xl border py-3 text-body font-bold transition-colors"
                  style={cefrLevel === lvl
                    ? { borderColor: ACCENT.speaking, background: `color-mix(in srgb, ${ACCENT.speaking} 14%, transparent)`, color: ACCENT.speaking }
                    : { borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)', color: 'var(--theme-text-secondary)' }}>
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--theme-text-muted)' }}>{t('match.topic')}</p>
            <div className="mb-2.5 flex flex-wrap gap-2">
              {TOPIC_KEYS.map((key) => {
                const label = t(`topics.${key}` as 'topics.travel');
                const color = TOPIC_KEY_COLOR[key] ?? 'var(--accent)';
                const on = topic === label;
                return (
                  <button key={key} onClick={() => setTopic(label)}
                    className="inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-caption font-semibold transition-colors"
                    style={on
                      ? { background: color, color: 'white', border: `1px solid ${color}` }
                      : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: on ? 'white' : color }} />
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex h-11 items-center gap-2 rounded-[10px] px-3" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: TOPIC_KEY_COLOR[TOPIC_KEYS.find((k) => t(`topics.${k}` as 'topics.travel') === topic) ?? ''] ?? 'var(--accent)' }} />
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={t('match.topicPlaceholder')}
                className="min-w-0 flex-1 bg-transparent text-body outline-none" style={{ color: 'var(--theme-text-primary)' }} />
            </div>
          </div>

          {errorMsg && <p className="mb-4 text-caption" style={{ color: 'var(--danger)' }}>{errorMsg}</p>}

          <button onClick={handleStart} disabled={enqueueMut.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            style={{ background: GRADIENT.speaking, boxShadow: '0 6px 18px color-mix(in srgb, var(--streak) 35%, transparent)' }}>
            <svg width={17} height={17} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="m6 4 1.2 2.8L10 8l-2.8 1.2L6 12 4.8 9.2 2 8l2.8-1.2L6 4Zm9 7 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" /></svg>
            {enqueueMut.isPending ? t('match.starting') : t('match.start')}
          </button>

          {/* Live status line */}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
            <span className="inline-flex items-center gap-1.5">
              <IconUsers size={13} />
              <span className="v2-pulse h-1.5 w-1.5 rounded-full" style={{ background: 'var(--success)' }} />
              <span className="mono font-bold" style={{ color: 'var(--theme-text-primary)' }}>{stats?.activeRooms ?? 0}</span> {t('components.chatting')}
            </span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span><span className="mono font-bold" style={{ color: 'var(--theme-text-primary)' }}>{stats?.waitingRooms ?? 0}</span> {t('components.waitingRooms')}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <Link href="/community/rules" className="transition-opacity hover:opacity-80">{t('list.communityRules')}</Link>
          </div>
        </div>

        {/* Right: stats card */}
        <div className="rounded-2xl p-5 lg:sticky lg:top-6 lg:self-start" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl text-body font-bold text-white" style={{ background: GRADIENT.speaking }}>{(user?.name ?? '?').charAt(0).toUpperCase()}</div>
            <div className="min-w-0">
              <div className="truncate text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{user?.name ?? '—'}</div>
              <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t('components.yourStats')}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatCell icon={<IconUsers />} value={stats?.my.sessions ?? 0} label={t('components.statSessions')} color="var(--accent)" />
            <StatCell icon={<IconClock />} value={fmtDuration(stats?.my.roomSeconds ?? 0)} label={t('components.statRoomTime')} color="var(--violet)" />
            <StatCell icon={<IconChat />} value={stats?.my.messages ?? 0} label={t('components.statMessages')} color="var(--warn)" />
          </div>
        </div>
      </div>
    </div>
  );
}
