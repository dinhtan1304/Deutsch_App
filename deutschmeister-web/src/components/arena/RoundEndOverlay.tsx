'use client';

import { useEffect } from 'react';
import type { ArenaWordReveal } from '@/types/arena-events.types';
import { usePronunciation } from '@/hooks/usePronunciation';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
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
      <span style={{ color: ACCENT.vocab, fontWeight: 700 }}>
        {example.slice(idx, idx + target.length)}
      </span>
      {example.slice(idx + target.length)}
    </>
  );
}

export function RoundEndOverlay({ reveal, myUserId }: RoundEndOverlayProps) {
  const { speak } = usePronunciation();
  const { wordReveal } = reveal;
  const headline =
    reveal.winnerUserId === null
      ? 'Hết giờ'
      : reveal.winnerUserId === myUserId
        ? 'Bạn thắng vòng này'
        : 'Đối thủ thắng vòng này';
  const headlineColor =
    reveal.winnerUserId === null
      ? 'var(--theme-text-muted)'
      : reveal.winnerUserId === myUserId
        ? STATUS.success
        : STATUS.danger;

  useEffect(() => {
    const t = setTimeout(() => {
      speak(wordReveal.word, 'de-DE');
    }, 250);
    return () => clearTimeout(t);
  }, [wordReveal.word, speak]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{
        background: 'rgba(0,0,0,.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 9000,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Đáp án vòng đấu"
    >
      {reveal.winnerUserId === myUserId && (
        <ConfettiBurst count={16} durationMs={1500} />
      )}
      <div
        className="rounded-2xl p-5 sm:p-6 max-w-lg w-full"
        style={{
          background: 'var(--theme-bg-card)',
          boxShadow: 'var(--shadow-lifted)',
          border: '1px solid var(--theme-border)',
          animation: 'bounceIn 0.45s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div className="text-center mb-3">
          <div className="text-body" style={{ color: headlineColor, fontWeight: 700 }}>
            {headline}
          </div>
        </div>

        <div
          className="rounded-2xl p-4 mb-3 text-white text-center"
          style={{ background: articleGradient(wordReveal.article) }}
        >
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {wordReveal.article && (
              <span className="text-lead font-semibold uppercase opacity-90">
                {wordReveal.article}
              </span>
            )}
            <span className="text-2xl sm:text-3xl font-bold">
              {wordReveal.word}
            </span>
            <button
              type="button"
              aria-label="Phát âm lại"
              onClick={() => speak(wordReveal.word, 'de-DE')}
              className="ml-1 w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
            >
              <IconVolume size={18} />
            </button>
          </div>
          {wordReveal.pronunciation && (
            <div className="text-caption mt-1 opacity-90">/{wordReveal.pronunciation}/</div>
          )}
        </div>

        {wordReveal.translationVi && (
          <div
            className="rounded-xl px-3 py-2 mb-2 text-center"
            style={{
              background: 'rgba(99,102,241,.08)',
              border: '1px solid rgba(99,102,241,.2)',
              color: 'var(--theme-text-primary)',
            }}
          >
            {wordReveal.translationVi}
          </div>
        )}

        {wordReveal.examples.length > 0 && (
          <div
            className="rounded-xl p-3"
            style={{
              background: 'rgba(34,197,94,.06)',
              border: '1px solid rgba(34,197,94,.2)',
            }}
          >
            <div className="text-body italic" style={{ color: 'var(--theme-text-primary)' }}>
              <ExampleWithHighlight example={wordReveal.examples[0] ?? ''} target={wordReveal.word} />
            </div>
          </div>
        )}

        <div className="text-caption text-center mt-3" style={{ color: 'var(--theme-text-muted)' }}>
          Vòng tiếp theo bắt đầu sau {Math.round(reveal.revealDurationMs / 1000)}s...
        </div>
      </div>
    </div>
  );
}
