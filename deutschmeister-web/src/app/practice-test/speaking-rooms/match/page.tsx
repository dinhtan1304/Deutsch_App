'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { ACCENT, GRADIENT } from '@/lib/tokens';
import { useAuthStore } from '@/stores/authStore';
import { useEnqueueMatch, useDequeueMatch, useMyQueueEntry, useSpeakingRoomStats } from '@/hooks/useSpeakingRooms';
import { useSpeakingRoomPresence } from '@/hooks/useSpeakingRoomSocket';
import { SpeakingRoomStatsCard, SpeakingRoomsActivityBar } from '@/components/speaking-rooms/SpeakingRoomStatsPanel';
import { getApiErrorMessage } from '@/lib/api/client';

const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;
const SUGGESTED_TOPICS = ['Du lịch', 'Gia đình', 'Công việc', 'Sở thích', 'Ẩm thực', 'Học tập'];
const MATCH_QUEUE_TTL_SECONDS = 180;

export default function MatchmakingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [cefrLevel, setCefrLevel] = useState<string>('B1');
  const [topic, setTopic] = useState<string>('Du lịch');
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
    setErrorMsg('Chưa tìm thấy partner phù hợp trong 3 phút. Bạn có thể thử lại với chủ đề rộng hơn.');
  }, [dequeueMut, elapsed, searching]);

  useEffect(() => {
    if (!searching || !queueFetched || queueEntry !== null) return;
    setSearching(false);
    setElapsed(0);
    setErrorMsg('Phiên tìm partner đã hết hạn. Bạn có thể bắt đầu tìm lại.');
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
      setErrorMsg(getApiErrorMessage(err, 'Không tìm được partner.'));
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
        <PageHeader title="Đang tìm partner..." accent="speaking" />
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
            Chủ đề: <strong>{queueEntry?.topic ?? topic}</strong> · {queueEntry?.cefrLevel ?? cefrLevel}
          </p>
          <p className="text-caption mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            Hệ thống đang ghép cặp với người có cùng trình độ và chủ đề. Tự dừng sau 3 phút.
          </p>
        </div>
        <button
          onClick={handleStop}
          className="w-full py-3 rounded-2xl font-bold border-2"
          style={{ borderColor: '#EF4444', color: '#EF4444' }}
        >
          Hủy tìm
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <PageHeader
        backHref="/practice-test/speaking-rooms"
        title="Tìm partner luyện nói"
        subtitle="Chọn trình độ và chủ đề, hệ thống sẽ ghép bạn với người phù hợp"
        accent="speaking"
      />

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          Trình độ
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
          Chủ đề
        </p>
        <div className="flex gap-2 flex-wrap mb-2">
          {SUGGESTED_TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className="px-3 py-1.5 rounded-full text-sm border"
              style={
                topic === t
                  ? { backgroundColor: ACCENT.speaking, borderColor: ACCENT.speaking, color: '#fff' }
                  : { borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }
              }
            >
              {t}
            </button>
          ))}
        </div>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Hoặc nhập chủ đề khác..."
          className="w-full px-3 py-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }}
        />
      </div>

      {errorMsg && (
        <p className="mb-4 text-sm" style={{ color: '#EF4444' }}>
          {errorMsg}
        </p>
      )}

      <button
        onClick={handleStart}
        disabled={enqueueMut.isPending}
        className="w-full py-3 rounded-2xl text-white font-bold text-[15px] disabled:opacity-60"
        style={{ background: GRADIENT.speaking }}
      >
        {enqueueMut.isPending ? 'Đang bắt đầu...' : 'Bắt đầu tìm partner'}
      </button>

      <SpeakingRoomsActivityBar stats={stats} />
      <SpeakingRoomStatsCard stats={stats} user={user} />
    </div>
  );
}
