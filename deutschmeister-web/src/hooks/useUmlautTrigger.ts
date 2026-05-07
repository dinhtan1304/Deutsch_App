'use client';

import { useCallback, type KeyboardEvent } from 'react';

const TRIGGER_MAP: Record<string, string> = {
  a: 'ä',
  A: 'Ä',
  o: 'ö',
  O: 'Ö',
  u: 'ü',
  U: 'Ü',
  s: 'ß',
};

export const UMLAUT_TRIGGER_HINT = 'a: → ä · o: → ö · u: → ü · s: → ß';

type InputOrTextarea = HTMLInputElement | HTMLTextAreaElement;

/**
 * Returns an `onKeyDown` handler that converts `<vowel>:` digraphs into
 * German umlauts as the user types: `a:` → ä, `o:` → ö, `u:` → ü, `s:` → ß
 * (with uppercase variants for vowels).
 *
 * Pass the controlled-value setter for the input/textarea. The handler
 * intercepts the `:` key only when the cursor is right after a trigger
 * char and there is no selection range; otherwise the keystroke falls
 * through unchanged.
 *
 * @example
 *   const onKeyDown = useUmlautTrigger(setText);
 *   <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={onKeyDown} />
 */
export function useUmlautTrigger(setValue: (next: string) => void) {
  return useCallback(
    (e: KeyboardEvent<InputOrTextarea>) => {
      if (e.key !== ':') return;

      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      if (start === null || end === null) return;
      if (start !== end) return; // active selection — let the user replace it normally
      if (start === 0) return;

      const value = target.value;
      const prevChar = value[start - 1];
      if (!prevChar) return;
      const replacement = TRIGGER_MAP[prevChar];
      if (!replacement) return;

      e.preventDefault();
      const newValue = value.slice(0, start - 1) + replacement + value.slice(end);
      setValue(newValue);

      // After React re-renders the value, restore the cursor position.
      // The replacement is also a single char, so cursor stays at `start`.
      requestAnimationFrame(() => {
        target.setSelectionRange(start, start);
      });
    },
    [setValue],
  );
}
