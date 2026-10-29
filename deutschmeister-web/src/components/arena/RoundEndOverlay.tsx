'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { ArenaWordReveal } from '@/types/arena-events.types';
import { usePronunciation } from '@/hooks/usePronunciation';
import { GRADIENT } from '@/lib/tokens';
import { IconVolume } from '@/components/ui/Icons';
import { ConfettiBurst } from './ConfettiBurst';

interface RoundEndOverlayProps {
  reveal: {
    correctAnswer: string;
    correctAnswerWithArticle: string;
    winnerUserId: string | null;
    wordReveal: ArenaWordReveal;
    revealDurationMs: number;
  };
  myUserId: string | null;
}

function articleGradient(article: string | null): string {
  if (article === 'der') return GRADIENT.der;
  if (article === 'die') return GRADIENT.die;
  if (article === 'das') return GRADIENT.das;
  return GRADIENT.vocab;
}

function ExampleWithHighlight({ example, target }: { example: string; target: string }) {
  if (!target) return <>{example}</>;
  const idx = example.toLowerCase().indexOf(target.toLowerCase());
  if (idx < 0) return <>{example}</>;
  return (
    <>
      {example.slice(0, idx)}
      <span style={{ color: 'var(--ag-gold)', fontWeight: 700 }}>
        {example.slice(idx, idx + target.length)}
      </span>
      {example.slice(idx + target.length)}
    </>
  );
}

export function RoundEndOverlay({ reveal, myUserId }: RoundEndOverlayProps) {
  const t = useTranslations('arena.components');
  const { speak, stop } = usePronunciation();
  const { wordReveal } = reveal;
  const headline =
    reveal.winnerUserId === null
      ? t('timeUp')
      : reveal.winnerUserId === myUserId
        ? t('youWonRound')
        : t('opponentWonRound');

  useEffect(() => {
    // Track whether this effect run is still the "current" word. If the
    // round flips before the TTS fetch returns (Coqui can take 300-800ms
    // cold), we used to play stale audio over the next word's reveal. Now
    // both the setTimeout AND any in-flight fetch / playing audio are
    // cancelled in cleanup.
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      // Fast path: arena rounds flip in 2-5s so we sacrifice Coqui's better
      // accent for instant Web Speech API playback (~0ms vs 300-800ms cold
      // backend round-trip). The reveal audio never lags into the next word.
      speak(wordReveal.word, 'de-DE', { fast: true });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
      stop();
    };
  }, [wordReveal.word, speak, stop]);

  const won = reveal.winnerUserId !== null && reveal.winnerUserId === myUserId;
  const lost = reveal.winnerUserId !== null && !won;
  const bannerColor = won ? 'var(--ag-win)' : lost ? 'var(--ag-lose)' : 'var(--ag-muted)';

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center px-4"
      style={{ background: 'rgba(5,6,20,.72)', backdropFilter: 'blur(8px)' }}
      role="dialog" aria-modal="true" aria-label={t('roundAnswerAria')}>
      {won && <ConfettiBurst count={16} durationMs={1500} />}
      <div className="arena-stage relative w-full max-w-lg rounded-3xl p-5 sm:p-6"
        style={{ animation: 'bounceIn 0.45s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: `0 0 0 2px ${bannerColor}, 0 24px 60px rgba(0,0,0,.5)` }}>
        <div className="mb-4 text-center text-h2 font-black uppercase"
          style={{ color: bannerColor, animation: 'arenaBannerIn .5s cubic-bezier(0.34,1.56,0.64,1)', textShadow: `0 0 24px ${bannerColor}` }}>
          {headline}
        </div>

        <div className="mb-3 rounded-2xl p-4 text-center text-white" style={{ background: articleGradient(wordReveal.article) }}>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {wordReveal.article && <span className="text-lead font-semibold uppercase opacity-90">{wordReveal.article}</span>}
            <span className="text-[28px] font-black sm:text-[32px]">{wordReveal.word}</span>
            <button type="button" aria-label={t('replayPronunciation')}
              onClick={() => speak(wordReveal.word, 'de-DE', { fast: true })}
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.2)' }}>
              <IconVolume size={18} />
            </button>
          </div>
          {wordReveal.pronunciation && <div className="mt-1 text-caption opacity-90">/{wordReveal.pronunciation}/</div>}
        </div>

        {wordReveal.translationVi && (
          <div className="arena-panel mb-2 rounded-xl px-3 py-2 text-center text-body font-semibold">{wordReveal.translationVi}</div>
        )}

        {wordReveal.examples.length > 0 && (
          <div className="arena-panel rounded-xl p-3 text-body italic">
            <ExampleWithHighlight example={wordReveal.examples[0] ?? ''} target={wordReveal.word} />
          </div>
        )}

        <div className="arena-muted mt-4 text-center text-caption">
          {t('nextRoundIn', { sec: Math.round(reveal.revealDurationMs / 1000) })}
        </div>
      </div>
    </div>
  );
}
