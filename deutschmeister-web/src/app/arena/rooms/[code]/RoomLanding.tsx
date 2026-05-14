'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { arenaApi } from '@/lib/api/arena';
import { useArenaSocket } from '@/hooks/useArenaSocket';
import { useArenaStore } from '@/stores/arenaStore';
import type { ArenaRoomMetadata } from '@/types/arena-events.types';
import { Card, Button, Loading } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { ARENA_MODE_LABEL } from '@/lib/arena/labels';
import {
  IconLogIn,
  IconFileText,
  IconLock,
  IconZap,
  IconGamepad,
  IconXCircle,
  IconCheck,
} from '@/components/ui/Icons';

interface RoomLandingProps {
  code: string;
}

export default function RoomLanding({ code }: RoomLandingProps) {
  const router = useRouter();
  const { waitInRoom, joinRoom } = useArenaSocket();
  const [meta, setMeta] = useState<ArenaRoomMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const phase = useArenaStore((s) => s.phase);
  const match = useArenaStore((s) => s.match);
  const roomError = useArenaStore((s) => s.roomError);
  const roomCancelled = useArenaStore((s) => s.roomCancelled);
  const clearRoomError = useArenaStore((s) => s.clearRoomError);

  // Fetch metadata. `code` is the URL param — it cannot change without a
  // remount, so the initial `useState(true)` is sufficient; no setLoading(true) needed here.
  useEffect(() => {
    let cancelled = false;
    arenaApi
      .getRoomByCode(code)
      .then((m) => {
        if (!cancelled) setMeta(m);
      })
      .catch((err) => {
        if (!cancelled) {
          const c = err?.body?.code ?? err?.code;
          setError(c === 'ROOM_NOT_FOUND' ? 'Phòng không tồn tại.' : 'Không tải được phòng.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  // Owner: attach socket to room as soon as we know we're the owner
  useEffect(() => {
    if (meta?.isOwner && meta.status === 'waiting') {
      waitInRoom(meta.id);
    }
  }, [meta, waitInRoom]);

  // Redirect once the match is found (engine fires arena:match:found)
  useEffect(() => {
    if (match && phase !== 'idle' && phase !== 'matchmaking') {
      router.replace(`/arena/match/${match.matchId}`);
    }
  }, [match, phase, router]);

  // Clear any stale room error on mount
  useEffect(() => {
    clearRoomError();
  }, [clearRoomError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading />
      </div>
    );
  }
  if (error || !meta) {
    return (
      <ErrorPanel
        message={error ?? 'Phòng không tồn tại.'}
        action={<Link href="/arena"><Button variant="primary" style={{ background: GRADIENT.vocab }}>Về sảnh</Button></Link>}
      />
    );
  }
  if (meta.status === 'closed' || meta.status === 'abandoned' || roomCancelled) {
    return (
      <ErrorPanel
        message="Phòng đã đóng."
        action={<Link href="/arena"><Button variant="primary" style={{ background: GRADIENT.vocab }}>Về sảnh</Button></Link>}
      />
    );
  }
  if (meta.status === 'active' && !meta.isOwner) {
    return (
      <ErrorPanel
        message="Phòng đã đầy. Trận đang diễn ra."
        action={<Link href="/arena"><Button variant="primary" style={{ background: GRADIENT.vocab }}>Về sảnh</Button></Link>}
      />
    );
  }

  return meta.isOwner ? (
    <OwnerWaitingPanel meta={meta} />
  ) : (
    <InviteeJoinPanel meta={meta} roomError={roomError} onJoin={joinRoom} />
  );
}

function OwnerWaitingPanel({ meta }: { meta: ArenaRoomMetadata }) {
  const router = useRouter();
  const setCurrentRoomId = useArenaStore((s) => s.setCurrentRoomId);
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const joinUrl = `${baseUrl}/arena/rooms/${meta.inviteCode}`;

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked — surface nothing, user can select manually
    }
  }, [joinUrl]);

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(meta.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }, [meta.inviteCode]);

  const cancel = async () => {
    setCancelling(true);
    try {
      await arenaApi.cancelRoom(meta.id);
    } finally {
      setCurrentRoomId(null);
      router.replace('/arena');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <div
        className="rounded-2xl p-6 mb-4 text-white"
        style={{ background: GRADIENT.vocab, boxShadow: 'var(--shadow-lifted)' }}
      >
        <div className="text-caption opacity-90 mb-1">Phòng của bạn</div>
        <div className="text-2xl sm:text-3xl font-bold">
          {meta.name ?? `${ARENA_MODE_LABEL[meta.mode]} · ${meta.level}`}
        </div>
        <div className="flex items-center gap-3 mt-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}
          >
            <IconLogIn size={18} />
          </div>
          <div>
            <div className="text-body font-semibold">Đang chờ đối thủ…</div>
            <div className="text-caption opacity-90">{ARENA_MODE_LABEL[meta.mode]} · {meta.level} · {visibilityLabel(meta.visibility)}</div>
          </div>
        </div>
      </div>

      <Card className="mb-3">
        <div className="text-caption uppercase font-bold tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>
          Mã phòng
        </div>
        <div className="flex items-center gap-2 mb-3">
          <code
            className="flex-1 text-2xl font-mono font-bold tabular-nums px-3 py-2 rounded-lg"
            style={{
              background: 'rgba(139,92,246,.1)',
              color: ACCENT.vocab,
              letterSpacing: '.15em',
              textAlign: 'center',
            }}
          >
            {meta.inviteCode}
          </code>
          <Button
            variant="outline"
            onClick={copyCode}
            aria-label={copied ? 'Đã sao chép mã' : 'Sao chép mã'}
          >
            {copied ? <IconCheck size={16} /> : <IconFileText size={16} />}
          </Button>
        </div>
        <div className="text-caption uppercase font-bold tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>
          Link mời
        </div>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={joinUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 px-3 py-2 rounded-lg text-caption font-mono"
            style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)' }}
          />
          <Button variant="outline" onClick={copyLink}>
            <span className="inline-flex items-center gap-1">
              {copied ? <IconCheck size={14} /> : <IconFileText size={14} />}
              <span>{copied ? 'Đã copy' : 'Copy'}</span>
            </span>
          </Button>
        </div>

        {meta.hasPassword && (
          <div
            className="mt-3 rounded-lg p-3 text-caption flex items-start gap-2"
            style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)', color: ACCENT.xp }}
          >
            <IconLock size={14} className="shrink-0 mt-0.5" />
            <span>Phòng có mật khẩu. Hãy gửi mật khẩu cùng với link cho bạn bè.</span>
          </div>
        )}
      </Card>

      <Button
        variant="outline"
        fullWidth
        onClick={cancel}
        isLoading={cancelling}
      >
        Hủy phòng
      </Button>
    </div>
  );
}

function InviteeJoinPanel({
  meta,
  roomError,
  onJoin,
}: {
  meta: ArenaRoomMetadata;
  roomError: { code: string; message?: string } | null;
  onJoin: (code: string, password?: string) => void;
}) {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const clearRoomError = useArenaStore((s) => s.clearRoomError);

  // Reset submitting when an out-of-band socket event (roomError) arrives —
  // this is the "subscribe to external system" case the lint rule allows.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (roomError) setSubmitting(false);
  }, [roomError]);

  const errorMessage = roomError ? joinErrorMessage(roomError.code) : null;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    clearRoomError();
    onJoin(meta.inviteCode, meta.hasPassword ? password : undefined);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <div
        className="rounded-2xl p-6 mb-4 text-white"
        style={{ background: GRADIENT.vocab, boxShadow: 'var(--shadow-lifted)' }}
      >
        <div className="text-caption opacity-90 mb-1">Lời mời từ {meta.owner.name ?? 'người chơi'}</div>
        <div className="text-2xl sm:text-3xl font-bold">
          {meta.name ?? `${ARENA_MODE_LABEL[meta.mode]} · ${meta.level}`}
        </div>
        <div className="text-body mt-2 opacity-90">
          {ARENA_MODE_LABEL[meta.mode]} · trình độ {meta.level} · {visibilityLabel(meta.visibility)}
        </div>
      </div>

      <form onSubmit={handleJoin}>
        <Card className="mb-3">
          {meta.hasPassword && (
            <>
              <label
                className="text-caption uppercase font-bold tracking-wider mb-2 block"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                Mật khẩu phòng
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu phòng"
                maxLength={32}
                className="w-full px-3 py-2 rounded-lg mb-2"
                style={{
                  background: 'var(--theme-bg-secondary)',
                  border: '1px solid var(--theme-border)',
                  color: 'var(--theme-text-primary)',
                }}
                autoFocus
              />
            </>
          )}
          {errorMessage && (
            <div
              className="rounded-lg px-3 py-2 mb-2 text-body"
              style={{
                background: 'rgba(239,68,68,.1)',
                border: '1px solid rgba(239,68,68,.35)',
                color: STATUS.danger,
              }}
            >
              {errorMessage}
            </div>
          )}
          <div
            className="text-caption flex items-center gap-1"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <IconZap size={12} />
            <span>Trận giao hữu — không ảnh hưởng xếp hạng.</span>
          </div>
        </Card>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={submitting || (meta.hasPassword && password.length === 0)}
          isLoading={submitting}
          style={{ background: GRADIENT.vocab }}
        >
          <span className="inline-flex items-center gap-2">
            <IconGamepad size={18} />
            <span>Tham gia trận</span>
          </span>
        </Button>
      </form>

      <div className="mt-3 text-center">
        <Link
          href="/arena"
          className="text-caption underline"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          ← Về sảnh
        </Link>
      </div>
    </div>
  );
}

function ErrorPanel({ message, action }: { message: string; action: React.ReactNode }) {
  return (
    <div className="max-w-md mx-auto px-4 sm:px-6">
      <Card className="text-center py-10">
        <div
          aria-hidden="true"
          className="flex justify-center mb-2"
          style={{ color: STATUS.danger }}
        >
          <IconXCircle size={40} />
        </div>
        <div className="text-lead mb-4" style={{ color: 'var(--theme-text-primary)' }}>
          {message}
        </div>
        {action}
      </Card>
    </div>
  );
}

function visibilityLabel(v: string): string {
  if (v === 'public') return 'Công khai';
  if (v === 'link') return 'Chỉ link';
  return 'Có mật khẩu';
}

function joinErrorMessage(code: string): string {
  if (code === 'WRONG_PASSWORD') return 'Mật khẩu không đúng. Vui lòng kiểm tra lại.';
  if (code === 'ROOM_FULL') return 'Có người vừa vào trước bạn. Phòng đã đầy.';
  if (code === 'ROOM_CLOSED') return 'Phòng đã đóng.';
  if (code === 'OWNER_LEFT') return 'Chủ phòng đã rời. Phòng đóng.';
  if (code === 'CANNOT_JOIN_OWN_ROOM') return 'Bạn không thể tự tham gia phòng của chính mình.';
  return 'Không thể vào phòng. Thử lại sau.';
}
