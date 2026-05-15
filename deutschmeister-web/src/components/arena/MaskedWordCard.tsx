'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ArenaRoundClue } from '@/types/arena-events.types';
import { ACCENT, GRADIENT } from '@/lib/tokens';
import { IconVolume, IconBookOpen, IconPin, IconSparkles } from '@/components/ui/Icons';
import { usePronunciation } from '@/hooks/usePronunciation';

interface MaskedWordCardProps {
  clue: ArenaRoundClue;
  serverClockSkewMs?: number;
}

// Progressive hint thresholds: at 10s elapsed (20s remaining) and 20s elapsed
// (10s remaining). Tied to even-second marks for predictable competitive pacing.
const HINT_TIER_1_MS = 10_000;
const HINT_TIER_2_MS = 20_000;

function computeInitialTier(roundStartedAt: number, skewMs: number): number {
  const elapsed = Math.max(0, Date.now() - skewMs - roundStartedAt);
  if (elapsed >= HINT_TIER_2_MS) return 2;
  if (elapsed >= HINT_TIER_1_MS) return 1;
  return 0;
}

/**
 * Render the masked target letters: first + last visible, middle starred.
 * Length 1-2: show fully (no useful middle to mask).
 * Length ≥ 3: `B * * * * * f` style.
 *
 * Hints unlock progressively at 10s and 20s elapsed — caller is expected to
 * remount this card per round (`key={clue.roundNumber}`) so the tier state
 * resets cleanly. State init uses `serverClockSkewMs` so a rejoin mid-round
 * skips already-passed thresholds.
 */
export function MaskedWordCard({ clue, serverClockSkewMs = 0 }: MaskedWordCardProps) {
  const { speak } = usePronunciation();
  const [hintTier, setHintTier] = useState(() =>
    computeInitialTier(clue.roundStartedAt, serverClockSkewMs),
  );

  useEffect(() => {
    const elapsed = Math.max(0, Date.now() - serverClockSkewMs - clue.roundStartedAt);
    const untilT1 = Math.max(0, HINT_TIER_1_MS - elapsed);
    const untilT2 = Math.max(0, HINT_TIER_2_MS - elapsed);
    const t1 = setTimeout(() => setHintTier((prev) => Math.max(prev, 1)), untilT1);
    const t2 = setTimeout(() => setHintTier((prev) => Math.max(prev, 2)), untilT2);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [clue.roundStartedAt, serverClockSkewMs]);

  const targetForMask = useMemo(() => {
    // For vi_to_de we mask the German answer letters using firstChar + lastChar + wordLength.
    // For de_to_vi we mask the Vietnamese answer.
    const len = clue.wordLength;
    if (len <= 0) return [];
    if (len === 1) return [clue.firstChar];
    if (len === 2) return [clue.firstChar, clue.lastChar];
    const middle = Array.from({ length: len - 2 }, () => '*');
    return [clue.firstChar, ...middle, clue.lastChar];
  }, [clue]);

  const isDeMode = clue.mode === 'de_to_vi';
  const germanWord = clue.mode === 'de_to_vi' ? clue.word : null;
  const article = clue.mode === 'de_to_vi' ? clue.article : null;
  const pronunciation = clue.mode === 'de_to_vi' ? clue.pronunciation : null;
  const hintVi = clue.mode === 'vi_to_de' ? clue.translationVi : null;

  return (
    <div
      className="rounded-2xl p-5 sm:p-6 mb-4"
      style={{
        background: 'var(--theme-bg-card)',
        border: '1px solid var(--theme-border)',
        boxShadow: '0 0 0 1px rgba(139,92,246,0.25), var(--shadow-lifted)',
        animation: 'bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      {/* Illustration */}
      {clue.imageUrl && (
        <div className="flex justify-center mb-4">
          <div
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden"
            style={{ background: 'rgba(139,92,246,.08)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={clue.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        </div>
      )}

      {/* For de_to_vi mode: show the German word at top */}
      {isDeMode && germanWord && (
        <div className="flex flex-col items-center mb-4">
          <div
            className="text-2xl sm:text-3xl font-bold flex items-center gap-2"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            {article && (
              <span
                className="text-lead font-semibold uppercase tracking-wide"
                style={{ color: ACCENT.vocab }}
              >
                {article}
              </span>
            )}
            <span>{germanWord}</span>
            <button
              type="button"
              aria-label="Phát âm"
              onClick={() => speak(germanWord, 'de-DE', { fast: true })}
              className="ml-2 w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{ background: 'rgba(59,130,246,.1)', color: ACCENT.srs }}
            >
              <IconVolume size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Masked letters */}
      <div className="flex justify-center mb-4 flex-wrap gap-1.5">
        {targetForMask.map((ch, i) => {
          const isVisible = ch !== '*';
          return (
            <div
              key={i}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold text-lead"
              style={{
                background: isVisible
                  ? GRADIENT.vocab
                  : 'rgba(168,85,247,.18)',
                color: isVisible ? '#fff' : 'rgba(168,85,247,.9)',
                border: isVisible ? 'none' : '1px solid rgba(168,85,247,.3)',
              }}
            >
              {ch === '*' ? '*' : ch.toUpperCase()}
            </div>
          );
        })}
      </div>

      {/* Hint for vi_to_de: show Vietnamese translation */}
      {hintVi && (
        <div
          className="rounded-xl p-3 mb-3"
          style={{
            background: 'rgba(99,102,241,.08)',
            border: '1px solid rgba(99,102,241,.2)',
          }}
        >
          <div
            className="text-caption flex items-center gap-1"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <IconBookOpen size={12} />
            <span>Bản dịch</span>
          </div>
          <div
            className="text-lead font-semibold mt-0.5"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            {hintVi}
          </div>
        </div>
      )}

      {/* Progressive hints — unlocked at 20s and 10s remaining */}
      <div className="space-y-2">
        {hintTier >= 1 && clue.category && (
          <RevealedHint label="Loại từ" Icon={IconPin}>
            <span style={{ color: 'var(--theme-text-secondary)' }}>{clue.category}</span>
          </RevealedHint>
        )}
        {hintTier >= 2 && isDeMode && pronunciation && (
          <RevealedHint label="Phát âm" Icon={IconSparkles}>
            <span style={{ color: 'var(--theme-text-secondary)' }}>/{pronunciation}/</span>
          </RevealedHint>
        )}
      </div>
    </div>
  );
}

interface RevealedHintProps {
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
  children: React.ReactNode;
}

function RevealedHint({ label, Icon, children }: RevealedHintProps) {
  return (
    <div
      className="rounded-lg px-3 py-2 flex items-center gap-2 text-caption"
      style={{
        background: 'rgba(245,158,11,.08)',
        border: '1px solid rgba(245,158,11,.3)',
        color: 'var(--theme-text-muted)',
        animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <span style={{ color: ACCENT.xp, display: 'inline-flex' }}>
        <Icon size={14} />
      </span>
      <span className="font-semibold">{label}:</span>
      {children}
    </div>
  );
}
