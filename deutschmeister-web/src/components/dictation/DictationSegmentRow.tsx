'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ACCENT, STATUS } from '@/lib/tokens';
import { Part, SegmentWithParts, BlankCheckStatus } from '@/lib/api/dictation';
import { YouTubeEmbedRef } from './YouTubeEmbed';
import { useUmlautTrigger, UMLAUT_TRIGGER_HINT } from '@/hooks/useUmlautTrigger';

interface Props {
  segment: SegmentWithParts;
  userAnswers: Record<string, string>;
  onChange: (blankId: string, value: string) => void;
  playerRef: React.RefObject<YouTubeEmbedRef | null>;
  isGraded?: boolean;
  isActive?: boolean;
  /** Instant-check status per blank (page-level state) */
  blankStatus?: Record<string, BlankCheckStatus>;
  /** Check all blanks of this segment now */
  onCheck?: (segmentId: string) => void;
  isChecking?: boolean;
  /** Reveal first letter of an empty focused blank */
  onHint?: (blankId: string) => void;
  /** Lets the page track the focused blank input (umlaut toolbar, hotkeys) */
  onBlankFocus?: (el: HTMLInputElement) => void;
}

function formatTimestamp(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function DictationSegmentRow({
  segment, userAnswers, onChange, playerRef, isGraded, isActive,
  blankStatus, onCheck, isChecking, onHint, onBlankFocus,
}: Props) {
  const t = useTranslations('practice.dictation.session');
  const opacityClass = isGraded ? 'opacity-100' : isActive ? 'opacity-100 scale-[1.01]' : 'opacity-50 hover:opacity-100';
  const textWeightClass = isActive && !isGraded ? 'font-medium' : 'font-normal';
  const hasBlanks = segment.parts.some(p => p.type === 'blank');

  return (
    <div
      data-segment-id={segment.id}
      className={`flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 ease-in-out ${opacityClass}`}
      style={{
        backgroundColor: isActive && !isGraded ? `${ACCENT.dictation}10` : 'var(--theme-bg-secondary)',
        borderLeft: isActive && !isGraded ? `4px solid ${ACCENT.dictation}` : '4px solid transparent',
        boxShadow: isActive && !isGraded ? `0 4px 20px rgba(6, 182, 212, 0.05)` : 'none',
      }}>
      {/* Headphone button — plays this segment */}
      <button
        type="button"
        title={t('listenSegment')}
        onClick={() => playerRef.current?.playSegment(segment.start / 1000, segment.end / 1000)}
        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all mt-0.5 shadow-sm${isActive && !isGraded ? ' animate-[pulse_2s_ease-in-out_infinite]' : ''}`}
        style={{
          backgroundColor: isActive && !isGraded ? ACCENT.dictation : 'var(--theme-bg-card)',
          color: isActive && !isGraded ? 'white' : ACCENT.dictation,
          border: isActive && !isGraded ? 'none' : '1px solid var(--theme-border)',
        }}
        onMouseEnter={e => {
          if (!isActive || isGraded) {
            e.currentTarget.style.backgroundColor = `${ACCENT.dictation}1a`;
            e.currentTarget.style.borderColor = ACCENT.dictation;
          }
        }}
        onMouseLeave={e => {
          if (!isActive || isGraded) {
            e.currentTarget.style.backgroundColor = 'var(--theme-bg-card)';
            e.currentTarget.style.borderColor = 'var(--theme-border)';
          }
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={isActive && !isGraded ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      </button>

      {/* Sentence with blanks */}
      <div className={`flex-1 min-w-0 flex flex-wrap items-center gap-x-2 gap-y-3 text-lead leading-loose ${textWeightClass}`}
        style={{ color: 'var(--theme-text-primary)' }}>
        {segment.parts.map((part, i) => (
          <SegmentPart key={i} part={part} userAnswers={userAnswers} onChange={onChange} isGraded={isGraded}
            blankStatus={blankStatus} onHint={onHint} onBlankFocus={onBlankFocus} />
        ))}
      </div>

      <div className="shrink-0 flex flex-col items-end gap-1.5">
        {/* Timestamp — click to seek */}
        <button
          type="button"
          title={t('seekHere')}
          onClick={() => playerRef.current?.seekTo(segment.start / 1000)}
          className="text-xs font-mono mt-1 transition-colors px-2 py-1 rounded-lg"
          style={{
            color: isActive && !isGraded ? ACCENT.dictation : 'var(--theme-text-muted)',
            backgroundColor: isActive && !isGraded ? `${ACCENT.dictation}1a` : 'transparent',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = ACCENT.dictation)}
          onMouseLeave={e => (e.currentTarget.style.color = isActive && !isGraded ? ACCENT.dictation : 'var(--theme-text-muted)')}
        >
          {formatTimestamp(segment.start)}
        </button>

        {/* Instant check for this segment */}
        {!isGraded && hasBlanks && onCheck && (
          <button
            type="button"
            title={t('checkSegment')}
            disabled={isChecking}
            onClick={() => onCheck(segment.id)}
            className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition-colors disabled:opacity-50"
            style={{
              borderColor: isActive ? ACCENT.dictation : 'var(--theme-border)',
              color: isActive ? ACCENT.dictation : 'var(--theme-text-muted)',
              backgroundColor: 'var(--theme-bg-card)',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            {t('checkSegment')}
          </button>
        )}
      </div>
    </div>
  );
}

function SegmentPart({ part, userAnswers, onChange, isGraded, blankStatus, onHint, onBlankFocus }: {
  part: Part;
  userAnswers: Record<string, string>;
  onChange: (blankId: string, value: string) => void;
  isGraded?: boolean;
  blankStatus?: Record<string, BlankCheckStatus>;
  onHint?: (blankId: string) => void;
  onBlankFocus?: (el: HTMLInputElement) => void;
}) {
  if (part.type === 'text') {
    return <span>{part.text}</span>;
  }

  const value = userAnswers[part.blankId] ?? '';

  if (isGraded && 'isCorrect' in part) {
    const charWidth = Math.max((part.displayLength || 6), 3);
    const pxWidth = `${charWidth * 12 + 16}px`;
    const color = part.isCorrect ? ACCENT.emerald : STATUS.danger;
    const bg = `${color}1a`;
    return (
      <span className="inline-flex flex-col items-center gap-1 mx-1.5">
        <span
          className="inline-block text-center font-bold px-3 py-1 rounded-lg shadow-sm"
          style={{ color, backgroundColor: bg, minWidth: pxWidth, border: `1px solid ${color}40` }}
        >
          {part.userAnswer || '—'}
        </span>
        {!part.isCorrect && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ color: 'white', backgroundColor: ACCENT.emerald }}>{part.correctWord}</span>
        )}
      </span>
    );
  }

  return (
    <BlankInput
      part={part}
      value={value}
      onChange={onChange}
      status={blankStatus?.[part.blankId]}
      onHint={onHint}
      onBlankFocus={onBlankFocus}
    />
  );
}

const STATUS_STYLE: Record<BlankCheckStatus, { color: string; title?: boolean }> = {
  correct: { color: ACCENT.emerald },
  near: { color: STATUS.warning, title: true },
  wrong: { color: STATUS.danger },
};

function BlankInput({ part, value, onChange, status, onHint, onBlankFocus }: {
  part: Extract<Part, { type: 'blank' }>;
  value: string;
  onChange: (blankId: string, value: string) => void;
  status?: BlankCheckStatus;
  onHint?: (blankId: string) => void;
  onBlankFocus?: (el: HTMLInputElement) => void;
}) {
  const t = useTranslations('practice.dictation.session');
  const [focused, setFocused] = useState(false);
  const onUmlautKey = useUmlautTrigger((next) => onChange(part.blankId, next));
  const isFilled = value.trim().length > 0;
  const locked = status === 'correct';

  // Neutral width: sized by what the learner typed, never by the answer length
  const width = `${Math.max(7, value.length + 2)}ch`;

  let bg = isFilled ? `${ACCENT.dictation}15` : 'var(--theme-bg-card)';
  let border = isFilled ? `${ACCENT.dictation}40` : 'var(--theme-border)';
  let color = isFilled ? ACCENT.dictation : 'var(--theme-text-primary)';
  if (status) {
    const s = STATUS_STYLE[status];
    bg = `${s.color}1a`;
    border = s.color;
    color = s.color;
  }
  if (focused && !status) {
    bg = 'var(--theme-bg-body)';
    border = ACCENT.dictation;
  }

  const showHint = focused && !isFilled && !!onHint;

  return (
    <span className="relative inline-flex items-center">
      <input
        type="text"
        data-dictation-blank
        data-blank-id={part.blankId}
        value={value}
        readOnly={locked}
        onChange={e => onChange(part.blankId, e.target.value)}
        onKeyDown={e => {
          onUmlautKey(e);
          if (e.key === 'Enter') {
            // Jump to the next blank (in DOM/reading order); blur on the last.
            e.preventDefault();
            const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[data-dictation-blank]'));
            const next = inputs[inputs.indexOf(e.currentTarget) + 1];
            if (next) next.focus();
            else e.currentTarget.blur();
          }
        }}
        title={status === 'near' ? t('nearMissTip') : t('umlautTip', { hint: UMLAUT_TRIGGER_HINT })}
        className="inline-block text-center rounded-lg shadow-sm font-bold outline-none transition-all duration-200 mx-1 py-1"
        style={{
          width,
          backgroundColor: bg,
          border: `1px solid ${border}`,
          color,
          boxShadow: focused && !status ? `0 0 0 3px ${ACCENT.dictation}30` : 'none',
          cursor: locked ? 'default' : undefined,
        }}
        onFocus={e => {
          setFocused(true);
          onBlankFocus?.(e.currentTarget);
        }}
        onBlur={() => setFocused(false)}
      />
      {status === 'correct' && (
        <svg className="absolute -right-1 -top-1" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ACCENT.emerald} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      )}
      {showHint && (
        <button
          type="button"
          title={t('hintTitle')}
          onPointerDown={e => e.preventDefault()}
          onClick={() => onHint?.(part.blankId)}
          className="absolute -right-1.5 -top-2.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] shadow-sm"
          style={{ background: STATUS.warning, color: 'white' }}
        >
          ?
        </button>
      )}
    </span>
  );
}
