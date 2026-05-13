'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { ACCENT, GRADIENT } from '@/lib/tokens';
import { useAuthStore } from '@/stores/authStore';
import { useCreateSpeakingRoom, useSpeakingRoomStats } from '@/hooks/useSpeakingRooms';
import { SpeakingRoomStatsCard, SpeakingRoomsActivityBar } from '@/components/speaking-rooms/SpeakingRoomStatsPanel';
import { getApiErrorMessage } from '@/lib/api/client';

const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;
const SUGGESTED_TOPICS = [
  'Du lịch', 'Gia đình', 'Công việc', 'Sở thích', 'Mua sắm',
  'Sức khỏe', 'Ẩm thực', 'Học tập', 'Cuộc sống hằng ngày',
];

export default function NewSpeakingRoomPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [cefrLevel, setCefrLevel] = useState<string>('B1');
  const [topic, setTopic] = useState<string>('Du lịch');
  const [title, setTitle] = useState<string>('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [errorMsg, setErrorMsg] = useState('');

  const createMut = useCreateSpeakingRoom();
  const { data: stats } = useSpeakingRoomStats();

  const effectiveTitle = title.trim() || `${topic} (${cefrLevel})`;

  const handleCreate = async () => {
    setErrorMsg('');
    try {
      const room = await createMut.mutateAsync({
        title: effectiveTitle,
        cefrLevel,
        topic,
        visibility,
      });
      router.push(`/practice-test/speaking-rooms/${room.id}`);
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Không tạo được phòng.'));
    }
  };

  return (
    <div className="py-6">
      <PageHeader
        backHref="/practice-test/speaking-rooms"
        title="Tạo phòng luyện nói"
        subtitle="Mở phòng để bạn bè vào, hoặc public để ai cũng tìm thấy"
        accent="speaking"
      />

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          Bước 1 — Trình độ (CEFR)
        </p>
        <div className="flex gap-2">
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setCefrLevel(lvl)}
              className="flex-1 py-3 rounded-2xl border-2 font-bold text-[15px] transition-all"
              style={
                cefrLevel === lvl
                  ? { borderColor: ACCENT.speaking, backgroundColor: `${ACCENT.speaking}1A`, color: ACCENT.speaking }
                  : { borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)', backgroundColor: 'transparent' }
              }
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          Bước 2 — Chủ đề
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
          placeholder="Hoặc nhập chủ đề tùy chọn..."
          className="w-full px-3 py-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }}
        />
      </div>

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          Bước 3 — Tên phòng
        </p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={effectiveTitle}
          maxLength={80}
          className="w-full px-3 py-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }}
        />
      </div>

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          Bước 4 — Quyền riêng tư
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setVisibility('PUBLIC')}
            className="p-4 rounded-2xl border-2 text-left transition-all"
            style={
              visibility === 'PUBLIC'
                ? { borderColor: ACCENT.speaking, backgroundColor: `${ACCENT.speaking}1A` }
                : { borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }
            }
          >
            <div className="font-bold" style={{ color: visibility === 'PUBLIC' ? ACCENT.speaking : 'var(--theme-text-primary)' }}>
              Công khai
            </div>
            <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
              Hiện trong danh sách, ai cũng tham gia được
            </div>
          </button>
          <button
            onClick={() => setVisibility('PRIVATE')}
            className="p-4 rounded-2xl border-2 text-left transition-all"
            style={
              visibility === 'PRIVATE'
                ? { borderColor: ACCENT.speaking, backgroundColor: `${ACCENT.speaking}1A` }
                : { borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }
            }
          >
            <div className="font-bold" style={{ color: visibility === 'PRIVATE' ? ACCENT.speaking : 'var(--theme-text-primary)' }}>
              Riêng tư
            </div>
            <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
              Chỉ ai có link mời mới vào được
            </div>
          </button>
        </div>
      </div>

      {errorMsg && (
        <p className="mb-4 text-sm" style={{ color: '#EF4444' }}>
          {errorMsg}
        </p>
      )}

      <button
        onClick={handleCreate}
        disabled={createMut.isPending}
        className="w-full py-3 rounded-2xl text-white font-bold text-[15px] disabled:opacity-60"
        style={{ background: GRADIENT.speaking }}
      >
        {createMut.isPending ? 'Đang tạo...' : 'Tạo phòng'}
      </button>

      <SpeakingRoomsActivityBar stats={stats} />
      <SpeakingRoomStatsCard stats={stats} user={user} />
    </div>
  );
}
