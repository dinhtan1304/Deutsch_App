'use client';

import { memo } from 'react';

const WORD_RE = /^[a-zA-ZäöüÄÖÜß]+$/;

/**
 * German subtitle line where every word is a `.wh-word` span, so the global
 * DictionaryProvider opens the lookup popup (with quick-add to word bank) on
 * click. Unlike HighlightedText this wraps all words, not only those in the
 * CEFR level index.
 */
export const SubtitleText = memo(function SubtitleText({ text }: { text: string }) {
  const tokens = text.match(/[a-zA-ZäöüÄÖÜß]+|[^a-zA-ZäöüÄÖÜß]+/g) ?? [text];
  return (
    <>
      {tokens.map((token, i) =>
        WORD_RE.test(token) && token.length > 1 ? (
          <span
            key={i}
            className="wh-word cursor-pointer rounded-sm transition-colors hover:bg-(--theme-bg-secondary) hover:underline decoration-dotted underline-offset-4"
          >
            {token}
          </span>
        ) : (
          <span key={i}>{token}</span>
        ),
      )}
    </>
  );
});
