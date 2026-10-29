'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { ACCENT } from '@/lib/tokens';
import { FIT_VIEWPORT_HEIGHT, fitToViewport } from '@/lib/fitToViewport';
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
import { CallStage } from '@/components/speaking-rooms/CallStage';
import { topicColor } from '@/components/speaking-rooms/RoomCard';
import { ReportUserModal } from '@/components/common/ReportUserModal';

type SideTab = 'chat' | 'suggestions';

export default function SpeakingRoomDetailPage() {
  const t = useTranslations('speakingRooms');
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id ?? '';

  const { data: room, isLoading } = useSpeakingRoom(params.id);
  const leaveMut = useLeaveSpeakingRoom();
  const initialMessages = useMemo(() => room?.messages ?? [], [room?.id]);
  const [reportOpen, setReportOpen] = useState(false);
  const [sideTab, setSideTab] = useState<SideTab>('chat');

  const { socket, messages, sendText, setTyping, typingUserIds, connected } =
    useSpeakingRoomSocket(room ? room.id : null, initialMessages);

  const suggestions = useSpeakingRoomSuggestions(params.id);
  const [inviteCopied, setInviteCopied] = useState(false);

  const remoteParticipant = useMemo(() => {
    if (!room) return null;
    return room.participants.find((p) => p.userId !== currentUserId && !p.leftAt) ?? null;
  }, [room, currentUserId]);
  const remotePeer = remoteParticipant
    ? { userId: remoteParticipant.userId, name: remoteParticipant.user.name ?? t('detail.opponent') }
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
      <div className="max-w-360 mx-auto px-4 py-6">
        <p style={{ color: 'var(--theme-text-muted)' }}>{t('detail.loading')}</p>
      </div>
    );
  }

  const tColor = topicColor(room.topic);
  const chip = 'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold';
  const btn = 'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-caption font-bold';

  return (
    <div ref={fitToViewport} className={`mx-auto flex max-w-360 flex-col gap-3 min-h-115 ${FIT_VIEWPORT_HEIGHT}`}>
      {/* Top bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <button type="button" onClick={() => router.push('/practice-test/speaking-rooms')} aria-label={t('detail.back')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lead font-bold" style={{ color: 'var(--theme-text-primary)' }} title={room.title}>{room.title}</h1>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`${chip} mono`} style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>{room.cefrLevel}</span>
            <span className={chip} style={{ background: `color-mix(in srgb, ${tColor} 16%, transparent)`, color: tColor }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: tColor }} />{room.topic}
            </span>
            <span className={chip} style={{ color: connected ? 'var(--success)' : 'var(--warn)' }}>
              <span className={`h-1.5 w-1.5 rounded-full ${connected ? '' : 'v2-pulse'}`} style={{ background: 'currentColor' }} />
              {connected ? t('detail.connected') : t('detail.connecting')}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {room.visibility === 'PRIVATE' && (
            <button type="button" onClick={handleCopyInvite} className={`${btn} border`} style={{ borderColor: ACCENT.speaking, color: ACCENT.speaking }}>
              {inviteCopied ? t('detail.copied') : t('detail.copyInvite')}
            </button>
          )}
          {remotePeer && (
            <button type="button" onClick={() => setReportOpen(true)} title={t('detail.reportTitle', { name: remotePeer.name })}
              className={`${btn} border`} style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
              {t('detail.report')}
            </button>
          )}
          <button type="button" onClick={handleLeave} disabled={leaveMut.isPending}
            className={`${btn} text-white disabled:opacity-60`} style={{ background: 'var(--danger)' }}>
            {leaveMut.isPending ? t('detail.leaving') : t('detail.leave')}
          </button>
        </div>
      </div>

      {/* Body: call stage + chat/suggestions side panel */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Compact on phones (tiles shrink) so the chat keeps most of the height */}
        <div className="shrink-0 lg:h-full">
          <CallStage call={call}
            me={{ name: user?.name ?? t('components.you'), caption: `${t('components.you')} · ${room.cefrLevel}` }}
            partner={remotePeer && { ...remotePeer, caption: t('detail.partnerLevel', { level: room.cefrLevel }) }} />
        </div>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border lg:h-full"
          style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
          <div role="tablist" className="flex shrink-0 gap-1 border-b p-1.5" style={{ borderColor: 'var(--theme-border)' }}>
            {(['chat', 'suggestions'] as const).map((tab) => (
              <button key={tab} type="button" role="tab" aria-selected={sideTab === tab} onClick={() => setSideTab(tab)}
                className="flex-1 rounded-lg py-1.5 text-caption font-bold transition-colors"
                style={sideTab === tab
                  ? { background: `color-mix(in srgb, ${ACCENT.speaking} 14%, transparent)`, color: ACCENT.speaking }
                  : { color: 'var(--theme-text-muted)' }}>
                {tab === 'chat' ? t('detail.tabChat') : t('detail.tabSuggestions')}
              </button>
            ))}
          </div>

          {sideTab === 'chat' ? (
            <>
              <ChatPanel
                messages={messages}
                currentUserId={currentUserId}
                participantById={participantById}
                typingUserIds={typingUserIds}
              />
              {/* pr-16 keeps the send button clear of the global feedback FAB */}
              <div className="shrink-0 border-t py-2 pl-2 pr-16" style={{ borderColor: 'var(--theme-border)' }}>
                <ChatInput
                  onSend={(text) => {
                    sendText(text);
                    setTyping(false);
                  }}
                  onTypingChange={setTyping}
                  placeholder={t('detail.chatPlaceholder')}
                  disabled={!connected}
                />
              </div>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col px-3 pb-3">
              <SuggestionsPanel
                embedded
                suggestions={suggestions.data}
                loading={suggestions.isFetching}
                onFetch={() => suggestions.refetch()}
                onPick={(text) => {
                  sendText(text);
                  setSideTab('chat');
                }}
              />
            </div>
          )}
        </section>
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
