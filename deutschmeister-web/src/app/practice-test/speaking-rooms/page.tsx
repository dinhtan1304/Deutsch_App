'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PracticePageShell, BetaBadge } from '@/components/ui';
import { FeedbackModal } from '@/components/layout/FeedbackModal';
import { ACCENT, GRADIENT } from '@/lib/tokens';
import { useAuthStore } from '@/stores/authStore';
import {
  useSpeakingRoomsList,
  useSpeakingRoomQuota,
  useSpeakingRoomStats,
  useJoinSpeakingRoom,
  useJoinByCode,
  useMySpeakingRooms,
  useReopenSpeakingRoom,
} from '@/hooks/useSpeakingRooms';
import { QuotaBanner } from '@/components/speaking-rooms/QuotaBanner';
import { RoomCard } from '@/components/speaking-rooms/RoomCard';
import { SpeakingRoomStatsCard, SpeakingRoomsActivityBar } from '@/components/speaking-rooms/SpeakingRoomStatsPanel';
import { parseSpeakingRoomInviteCode } from '@/lib/api/speakingRooms';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;

export default function SpeakingRoomsListPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [level, setLevel] = useState<string | undefined>(undefined);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const { data: rooms, isLoading } = useSpeakingRoomsList({ cefrLevel: level });
  const { data: myRooms } = useMySpeakingRooms(!!user);
  const { data: quota } = useSpeakingRoomQuota();
  const { data: stats } = useSpeakingRoomStats();
  const joinMut = useJoinSpeakingRoom();
  const joinByCodeMut = useJoinByCode();
  const reopenMut = useReopenSpeakingRoom();

  const handleJoin = async (id: string) => {
    try {
      const room = await joinMut.mutateAsync({ id });
      router.push(`/practice-test/speaking-rooms/${room.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReopen = async (id: string) => {
    try {
      const room = await reopenMut.mutateAsync({ id });
      router.push(`/practice-test/speaking-rooms/${room.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoinByCode = async () => {
    setCodeError('');
    const inviteCode = parseSpeakingRoomInviteCode(code);
    if (!inviteCode) return;
    try {
      const room = await joinByCodeMut.mutateAsync({ code: inviteCode });
      router.push(`/practice-test/speaking-rooms/${room.id}`);
    } catch {
      setCodeError('Mã mời hoặc link mời không hợp lệ.');
    }
  };

  return (
    <PracticePageShell
      title="Phòng Luyện Nói"
      subtitle="Ghép cặp với người học khác để luyện nói tiếng Đức trực tiếp"
      accent="speaking"
      right={
        <div className="flex items-center gap-3 flex-wrap">
          <BetaBadge size="md" />
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="text-caption underline-offset-2 hover:underline opacity-80 hover:opacity-100"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            🐞 Báo lỗi · Góp ý
          </button>
          <Link
            href="/community/rules"
            className="text-caption underline-offset-2 hover:underline opacity-80 hover:opacity-100"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            📜 Quy tắc cộng đồng
          </Link>
        </div>
      }
    >
      <QuotaBanner quota={quota} />

      <div className="flex gap-3 my-4">
        <Link
          href="/practice-test/speaking-rooms/new"
          className="flex-1 py-3 px-4 rounded-2xl text-white font-bold text-center"
          style={{ background: GRADIENT.speaking }}
        >
          + Tạo phòng mới
        </Link>
        <Link
          href="/practice-test/speaking-rooms/match"
          className="flex-1 py-3 px-4 rounded-2xl font-bold text-center border-2"
          style={{ borderColor: ACCENT.speaking, color: ACCENT.speaking }}
        >
          Tìm partner
        </Link>
      </div>

      <div className="my-4 p-4 rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>
          Vào phòng riêng bằng mã mời
        </p>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Dán mã hoặc link mời..."
            className="flex-1 px-3 py-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--theme-bg-body)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-primary)',
            }}
          />
          <button
            onClick={handleJoinByCode}
            disabled={!code.trim() || joinByCodeMut.isPending}
            className="px-4 py-2 rounded-lg font-bold text-white disabled:opacity-50"
            style={{ backgroundColor: ACCENT.speaking }}
          >
            Vào phòng
          </button>
        </div>
        {codeError && <p className="text-caption mt-2" style={{ color: '#EF4444' }}>{codeError}</p>}
      </div>

      <SpeakingRoomsActivityBar stats={stats} />
      <SpeakingRoomStatsCard stats={stats} user={user} />

      <div className="my-4">
        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>
          Lọc theo trình độ
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setLevel(undefined)}
            className="px-3 py-1.5 rounded-full text-sm font-medium border"
            style={
              !level
                ? { backgroundColor: ACCENT.speaking, borderColor: ACCENT.speaking, color: '#fff' }
                : { borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }
            }
          >
            Tất cả
          </button>
          {CEFR_LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevel(lvl)}
              className="px-3 py-1.5 rounded-full text-sm font-medium border"
              style={
                level === lvl
                  ? { backgroundColor: ACCENT.speaking, borderColor: ACCENT.speaking, color: '#fff' }
                  : { borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }
              }
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {myRooms && myRooms.length > 0 && (
        <section className="my-4">
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>
            Phòng của tôi
          </p>
          <div className="space-y-3">
            {myRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                variant="mine"
                onJoin={room.status === 'CLOSED' ? undefined : () => handleJoin(room.id)}
                onReopen={room.status === 'CLOSED' ? () => handleReopen(room.id) : undefined}
                loading={joinMut.isPending || reopenMut.isPending}
              />
            ))}
          </div>
        </section>
      )}

      <div className="space-y-3">
        {(myRooms?.length ?? 0) > 0 && (
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>
            Phòng công khai
          </p>
        )}
        {isLoading && <p style={{ color: 'var(--theme-text-muted)' }}>Đang tải...</p>}
        {!isLoading && rooms && rooms.length === 0 && (
          <div className="py-8 text-center rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px dashed var(--theme-border)' }}>
            <p style={{ color: 'var(--theme-text-muted)' }}>Chưa có phòng nào đang chờ. Hãy tạo phòng đầu tiên!</p>
          </div>
        )}
        {rooms?.map((room) => (
          <RoomCard key={room.id} room={room} onJoin={() => handleJoin(room.id)} loading={joinMut.isPending} />
        ))}
      </div>

      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </PracticePageShell>
  );
}
