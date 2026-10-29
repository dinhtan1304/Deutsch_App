'use client';

import { useTranslations } from 'next-intl';
import { GRADIENT } from '@/lib/tokens';
import type { useWebRTCCall } from '@/hooks/useWebRTCCall';

type CallApi = ReturnType<typeof useWebRTCCall>;

interface Person {
  name: string;
  /** Second line under the name (e.g. "Bạn · B1"). */
  caption: string;
}

interface Props {
  call: CallApi;
  me: Person;
  /** null while nobody else is in the room. */
  partner: (Person & { userId: string }) | null;
}

function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function IconMic({ off, size = 20 }: { off?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {off ? (
        <>
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
          <line x1="12" y1="19" x2="12" y2="23" />
        </>
      ) : (
        <>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
        </>
      )}
    </svg>
  );
}

function IconPhone({ hangup, size = 20 }: { hangup?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={hangup ? { transform: 'rotate(135deg)' } : undefined}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

/** A participant: avatar whose glow ring grows with their live audio level. */
// Avatar size: compact on phones (the chat needs the height), big on desktop.
const AVATAR = 'h-16 w-16 text-h2 lg:h-28 lg:w-28 lg:text-[44px]';

function Tile({ person, level, speakingColor, muted, label }: {
  person: Person | null;
  level: number;
  speakingColor: string;
  muted?: boolean;
  label: string;
}) {
  const speaking = level > 0.08 && !muted;
  if (!person) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <div className={`v2-pulse flex items-center justify-center rounded-full border-2 border-dashed ${AVATAR}`}
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
          ?
        </div>
        <div className="text-caption font-semibold" style={{ color: 'var(--theme-text-muted)' }}>{label}</div>
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <div className={`relative ${AVATAR}`}>
        {/* live voice ring */}
        <span aria-hidden className="absolute inset-0 rounded-full transition-transform duration-100"
          style={{
            background: speakingColor,
            opacity: speaking ? 0.35 : 0,
            transform: `scale(${1 + Math.min(level, 1) * 0.35})`,
          }} />
        <div className="relative flex h-full w-full items-center justify-center rounded-full font-black text-white"
          style={{
            background: GRADIENT.speaking,
            boxShadow: speaking ? `0 0 0 3px ${speakingColor}` : '0 0 0 3px var(--theme-bg-card)',
          }}>
          {person.name.charAt(0).toUpperCase()}
        </div>
        {muted && (
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full"
            style={{ background: 'var(--danger)', color: 'white', boxShadow: '0 0 0 3px var(--theme-bg-card)' }}>
            <IconMic off size={14} />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className="max-w-40 truncate text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{person.name}</div>
        <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{person.caption}</div>
      </div>
    </div>
  );
}

/**
 * Voice-call stage of a speaking room: both participants as big tiles that
 * glow while speaking, a status line, and Meet-style round call controls.
 */
export function CallStage({ call, me, partner }: Props) {
  const {
    callState, localVoiceEnabled, remoteReady, remoteAudioRef, audioLevel, isMuted, remoteAudioLevel, callDurationSec, error, toggleMute, retryCall, stopCall, startCall,
  } = call;
  const t = useTranslations('speakingRooms.components');
  const inCall = callState === 'in-call';
  const canUseVoice = !!partner;

  let status = t('waitingPartner');
  if (partner && callState === 'connecting') status = t('connectingVoice');
  else if (partner && inCall) status = t('talkingWith', { name: partner.name });
  else if (partner && callState === 'failed') status = t('connectionFailed');
  else if (partner && localVoiceEnabled && callState === 'idle') status = t('waitingEnableVoice', { name: partner.name });
  else if (partner && remoteReady) status = t('partnerReady', { name: partner.name });
  else if (partner && callState === 'idle') status = t('readyToConnect', { name: partner.name });

  const roundBtn = 'flex h-12 w-12 items-center justify-center rounded-full transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="flex h-full flex-col items-center justify-between gap-3 rounded-2xl border p-3 lg:gap-4 lg:p-6"
      style={{ borderColor: 'var(--theme-border)', background: 'radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--accent) 10%, var(--theme-bg-card)), var(--theme-bg-card))' }}>
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className="flex w-full flex-1 items-center justify-center gap-8 lg:gap-16">
        <Tile person={me} level={audioLevel} speakingColor="var(--cyan)" muted={isMuted && localVoiceEnabled} label={t('you')} />
        <Tile person={partner} level={remoteAudioLevel} speakingColor="var(--streak)" label={t('waitingPartner')} />
      </div>

      <div className="text-center">
        <p className="text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{status}</p>
        {inCall && (
          <p className="mono mt-0.5 text-caption" style={{ color: 'var(--theme-text-muted)' }}>{fmtDuration(callDurationSec)}</p>
        )}
        {error && <p className="mt-1 text-caption" style={{ color: 'var(--danger)' }}>{error}</p>}
      </div>

      {/* Call controls */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={toggleMute}
          disabled={!inCall && callState !== 'connecting'}
          aria-label={isMuted ? t('unmute') : t('mute')} title={isMuted ? t('unmute') : t('mute')}
          className={roundBtn}
          style={isMuted
            ? { background: 'var(--danger)', color: 'white' }
            : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' }}>
          <IconMic off={isMuted} />
        </button>

        {callState === 'failed' ? (
          <button type="button" onClick={retryCall} disabled={!canUseVoice}
            className="flex h-12 items-center gap-2 rounded-full px-5 text-body font-bold text-white transition-transform active:scale-95 disabled:opacity-40"
            style={{ background: GRADIENT.speaking }}>
            <IconPhone />{t('retry')}
          </button>
        ) : localVoiceEnabled ? (
          <button type="button" onClick={stopCall}
            className="flex h-12 items-center gap-2 rounded-full px-5 text-body font-bold text-white transition-transform active:scale-95"
            style={{ background: 'var(--danger)' }}>
            <IconPhone hangup />{t('stopVoice')}
          </button>
        ) : (
          <button type="button" onClick={startCall} disabled={!canUseVoice}
            className="flex h-12 items-center gap-2 rounded-full px-5 text-body font-bold text-white transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: GRADIENT.reading }}>
            <IconPhone />{t('startVoice')}
          </button>
        )}
      </div>
    </div>
  );
}
