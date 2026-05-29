'use client';

import { useTranslations } from 'next-intl';
import { ACCENT, STATUS } from '@/lib/tokens';
import { Part, SegmentWithParts } from '@/lib/api/dictation';
import { YouTubeEmbedRef } from './YouTubeEmbed';
import { useUmlautTrigger, UMLAUT_TRIGGER_HINT } from '@/hooks/useUmlautTrigger';

interface Props {
  segment: SegmentWithParts;
  userAnswers: Record<string, string>;
  onChange: (blankId: string, value: string) => void;
  playerRef: React.RefObject<YouTubeEmbedRef | null>;
  isGraded?: boolean;
  isActive?: boolean;
}

function formatTimestamp(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function DictationSegmentRow({ segment, userAnswers, onChange, playerRef, isGraded, isActive }: Props) {
  const t = useTranslations('practice.dictation.session');
  const opacityClass = isGraded ? 'opacity-100' : isActive ? 'opacity-100 scale-[1.01]' : 'opacity-50 hover:opacity-100';
  const textWeightClass = isActive && !isGraded ? 'font-medium' : 'font-normal';

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
          <SegmentPart key={i} part={part} userAnswers={userAnswers} onChange={onChange} isGraded={isGraded} isActive={isActive} />
        ))}
      </div>

      {/* Timestamp — click to seek */}
      <button
        type="button"
        title={t('seekHere')}
        onClick={() => playerRef.current?.seekTo(segment.start / 1000)}
        className="shrink-0 text-xs font-mono mt-1 transition-colors px-2 py-1 rounded-lg"
        style={{
          color: isActive && !isGraded ? ACCENT.dictation : 'var(--theme-text-muted)',
          backgroundColor: isActive && !isGraded ? `${ACCENT.dictation}1a` : 'transparent',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = ACCENT.dictation)}
        onMouseLeave={e => (e.currentTarget.style.color = isActive && !isGraded ? ACCENT.dictation : 'var(--theme-text-muted)')}
      >
        {formatTimestamp(segment.start)}
      </button>
    </div>
  );
}

function SegmentPart({ part, userAnswers, onChange, isGraded }: {
  part: Part;
  userAnswers: Record<string, string>;
  onChange: (blankId: string, value: string) => void;
  isGraded?: boolean;
  isActive?: boolean;
}) {
  if (part.type === 'text') {
    return <span>{part.text}</span>;
  }

  const value = userAnswers[part.blankId] ?? '';
  const charWidth = Math.max((part.displayLength || 6), 3);
  const pxWidth = `${charWidth * 12 + 16}px`;

  if (isGraded && 'isCorrect' in part) {
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
      pxWidth={pxWidth}
    />
  );
}

function BlankInput({ part, value, onChange, pxWidth }: {
  part: Extract<Part, { type: 'blank' }>;
  value: string;
  onChange: (blankId: string, value: string) => void;
  pxWidth: string;
}) {
  const t = useTranslations('practice.dictation.session');
  const onUmlautKey = useUmlautTrigger((next) => onChange(part.blankId, next));
  const isFilled = value.trim().length > 0;
  const idleBg = isFilled ? `${ACCENT.dictation}15` : 'var(--theme-bg-card)';
  const idleBorder = isFilled ? `${ACCENT.dictation}40` : 'var(--theme-border)';
  const idleColor = isFilled ? ACCENT.dictation : 'var(--theme-text-primary)';

  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(part.blankId, e.target.value)}
      onKeyDown={onUmlautKey}
      title={t('umlautTip', { hint: UMLAUT_TRIGGER_HINT })}
      className="inline-block text-center rounded-lg shadow-sm font-bold outline-none transition-all duration-200 mx-1 py-1"
      style={{
        width: pxWidth,
        backgroundColor: idleBg,
        border: `1px solid ${idleBorder}`,
        color: idleColor,
      }}
      onFocus={e => {
        e.currentTarget.style.backgroundColor = 'var(--theme-bg-body)';
        e.currentTarget.style.border = `1px solid ${ACCENT.dictation}`;
        e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT.dictation}30`;
      }}
      onBlur={e => {
        e.currentTarget.style.backgroundColor = idleBg;
        e.currentTarget.style.border = `1px solid ${idleBorder}`;
        e.currentTarget.style.boxShadow = 'none';
      }}
    />
  );
}
