/**
 * Shared Game UI Components
 * Reusable styled elements for all game pages
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCreatePersonalWord } from '@/hooks/usePersonalWords';
import { useAuthStore } from '@/stores/authStore';
import { UpsellTrigger } from '@/components/subscription/UpsellTrigger';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import type { Word } from '@/types';
import type { Level } from '@/types/personalWord';
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
export function GameProgressBar({ current, total, color = ACCENT.srs }: { current: number; total: number; color?: string }) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="h-2.5 rounded-full overflow-hidden relative" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
      <div className="h-full rounded-full transition-all duration-700 ease-out relative"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }}>
        <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]" />
        <div className="absolute right-0 top-0 bottom-0 w-8 blur-md bg-white/30" />
      </div>
    </div>
  );
}

/** Combo badge shown during gameplay */
export function ComboBadge({ combo }: { combo: number }) {
  if (combo <= 0) return <div className="h-10" />;
  const multiplier = Math.min(combo, 4);
  return (
    <div className="h-10 flex justify-center items-center">
      <div className={`flex items-center gap-2 px-5 py-2 rounded-full text-white text-sm font-black shadow-lg transform transition-all duration-300 ${combo >= 5 ? 'animate-bounce' : 'animate-pulse'}`}
        style={{
          background: multiplier >= 4 ? `linear-gradient(135deg, ${STATUS.danger}, ${ACCENT.xp})` : `linear-gradient(135deg, ${ACCENT.games}, ${STATUS.danger})`,
          boxShadow: `0 8px 24px ${multiplier >= 4 ? `${STATUS.danger}66` : `${ACCENT.games}4D`}`
        }}>
        <IconFlame size={16} className={multiplier >= 4 ? 'animate-spin' : ''} /> 
        <span>COMBO X{multiplier}!</span>
      </div>
    </div>
  );
}

/** Stats card (horizontal: icon + value + label) — matches v2 result design */
export function StatCard({ label, value, color = ACCENT.srs, icon: Icon }: {
  label: string; value: string | number; color?: string; icon?: React.FC<{ size?: number; style?: React.CSSProperties; className?: string }>;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border p-3.5"
      style={{ backgroundColor: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)' }}>
      {Icon && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]"
          style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>
          <Icon size={16} />
        </span>
      )}
      <div className="min-w-0 text-left">
        <div className="mono text-lg font-bold leading-tight" style={{ color }}>{value}</div>
        <div className="text-[10.5px]" style={{ color: 'var(--theme-text-muted)' }}>{label}</div>
      </div>
    </div>
  );
}

/** Setup screen wrapper */
export function GameSetupCard({ icon: Icon, iconColor, title, loadError, children }: {
  icon: React.FC<{ size?: number; style?: React.CSSProperties; className?: string }>; iconColor: string; title: string;
  loadError?: string | null; children: React.ReactNode;
}) {
  return (
    <div className="max-w-xl mx-auto px-4 py-10" style={{ animation: 'slideUp .4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div className="rounded-3xl border-2 p-8 text-center relative overflow-hidden shadow-xl backdrop-blur-xl"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>

        {/* Background glow */}
        <div className="absolute -top-20 -left-20 w-48 h-48 rounded-full opacity-[0.06] blur-3xl pointer-events-none"
          style={{ background: iconColor }} />

        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-lg transform transition-transform hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${iconColor}, ${iconColor}cc)`, boxShadow: `0 8px 24px ${iconColor}30` }}>
            <Icon size={28} />
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-2" style={{ color: 'var(--theme-text-primary)' }}>{title}</h1>
          {loadError && (
            <div className="mb-4 rounded-xl px-4 py-3 text-body text-left"
              style={{ background: `${STATUS.danger}1A`, border: `1px solid ${STATUS.danger}40`, color: STATUS.danger }}
              role="alert">
              {loadError}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

/** A single horizontal result stat (icon + value + label) — matches design */
export type ResultStatItem = {
  label: string; value: string | number; color: string;
  icon?: React.FC<{ size?: number; style?: React.CSSProperties }>;
};
function ResultStat({ label, value, color, icon: Icon }: ResultStatItem) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border p-3.5"
      style={{ backgroundColor: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)' }}>
      {Icon && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]"
          style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>
          <Icon size={16} />
        </span>
      )}
      <div className="min-w-0 text-left">
        <div className="mono text-lg font-bold leading-tight" style={{ color }}>{value}</div>
        <div className="text-[10.5px]" style={{ color: 'var(--theme-text-muted)' }}>{label}</div>
      </div>
    </div>
  );
}

/** Result screen wrapper — emoji + grade + "đúng X/Y" + 2×2 stat grid + 2 buttons */
export function GameResultCard({ accuracy, correct, total, stats, onRestart, onExit, bare, children }: {
  accuracy: number;
  correct?: number; total?: number;
  stats?: ResultStatItem[];
  onRestart?: () => void; onExit?: () => void;
  /** Render just the card (no centered max-w-md wrapper) — for 2-column layouts */
  bare?: boolean;
  /** @deprecated kept for back-compat; no longer rendered (grade label shown instead) */
  title?: string;
  children?: React.ReactNode;
}) {
  const t = useTranslations('games.common');
  const grade = accuracy >= 90 ? { label: t('gradeExcellent'), emoji: '🏆', color: ACCENT.xp }
    : accuracy >= 70 ? { label: t('gradeGreat'), emoji: '🎉', color: STATUS.success }
    : accuracy >= 50 ? { label: t('gradeGood'), emoji: '👍', color: ACCENT.srs }
    : { label: t('gradeKeepGoing'), emoji: '💪', color: ACCENT.games };

  const card = (
      <div className="rounded-[22px] border p-8 text-center"
        // eslint-disable-next-line no-restricted-syntax
        style={{ background: 'linear-gradient(180deg, var(--theme-bg-card), var(--theme-bg-tertiary))', borderColor: 'var(--theme-border)', boxShadow: '0 24px 60px rgba(0,0,0,.4)' }}>
        <div className="mb-2 text-[56px] leading-none">{grade.emoji}</div>
        <h1 className="text-h1 font-extrabold" style={{ color: grade.color }}>{grade.label}</h1>
        {correct != null && total != null && (
          <p className="mb-6 mt-1.5 text-body" style={{ color: 'var(--theme-text-muted)' }}>
            {t('answeredCorrect', { correct, total })}
          </p>
        )}

        {stats && (
          <div className="mb-6 grid grid-cols-2 gap-2.5">
            {stats.map((s, i) => <ResultStat key={i} {...s} />)}
          </div>
        )}

        {(onRestart || onExit) && (
          <div className="flex gap-3">
            {onExit && (
              <button onClick={onExit} className="h-11 flex-1 rounded-[11px] border text-sm font-semibold transition-colors hover:opacity-80"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                {t('backToGames')}
              </button>
            )}
            {onRestart && (
              <button onClick={onRestart} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[11px] text-sm font-bold text-white transition-transform active:scale-95"
                style={{ background: 'var(--accent)', boxShadow: '0 4px 14px color-mix(in srgb, var(--accent) 55%, transparent)' }}>
                <IconRefresh size={15} /> {t('restart')}
              </button>
            )}
          </div>
        )}

        {children}
      </div>
  );

  if (bare) return <div style={{ animation: 'bounceIn .5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>{card}</div>;
  return (
    <div className="max-w-md mx-auto px-4 py-8" style={{ animation: 'bounceIn .5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
      {card}
    </div>
  );
}


/** Gender article answer buttons (der/die/das) — SRS rating button style */
type GenderType = 'masculine' | 'feminine' | 'neuter';

const GENDER_BTN = [
  { gender: 'masculine' as GenderType, article: 'der', label: 'Maskulin', color: 'var(--der)', hotkey: '1' },
  { gender: 'feminine'  as GenderType, article: 'die', label: 'Feminin',  color: 'var(--die)', hotkey: '2' },
  { gender: 'neuter'    as GenderType, article: 'das', label: 'Neutrum',  color: 'var(--das)', hotkey: '3' },
];

export function GenderButtons({ onAnswer, answered, selectedAnswer, correctGender, disabled }: {
  onAnswer: (g: GenderType) => void; answered: boolean; selectedAnswer: GenderType | null;
  correctGender?: GenderType; disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {GENDER_BTN.map(btn => {
        const isSelected = selectedAnswer === btn.gender;
        const isCorrectBtn = answered && correctGender === btn.gender;
        const isWrongPick = answered && isSelected && correctGender !== btn.gender;
        const dim = answered && !isCorrectBtn && !isWrongPick;
        const bg = isCorrectBtn ? `color-mix(in srgb, ${STATUS.success} 18%, transparent)`
          : isWrongPick ? `color-mix(in srgb, ${STATUS.danger} 18%, transparent)`
            : `color-mix(in srgb, ${btn.color} 16%, transparent)`;
        const bd = isCorrectBtn ? STATUS.success : isWrongPick ? STATUS.danger : `color-mix(in srgb, ${btn.color} 27%, transparent)`;
        const col = isCorrectBtn ? STATUS.success : isWrongPick ? STATUS.danger : btn.color;
        return (
          <button key={btn.gender} onClick={() => onAnswer(btn.gender)} disabled={answered || disabled}
            className="relative flex flex-col items-center justify-center gap-1 rounded-[16px] py-6 transition-all duration-200 enabled:hover:-translate-y-0.5 disabled:cursor-default"
            style={{ background: bg, border: `2px solid ${bd}`, color: col, opacity: dim ? 0.4 : 1 }}>
            <kbd className="mono absolute left-2.5 top-2.5 rounded-xs px-1.5 text-[10px] opacity-60" style={{ background: 'rgba(255,255,255,.08)', color: 'currentColor' }}>{btn.hotkey}</kbd>
            {isCorrectBtn && <span className="absolute right-2.5 top-2.5"><IconCheck size={16} /></span>}
            {isWrongPick && <span className="absolute right-2.5 top-2.5"><IconX size={16} /></span>}
            <span className="text-3xl font-extrabold leading-none" style={{ letterSpacing: '-.02em' }}>{btn.article}</span>
            <span className="text-[10.5px] font-semibold uppercase tracking-wide opacity-75">{btn.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Answer review list for result screens */
export function AnswerReview<T extends { word: { word: string }; isCorrect: boolean }>({ answers, getCorrectArticle, getSelectedLabel }: {
  answers: T[];
  getCorrectArticle: (a: T) => { article: string; color: string };
  getSelectedLabel?: (a: T) => string | null;
}) {
  const t = useTranslations('games.gameUi');
  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <div className="px-5 py-4 border-b flex items-center gap-2"
        style={{ borderColor: 'var(--theme-border)' }}>
        <IconLightbulb size={16} style={{ color: ACCENT.xp }} />
        <h2 className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
          {t('answerDetails')}
        </h2>
      </div>
      <div className="max-h-96 overflow-y-auto divide-y" style={{ borderColor: 'var(--theme-border)' }}>
        {answers.map((record, i) => {
          const correct = getCorrectArticle(record);
          const wrongLabel = getSelectedLabel?.(record);
          return (
            <div key={i} className="flex items-center justify-between px-4 py-3"
              style={{ background: record.isCorrect ? `${STATUS.success}0A` : `${STATUS.danger}0A` }}>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: record.isCorrect ? `${STATUS.success}1F` : `${STATUS.danger}1F` }}>
                  {record.isCorrect
                    ? <IconCheck size={11} style={{ color: STATUS.success }} />
                    : <IconX size={11} style={{ color: STATUS.danger }} />}
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
                  {t('youChose')} <span style={{ color: STATUS.danger }}>{wrongLabel}</span>
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
  const t = useTranslations('games.gameUi');
  const createWord = useCreatePersonalWord();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const count = wrongWords.length;

  if (count === 0) return null;

  if (added) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-4">
        <div className="text-center py-3 rounded-xl text-body font-semibold"
          style={{ background: `${STATUS.success}14`, color: STATUS.success, border: `1px solid ${STATUS.success}26` }}>
          {t('addedWrong', { count })}
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
          level: w.level as Level,
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
          background: GRADIENT.history,
          color: 'white', border: 'none',
          boxShadow: `0 4px 12px ${ACCENT.writing}4D`,
          opacity: adding ? 0.7 : 1,
          cursor: adding ? 'wait' : 'pointer',
        }}>
        {adding ? t('adding') : t('addWrongCta', { count })}
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
  const t = useTranslations('games.gameUi');
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-4">
        <div className="rounded-2xl border p-5 text-center"
          style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
          <div className="text-2xl mb-2">🎉</div>
          <p className="font-bold text-base mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            {t('signupTitle')}
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>
            {t('signupDesc')}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/auth/register"
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: GRADIENT.brand }}>
              {t('signupFree')}
            </Link>
            <Link href="/auth/login"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:opacity-80"
              style={{ color: 'var(--theme-text-secondary)', borderColor: 'var(--theme-border)' }}>
              {t('login')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-4">
      <UpsellTrigger
        variant="compact"
        title={t('upsellTitle')}
        description={t('upsellDesc')}
        ctaLabel={t('upsellCta')}
        source="game_result"
      />
    </div>
  );
}

// ─── SRS-style playing UI ────────────────────────────────────────────────────

/** Self-contained session timer. Resets when active goes false→true. */
export function useGameTimer(active: boolean): string {
  const [seconds, dispatch] = React.useReducer(
    (s: number, action: 'reset' | 'tick') => action === 'reset' ? 0 : s + 1,
    0,
  );

  useEffect(() => {
    if (!active) return;
    dispatch('reset');
    const id = setInterval(() => dispatch('tick'), 1000);
    return () => clearInterval(id);
  }, [active]);

  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

/** SRS-style playing header with × close, game title, streak + timer pills */
export function GamePlayHeader({ title, subtitle, streak, timer, onExit }: {
  title: string; subtitle?: string; streak?: number; timer?: string; onExit: () => void;
}) {
  const t = useTranslations('games.gameUi');
  const subtitleText = subtitle ?? t('defaultSubtitle');
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <button onClick={onExit}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
          style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
          <IconX size={16} />
        </button>
        <div>
          <p className="text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>{subtitleText}</p>
          <p className="text-[15px] font-bold leading-tight" style={{ color: 'var(--theme-text-primary)' }}>{title}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {streak !== undefined && streak >= 2 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-body font-bold"
            style={{ background: `${ACCENT.games}1F`, color: ACCENT.games }}>
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
/* eslint-disable no-restricted-syntax */
export function GameWordCard({ gradient = 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)', feedback, children, onClick }: {
  gradient?: string; feedback?: 'correct' | 'wrong' | null; children: React.ReactNode; onClick?: () => void;
}) {
  const bg = feedback === 'correct' ? 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)'
    : feedback === 'wrong'   ? 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)'
    : gradient;
/* eslint-enable no-restricted-syntax */
    
  return (
    <div className={`rounded-[20px] overflow-hidden my-6 transition-all duration-500 relative ${feedback === 'wrong' ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
      style={{
        background: bg,
        cursor: onClick ? 'pointer' : 'default',
        minHeight: 180,
        boxShadow: feedback === 'correct' ? '0 16px 40px rgba(34,197,94,0.2)' : feedback === 'wrong' ? '0 16px 40px rgba(239,68,68,0.2)' : '0 16px 40px rgba(79,70,229,0.3)'
      }}
      onClick={onClick}>

      {/* Soft corner glow (clean — no grain) */}
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full pointer-events-none"
        style={{ background: 'rgba(255,255,255,0.08)' }} />

      <div className="flex flex-col items-center justify-center px-6 py-10 text-center relative z-10" style={{ minHeight: 180 }}>
        {children}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
