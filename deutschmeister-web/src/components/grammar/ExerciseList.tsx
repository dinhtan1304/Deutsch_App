'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Exercise, SubmitResult } from '@/types/grammar';
import { HighlightedText } from '@/components/word-highlight/HighlightedText';
import { usePronunciation } from '@/hooks/usePronunciation';
import {
    IconCheck, IconX, IconArrowRight, IconRefresh,
    IconTrophy, IconLightbulb, IconLoader,
} from '@/components/ui/Icons';

const SPECIAL_CHARS = ['ä', 'ö', 'ü', 'Ä', 'Ö', 'Ü', 'ß'];

interface ExerciseListProps {
    exercises: Exercise[];
    onSubmit: (answers: Record<number, string | string[]>) => Promise<SubmitResult>;
    onBackToTheory?: () => void; // kept for API compat, not rendered
}

const TYPE_META: Record<string, { label: string; color: string; icon: string }> = {
    mcq:          { label: 'Trắc nghiệm', color: '#3B82F6', icon: '🎯' },
    fill_blank:   { label: 'Điền từ',     color: '#8B5CF6', icon: '✏️' },
    reorder:      { label: 'Sắp xếp',     color: '#F59E0B', icon: '🔀' },
    translate:    { label: 'Dịch',        color: '#10B981', icon: '🌐' },
    error_correct:{ label: 'Sửa lỗi',    color: '#EF4444', icon: '🔧' },
};

function difficultyFromPoints(pts: number): { label: string; color: string } {
    if (pts <= 1) return { label: 'Dễ',        color: '#22C55E' };
    if (pts <= 2) return { label: 'Trung bình', color: '#F59E0B' };
    return            { label: 'Khó',       color: '#EF4444' };
}

const OPTION_COLORS = ['#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B'];

// ─── Dot progress bar ───────────────────────────────────────────────────

function DotProgress({ total, current, skipped }: { total: number; current: number; skipped: Set<number> }) {
    return (
        <div className="flex gap-1 flex-wrap">
            {Array.from({ length: total }, (_, i) => {
                const isPast    = i < current && !skipped.has(i);
                const isSkipped = skipped.has(i);
                const isCurrent = i === current;
                return (
                    <div
                        key={i}
                        className="rounded-full transition-all duration-300"
                        style={{
                            width:  isCurrent ? 26 : 10,
                            height: 10,
                            background: isCurrent  ? '#3B82F6'
                                : isPast    ? '#22C55E'
                                : isSkipped ? '#EF4444'
                                : 'var(--theme-bg-tertiary)',
                            opacity: i > current && !isSkipped ? 0.45 : 1,
                        }}
                    />
                );
            })}
        </div>
    );
}

// ─── MCQ with numbered options + keyboard ────────────────────────────────

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

function MCQInput({ options, value, onChange, disabled }: {
    options: string[]; value?: string; onChange: (v: string) => void; disabled: boolean;
}) {
    useEffect(() => {
        const handle = (e: KeyboardEvent) => {
            if (disabled) return;
            const n = parseInt(e.key);
            if (n >= 1 && n <= options.length) onChange(String(n - 1));
        };
        window.addEventListener('keydown', handle);
        return () => window.removeEventListener('keydown', handle);
    }, [options.length, onChange, disabled]);

    return (
        <div className="space-y-2.5">
            {options.map((opt, idx) => {
                const isSelected = value === String(idx);
                const color = OPTION_COLORS[idx % OPTION_COLORS.length];
                return (
                    <button
                        key={idx}
                        onClick={() => !disabled && onChange(String(idx))}
                        disabled={disabled}
                        className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-150 hover:-translate-y-0.5"
                        style={{
                            borderColor: isSelected ? color : 'var(--theme-border)',
                            backgroundColor: isSelected ? `${color}12` : 'var(--theme-bg-secondary)',
                            cursor: disabled ? 'default' : 'pointer',
                        }}
                    >
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-body font-extrabold shrink-0 transition-all"
                            style={{
                                background: isSelected ? color : `${color}18`,
                                color: isSelected ? 'white' : color,
                            }}
                        >
                            {OPTION_LABELS[idx]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium leading-snug" style={{ color: 'var(--theme-text-primary)' }}>
                                <HighlightedText text={opt} />
                            </div>
                        </div>
                        {isSelected && (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: color }}>
                                <IconCheck size={11} style={{ color: 'white' }} />
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Text Input ──────────────────────────────────────────────────────────

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
        borderColor: disabled ? 'var(--theme-border)' : '#8B5CF6',
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
                            style={{ borderColor: '#8B5CF6', color: '#8B5CF6', backgroundColor: 'rgba(139,92,246,.06)' }}>
                            {ch}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Reorder ──────────────────────────────────────────────────────────────

function ReorderInput({ words, value, onChange, disabled }: {
    words: string[]; value: string[]; onChange: (v: string[]) => void; disabled: boolean;
}) {
    const available = (() => {
        const remaining = [...words];
        for (const w of value) { const i = remaining.indexOf(w); if (i !== -1) remaining.splice(i, 1); }
        return remaining;
    })();

    return (
        <div className="space-y-4">
            <div className="min-h-14 p-3 rounded-xl border-2 border-dashed flex flex-wrap gap-2 items-center"
                style={{ borderColor: value.length > 0 ? '#8B5CF6' : 'var(--theme-border)', backgroundColor: 'rgba(139,92,246,.03)' }}>
                {value.length === 0 && <span className="text-body italic" style={{ color: 'var(--theme-text-muted)' }}>Nhấn vào từ bên dưới để sắp xếp...</span>}
                {value.map((w, i) => (
                    <button key={i} onClick={() => { if (!disabled) { const n=[...value]; n.splice(i,1); onChange(n); } }} disabled={disabled}
                        className="px-3.5 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                        style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', color: 'white', boxShadow: '0 2px 8px rgba(139,92,246,.25)' }}>
                        {w} <span className="ml-1 opacity-60 text-xs">×</span>
                    </button>
                ))}
                {value.length > 0 && !disabled && (
                    <button onClick={() => onChange([])} className="ml-auto px-2 py-1 rounded-md text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>Xóa hết</button>
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

// ─── Result Screen ────────────────────────────────────────────────────────

function ResultScreen({ result, exercises, onRetry }: { result: SubmitResult; exercises: Exercise[]; onRetry: () => void }) {
    const accuracy = result.totalQuestions > 0 ? Math.round((result.correctCount / result.totalQuestions) * 100) : 0;
    const gradient = result.passed ? 'linear-gradient(135deg, #F59E0B, #D97706)' : accuracy >= 50 ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : 'linear-gradient(135deg, #8B5CF6, #7C3AED)';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: gradient }}>
                    <IconTrophy size={28} style={{ color: 'white' }} />
                </div>
                <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
                    {result.passed ? 'Xuất sắc!' : accuracy >= 50 ? 'Cố gắng thêm!' : 'Cần luyện thêm'}
                </h2>
                <p className="text-sm mb-6" style={{ color: 'var(--theme-text-muted)' }}>
                    {result.passed ? 'Bạn đã hoàn thành bài học này' : 'Cần đạt 80% để hoàn thành'}
                </p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                        { value: result.score, label: 'Điểm', color: '#8B5CF6', bg: 'rgba(139,92,246,' },
                        { value: `${result.correctCount}/${result.totalQuestions}`, label: 'Đúng', color: '#22C55E', bg: 'rgba(34,197,94,' },
                        { value: `${accuracy}%`, label: 'Chính xác', color: '#3B82F6', bg: 'rgba(59,130,246,' },
                    ].map((s, i) => (
                        <div key={i} className="rounded-xl p-3" style={{ background: `linear-gradient(135deg, ${s.bg}.1), ${s.bg}.05))` }}>
                            <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                            <div className="text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</div>
                        </div>
                    ))}
                </div>
                <button onClick={onRetry}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', boxShadow: '0 4px 12px rgba(139,92,246,.25)' }}>
                    <IconRefresh size={16} style={{ color: 'white' }} /> Làm lại
                </button>
            </div>

            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--theme-border)' }}>
                    <IconLightbulb size={16} style={{ color: '#F59E0B' }} />
                    <h3 className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>Chi tiết câu trả lời</h3>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                    {exercises.map((ex, i) => {
                        const fb = result.feedback.find(f => f.exerciseId === ex.id);
                        if (!fb) return null;
                        const t = TYPE_META[ex.exerciseType] || { label: ex.exerciseType, color: '#6B7280', icon: '' };
                        return (
                            <div key={i} className="px-5 py-3 flex items-start gap-3"
                                style={{ background: fb.correct ? 'rgba(34,197,94,.03)' : 'rgba(239,68,68,.03)' }}>
                                <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                    style={{ background: fb.correct ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)' }}>
                                    {fb.correct ? <IconCheck size={12} style={{ color: '#22C55E' }} /> : <IconX size={12} style={{ color: '#EF4444' }} />}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-caption font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${t.color}15`, color: t.color }}>
                                            {t.label}
                                        </span>
                                        <span className="text-body font-medium truncate" style={{ color: 'var(--theme-text-primary)' }}>{ex.questionVi}</span>
                                    </div>
                                    {fb.explanation && (
                                        <p className="text-xs mt-1" style={{ color: fb.correct ? '#22C55E' : '#EF4444' }}>
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            💡 {(fb.explanation as any)?.vi || (fb.explanation as any)?.en || ''}
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

// ─── Main ────────────────────────────────────────────────────────────────

export const ExerciseList = ({ exercises, onSubmit, onBackToTheory }: ExerciseListProps) => {
    const [index, setIndex]               = useState(0);
    const [answers, setAnswers]           = useState<Record<number, string | string[]>>({});
    const [currentAnswer, setCurrentAnswer] = useState<string | string[]>('');
    const [result, setResult]             = useState<SubmitResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError]   = useState<string | null>(null);
    const [combo, setCombo]               = useState(0);
    const [showHint, setShowHint]         = useState(false);
    const [skipped, setSkipped]           = useState<Set<number>>(new Set());
    const { speak } = usePronunciation();

    const exercise  = exercises[index];
    const isLast    = index === exercises.length - 1;
    const typeMeta  = exercise ? TYPE_META[exercise.exerciseType] || { label: exercise.exerciseType, color: '#6B7280', icon: '' } : null;
    const difficulty = exercise ? difficultyFromPoints(exercise.points) : null;

    const shuffledMap = useMemo(() => {
        const map: Record<number, string[]> = {};
        exercises.forEach((ex, i) => {
            if (ex.exerciseType === 'reorder') {
                const words = [...(ex.answerData.correctOrder as string[])];
                for (let j = words.length - 1; j > 0; j--) {
                    const k = Math.floor(Math.random() * (j + 1));
                    [words[j], words[k]] = [words[k], words[j]];
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

    const handleNext = useCallback(() => {
        setAnswers(prev => ({ ...prev, [exercise.order]: currentAnswer }));
        setCurrentAnswer('');
        setShowHint(false);
        setCombo(c => c + 1);
        setIndex(i => i + 1);
    }, [exercise, currentAnswer]);

    const handleSkip = useCallback(() => {
        setSkipped(prev => new Set(prev).add(index));
        setAnswers(prev => ({ ...prev, [exercise.order]: '' }));
        setCurrentAnswer('');
        setShowHint(false);
        setCombo(0);
        setIndex(i => i + 1);
    }, [index, exercise]);

    const handleSubmit = useCallback(async () => {
        const final = { ...answers, [exercise.order]: currentAnswer };
        setAnswers(final);
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const res = await onSubmit(final);
            setResult(res);
        } catch (err: unknown) {
            const msg = (err as { message?: string })?.message || 'Có lỗi khi nộp bài.';
            setSubmitError(typeof msg === 'string' ? msg : 'Có lỗi khi nộp bài.');
        } finally {
            setIsSubmitting(false);
        }
    }, [answers, exercise, currentAnswer, onSubmit]);

    const handleRetry = () => {
        setIndex(0); setAnswers({}); setCurrentAnswer(''); setResult(null);
        setIsSubmitting(false); setSubmitError(null); setCombo(0); setSkipped(new Set());
    };

    // Keyboard: Enter = next/submit
    useEffect(() => {
        const handle = (e: KeyboardEvent) => {
            if (e.key !== 'Enter' || e.shiftKey || result || !hasAnswer()) return;
            if (exercise?.exerciseType === 'mcq') {
                e.preventDefault();
                if (isLast) handleSubmit(); else handleNext();
            }
        };
        window.addEventListener('keydown', handle);
        return () => window.removeEventListener('keydown', handle);
    }, [result, hasAnswer, exercise, isLast, handleSubmit, handleNext]);

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
                <ResultScreen result={result} exercises={exercises} onRetry={handleRetry} />
            </div>
        );
    }

    if (!exercise || !typeMeta || !difficulty) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-4">

            {/* ── Progress header ── */}
            <div className="rounded-2xl border px-5 py-3.5 space-y-3"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                        Câu {index + 1} / {exercises.length}
                    </span>
                    {combo >= 2 && (
                        <span className="flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg text-caption"
                            style={{ background: 'rgba(249,115,22,.12)', color: '#F97316' }}>
                            🔥 Combo x{combo}
                        </span>
                    )}
                </div>
                {/* Dot track */}
                <DotProgress total={exercises.length} current={index} skipped={skipped} />
            </div>

            {/* ── Question card ── */}
            <div
                className="rounded-2xl border overflow-hidden"
                key={index}
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
            >
                {/* Card header */}
                <div className="px-5 py-4 border-b flex items-center justify-between gap-3"
                    style={{ borderColor: 'var(--theme-border)' }}>
                    <div className="flex items-center gap-2.5">
                        {/* Question number */}
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold text-white shrink-0"
                            style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
                        >
                            {index + 1}
                        </div>
                        {/* Type badge */}
                        <span className="flex items-center gap-1 text-caption font-bold px-2.5 py-1 rounded-lg"
                            style={{ backgroundColor: `${typeMeta.color}14`, color: typeMeta.color }}>
                            {typeMeta.icon} {typeMeta.label}
                        </span>
                        {/* Difficulty */}
                        <span className="flex items-center gap-1 text-caption font-semibold px-2 py-1 rounded-lg"
                            style={{ backgroundColor: `${difficulty.color}12`, color: difficulty.color }}>
                            ● {difficulty.label}
                        </span>
                    </div>
                    {/* Points */}
                    <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg shrink-0"
                        style={{ background: 'rgba(245,158,11,.12)', color: '#F59E0B' }}>
                        ⭐ {exercise.points} điểm
                    </span>
                </div>

                {/* Question text */}
                <div className="px-5 pt-5 pb-4">
                    <div className="flex items-start gap-2.5 mb-1.5">
                        <h3 className="flex-1 text-[17px] font-bold leading-snug" style={{ color: 'var(--theme-text-primary)' }}>
                            {exercise.questionVi}
                        </h3>
                        {exercise.questionDe && (
                            <button
                                onClick={() => speak(exercise.questionDe!)}
                                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 mt-0.5"
                                style={{ background: 'rgba(59,130,246,.1)', color: '#3B82F6' }}
                                title="Phát âm câu hỏi"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                </svg>
                            </button>
                        )}
                    </div>
                    {exercise.questionDe && exercise.questionDe !== exercise.questionVi && (
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
                        />
                    )}
                    {exercise.exerciseType === 'fill_blank' && (
                        <TextInput value={typeof currentAnswer === 'string' ? currentAnswer : ''} onChange={v => setCurrentAnswer(v)}
                            disabled={false} placeholder="Điền câu trả lời..." onEnter={isLast ? handleSubmit : handleNext} showSpecialChars />
                    )}
                    {exercise.exerciseType === 'translate' && (
                        <TextInput value={typeof currentAnswer === 'string' ? currentAnswer : ''} onChange={v => setCurrentAnswer(v)}
                            disabled={false} multiline placeholder="Nhập bản dịch..." onEnter={isLast ? handleSubmit : handleNext} showSpecialChars />
                    )}
                    {exercise.exerciseType === 'error_correct' && (
                        <TextInput value={typeof currentAnswer === 'string' ? currentAnswer : ''} onChange={v => setCurrentAnswer(v)}
                            disabled={false} multiline placeholder="Nhập câu đã sửa..." onEnter={isLast ? handleSubmit : handleNext} showSpecialChars />
                    )}
                    {exercise.exerciseType === 'reorder' && (
                        <ReorderInput words={shuffledMap[index] || exercise.answerData.correctOrder}
                            value={Array.isArray(currentAnswer) ? currentAnswer : []}
                            onChange={v => setCurrentAnswer(v)} disabled={false} />
                    )}
                </div>

                {/* Hint panel */}
                {showHint && (
                    <div className="mx-5 mb-4 rounded-xl overflow-hidden"
                        style={{ border: '1.5px solid rgba(245,158,11,.35)' }}>
                        <div className="px-3.5 py-2 flex items-center gap-2"
                            style={{ background: 'linear-gradient(135deg, #F59E0B, #F97316)' }}>
                            <IconLightbulb size={14} style={{ color: 'white' }} />
                            <span className="text-xs font-bold text-white tracking-wide">Gợi ý</span>
                        </div>
                        <div className="px-4 py-3 flex items-start gap-2.5"
                            style={{ background: 'rgba(245,158,11,.06)' }}>
                            <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--theme-text-primary)' }}>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {(exercise as any).hint || (exercise as any).hintVi || 'Xem lại phần lý thuyết để tìm câu trả lời.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Error banner */}
                {submitError && (
                    <div className="mx-5 mb-4 px-4 py-3 rounded-xl flex items-start gap-2.5"
                        style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)' }}>
                        <IconX size={15} style={{ color: '#EF4444', marginTop: 1, flexShrink: 0 }} />
                        <p className="text-body" style={{ color: '#EF4444' }}>{submitError}</p>
                    </div>
                )}

                {/* Footer action bar */}
                <div className="px-5 py-4 border-t flex items-center justify-between gap-3"
                    style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                    {/* Left: secondary actions */}
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setShowHint(h => !h)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
                            style={showHint
                                ? { background: 'linear-gradient(135deg, #F59E0B, #F97316)', color: 'white' }
                                : { background: 'rgba(245,158,11,.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,.25)' }}
                        >
                            <IconLightbulb size={13} /> Gợi ý
                        </button>
                        {!isLast && (
                            <button
                                onClick={handleSkip}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
                                style={{ background: 'rgba(239,68,68,.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,.2)' }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></svg>
                                Bỏ qua
                            </button>
                        )}
                        {onBackToTheory && (
                            <button
                                onClick={onBackToTheory}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
                                style={{ background: 'rgba(99,102,241,.08)', color: '#6366F1', border: '1px solid rgba(99,102,241,.2)' }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                                Xem lý thuyết
                            </button>
                        )}
                    </div>

                    {/* Right: primary CTA */}
                    <button
                        onClick={isLast ? handleSubmit : handleNext}
                        disabled={!hasAnswer() || isSubmitting}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-body font-bold transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                        style={{
                            background: hasAnswer() ? 'linear-gradient(135deg, #3B82F6, #6366F1)' : 'var(--theme-bg-tertiary)',
                            color: hasAnswer() ? 'white' : 'var(--theme-text-muted)',
                            boxShadow: hasAnswer() ? '0 4px 12px rgba(59,130,246,.3)' : 'none',
                        }}
                    >
                        {isSubmitting ? (
                            <><IconLoader size={14} /> Đang chấm...</>
                        ) : isLast ? (
                            <><IconCheck size={14} /> Nộp bài</>
                        ) : !hasAnswer() ? (
                            'Chọn đáp án'
                        ) : (
                            <>Tiếp tục <IconArrowRight size={14} /></>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Keyboard shortcuts hint ── */}
            <div className="text-center text-caption space-x-2" style={{ color: 'var(--theme-text-muted)' }}>
                <span>Phím tắt:</span>
                {exercise.exerciseType === 'mcq' && (
                    <span>
                        <kbd className="px-1.5 py-0.5 rounded text-caption font-bold" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
                            1–{exercise.answerData.options?.length ?? 4}
                        </kbd>
                        {' '}chọn ·
                    </span>
                )}
                <span>
                    <kbd className="px-1.5 py-0.5 rounded text-caption font-bold" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>Enter</kbd>
                    {' '}tiếp tục ·
                </span>
                <span>
                    <kbd className="px-1.5 py-0.5 rounded text-caption font-bold" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>Space</kbd>
                    {' '}phát âm
                </span>
            </div>
        </div>
    );
};
