'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { ACCENT } from '@/lib/tokens';
import { useAuthStore } from '@/stores/authStore';
import {
  useSpeakingRoom,
  useSpeakingRoomSuggestions,
  useLeaveSpeakingRoom,
} from '@/hooks/useSpeakingRooms';
import { useSpeakingRoomSocket } from '@/hooks/useSpeakingRoomSocket';
import { useWebRTCCall } from '@/hooks/useWebRTCCall';
import { ChatPanel } from '@/components/speaking-rooms/ChatPanel';
import { ChatInput } from '@/components/roleplay/ChatInput';
import { SuggestionsPanel } from '@/components/speaking-rooms/SuggestionsPanel';
import { VoiceCallPanel } from '@/components/speaking-rooms/VoiceCallPanel';
import { ReportUserModal } from '@/components/common/ReportUserModal';

export default function SpeakingRoomDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id ?? '';

  const { data: room, isLoading } = useSpeakingRoom(params.id);
  const leaveMut = useLeaveSpeakingRoom();
  const initialMessages = useMemo(() => room?.messages ?? [], [room?.id]);
  const [reportOpen, setReportOpen] = useState(false);

  const { socket, messages, sendText, setTyping, typingUserIds, connected } =
    useSpeakingRoomSocket(room ? room.id : null, initialMessages);

  const suggestions = useSpeakingRoomSuggestions(params.id);
  const [inviteCopied, setInviteCopied] = useState(false);

  const remoteParticipant = useMemo(() => {
    if (!room) return null;
    return room.participants.find((p) => p.userId !== currentUserId && !p.leftAt) ?? null;
  }, [room, currentUserId]);
  const remotePeer = remoteParticipant
    ? { userId: remoteParticipant.userId, name: remoteParticipant.user.name ?? 'Đối phương' }
    : null;

  const call = useWebRTCCall({
    socket,
    roomId: room?.id ?? '',
    currentUserId,
    remoteUserId: remotePeer?.userId ?? null,
  });

  const participantById = useMemo(() => {
    const map = new Map<string, { name: string | null; avatar: string | null }>();
    if (!room) return map;
    for (const p of room.participants) {
      map.set(p.userId, { name: p.user.name, avatar: p.user.avatar });
    }
    return map;
  }, [room]);

  useEffect(() => {
    return () => {
      setTyping(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLeave = async () => {
    if (!room || leaveMut.isPending) return;
    try {
      await leaveMut.mutateAsync({ id: room.id });
    } catch (err) {
      console.error('[Room] Leave failed:', err);
    } finally {
      router.push('/practice-test/speaking-rooms');
    }
  };

  const handleCopyInvite = () => {
    if (!room) return;
    const url = `${window.location.origin}/practice-test/speaking-rooms/join/${room.inviteCode}`;
    navigator.clipboard.writeText(url);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  if (isLoading || !room) {
    return (
      <div className="py-6">
        <p style={{ color: 'var(--theme-text-muted)' }}>Đang tải phòng...</p>
      </div>
    );
  }

  return (
    <div className="py-6 flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <PageHeader
        backHref="/practice-test/speaking-rooms"
        title={room.title}
        subtitle={`Chủ đề: ${room.topic} · ${room.cefrLevel} · ${connected ? 'Đã kết nối' : 'Đang kết nối...'}`}
        accent="speaking"
        right={
          <div className="flex items-center gap-2">
            {room.visibility === 'PRIVATE' && (
              <button
                type="button"
                onClick={handleCopyInvite}
                className="px-3 py-2 rounded-lg text-sm font-bold border"
                style={{ borderColor: ACCENT.speaking, color: ACCENT.speaking }}
              >
                {inviteCopied ? '✓ Đã copy' : 'Copy link mời'}
              </button>
            )}
            {remotePeer && (
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="px-3 py-2 rounded-lg text-sm font-bold border"
                title={`Báo cáo ${remotePeer.name}`}
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}
              >
                🚩 Báo cáo
              </button>
            )}
            <button
              type="button"
              onClick={handleLeave}
              disabled={leaveMut.isPending}
              className="px-3 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-60"
              style={{ backgroundColor: '#EF4444' }}
            >
              {leaveMut.isPending ? 'Đang rời...' : 'Rời phòng'}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1">
        <div className="lg:col-span-2 flex flex-col gap-3">
          <VoiceCallPanel call={call} remotePeer={remotePeer} />
          <ChatPanel
            messages={messages}
            currentUserId={currentUserId}
            participantById={participantById}
            typingUserIds={typingUserIds}
          />
          <ChatInput
            onSend={(text) => {
              sendText(text);
              setTyping(false);
            }}
            onTypingChange={setTyping}
            placeholder="Viết bằng tiếng Đức..."
            disabled={!connected}
          />
        </div>
        <div className="space-y-3">
          <SuggestionsPanel
            suggestions={suggestions.data}
            loading={suggestions.isFetching}
            onFetch={() => suggestions.refetch()}
            onPick={(text) => {
              sendText(text);
            }}
          />
        </div>
      </div>

      {reportOpen && remotePeer && (
        <ReportUserModal
          reportedUserId={remotePeer.userId}
          reportedUserName={remotePeer.name}
          context="speaking_room"
          contextId={room.id}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}
