'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { arenaApi } from '@/lib/api/arena';
import { useArenaSocket } from '@/hooks/useArenaSocket';
import { useArenaStore } from '@/stores/arenaStore';
import type { ArenaMode, ArenaRoomMetadata } from '@/types/arena-events.types';
import { Card, Button, Loading } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
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

const MODE_KEY: Record<ArenaMode, 'viToDe' | 'deToVi' | 'mixed'> = {
  vi_to_de: 'viToDe',
  de_to_vi: 'deToVi',
  mixed: 'mixed',
};

export default function RoomLanding({ code }: RoomLandingProps) {
  const t = useTranslations('arena');
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
          setError(c === 'ROOM_NOT_FOUND' ? t('room.notFound') : t('room.loadFailed'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        message={error ?? t('room.notFound')}
        action={<Link href="/arena"><Button variant="primary" style={{ background: GRADIENT.vocab }}>{t('room.backToLobbyBtn')}</Button></Link>}
      />
    );
  }
  if (meta.status === 'closed' || meta.status === 'abandoned' || roomCancelled) {
    return (
      <ErrorPanel
        message={t('room.closed')}
        action={<Link href="/arena"><Button variant="primary" style={{ background: GRADIENT.vocab }}>{t('room.backToLobbyBtn')}</Button></Link>}
      />
    );
  }
  if (meta.status === 'active' && !meta.isOwner) {
    return (
      <ErrorPanel
        message={t('room.fullActive')}
        action={<Link href="/arena"><Button variant="primary" style={{ background: GRADIENT.vocab }}>{t('room.backToLobbyBtn')}</Button></Link>}
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
  const t = useTranslations('arena');
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
        <div className="text-caption opacity-90 mb-1">{t('room.yourRoom')}</div>
        <div className="text-2xl sm:text-3xl font-bold">
          {meta.name ?? `${t(`modes.${MODE_KEY[meta.mode]}` as 'modes.mixed')} · ${meta.level}`}
        </div>
        <div className="flex items-center gap-3 mt-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}
          >
            <IconLogIn size={18} />
          </div>
          <div>
            <div className="text-body font-semibold">{t('room.waitingOpponent')}</div>
            <div className="text-caption opacity-90">{t(`modes.${MODE_KEY[meta.mode]}` as 'modes.mixed')} · {meta.level} · {t(`room.${visibilityKey(meta.visibility)}` as 'room.visPublic')}</div>
          </div>
        </div>
      </div>

      <Card className="mb-3">
        <div className="text-caption uppercase font-bold tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>
          {t('room.roomCode')}
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
            aria-label={copied ? t('room.copyCodeAriaCopied') : t('room.copyCodeAria')}
          >
            {copied ? <IconCheck size={16} /> : <IconFileText size={16} />}
          </Button>
        </div>
        <div className="text-caption uppercase font-bold tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>
          {t('room.inviteLink')}
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
              <span>{copied ? t('room.copied') : t('room.copy')}</span>
            </span>
          </Button>
        </div>

        {meta.hasPassword && (
          <div
            className="mt-3 rounded-lg p-3 text-caption flex items-start gap-2"
            style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)', color: ACCENT.xp }}
          >
            <IconLock size={14} className="shrink-0 mt-0.5" />
            <span>{t('room.hasPasswordNote')}</span>
          </div>
        )}
      </Card>

      <Button
        variant="outline"
        fullWidth
        onClick={cancel}
        isLoading={cancelling}
      >
        {t('room.cancelRoom')}
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
  const t = useTranslations('arena');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const clearRoomError = useArenaStore((s) => s.clearRoomError);

  // Reset submitting when an out-of-band socket event (roomError) arrives —
  // this is the "subscribe to external system" case the lint rule allows.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (roomError) setSubmitting(false);
  }, [roomError]);

  const errorMessage = roomError ? t(`room.${joinErrorKey(roomError.code)}` as 'room.errJoinFailed') : null;

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
        <div className="text-caption opacity-90 mb-1">{t('room.inviteFrom', { name: meta.owner.name ?? t('player') })}</div>
        <div className="text-2xl sm:text-3xl font-bold">
          {meta.name ?? `${t(`modes.${MODE_KEY[meta.mode]}` as 'modes.mixed')} · ${meta.level}`}
        </div>
        <div className="text-body mt-2 opacity-90">
          {t('room.metaLine', { mode: t(`modes.${MODE_KEY[meta.mode]}` as 'modes.mixed'), level: meta.level, visibility: t(`room.${visibilityKey(meta.visibility)}` as 'room.visPublic') })}
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
                {t('room.passwordLabel')}
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('room.passwordPlaceholder')}
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
            <span>{t('room.friendlyNote')}</span>
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
            <span>{t('room.joinMatch')}</span>
          </span>
        </Button>
      </form>

      <div className="mt-3 text-center">
        <Link
          href="/arena"
          className="text-caption underline"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {t('room.backToLobbyLink')}
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

function visibilityKey(v: string): 'visPublic' | 'visLink' | 'visPassword' {
  if (v === 'public') return 'visPublic';
  if (v === 'link') return 'visLink';
  return 'visPassword';
}

type JoinErrorKey =
  | 'errWrongPassword' | 'errRoomFull' | 'errRoomClosed'
  | 'errOwnerLeft' | 'errCannotJoinOwn' | 'errLevelLocked' | 'errJoinFailed';

function joinErrorKey(code: string): JoinErrorKey {
  if (code === 'WRONG_PASSWORD') return 'errWrongPassword';
  if (code === 'ROOM_FULL') return 'errRoomFull';
  if (code === 'ROOM_CLOSED') return 'errRoomClosed';
  if (code === 'OWNER_LEFT') return 'errOwnerLeft';
  if (code === 'CANNOT_JOIN_OWN_ROOM') return 'errCannotJoinOwn';
  if (code === 'LEVEL_LOCKED') return 'errLevelLocked';
  return 'errJoinFailed';
}
