'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ArenaRoundClue } from '@/types/arena-events.types';
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
  const t = useTranslations('arena.components');
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
    <div className="arena-panel w-full rounded-3xl p-5 text-center sm:p-6"
      style={{ animation: 'bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 0 40px rgba(124,58,237,.25)' }}>
      {clue.imageUrl && (
        <div className="mb-4 flex justify-center">
          <div className="h-28 w-28 overflow-hidden rounded-2xl sm:h-32 sm:w-32" style={{ border: '1px solid var(--ag-line)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={clue.imageUrl} alt="" className="h-full w-full object-cover" loading="eager" />
          </div>
        </div>
      )}

      {/* The clue: German word (DE→VI) or Vietnamese meaning (VI→DE) */}
      {isDeMode && germanWord ? (
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          {article && (
            <span className="rounded-md px-2 py-0.5 text-body font-bold uppercase" style={{ background: 'rgba(251,191,36,.16)', color: 'var(--ag-gold)' }}>{article}</span>
          )}
          <span className="text-[28px] font-black sm:text-[34px]" style={{ textShadow: '0 4px 20px rgba(167,139,250,.5)' }}>{germanWord}</span>
          <button type="button" aria-label={t('pronounce')}
            onClick={() => speak(germanWord, 'de-DE', { fast: true })}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110"
            style={{ background: 'rgba(34,211,238,.16)', color: 'var(--ag-me)' }}>
            <IconVolume size={18} />
          </button>
        </div>
      ) : hintVi ? (
        <div className="mb-4">
          <div className="arena-muted mb-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest">
            <IconBookOpen size={12} />{t('translation')}
          </div>
          <div className="text-[24px] font-black leading-tight sm:text-[30px]" style={{ textShadow: '0 4px 20px rgba(167,139,250,.5)' }}>{hintVi}</div>
        </div>
      ) : null}

      {/* Masked answer letters */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {targetForMask.map((ch, i) => (
          <div key={i}
            className={`flex h-11 w-9 items-center justify-center rounded-lg text-lead font-black sm:h-12 sm:w-10 ${ch === '*' ? 'arena-tile' : 'arena-tile arena-tile--on'}`}>
            {ch === '*' ? '' : ch.toUpperCase()}
          </div>
        ))}
      </div>

      {/* Progressive hints — unlocked at 20s and 10s remaining */}
      {(hintTier >= 1 && clue.category) || (hintTier >= 2 && isDeMode && pronunciation) ? (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {hintTier >= 1 && clue.category && (
            <RevealedHint label={t('hintWordType')} Icon={IconPin}>{clue.category}</RevealedHint>
          )}
          {hintTier >= 2 && isDeMode && pronunciation && (
            <RevealedHint label={t('hintPronunciation')} Icon={IconSparkles}>/{pronunciation}/</RevealedHint>
          )}
        </div>
      ) : null}
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
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption"
      style={{ background: 'rgba(251,191,36,.12)', border: '1px solid rgba(251,191,36,.35)', animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
      <span style={{ color: 'var(--ag-gold)', display: 'inline-flex' }}><Icon size={13} /></span>
      <span className="font-bold" style={{ color: 'var(--ag-gold)' }}>{label}:</span>
      <span>{children}</span>
    </span>
  );
}
