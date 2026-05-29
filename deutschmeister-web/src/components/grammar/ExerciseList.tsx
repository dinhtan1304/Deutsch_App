'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { pickField, pickLocale } from '@/i18n/pickLocale';
import { Exercise, SubmitResult, GrammarLesson } from '@/types/grammar';
import { HighlightedText } from '@/components/word-highlight/HighlightedText';
import { usePronunciation } from '@/hooks/usePronunciation';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import {
    IconCheck, IconX, IconArrowRight, IconRefresh,
    IconTrophy, IconLightbulb, IconLoader,
} from '@/components/ui/Icons';

const SPECIAL_CHARS = ['ä', 'ö', 'ü', 'Ä', 'Ö', 'Ü', 'ß'];

interface NextLesson {
    slug: string;
    titleVi: string;
    titleEn?: string;
    titleDe?: string;
    level: GrammarLesson['level'];
}

interface ExerciseListProps {
    exercises: Exercise[];
    onSubmit: (answers: Record<number, string | string[]>) => Promise<SubmitResult>;
    onBackToTheory?: () => void;
    nextLesson?: NextLesson | null;
}

const TYPE_META: Record<string, { labelKey: string; color: string; icon: string }> = {
    mcq:           { labelKey: 'typeMcq',          color: ACCENT.srs,    icon: '🎯' },
    fill_blank:    { labelKey: 'typeFillBlank',    color: ACCENT.vocab,  icon: '✏️' },
    reorder:       { labelKey: 'typeReorder',      color: ACCENT.xp,     icon: '🔀' },
    // eslint-disable-next-line no-restricted-syntax
    translate:     { labelKey: 'typeTranslate',    color: '#10B981',     icon: '🌐' },
    error_correct: { labelKey: 'typeErrorCorrect', color: STATUS.danger, icon: '🔧' },
};

function difficultyFromPoints(pts: number): { labelKey: string; color: string } {
    if (pts <= 1) return { labelKey: 'diffEasy',   color: STATUS.success };
    if (pts <= 2) return { labelKey: 'diffMedium', color: ACCENT.xp };
    return            { labelKey: 'diffHard',  color: STATUS.danger };
}

const OPTION_COLORS = [ACCENT.srs, ACCENT.vocab, ACCENT.reading, ACCENT.xp];
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

// ─── Client-side answer validation ──────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkClientSide(exercise: Exercise, answer: string | string[]): boolean {
    const ad = exercise.answerData as Record<string, unknown>;
    switch (exercise.exerciseType) {
        case 'mcq':
            return answer === String(ad.correctIndex);
        case 'fill_blank': {
            const u = (answer as string).trim().toLowerCase();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const b = (ad.blanks as any[])[0] as { answer: string; alternatives?: string[] };
            return u === b.answer.trim().toLowerCase() ||
                (b.alternatives ?? []).some((a: string) => u === a.trim().toLowerCase());
        }
        case 'reorder':
            return JSON.stringify(answer) === JSON.stringify(ad.correctOrder);
        case 'translate': {
            const u = (answer as string).toLowerCase().replace(/[.!?]/g, '').trim();
            return (ad.acceptedAnswers as string[]).some(
                (a: string) => a.toLowerCase().replace(/[.!?]/g, '').trim() === u
            );
        }
        case 'error_correct':
            return (answer as string).trim().toLowerCase() ===
                (ad.correctedText as string).trim().toLowerCase();
        default:
            return false;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCorrectAnswerLabel(exercise: Exercise): string {
    const ad = exercise.answerData as Record<string, unknown>;
    switch (exercise.exerciseType) {
        case 'mcq': {
            const opts = ad.options as string[];
            const idx = ad.correctIndex as number;
            return opts[idx] ?? '';
        }
        case 'fill_blank':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return ((ad.blanks as any[])[0] as { answer: string }).answer;
        case 'reorder':
            return (ad.correctOrder as string[]).join(' ');
        case 'translate':
            return (ad.acceptedAnswers as string[])[0] ?? '';
        case 'error_correct':
            return ad.correctedText as string;
        default:
            return '';
    }
}

// ─── Dot progress bar ───────────────────────────────────────────────────────

function DotProgress({ total, current, results }: {
    total: number; current: number; results: (boolean | null)[];
}) {
    return (
        <div className="flex gap-1 flex-wrap">
            {Array.from({ length: total }, (_, i) => {
                const isDone    = i < current;
                const correct   = results[i];
                const isCurrent = i === current;
                return (
                    <div key={i} className="rounded-full transition-all duration-300"
                        style={{
                            width:  isCurrent ? 26 : 10,
                            height: 10,
                            background: isCurrent  ? ACCENT.srs
                                : !isDone   ? 'var(--theme-bg-tertiary)'
                                : correct   ? STATUS.success
                                : STATUS.danger,
                            opacity: i > current ? 0.45 : 1,
                        }}
                    />
                );
            })}
        </div>
    );
}

// ─── MCQ ────────────────────────────────────────────────────────────────────

function MCQInput({ options, value, onChange, disabled, revealed, correctIndex }: {
    options: string[]; value?: string; onChange: (v: string) => void;
    disabled: boolean; revealed: boolean; correctIndex?: number;
}) {
    useEffect(() => {
        const handle = (e: KeyboardEvent) => {
            if (disabled || revealed) return;
            const n = parseInt(e.key);
            if (n >= 1 && n <= options.length) onChange(String(n - 1));
        };
        window.addEventListener('keydown', handle);
        return () => window.removeEventListener('keydown', handle);
    }, [options.length, onChange, disabled, revealed]);

    return (
        <div className="space-y-2.5">
            {options.map((opt, idx) => {
                const isSelected = value === String(idx);
                const isCorrect  = correctIndex !== undefined && idx === correctIndex;
                const isWrong    = revealed && isSelected && !isCorrect;

                const color = revealed
                    ? isCorrect ? STATUS.success : isWrong ? STATUS.danger : OPTION_COLORS[idx % OPTION_COLORS.length]
                    : OPTION_COLORS[idx % OPTION_COLORS.length];

                const bg = revealed
                    ? isCorrect ? `${STATUS.success}18` : isWrong ? `${STATUS.danger}12` : `${color}08`
                    : isSelected ? `${color}12` : 'var(--theme-bg-secondary)';

                const border = revealed
                    ? isCorrect ? STATUS.success : isWrong ? STATUS.danger : 'var(--theme-border)'
                    : isSelected ? color : 'var(--theme-border)';

                return (
                    <button key={idx} onClick={() => !disabled && !revealed && onChange(String(idx))}
                        disabled={disabled || revealed}
                        className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-150"
                        style={{ borderColor: border, backgroundColor: bg, cursor: disabled || revealed ? 'default' : 'pointer' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-body font-extrabold shrink-0 transition-all"
                            style={{ background: isSelected || (revealed && isCorrect) ? color : `${color}18`, color: isSelected || (revealed && isCorrect) ? 'white' : color }}>
                            {OPTION_LABELS[idx]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium leading-snug" style={{ color: 'var(--theme-text-primary)' }}>
                                <HighlightedText text={opt} />
                            </div>
                        </div>
                        {revealed && isCorrect && (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: STATUS.success }}>
                                <IconCheck size={11} style={{ color: 'white' }} />
                            </div>
                        )}
                        {revealed && isWrong && (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: STATUS.danger }}>
                                <IconX size={11} style={{ color: 'white' }} />
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Text Input ──────────────────────────────────────────────────────────────

function TextInput({ value, onChange, disabled, placeholder, multiline, onEnter, showSpecialChars }: {
    value: string; onChange: (v: string) => void; disabled: boolean;
    placeholder: string; multiline?: boolean; onEnter?: () => void; showSpecialChars?: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const textRef  = useRef<HTMLTextAreaElement>(null);
    useEffect(() => { if (!disabled) { inputRef.current?.focus(); textRef.current?.focus(); } }, [disabled]);

    const insertSpecial = (char: string) => {
        const el = multiline ? textRef.current : inputRef.current;
        if (!el) { onChange(value + char); return; }
        const start = el.selectionStart ?? value.length;
        const end   = el.selectionEnd   ?? value.length;
        const newVal = value.slice(0, start) + char + value.slice(end);
        onChange(newVal);
        setTimeout(() => { el.setSelectionRange(start + char.length, start + char.length); el.focus(); }, 0);
    };

    const sharedStyle: React.CSSProperties = {
        borderColor: disabled ? 'var(--theme-border)' : ACCENT.vocab,
        backgroundColor: 'var(--theme-bg-secondary)',
        color: 'var(--theme-text-primary)',
    };
    const cls = 'w-full px-4 py-3.5 rounded-xl border-2 text-[15px] font-medium transition-all outline-none';

    return (
        <div>
            {multiline
                ? <textarea ref={textRef} value={value} onChange={e => onChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && value.trim()) { e.preventDefault(); onEnter?.(); } }}
                    disabled={disabled} placeholder={placeholder} rows={2} className={`${cls} resize-none`} style={sharedStyle} />
                : <input ref={inputRef} type="text" value={value} autoComplete="off"
                    onChange={e => onChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && value.trim()) onEnter?.(); }}
                    disabled={disabled} placeholder={placeholder} className={cls} style={sharedStyle} />
            }
            {showSpecialChars && !disabled && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {SPECIAL_CHARS.map(ch => (
                        <button key={ch} type="button" onClick={() => insertSpecial(ch)}
                            className="w-9 h-9 rounded-lg text-sm font-bold border transition-all hover:scale-105 active:scale-95"
                            style={{ borderColor: ACCENT.vocab, color: ACCENT.vocab, backgroundColor: `${ACCENT.vocab}0F` }}>
                            {ch}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Reorder ──────────────────────────────────────────────────────────────────

function ReorderInput({ words, value, onChange, disabled }: {
    words: string[]; value: string[]; onChange: (v: string[]) => void; disabled: boolean;
}) {
    const t = useTranslations('vocabulary.grammar.exercise');
    const available = (() => {
        const remaining = [...words];
        for (const w of value) { const i = remaining.indexOf(w); if (i !== -1) remaining.splice(i, 1); }
        return remaining;
    })();

    return (
        <div className="space-y-4">
            <div className="min-h-14 p-3 rounded-xl border-2 border-dashed flex flex-wrap gap-2 items-center"
                style={{ borderColor: value.length > 0 ? ACCENT.vocab : 'var(--theme-border)', backgroundColor: `${ACCENT.vocab}08` }}>
                {value.length === 0 && <span className="text-body italic" style={{ color: 'var(--theme-text-muted)' }}>{t('reorderPrompt')}</span>}
                {value.map((w, i) => (
                    <button key={i} onClick={() => { if (!disabled) { const n=[...value]; n.splice(i,1); onChange(n); } }} disabled={disabled}
                        className="px-3.5 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                        style={{ background: GRADIENT.history, color: 'white', boxShadow: `0 2px 8px ${ACCENT.vocab}40` }}>
                        {w} <span className="ml-1 opacity-60 text-xs">×</span>
                    </button>
                ))}
                {value.length > 0 && !disabled && (
                    <button onClick={() => onChange([])} className="ml-auto px-2 py-1 rounded-md text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>{t('clearAll')}</button>
                )}
            </div>
            {available.length > 0 && !disabled && (
                <div className="flex flex-wrap gap-2">
                    {available.map((w, i) => (
                        <button key={i} onClick={() => onChange([...value, w])}
                            className="px-3.5 py-2 rounded-lg border-2 text-sm font-medium transition-all hover:-translate-y-0.5"
                            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)' }}>
                            {w}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Feedback panel (shown after Check) ─────────────────────────────────────

function FeedbackPanel({ correct, correctAnswer, explanation }: {
    correct: boolean; correctAnswer?: string; explanation?: string;
}) {
    const t = useTranslations('vocabulary.grammar.exercise');
    return (
        <div className="mx-5 mb-4 rounded-xl overflow-hidden border"
            style={{ borderColor: correct ? `${STATUS.success}40` : `${STATUS.danger}40` }}>
            {/* Header */}
            <div className="px-4 py-2.5 flex items-center gap-2"
                style={{ background: correct ? `${STATUS.success}15` : `${STATUS.danger}15` }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: correct ? STATUS.success : STATUS.danger }}>
                    {correct
                        ? <IconCheck size={11} style={{ color: 'white' }} />
                        : <IconX size={11} style={{ color: 'white' }} />}
                </div>
                <span className="text-sm font-bold" style={{ color: correct ? STATUS.success : STATUS.danger }}>
                    {correct ? t('correct') : t('incorrect')}
                </span>
            </div>
            {/* Body */}
            <div className="px-4 py-3 space-y-2" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                {!correct && correctAnswer && (
                    <p className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>
                        <span style={{ color: 'var(--theme-text-muted)' }}>{t('correctAnswerPrefix')}</span>
                        <span className="font-bold" style={{ color: STATUS.success }}>{correctAnswer}</span>
                    </p>
                )}
                {explanation && (
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                        💡 {explanation}
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Result Screen ────────────────────────────────────────────────────────────

function ResultScreen({ result, exercises, onRetry, nextLesson }: {
    result: SubmitResult; exercises: Exercise[]; onRetry: () => void; nextLesson?: NextLesson | null;
}) {
    const t = useTranslations('vocabulary.grammar.exercise');
    const locale = useLocale();
    const accuracy = result.totalQuestions > 0 ? Math.round((result.correctCount / result.totalQuestions) * 100) : 0;
    // eslint-disable-next-line no-restricted-syntax
    const gradient = result.passed ? GRADIENT.writing : accuracy >= 50 ? GRADIENT.action : GRADIENT.vocab;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: gradient }}>
                    <IconTrophy size={28} style={{ color: 'white' }} />
                </div>
                <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
                    {result.passed ? t('excellent') : accuracy >= 50 ? t('tryHarder') : t('needPractice')}
                </h2>
                <p className="text-sm mb-6" style={{ color: 'var(--theme-text-muted)' }}>
                    {result.passed ? t('passedMsg') : t('needScoreMsg')}
                </p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                        { value: result.score,                                label: t('statScore'),    color: ACCENT.vocab,   bg: 'rgba(139,92,246,' },
                        { value: `${result.correctCount}/${result.totalQuestions}`, label: t('statCorrect'),  color: STATUS.success, bg: 'rgba(34,197,94,' },
                        { value: `${accuracy}%`,                              label: t('statAccuracy'), color: ACCENT.srs,     bg: 'rgba(59,130,246,' },
                    ].map((s, i) => (
                        <div key={i} className="rounded-xl p-3" style={{ background: `linear-gradient(135deg, ${s.bg}.1), ${s.bg}.05))` }}>
                            <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                            <div className="text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button onClick={onRetry}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                        style={{ background: GRADIENT.history, boxShadow: `0 4px 12px ${ACCENT.vocab}40` }}>
                        <IconRefresh size={16} style={{ color: 'white' }} /> {t('retry')}
                    </button>

                    {result.passed && nextLesson && (
                        <Link href={`/grammar/${nextLesson.slug}`}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:scale-[1.02] shadow-xl"
                            style={{ background: GRADIENT.writing, boxShadow: '0 8px 20px rgba(99,102,241,0.35)' }}>
                            {t('nextLesson', { title: pickField(nextLesson, 'title', locale) })}
                            <IconArrowRight size={14} style={{ color: 'white' }} />
                        </Link>
                    )}
                </div>
            </div>

            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--theme-border)' }}>
                    <IconLightbulb size={16} style={{ color: ACCENT.xp }} />
                    <h3 className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('answerDetails')}</h3>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                    {exercises.map((ex, i) => {
                        const fb = result.feedback.find(f => f.exerciseId === ex.id);
                        if (!fb) return null;
                        const tm = TYPE_META[ex.exerciseType] || { labelKey: '', color: 'var(--theme-text-muted)', icon: '' };
                        return (
                            <div key={i} className="px-5 py-3 flex items-start gap-3"
                                style={{ background: fb.correct ? 'rgba(34,197,94,.03)' : 'rgba(239,68,68,.03)' }}>
                                <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                    style={{ background: fb.correct ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)' }}>
                                    {fb.correct ? <IconCheck size={12} style={{ color: STATUS.success }} /> : <IconX size={12} style={{ color: STATUS.danger }} />}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-caption font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${tm.color}15`, color: tm.color }}>
                                            {tm.labelKey ? t(tm.labelKey as 'typeMcq') : ex.exerciseType}
                                        </span>
                                        <span className="text-body font-medium truncate" style={{ color: 'var(--theme-text-primary)' }}>{pickField(ex, 'question', locale)}</span>
                                    </div>
                                    {fb.explanation && (
                                        <p className="text-xs mt-1" style={{ color: fb.correct ? STATUS.success : STATUS.danger }}>
                                            💡 {pickLocale<string>(fb.explanation as Record<string, string>, locale) || ''}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export const ExerciseList = ({ exercises, onSubmit, nextLesson }: ExerciseListProps) => {
    const t = useTranslations('vocabulary.grammar.exercise');
    const locale = useLocale();
    const [index, setIndex]                   = useState(0);
    const [answers, setAnswers]               = useState<Record<number, string | string[]>>({});
    const [currentAnswer, setCurrentAnswer]   = useState<string | string[]>('');
    const [result, setResult]                 = useState<SubmitResult | null>(null);
    const [isSubmitting, setIsSubmitting]     = useState(false);
    const [submitError, setSubmitError]       = useState<string | null>(null);
    const [combo, setCombo]                   = useState(0);
    const [showHint, setShowHint]             = useState(false);
    // Immediate feedback state
    const [revealed, setRevealed]             = useState(false);
    const [questionCorrect, setQuestionCorrect] = useState<boolean | null>(null);
    const [questionResults, setQuestionResults] = useState<(boolean | null)[]>([]);
    const { speak } = usePronunciation();

    const exercise  = exercises[index]!;
    const isLast    = index === exercises.length - 1;
    const typeMeta  = exercise ? TYPE_META[exercise.exerciseType] || { labelKey: '', color: 'var(--theme-text-muted)', icon: '' } : null;
    const difficulty = exercise ? difficultyFromPoints(exercise.points) : null;

    const shuffledMap = useMemo(() => {
        const map: Record<number, string[]> = {};
        exercises.forEach((ex, i) => {
            if (ex.exerciseType === 'reorder') {
                const words = [...(ex.answerData.correctOrder as string[])];
                for (let j = words.length - 1; j > 0; j--) {
                    const k = Math.floor(Math.random() * (j + 1));
                    const tmp = words[j]!; words[j] = words[k]!; words[k] = tmp;
                }
                map[i] = words;
            }
        });
        return map;
    }, [exercises]);

    const hasAnswer = useCallback((): boolean => {
        if (typeof currentAnswer === 'string') return currentAnswer.trim().length > 0;
        return Array.isArray(currentAnswer) && currentAnswer.length > 0;
    }, [currentAnswer]);

    // Check — reveal feedback for current question
    const handleCheck = useCallback(() => {
        const correct = checkClientSide(exercise, currentAnswer);
        setQuestionCorrect(correct);
        setRevealed(true);
        setQuestionResults(prev => {
            const next = [...prev];
            next[index] = correct;
            return next;
        });
        if (correct) {
            setCombo(c => c + 1);
        } else {
            setCombo(0);
        }
    }, [exercise, currentAnswer, index]);

    // Continue — advance to next after reveal
    const handleNext = useCallback(() => {
        setAnswers(prev => ({ ...prev, [exercise.order]: currentAnswer }));
        setCurrentAnswer('');
        setShowHint(false);
        setRevealed(false);
        setQuestionCorrect(null);
        setIndex(i => i + 1);
    }, [exercise, currentAnswer]);

    const handleSubmit = useCallback(async () => {
        const final = { ...answers, [exercise.order]: currentAnswer };
        setAnswers(final);
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const res = await onSubmit(final);
            setResult(res);
        } catch (err: unknown) {
            const msg = (err as { message?: string })?.message || t('submitError');
            setSubmitError(typeof msg === 'string' ? msg : t('submitError'));
        } finally {
            setIsSubmitting(false);
        }
    }, [answers, exercise, currentAnswer, onSubmit]);

    // Last question after reveal: submit
    const handleNextOrSubmit = useCallback(() => {
        if (isLast) handleSubmit(); else handleNext();
    }, [isLast, handleNext, handleSubmit]);

    const handleRetry = () => {
        setIndex(0); setAnswers({}); setCurrentAnswer(''); setResult(null);
        setIsSubmitting(false); setSubmitError(null); setCombo(0);
        setRevealed(false); setQuestionCorrect(null); setQuestionResults([]);
    };

    // Keyboard: Enter = check (if not revealed) or next/submit (if revealed)
    useEffect(() => {
        const handle = (e: KeyboardEvent) => {
            if (e.key !== 'Enter' || e.shiftKey || result) return;
            if (!revealed && hasAnswer() && exercise?.exerciseType === 'mcq') {
                e.preventDefault();
                handleCheck();
            } else if (revealed) {
                e.preventDefault();
                handleNextOrSubmit();
            }
        };
        window.addEventListener('keydown', handle);
        return () => window.removeEventListener('keydown', handle);
    }, [result, hasAnswer, exercise, revealed, handleCheck, handleNextOrSubmit]);

    // Space = speak question
    useEffect(() => {
        const handle = (e: KeyboardEvent) => {
            if (e.key === ' ' && e.target === document.body && exercise?.questionDe) {
                e.preventDefault();
                speak(exercise.questionDe);
            }
        };
        window.addEventListener('keydown', handle);
        return () => window.removeEventListener('keydown', handle);
    }, [exercise, speak]);

    if (result) {
        return (
            <div className="max-w-2xl mx-auto">
                <ResultScreen result={result} exercises={exercises} onRetry={handleRetry} nextLesson={nextLesson} />
            </div>
        );
    }

    if (!exercise || !typeMeta || !difficulty) return null;

    const explanationText = pickLocale<string>(
        (exercise as { explanation?: Record<string, string> }).explanation, locale,
    ) || '';
    const correctAnswerLabel = getCorrectAnswerLabel(exercise);
    const questionText = pickField(exercise, 'question', locale);

    return (
        <div className="max-w-2xl mx-auto space-y-4">

            {/* ── Progress header ── */}
            <div className="rounded-2xl border px-5 py-3.5 space-y-3"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                        {t('questionProgress', { current: index + 1, total: exercises.length })}
                    </span>
                    {combo >= 2 && (
                        <span className="flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg text-caption"
                            style={{ background: `${ACCENT.games}1F`, color: ACCENT.games }}>
                            🔥 {t('comboLabel', { count: combo })}
                        </span>
                    )}
                </div>
                <DotProgress total={exercises.length} current={index} results={questionResults} />
            </div>

            {/* ── Question card ── */}
            <div className="rounded-2xl border overflow-hidden" key={index}
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>

                {/* Card header */}
                <div className="px-5 py-4 border-b flex items-center justify-between gap-3"
                    style={{ borderColor: 'var(--theme-border)' }}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold text-white shrink-0"
                            style={{ background: GRADIENT.action }}>
                            {index + 1}
                        </div>
                        <span className="flex items-center gap-1 text-caption font-bold px-2.5 py-1 rounded-lg"
                            style={{ backgroundColor: `${typeMeta.color}14`, color: typeMeta.color }}>
                            {typeMeta.icon} {typeMeta.labelKey ? t(typeMeta.labelKey as 'typeMcq') : exercise.exerciseType}
                        </span>
                        <span className="flex items-center gap-1 text-caption font-semibold px-2 py-1 rounded-lg"
                            style={{ backgroundColor: `${difficulty.color}12`, color: difficulty.color }}>
                            ● {t(difficulty.labelKey as 'diffEasy')}
                        </span>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg shrink-0"
                        style={{ background: `${ACCENT.xp}1F`, color: ACCENT.xp }}>
                        ⭐ {t('points', { points: exercise.points })}
                    </span>
                </div>

                {/* Question text */}
                <div className="px-5 pt-5 pb-4">
                    <div className="flex items-start gap-2.5 mb-1.5">
                        <h3 className="flex-1 text-[17px] font-bold leading-snug" style={{ color: 'var(--theme-text-primary)' }}>
                            {questionText}
                        </h3>
                        {exercise.questionDe && (
                            <button onClick={() => speak(exercise.questionDe!)}
                                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 mt-0.5"
                                style={{ background: `${ACCENT.srs}1A`, color: ACCENT.srs }}
                                title={t('speakQuestion')}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                </svg>
                            </button>
                        )}
                    </div>
                    {exercise.questionDe && exercise.questionDe !== questionText && (
                        <p className="text-body italic" style={{ color: 'var(--theme-text-muted)' }}>
                            <HighlightedText text={exercise.questionDe} />
                        </p>
                    )}
                </div>

                {/* Answer area */}
                <div className="px-5 pb-5">
                    {exercise.exerciseType === 'mcq' && (
                        <MCQInput
                            options={exercise.answerData.options}
                            value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
                            onChange={v => setCurrentAnswer(v)}
                            disabled={false}
                            revealed={revealed}
                            correctIndex={exercise.answerData.correctIndex as number}
                        />
                    )}
                    {exercise.exerciseType === 'fill_blank' && (
                        <TextInput value={typeof currentAnswer === 'string' ? currentAnswer : ''} onChange={v => setCurrentAnswer(v)}
                            disabled={revealed} placeholder={t('placeholderFill')}
                            onEnter={revealed ? handleNextOrSubmit : handleCheck} showSpecialChars />
                    )}
                    {exercise.exerciseType === 'translate' && (
                        <TextInput value={typeof currentAnswer === 'string' ? currentAnswer : ''} onChange={v => setCurrentAnswer(v)}
                            disabled={revealed} multiline placeholder={t('placeholderTranslate')}
                            onEnter={revealed ? handleNextOrSubmit : handleCheck} showSpecialChars />
                    )}
                    {exercise.exerciseType === 'error_correct' && (
                        <TextInput value={typeof currentAnswer === 'string' ? currentAnswer : ''} onChange={v => setCurrentAnswer(v)}
                            disabled={revealed} multiline placeholder={t('placeholderCorrect')}
                            onEnter={revealed ? handleNextOrSubmit : handleCheck} showSpecialChars />
                    )}
                    {exercise.exerciseType === 'reorder' && (
                        <ReorderInput words={shuffledMap[index] || exercise.answerData.correctOrder}
                            value={Array.isArray(currentAnswer) ? currentAnswer : []}
                            onChange={v => setCurrentAnswer(v)} disabled={revealed} />
                    )}
                </div>

                {/* Feedback panel (after check) */}
                {revealed && (
                    <FeedbackPanel
                        correct={questionCorrect === true}
                        correctAnswer={questionCorrect ? undefined : correctAnswerLabel}
                        explanation={explanationText}
                    />
                )}

                {/* Hint panel (only when not revealed) */}
                {showHint && !revealed && (
                    <div className="mx-5 mb-4 rounded-xl overflow-hidden" style={{ border: `1.5px solid ${ACCENT.xp}59` }}>
                        <div className="px-3.5 py-2 flex items-center gap-2" style={{ background: GRADIENT.xp }}>
                            <IconLightbulb size={14} style={{ color: 'white' }} />
                            <span className="text-xs font-bold text-white tracking-wide">{t('hint')}</span>
                        </div>
                        <div className="px-4 py-3" style={{ background: `${ACCENT.xp}0F` }}>
                            <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--theme-text-primary)' }}>
                                {(exercise as { hint?: string; hintVi?: string }).hint || (exercise as { hintVi?: string }).hintVi || t('defaultHint')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Error banner */}
                {submitError && (
                    <div className="mx-5 mb-4 px-4 py-3 rounded-xl flex items-start gap-2.5"
                        style={{ background: `${STATUS.danger}14`, border: `1px solid ${STATUS.danger}33` }}>
                        <IconX size={15} style={{ color: STATUS.danger, marginTop: 1, flexShrink: 0 }} />
                        <p className="text-body" style={{ color: STATUS.danger }}>{submitError}</p>
                    </div>
                )}

                {/* Footer action bar */}
                <div className="px-5 py-4 border-t flex items-center justify-between gap-3"
                    style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                    {/* Left: secondary actions (hide when revealed) */}
                    <div className="flex items-center gap-1.5">
                        {!revealed && (
                            <button onClick={() => setShowHint(h => !h)}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
                                style={showHint
                                    ? { background: GRADIENT.xp, color: 'white' }
                                    : { background: `${ACCENT.xp}1A`, color: ACCENT.xp, border: `1px solid ${ACCENT.xp}40` }}>
                                <IconLightbulb size={13} /> {t('hint')}
                            </button>
                        )}
                    </div>

                    {/* Right: primary CTA */}
                    {!revealed ? (
                        <button onClick={handleCheck} disabled={!hasAnswer()}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-body font-bold transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                            style={{
                                background: hasAnswer() ? GRADIENT.action : 'var(--theme-bg-tertiary)',
                                color: hasAnswer() ? 'white' : 'var(--theme-text-muted)',
                                boxShadow: hasAnswer() ? `0 4px 12px ${ACCENT.srs}4D` : 'none',
                            }}>
                            {!hasAnswer() ? t('chooseAnswer') : <><IconCheck size={14} /> {t('check')}</>}
                        </button>
                    ) : (
                        <button onClick={handleNextOrSubmit} disabled={isSubmitting}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-body font-bold transition-all hover:-translate-y-0.5 disabled:opacity-40"
                            style={{
                                background: isLast ? GRADIENT.writing : GRADIENT.action,
                                color: 'white',
                                boxShadow: `0 4px 12px ${ACCENT.srs}4D`,
                            }}>
                            {isSubmitting ? (
                                <><IconLoader size={14} /> {t('grading')}</>
                            ) : isLast ? (
                                <><IconCheck size={14} /> {t('submit')}</>
                            ) : (
                                <>{t('continue')} <IconArrowRight size={14} /></>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Keyboard shortcuts hint ── */}
            {!revealed && (
                <div className="text-center text-caption space-x-2" style={{ color: 'var(--theme-text-muted)' }}>
                    <span>{t('shortcuts')}</span>
                    {exercise.exerciseType === 'mcq' && (
                        <span>
                            <kbd className="px-1.5 py-0.5 rounded text-caption font-bold" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
                                1–{exercise.answerData.options?.length ?? 4}
                            </kbd>
                            {' '}{t('shortcutSelect')} ·
                        </span>
                    )}
                    <span>
                        <kbd className="px-1.5 py-0.5 rounded text-caption font-bold" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>Enter</kbd>
                        {' '}{t('shortcutCheck')} ·
                    </span>
                    <span>
                        <kbd className="px-1.5 py-0.5 rounded text-caption font-bold" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>Space</kbd>
                        {' '}{t('shortcutSpeak')}
                    </span>
                </div>
            )}
        </div>
    );
};
