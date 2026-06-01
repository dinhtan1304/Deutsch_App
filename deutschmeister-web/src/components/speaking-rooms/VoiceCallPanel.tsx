'use client';

import { useTranslations } from 'next-intl';
import { ACCENT } from '@/lib/tokens';
import type { useWebRTCCall } from '@/hooks/useWebRTCCall';

type CallApi = ReturnType<typeof useWebRTCCall>;

interface Props {
  call: CallApi;
  remotePeer: { userId: string; name: string } | null;
}

function VuMeter({ level, color }: { level: number; color: string }) {
  const bars = 5;
  return (
    <div className="flex items-end gap-0.5 h-5">
      {Array.from({ length: bars }).map((_, i) => {
        const threshold = (i + 1) / bars;
        const active = level >= threshold * 0.4;
        return (
          <div
            key={i}
            className="w-1 rounded-sm transition-colors"
            style={{
              height: `${20 + i * 12}%`,
              backgroundColor: active ? color : 'var(--theme-border)',
            }}
          />
        );
      })}
    </div>
  );
}

function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${String(ss).padStart(2, '0')}`;
}

export function VoiceCallPanel({ call, remotePeer }: Props) {
  const t = useTranslations('speakingRooms.components');
  const connected = call.callState === 'in-call';
  const canUseVoice = !!remotePeer;

  let statusLabel = t('waitingPartner');
  if (remotePeer && call.callState === 'connecting') statusLabel = t('connectingVoice');
  else if (remotePeer && call.callState === 'in-call') statusLabel = t('talkingWith', { name: remotePeer.name });
  else if (remotePeer && call.callState === 'failed') statusLabel = t('connectionFailed');
  else if (remotePeer && call.localVoiceEnabled && call.callState === 'idle') statusLabel = t('waitingEnableVoice', { name: remotePeer.name });
  else if (remotePeer && call.remoteReady) statusLabel = t('partnerReady', { name: remotePeer.name });
  else if (remotePeer && call.callState === 'idle') statusLabel = t('readyToConnect', { name: remotePeer.name });

  return (
    <div
      className="p-3 rounded-2xl border flex items-center gap-3"
      style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}
    >
      <audio ref={call.remoteAudioRef} autoPlay playsInline />

      <div
        className="v2-match-grad w-12 h-12 rounded-full flex items-center justify-center shrink-0 relative text-white"
        style={{ boxShadow: `0 6px 16px color-mix(in srgb, ${ACCENT.speaking} 35%, transparent)` }}
      >
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
        </svg>
        {connected && (
          <span
            className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
            style={{ backgroundColor: 'var(--success)', borderColor: 'var(--theme-bg-card)' }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
          {statusLabel}
        </p>
        {connected && remotePeer && (
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t('you')}</span>
              <VuMeter level={call.audioLevel} color={ACCENT.speaking} />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{remotePeer.name}</span>
              <VuMeter level={call.remoteAudioLevel} color={ACCENT.brand} />
            </div>
            <span className="ml-auto text-sm font-mono" style={{ color: 'var(--theme-text-primary)' }}>
              {fmtDuration(call.callDurationSec)}
            </span>
          </div>
        )}
        {call.error && (
          <p className="text-caption mt-1" style={{ color: 'var(--danger)' }}>{call.error}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {call.callState === 'failed' ? (
          <button
            onClick={call.retryCall}
            disabled={!canUseVoice}
            className="px-3 py-2 rounded-lg font-bold text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: ACCENT.speaking }}
          >
            {t('retry')}
          </button>
        ) : call.localVoiceEnabled ? (
          <button
            onClick={call.stopCall}
            className="px-3 py-2 rounded-lg font-bold text-sm border"
            style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
          >
            {t('stopVoice')}
          </button>
        ) : (
          <button
            onClick={call.startCall}
            disabled={!canUseVoice}
            className="px-3 py-2 rounded-lg font-bold text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: ACCENT.speaking }}
          >
            {t('startVoice')}
          </button>
        )}
      </div>

      <button
        onClick={call.toggleMute}
        disabled={!connected && call.callState !== 'connecting'}
        className="w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          borderColor: call.isMuted ? 'var(--danger)' : 'var(--theme-border)',
          backgroundColor: call.isMuted ? 'color-mix(in srgb, var(--danger) 12%, transparent)' : 'transparent',
          color: call.isMuted ? 'var(--danger)' : 'var(--theme-text-primary)',
        }}
        title={call.isMuted ? t('unmute') : t('mute')}
        aria-label={call.isMuted ? t('unmute') : t('mute')}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          {call.isMuted ? (
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
      </button>
    </div>
  );
}
