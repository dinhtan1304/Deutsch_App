'use client';

import { ACCENT, STATUS } from '@/lib/tokens';

interface TypingDisplayProps {
  sentence: string;
  translation: string;
  /** Words completed so far in the current sentence */
  currentWordIdx: number;
  /** Characters typed so far for the *current* word */
  typed: string;
}

/**
 * Renders the German sentence word-by-word with three visual states:
 *   - completed words → primary text color
 *   - current word    → orange highlighted box, with per-char correctness
 *   - upcoming words  → muted gray
 *
 * Translation is shown italic below the sentence card.
 */
export function TypingDisplay({
  sentence,
  translation,
  currentWordIdx,
  typed,
}: TypingDisplayProps) {
  const words = sentence.split(' ');

  return (
    <div className="flex flex-col items-center gap-6 max-w-3xl mx-auto">
      <div
        className="w-full rounded-2xl px-8 py-10 leading-relaxed"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          border: '1px solid var(--theme-border)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '28px',
        }}
      >
        <div className="flex flex-wrap gap-x-2 gap-y-3 justify-center">
          {words.map((word, idx) => {
            if (idx < currentWordIdx) {
              return (
                <span
                  key={idx}
                  style={{ color: 'var(--theme-text-primary)' }}
                >
                  {word}
                </span>
              );
            }

            if (idx === currentWordIdx) {
              return <CurrentWord key={idx} word={word} typed={typed} />;
            }

            return (
              <span
                key={idx}
                style={{ color: 'var(--theme-text-muted)', opacity: 0.55 }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 px-6">
        <span
          aria-hidden
          style={{
            color: 'var(--theme-text-muted)',
            opacity: 0.4,
            letterSpacing: '0.4em',
          }}
        >
          ———
        </span>
        <p
          className="text-sm italic text-center"
          style={{
            color: 'var(--theme-text-muted)',
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}
        >
          {translation}
        </p>
        <span
          aria-hidden
          style={{
            color: 'var(--theme-text-muted)',
            opacity: 0.4,
            letterSpacing: '0.4em',
          }}
        >
          ———
        </span>
      </div>
    </div>
  );
}

function CurrentWord({ word, typed }: { word: string; typed: string }) {
  const chars = Array.from(word);
  const typedChars = Array.from(typed);

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md"
      style={{
        backgroundColor: `${ACCENT.games}1F`,
        border: `1.5px solid ${ACCENT.games}`,
        color: 'var(--theme-text-primary)',
      }}
    >
      {chars.map((ch, i) => {
        if (i < typedChars.length) {
          const isCorrect = typedChars[i] === ch;
          return (
            <span
              key={i}
              style={{
                backgroundColor: isCorrect ? ACCENT.games : STATUS.danger,
                color: 'white',
                borderRadius: '3px',
                padding: '0 2px',
              }}
            >
              {ch}
            </span>
          );
        }

        if (i === typedChars.length) {
          return (
            <span
              key={i}
              style={{
                borderLeft: `2px solid ${ACCENT.games}`,
                marginLeft: i === 0 ? 0 : '-1px',
                paddingRight: '1px',
              }}
            >
              {ch}
            </span>
          );
        }

        return <span key={i}>{ch}</span>;
      })}
    </span>
  );
}
