'use client';

import { Part, SegmentWithParts } from '@/lib/api/dictation';
import { YouTubeEmbedRef } from './YouTubeEmbed';

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
  // Focus Mode: Dim inactive segments unless graded
  const opacityClass = isGraded ? 'opacity-100' : isActive ? 'opacity-100 scale-[1.01]' : 'opacity-50 hover:opacity-100';
  const textWeightClass = isActive && !isGraded ? 'font-medium' : 'font-normal';
  
  return (
    <div
      data-segment-id={segment.id}
      className={`flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 ease-in-out ${opacityClass}`}
      style={{
        backgroundColor: isActive && !isGraded ? '#06B6D410' : 'var(--theme-bg-secondary)',
        borderLeft: isActive && !isGraded ? '4px solid #06B6D4' : '4px solid transparent',
        boxShadow: isActive && !isGraded ? '0 4px 20px rgba(6, 182, 212, 0.05)' : 'none',
      }}>
      {/* Headphone button — plays this segment */}
      <button
        type="button"
        title="Nghe câu này"
        onClick={() => playerRef.current?.playSegment(segment.start / 1000, segment.end / 1000)}
        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all mt-0.5 shadow-sm${isActive && !isGraded ? ' animate-[pulse_2s_ease-in-out_infinite]' : ''}`}
        style={{
          backgroundColor: isActive && !isGraded ? '#06B6D4' : 'var(--theme-bg-card)',
          color: isActive && !isGraded ? '#fff' : '#06B6D4',
          border: isActive && !isGraded ? 'none' : '1px solid var(--theme-border)',
        }}
        onMouseEnter={e => {
          if (!isActive || isGraded) {
            e.currentTarget.style.backgroundColor = '#06B6D41A';
            e.currentTarget.style.borderColor = '#06B6D4';
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
      <div className={`flex-1 min-w-0 flex flex-wrap items-center gap-x-2 gap-y-3 text-[16px] leading-loose ${textWeightClass}`}
        style={{ color: 'var(--theme-text-primary)' }}>
        {segment.parts.map((part, i) => (
          <SegmentPart key={i} part={part} userAnswers={userAnswers} onChange={onChange} isGraded={isGraded} isActive={isActive} />
        ))}
      </div>

      {/* Timestamp — click to seek */}
      <button
        type="button"
        title="Nhảy tới vị trí này"
        onClick={() => playerRef.current?.seekTo(segment.start / 1000)}
        className="shrink-0 text-xs font-mono mt-1 transition-colors px-2 py-1 rounded-lg"
        style={{ 
          color: isActive && !isGraded ? '#06B6D4' : 'var(--theme-text-muted)',
          backgroundColor: isActive && !isGraded ? '#06B6D41A' : 'transparent',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#06B6D4')}
        onMouseLeave={e => (e.currentTarget.style.color = isActive && !isGraded ? '#06B6D4' : 'var(--theme-text-muted)')}
      >
        {formatTimestamp(segment.start)}
      </button>
    </div>
  );
}

function SegmentPart({ part, userAnswers, onChange, isGraded, isActive }: {
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
  // Estimate width based on characters, min 3 chars
  const charWidth = Math.max((part.displayLength || 6), 3);
  const pxWidth = `${charWidth * 12 + 16}px`; 

  if (isGraded && 'isCorrect' in part) {
    // Show graded result inline
    const color = part.isCorrect ? '#10B981' : '#EF4444';
    const bg = part.isCorrect ? '#10B9811A' : '#EF44441A';
    return (
      <span className="inline-flex flex-col items-center gap-1 mx-1.5">
        <span
          className="inline-block text-center font-bold px-3 py-1 rounded-lg shadow-sm"
          style={{ color, backgroundColor: bg, minWidth: pxWidth, border: `1px solid ${color}40` }}
        >
          {part.userAnswer || '—'}
        </span>
        {!part.isCorrect && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ color: '#fff', backgroundColor: '#10B981' }}>{part.correctWord}</span>
        )}
      </span>
    );
  }

  // Active playing segment highlights the inputs a bit more if they are empty
  const isFilled = value.trim().length > 0;
  const idleBg = isFilled ? '#06B6D415' : 'var(--theme-bg-card)';
  const idleBorder = isFilled ? '#06B6D440' : 'var(--theme-border)';
  const idleColor = isFilled ? '#06B6D4' : 'var(--theme-text-primary)';

  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(part.blankId, e.target.value)}
      className="inline-block text-center rounded-lg shadow-sm font-bold outline-none transition-all duration-200 mx-1 py-1"
      style={{
        width: pxWidth,
        backgroundColor: idleBg,
        border: `1px solid ${idleBorder}`,
        color: idleColor,
      }}
      onFocus={e => {
        e.currentTarget.style.backgroundColor = 'var(--theme-bg-body)';
        e.currentTarget.style.border = '1px solid #06B6D4';
        e.currentTarget.style.boxShadow = '0 0 0 3px #06B6D430';
      }}
      onBlur={e => {
        e.currentTarget.style.backgroundColor = idleBg;
        e.currentTarget.style.border = `1px solid ${idleBorder}`;
        e.currentTarget.style.boxShadow = 'none';
      }}
    />
  );
}
