/**
 * Shared Game UI Components
 * Reusable styled elements for all game pages
 */

import React from 'react';
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
      <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white text-[13px] font-bold"
        style={{ background: 'linear-gradient(135deg, #F97316, #EF4444)' }}>
        <IconFlame size={14} /> Combo x{Math.min(combo, 4)}!
      </div>
    </div>
  );
}

/** Stats card used in result screens */
export function StatCard({ label, value, color, icon: Icon }: {
  label: string; value: string | number; color: string; icon?: React.FC<{ size?: number }>;
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
      <div className="text-[11px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{label}</div>
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

/** Primary action button */
export function GameButton({ children, onClick, disabled, loading, variant = 'primary', color = '#3B82F6', className = '' }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; loading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost'; color?: string; className?: string;
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 text-[14px] disabled:opacity-50 disabled:cursor-not-allowed';

  const styles: Record<string, React.CSSProperties> = {
    primary: { background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'white', boxShadow: `0 4px 12px ${color}30` },
    outline: { border: '2px solid var(--theme-border)', color: 'var(--theme-text-secondary)', background: 'transparent' },
    ghost: { color: 'var(--theme-text-muted)', background: 'transparent' },
  };

  return (
    <button onClick={onClick} disabled={disabled || loading}
      className={`${base} px-6 py-3 hover:-translate-y-0.5 ${className}`}
      style={styles[variant]}>
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}

/** Gender article answer buttons (der/die/das) */
type GenderType = 'masculine' | 'feminine' | 'neuter';

export function GenderButtons({ onAnswer, answered, selectedAnswer, correctGender, disabled }: {
  onAnswer: (g: GenderType) => void; answered: boolean; selectedAnswer: GenderType | null;
  correctGender?: GenderType; disabled?: boolean;
}) {
  const buttons: { gender: GenderType; article: string; color: string; key: string }[] = [
    { gender: 'masculine', article: 'der', color: '#3B82F6', key: '1' },
    { gender: 'feminine', article: 'die', color: '#EC4899', key: '2' },
    { gender: 'neuter', article: 'das', color: '#22C55E', key: '3' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {buttons.map(btn => {
        const isSelected = selectedAnswer === btn.gender;
        const isCorrect = correctGender === btn.gender;

        let bg = `linear-gradient(135deg, ${btn.color}, ${btn.color}cc)`;
        let opacity = 1;

        if (answered) {
          if (isCorrect) bg = 'linear-gradient(135deg, #22C55E, #16A34A)';
          else if (isSelected) bg = 'linear-gradient(135deg, #EF4444, #DC2626)';
          else opacity = 0.35;
        }

        return (
          <button key={btn.gender} onClick={() => onAnswer(btn.gender)}
            disabled={answered || disabled}
            className="py-7 md:py-9 rounded-2xl font-bold text-3xl md:text-4xl text-white transition-all duration-200
              hover:-translate-y-1 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed"
            style={{ background: bg, opacity, boxShadow: !answered ? `0 4px 16px ${btn.color}30` : 'none' }}>
            {btn.article}
            <div className="text-[11px] font-medium mt-1.5 opacity-80">
              {answered && isCorrect && <IconCheck size={14} />}
              {answered && isSelected && !isCorrect && <IconX size={14} />}
              {!answered && `(${btn.key})`}
            </div>
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
                  <span className="text-[13px] font-semibold" style={{ color: correct.color }}>
                    {correct.article}
                  </span>
                  <span className="text-[14px] font-bold ml-1.5" style={{ color: 'var(--theme-text-primary)' }}>
                    {record.word.word}
                  </span>
                </div>
              </div>
              {!record.isCorrect && wrongLabel && (
                <span className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
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
    <div className="rounded-xl p-4 text-left space-y-2 text-[13px]"
      style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>
      {children}
    </div>
  );
}

/** Keyboard hint badge */
export function KBD({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-6 px-1.5 py-0.5 rounded-md text-[11px] font-bold"
      style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}>
      {children}
    </kbd>
  );
}
