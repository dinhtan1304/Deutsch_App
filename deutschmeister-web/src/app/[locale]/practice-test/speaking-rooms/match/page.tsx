'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { ACCENT, GRADIENT } from '@/lib/tokens';
import { useAuthStore } from '@/stores/authStore';
import { useEnqueueMatch, useDequeueMatch, useMyQueueEntry, useSpeakingRoomStats } from '@/hooks/useSpeakingRooms';
import { useSpeakingRoomPresence } from '@/hooks/useSpeakingRoomSocket';
import { SpeakingRoomStatsCard, SpeakingRoomsActivityBar } from '@/components/speaking-rooms/SpeakingRoomStatsPanel';
import { getApiErrorMessage } from '@/lib/api/client';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
const TOPIC_KEYS = ['travel', 'family', 'work', 'hobbies', 'food', 'study'] as const;
const TOPIC_KEY_COLOR: Record<string, string> = {
  travel: 'var(--success)', family: 'var(--die)', work: 'var(--streak)',
  hobbies: 'var(--violet)', food: 'var(--die)', study: 'var(--der)',
};
const MATCH_QUEUE_TTL_SECONDS = 180;

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
      <div className="max-w-5xl mx-auto px-4 py-6">
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
    <div className="max-w-5xl mx-auto px-4 py-6">
      <PageHeader
        backHref="/practice-test/speaking-rooms"
        title={t('match.title')}
        subtitle={t('match.subtitle')}
        accent="speaking"
      />

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          {t('match.level')}
        </p>
        <div className="flex gap-2">
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setCefrLevel(lvl)}
              className="flex-1 py-3 rounded-2xl border-2 font-bold"
              style={
                cefrLevel === lvl
                  ? { borderColor: ACCENT.speaking, backgroundColor: `${ACCENT.speaking}1A`, color: ACCENT.speaking }
                  : { borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }
              }
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          {t('match.topic')}
        </p>
        <div className="mb-2.5 flex flex-wrap gap-2">
          {TOPIC_KEYS.map((key) => {
            const label = t(`topics.${key}` as 'topics.travel');
            const color = TOPIC_KEY_COLOR[key] ?? 'var(--accent)';
            const on = topic === label;
            return (
              <button
                key={key}
                onClick={() => setTopic(label)}
                className="inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-caption font-semibold transition-colors"
                style={on
                  ? { background: color, color: 'white', border: `1px solid ${color}` }
                  : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: on ? 'white' : color }} />
                {label}
              </button>
            );
          })}
        </div>
        {/* selected / custom topic display */}
        <div className="flex h-11 items-center gap-2 rounded-[10px] px-3" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: TOPIC_KEY_COLOR[TOPIC_KEYS.find((k) => t(`topics.${k}` as 'topics.travel') === topic) ?? ''] ?? 'var(--accent)' }} />
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('match.topicPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-body outline-none"
            style={{ color: 'var(--theme-text-primary)' }}
          />
        </div>
      </div>

      {errorMsg && (
        <p className="mb-4 text-sm" style={{ color: 'var(--danger)' }}>
          {errorMsg}
        </p>
      )}

      <button
        onClick={handleStart}
        disabled={enqueueMut.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        style={{ background: GRADIENT.speaking, boxShadow: '0 6px 18px color-mix(in srgb, var(--streak) 35%, transparent)' }}
      >
        <svg width={17} height={17} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="m6 4 1.2 2.8L10 8l-2.8 1.2L6 12 4.8 9.2 2 8l2.8-1.2L6 4Zm9 7 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" /></svg>
        {enqueueMut.isPending ? t('match.starting') : t('match.start')}
      </button>

      <SpeakingRoomsActivityBar stats={stats} />
      <SpeakingRoomStatsCard stats={stats} user={user} />
    </div>
  );
}
