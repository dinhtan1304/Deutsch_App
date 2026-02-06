/**
 * Shared Game UI Components
 * Reusable styled elements for all game pages
 */

import React from 'react';
import Link from 'next/link';

// ─── Inline SVG Icons ───
export function IconTrophy({ size = 16, ...props}: { size?: number, [key: string]: any  }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} {...props}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
export function IconFlame({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
export function IconZap({ size = 16, ...props }: { size?: number, [key: string]: any }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
export function IconTarget({ size = 16, ...props }: { size?: number, [key: string]: any }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} {...props}>
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}
export function IconClock({ size = 16, ...props }: { size?: number, [key: string]: any }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} {...props}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
export function IconPenTool({ size = 16, ...props }: { size?: number, [key: string]: any }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} {...props}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
    </svg>
  );
}
export function IconLayers({ size = 16, ...props }: { size?: number, [key: string]: any }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <line x1="3" x2="21" y1="9" y2="9" /><line x1="9" x2="9" y1="21" y2="9" />
    </svg>
  );
}
export function IconBookOpen({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
export function IconLink({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
export function IconHeadphones({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}
export function IconSpellCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="m6 16 6-12 6 12" /><path d="M8 12h8" /><path d="m16 20 2 2 4-4" />
    </svg>
  );
}
export function IconRefresh({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}
export function IconCheck({ size = 16, ...props }: { size?: number, [key: string]: any  }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
export function IconX({ size = 16, ...props }: { size?: number, [key: string]: any  }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} {...props}>
      <line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" />
    </svg>
  );
}
export function IconChevronLeft({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
export function IconVolume({ size = 16, ...props }: { size?: number, [key: string]: any }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} {...props}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}
export function IconRocket({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}
export function IconKeyboard({ size = 16, ...props }: { size?: number, [key: string]: any }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} {...props}>
      <rect width="20" height="16" x="2" y="4" rx="2" ry="2" />
      <path d="M6 8h.001" /><path d="M10 8h.001" /><path d="M14 8h.001" /><path d="M18 8h.001" />
      <path d="M8 12h.001" /><path d="M12 12h.001" /><path d="M16 12h.001" /><path d="M7 16h10" />
    </svg>
  );
}
export function IconLightbulb({ size = 16, ...props }: { size?: number, [key: string]: any  }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} {...props}>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" /><path d="M10 22h4" />
    </svg>
  );
}
export function IconGamepad({ size = 16 }: { size?: number, [key: string]: any  }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <line x1="6" x2="10" y1="12" y2="12" /><line x1="8" x2="8" y1="10" y2="14" />
      <line x1="15" x2="15.01" y1="13" y2="13" /><line x1="18" x2="18.01" y1="11" y2="11" />
      <rect width="20" height="12" x="2" y="6" rx="2" />
    </svg>
  );
}

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