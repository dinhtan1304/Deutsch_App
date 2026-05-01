'use client';
/* eslint-disable no-restricted-syntax */

import { STATUS } from '@/lib/tokens';
import type { Question } from '../_data';
import { LEVEL_CONFIG } from '../_data';
import { cardBg, borderColor } from '../_styles';

interface Props {
  q: Question;
  qIdx: number;
  totalQuestions: number;
  selected: number | null;
  isPending: boolean;
  onAnswer: (idx: number) => void;
  onSkip: () => void;
}

export function StepQuiz({ q, qIdx, totalQuestions, selected, isPending, onAnswer, onSkip }: Props) {
  const progressPct = ((qIdx + (selected !== null ? 1 : 0)) / totalQuestions) * 100;
  const lc = LEVEL_CONFIG[q.level];
  const lvColor = lc.color;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{
          padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
          background: `${lvColor}18`, color: lvColor, border: `1px solid ${lvColor}30`,
        }}>
          {q.level} &mdash; {q.hint}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 600 }}>
          {qIdx + 1} / {totalQuestions}
        </span>
      </div>

      <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)', marginBottom: '28px', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: '2px', background: `linear-gradient(90deg, #3B82F6, ${lvColor})`, width: `${progressPct}%`, transition: 'width 0.4s ease' }} />
      </div>

      <div style={{ padding: '24px 20px', borderRadius: '16px', background: cardBg, border: `1px solid ${borderColor}`, marginBottom: '20px', textAlign: 'center' }}>
        <p style={{ color: 'white', fontSize: '20px', fontWeight: 600, lineHeight: 1.5, letterSpacing: '0.3px' }}>
          {q.sentence.split('___').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span style={{
                  display: 'inline-block', minWidth: '80px', borderBottom: '2px solid rgba(59,130,246,0.5)',
                  margin: '0 4px',
                  color: selected !== null ? (selected === q.answer ? STATUS.success : STATUS.danger) : 'rgba(59,130,246,0.6)',
                  fontWeight: 700,
                }}>
                  {selected !== null ? (q.options[selected] ?? ' ') : ' '}
                </span>
              )}
            </span>
          ))}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {q.options.map((opt, i) => {
          let bg = cardBg;
          let brd = borderColor;
          let textColor = 'white';
          if (selected !== null) {
            if (i === q.answer) {
              bg = 'rgba(34,197,94,0.15)'; brd = STATUS.success; textColor = STATUS.success;
            } else if (i === selected) {
              bg = 'rgba(239,68,68,0.15)'; brd = STATUS.danger; textColor = STATUS.danger;
            } else {
              textColor = 'rgba(255,255,255,0.3)';
            }
          }
          return (
            <button key={i} onClick={() => onAnswer(i)} disabled={selected !== null}
              style={{
                padding: '14px 16px', borderRadius: '12px', background: bg,
                border: `1.5px solid ${brd}`, color: textColor, fontSize: '16px',
                fontWeight: 600, cursor: selected !== null ? 'default' : 'pointer',
                transition: 'all 0.2s', textAlign: 'center',
              }}
              className="ob-quiz-btn"
            >
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', fontWeight: 400, marginRight: '6px' }}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={onSkip} disabled={isPending}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '12px', cursor: 'pointer', padding: '6px 12px' }}>
          Bỏ qua →
        </button>
      </div>
    </div>
  );
}
