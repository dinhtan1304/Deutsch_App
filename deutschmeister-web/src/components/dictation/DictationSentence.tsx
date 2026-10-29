'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ACCENT, STATUS } from '@/lib/tokens';
import { Part, BlankCheckStatus } from '@/lib/api/dictation';
import { useUmlautTrigger, UMLAUT_TRIGGER_HINT } from '@/hooks/useUmlautTrigger';

const ACC = ACCENT.dictation;

const STATUS_COLOR: Record<BlankCheckStatus, string> = {
  correct: ACCENT.emerald,
  near: STATUS.warning,
  wrong: STATUS.danger,
};

interface Props {
  parts: Part[];
  userAnswers: Record<string, string>;
  onChange: (blankId: string, value: string) => void;
  /** Instant-check status per blank */
  blankStatus: Record<string, BlankCheckStatus>;
  /** Reveal first letter of an empty focused blank */
  onHint: (blankId: string) => void;
  /** Lets the page track the focused blank input (umlaut toolbar) */
  onBlankFocus: (el: HTMLInputElement) => void;
  /** Enter in the sentence's last blank (the page checks the sentence) */
  onLastEnter: () => void;
}

/** The current dictation sentence: plain text with an input per blank. */
export function DictationSentence({ parts, userAnswers, onChange, blankStatus, onHint, onBlankFocus, onLastEnter }: Props) {
  return (
    <p data-dictation-sentence className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-xl md:text-2xl font-semibold leading-loose"
      style={{ color: 'var(--theme-text-primary)' }}>
      {parts.map((part, i) =>
        part.type === 'text' ? (
          // Hug punctuation to the preceding word/blank instead of the flex gap
          <span key={i} className={/^[.,!?;:…]/.test(part.text) ? '-ml-1.5' : undefined}>{part.text}</span>
        ) : (
          <BlankInput
            key={part.blankId}
            blankId={part.blankId}
            value={userAnswers[part.blankId] ?? ''}
            onChange={onChange}
            status={blankStatus[part.blankId]}
            onHint={onHint}
            onBlankFocus={onBlankFocus}
            onLastEnter={onLastEnter}
          />
        ),
      )}
    </p>
  );
}

function BlankInput({ blankId, value, onChange, status, onHint, onBlankFocus, onLastEnter }: {
  blankId: string;
  value: string;
  onChange: (blankId: string, value: string) => void;
  status?: BlankCheckStatus;
  onHint: (blankId: string) => void;
  onBlankFocus: (el: HTMLInputElement) => void;
  onLastEnter: () => void;
}) {
  const t = useTranslations('practice.dictation.session');
  const [focused, setFocused] = useState(false);
  const onUmlautKey = useUmlautTrigger((next) => onChange(blankId, next));
  const isFilled = value.trim().length > 0;
  const locked = status === 'correct';

  // Neutral width: sized by what the learner typed, never by the answer length
  const width = `${Math.max(6, value.length + 2)}ch`;

  let bg = isFilled ? `${ACC}15` : 'var(--theme-bg-secondary)';
  let border = isFilled ? `${ACC}66` : 'var(--theme-border)';
  let color = isFilled ? ACC : 'var(--theme-text-primary)';
  if (status) {
    const c = STATUS_COLOR[status];
    bg = `${c}1a`;
    border = c;
    color = c;
  }
  if (focused && !status) {
    bg = 'var(--theme-bg-card)';
    border = ACC;
  }

  return (
    <span className="relative inline-flex items-center">
      <input
        type="text"
        data-dictation-blank
        data-blank-id={blankId}
        value={value}
        readOnly={locked}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={e => onChange(blankId, e.target.value)}
        onKeyDown={e => {
          onUmlautKey(e);
          if (e.key !== 'Enter' || e.ctrlKey || e.metaKey) return;
          // Next blank of this sentence; the last one checks the sentence.
          e.preventDefault();
          const scope = e.currentTarget.closest('[data-dictation-sentence]');
          const inputs = Array.from(scope?.querySelectorAll<HTMLInputElement>('input[data-dictation-blank]') ?? []);
          const next = inputs.slice(inputs.indexOf(e.currentTarget) + 1).find(el => !el.readOnly);
          if (next) next.focus();
          else onLastEnter();
        }}
        title={status === 'near' ? t('nearMissTip') : t('umlautTip', { hint: UMLAUT_TRIGGER_HINT })}
        className="inline-block rounded-lg py-1 text-center font-bold outline-none transition-all duration-200"
        style={{
          width,
          backgroundColor: bg,
          border: `2px solid ${border}`,
          color,
          boxShadow: focused && !status ? `0 0 0 3px ${ACC}30` : 'none',
          cursor: locked ? 'default' : undefined,
        }}
        onFocus={e => {
          setFocused(true);
          onBlankFocus(e.currentTarget);
        }}
        onBlur={() => setFocused(false)}
      />
      {status === 'correct' && (
        <svg className="absolute -right-1 -top-1" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ACCENT.emerald} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      )}
      {focused && !isFilled && (
        <button
          type="button"
          title={t('hintTitle')}
          aria-label={t('hintTitle')}
          onPointerDown={e => e.preventDefault()}
          onClick={() => onHint(blankId)}
          className="absolute -right-2 -top-3 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold shadow-sm"
          style={{ background: STATUS.warning, color: 'white' }}
        >
          ?
        </button>
      )}
    </span>
  );
}
