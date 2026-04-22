/**
 * Shared Game UI Components
 * Reusable styled elements for all game pages
 */

import React, { useState, useEffect } from 'react';
import { useCreatePersonalWord } from '@/hooks/usePersonalWords';
import { UpsellTrigger } from '@/components/subscription/UpsellTrigger';
import type { Word } from '@/types';
import {
  IconTrophy, IconFlame, IconZap, IconTarget, IconClock,
  IconPenTool, IconLayers, IconBookOpen, IconLink,
  IconHeadphones, IconSpellCheck, IconRefresh,
  IconCheck, IconX, IconChevronLeft, IconChevronRight,
  IconVolume, IconRocket, IconKeyboard, IconLightbulb, IconGamepad,
} from '@/components/ui/Icons';

// ─── Re-export icons so all game pages can import from this file ───
export {
  IconTrophy, IconFlame, IconZap, IconTarget, IconClock,
  IconPenTool, IconLayers, IconBookOpen, IconLink,
  IconHeadphones, IconSpellCheck, IconRefresh,
  IconCheck, IconX, IconChevronLeft, IconChevronRight,
  IconVolume, IconRocket, IconKeyboard, IconLightbulb, IconGamepad,
};

// ─── Styled Components ───

/** Gradient progress bar used in all game playing screens */
export function GameProgressBar({ current, total, color = '#3B82F6' }: { current: number; total: number; color?: string }) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
    </div>
  );
}

/** Combo badge shown during gameplay */
export function ComboBadge({ combo }: { combo: number }) {
  if (combo <= 0) return <div className="h-9" />;
  return (
    <div className="h-9 flex justify-center items-center">
      <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white text-body font-bold"
        style={{ background: 'linear-gradient(135deg, #F97316, #EF4444)' }}>
        <IconFlame size={14} /> Combo x{Math.min(combo, 4)}!
      </div>
    </div>
  );
}

/** Stats card used in result screens */
export function StatCard({ label, value, color = '#3B82F6', icon: Icon }: {
  label: string; value: string | number; color?: string; icon?: React.FC<{ size?: number }>;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-3 text-center"
      style={{ background: `linear-gradient(135deg, ${color}15, ${color}08)` }}>
      <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full" style={{ backgroundColor: color, opacity: 0.06 }} />
      {Icon && (
        <div className="w-7 h-7 rounded-lg mx-auto flex items-center justify-center mb-1"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
          <Icon size={14} />
        </div>
      )}
      <div className="text-xl font-extrabold" style={{ color }}>{value}</div>
      <div className="text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>{label}</div>
    </div>
  );
}

/** Setup screen wrapper */
export function GameSetupCard({ icon: Icon, iconColor, title, children }: {
  icon: React.FC<{ size?: number }>; iconColor: string; title: string; children: React.ReactNode;
}) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="rounded-2xl border p-8 text-center"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5"
          style={{ background: `linear-gradient(135deg, ${iconColor}, ${iconColor}cc)` }}>
          <Icon size={30} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>{title}</h1>
        {children}
      </div>
    </div>
  );
}

/** Result screen wrapper */
export function GameResultCard({ accuracy, title, children }: {
  accuracy: number; title: string; children: React.ReactNode;
}) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="rounded-2xl border p-6 text-center mb-6"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
          style={{
            background: accuracy >= 80
              ? 'linear-gradient(135deg, #F59E0B, #D97706)'
              : accuracy >= 60
              ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
              : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
          }}>
          <IconTrophy size={28} style={{ color: 'white' }} />
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>{title}</h1>
        {children}
      </div>
    </div>
  );
}


/** Gender article answer buttons (der/die/das) — SRS rating button style */
type GenderType = 'masculine' | 'feminine' | 'neuter';

const GENDER_BTN = [
  { gender: 'masculine' as GenderType, article: 'der', label: 'Maskulin', textColor: '#93C5FD', bg: 'linear-gradient(160deg, #0a1628, #1e3a8a)', border: 'rgba(59,130,246,.45)',  hotkey: '1' },
  { gender: 'feminine'  as GenderType, article: 'die', label: 'Feminin',  textColor: '#F9A8D4', bg: 'linear-gradient(160deg, #2a0a1e, #9d174d)', border: 'rgba(236,72,153,.45)', hotkey: '2' },
  { gender: 'neuter'    as GenderType, article: 'das', label: 'Neutrum',  textColor: '#5EEAD4', bg: 'linear-gradient(160deg, #0a2218, #065f46)', border: 'rgba(20,184,166,.45)',  hotkey: '3' },
];

export function GenderButtons({ onAnswer, answered, selectedAnswer, correctGender, disabled }: {
  onAnswer: (g: GenderType) => void; answered: boolean; selectedAnswer: GenderType | null;
  correctGender?: GenderType; disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {GENDER_BTN.map(btn => {
        const isSelected = selectedAnswer === btn.gender;
        const isCorrect  = correctGender === btn.gender;
        let bg = btn.bg, border = `1.5px solid ${btn.border}`, opacity = 1, textColor = btn.textColor;
        if (answered) {
          if (isCorrect)            { bg = 'linear-gradient(160deg, #052e16, #166534)'; border = '1.5px solid rgba(34,197,94,.5)';  textColor = '#86EFAC'; }
          else if (isSelected)      { bg = 'linear-gradient(160deg, #450a0a, #991b1b)'; border = '1.5px solid rgba(239,68,68,.5)'; textColor = '#FCA5A5'; }
          else                      { opacity = 0.28; }
        }
        return (
          <button key={btn.gender} onClick={() => onAnswer(btn.gender)} disabled={answered || disabled}
            className="relative py-6 rounded-2xl transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed"
            style={{ background: bg, border, opacity }}>
            {!answered && <span className="absolute top-2 right-2.5 text-caption font-bold" style={{ color: textColor, opacity: 0.5 }}>{btn.hotkey}</span>}
            {answered && isCorrect  && <span className="absolute top-2 right-2.5 text-sm" style={{ color: textColor }}>✓</span>}
            {answered && isSelected && !isCorrect && <span className="absolute top-2 right-2.5 text-sm" style={{ color: textColor }}>✗</span>}
            <div className="text-3xl md:text-4xl font-extrabold" style={{ color: textColor }}>{btn.article}</div>
            <div className="text-caption font-semibold mt-1" style={{ color: textColor, opacity: 0.65 }}>{btn.label}</div>
          </button>
        );
      })}
    </div>
  );
}

/** Answer review list for result screens */
export function AnswerReview<T extends { word: any; isCorrect: boolean }>({ answers, getCorrectArticle, getSelectedLabel }: {
  answers: T[];
  getCorrectArticle: (a: T) => { article: string; color: string };
  getSelectedLabel?: (a: T) => string | null;
}) {
  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <div className="px-5 py-4 border-b flex items-center gap-2"
        style={{ borderColor: 'var(--theme-border)' }}>
        <IconLightbulb size={16} style={{ color: '#F59E0B' }} />
        <h2 className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
          Chi tiết câu trả lời
        </h2>
      </div>
      <div className="max-h-96 overflow-y-auto divide-y" style={{ borderColor: 'var(--theme-border)' }}>
        {answers.map((record, i) => {
          const correct = getCorrectArticle(record);
          const wrongLabel = getSelectedLabel?.(record);
          return (
            <div key={i} className="flex items-center justify-between px-4 py-3"
              style={{ background: record.isCorrect ? 'rgba(34,197,94,.04)' : 'rgba(239,68,68,.04)' }}>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: record.isCorrect ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)' }}>
                  {record.isCorrect
                    ? <IconCheck size={11} style={{ color: '#22C55E' }} />
                    : <IconX size={11} style={{ color: '#EF4444' }} />}
                </span>
                <div>
                  <span className="text-body font-semibold" style={{ color: correct.color }}>
                    {correct.article}
                  </span>
                  <span className="text-sm font-bold ml-1.5" style={{ color: 'var(--theme-text-primary)' }}>
                    {record.word.word}
                  </span>
                </div>
              </div>
              {!record.isCorrect && wrongLabel && (
                <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  Bạn chọn: <span style={{ color: '#EF4444' }}>{wrongLabel}</span>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Info box for setup screens */
export function GameInfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 text-left space-y-2 text-body"
      style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>
      {children}
    </div>
  );
}

/** Keyboard hint badge */
export function KBD({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-6 px-1.5 py-0.5 rounded-md text-caption font-bold"
      style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}>
      {children}
    </kbd>
  );
}

/** CTA to batch-add wrong words to Word Bank after a game */
export function AddWrongWordsToBank({ wrongWords }: { wrongWords: Word[] }) {
  const createWord = useCreatePersonalWord();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const count = wrongWords.length;

  if (count === 0) return null;

  if (added) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-4">
        <div className="text-center py-3 rounded-xl text-body font-semibold"
          style={{ background: 'rgba(34,197,94,.08)', color: '#4ADE80', border: '1px solid rgba(34,197,94,.15)' }}>
          ✓ Đã thêm {count} từ vào Word Bank
        </div>
      </div>
    );
  }

  const handleAdd = async () => {
    setAdding(true);
    for (const w of wrongWords) {
      try {
        await createWord.mutateAsync({
          word: w.word,
          wordType: 'nomen',
          translationEn: w.translationEn,
          translationVi: w.translationVi || '',
          nomenData: { article: w.article, gender: w.gender, plural: w.plural || '' },
          level: w.level as any,
          category: w.category,
        });
      } catch { /* duplicate — skip */ }
    }
    setAdded(true);
    setAdding(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-4">
      <button onClick={handleAdd} disabled={adding}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5"
        style={{
          background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
          color: 'white', border: 'none',
          boxShadow: '0 4px 12px rgba(99,102,241,.3)',
          opacity: adding ? 0.7 : 1,
          cursor: adding ? 'wait' : 'pointer',
        }}>
        {adding ? 'Đang thêm...' : `+ Thêm ${count} từ sai vào Word Bank`}
      </button>
    </div>
  );
}

/**
 * Compact upsell card for game result screens. Renders nothing for Premium
 * users (the inner UpsellTrigger handles gating). Wrapped in the standard
 * game-result container so it aligns with AnswerReview / AddWrongWordsToBank.
 */
export function GameResultUpsell() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-4">
      <UpsellTrigger
        variant="compact"
        title="Muốn thi thật Goethe/TELC?"
        description="Mở khóa đề chuẩn + AI chấm không giới hạn"
        ctaLabel="Xem Premium"
        source="game_result"
      />
    </div>
  );
}

// ─── SRS-style playing UI ────────────────────────────────────────────────────

/** Self-contained session timer. Resets when active goes false→true. */
export function useGameTimer(active: boolean): string {
  const [seconds, setSeconds] = React.useState(0);
  useEffect(() => {
    if (!active) { setSeconds(0); return; }
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

/** SRS-style playing header with × close, game title, streak + timer pills */
export function GamePlayHeader({ title, subtitle = 'Trò chơi', streak, timer, onExit }: {
  title: string; subtitle?: string; streak?: number; timer?: string; onExit: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <button onClick={onExit}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
          style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
          <IconX size={16} />
        </button>
        <div>
          <p className="text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>{subtitle}</p>
          <p className="text-[15px] font-bold leading-tight" style={{ color: 'var(--theme-text-primary)' }}>{title}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {streak !== undefined && streak >= 2 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-body font-bold"
            style={{ background: 'rgba(249,115,22,.12)', color: '#F97316' }}>
            🔥 {streak}
          </div>
        )}
        {timer && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-body font-mono font-semibold"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {timer}
          </div>
        )}
      </div>
    </div>
  );
}

/** Stats bar with colored number cells (like SRS session stats) */
export function GameStatsBar({ stats }: {
  stats: Array<{ label: string; value: number | string; color: string; dot?: boolean }>;
}) {
  return (
    <div className="grid gap-1 mb-5 rounded-2xl p-3.5"
      style={{
        gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
        backgroundColor: 'var(--theme-bg-card)',
        border: '1px solid var(--theme-border)',
      }}>
      {stats.map(s => (
        <div key={s.label} className="text-center">
          <div className="text-h2 font-extrabold leading-tight" style={{ color: s.color }}>{s.value}</div>
          <div className="text-caption flex items-center justify-center gap-1 mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {s.dot && <span style={{ color: s.color, fontSize: 9 }}>■</span>}
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Dark gradient hero card for word display — matches SRS card aesthetic */
export function GameWordCard({ gradient = 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)', feedback, children, onClick }: {
  gradient?: string; feedback?: 'correct' | 'wrong' | null; children: React.ReactNode; onClick?: () => void;
}) {
  const bg = feedback === 'correct' ? 'linear-gradient(135deg, #052e16 0%, #166534 100%)'
    : feedback === 'wrong'   ? 'linear-gradient(135deg, #450a0a 0%, #991b1b 100%)'
    : gradient;
  return (
    <div className="rounded-3xl overflow-hidden mb-5 transition-all duration-300"
      style={{ background: bg, cursor: onClick ? 'pointer' : 'default', minHeight: 200 }}
      onClick={onClick}>
      <div className="flex flex-col items-center justify-center px-6 py-8 text-center" style={{ minHeight: 200 }}>
        {children}
      </div>
    </div>
  );
}
