'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Exercise, SubmitResult } from '@/types/grammar';
import { HighlightedText } from '@/components/word-highlight/HighlightedText';
import {
    IconCheck, IconX, IconArrowRight, IconRefresh,
    IconTrophy, IconLightbulb, IconLoader,
} from '@/components/ui/Icons';

/* ─── Shared ─── */
const SPECIAL_CHARS = ['ä', 'ö', 'ü', 'Ä', 'Ö', 'Ü', 'ß'];

interface ExerciseListProps {
    exercises: Exercise[];
    onSubmit: (answers: Record<number, string | string[]>) => Promise<SubmitResult>;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
    mcq: { label: 'Trắc nghiệm', color: '#3B82F6' },
    fill_blank: { label: 'Điền từ', color: '#8B5CF6' },
    reorder: { label: 'Sắp xếp', color: '#F59E0B' },
    translate: { label: 'Dịch', color: '#10B981' },
    error_correct: { label: 'Sửa lỗi', color: '#EF4444' },
};

/* ═══════════════════════════════════════════ */
/*  Progress Bar                               */
/* ═══════════════════════════════════════════ */
function ProgressBar({ current, total }: { current: number; total: number }) {
    const pct = total > 0 ? (current / total) * 100 : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
                <span>Câu {Math.min(current + 1, total)} / {total}</span>
                <span>{Math.round(pct)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #8B5CF6, #6366F1)' }} />
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════ */
/*  MCQ Input                                  */
/* ═══════════════════════════════════════════ */
function MCQInput({ options, value, onChange, disabled }: {
    options: string[]; value?: string; onChange: (v: string) => void; disabled: boolean;
}) {
    return (
        <div className="space-y-2.5">
            {options.map((opt, idx) => {
                const isSelected = value === String(idx);
                return (
                    <label key={idx}
                        className="flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200"
                        style={{
                            borderColor: isSelected ? '#8B5CF6' : 'var(--theme-border)',
                            backgroundColor: isSelected ? 'rgba(139,92,246,.05)' : 'transparent',
                            opacity: disabled ? 0.6 : 1,
                        }}>
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                            style={{
                                borderColor: isSelected ? '#8B5CF6' : 'var(--theme-border)',
                                backgroundColor: isSelected ? '#8B5CF6' : 'transparent',
                            }}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <input type="radio" name="mcq" value={idx} checked={isSelected}
                            onChange={() => onChange(String(idx))} disabled={disabled} className="sr-only" />
                        <span className="text-[14px] font-medium" style={{ color: 'var(--theme-text-primary)' }}>
                            <HighlightedText text={opt} />
                        </span>
                    </label>
                );
            })}
        </div>
    );
}

/* ═══════════════════════════════════════════ */
/*  Text Input (fill blank, translate, error)  */
/* ═══════════════════════════════════════════ */
function TextInput({ value, onChange, disabled, placeholder, multiline, onEnter, showSpecialChars }: {
    value: string; onChange: (v: string) => void; disabled: boolean;
    placeholder: string; multiline?: boolean; onEnter?: () => void; showSpecialChars?: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const textRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (!disabled) { inputRef.current?.focus(); textRef.current?.focus(); }
    }, [disabled]);

    const fieldStyle: React.CSSProperties = {
        borderColor: disabled ? 'var(--theme-border)' : '#8B5CF6',
        backgroundColor: 'var(--theme-bg-card)',
        color: 'var(--theme-text-primary)',
    };

    const insertSpecial = (char: string) => {
        const el: HTMLInputElement | HTMLTextAreaElement | null = multiline ? textRef.current : inputRef.current;
        if (!el) { onChange(value + char); return; }
        const start = el.selectionStart ?? value.length;
        const end = el.selectionEnd ?? value.length;
        const newVal = value.slice(0, start) + char + value.slice(end);
        onChange(newVal);
        setTimeout(() => {
            el.setSelectionRange(start + char.length, start + char.length);
            el.focus();
        }, 0);
    };

    return (
        <div>
            {multiline ? (
                <textarea ref={textRef} value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && value.trim()) { e.preventDefault(); onEnter?.(); } }}
                    disabled={disabled} placeholder={placeholder} rows={2}
                    className="w-full px-4 py-3.5 rounded-xl border-2 text-[15px] font-medium transition-all outline-none resize-none"
                    style={fieldStyle} />
            ) : (
                <input ref={inputRef} type="text" value={value} autoComplete="off"
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) onEnter?.(); }}
                    disabled={disabled} placeholder={placeholder}
                    className="w-full px-4 py-3.5 rounded-xl border-2 text-[15px] font-medium transition-all outline-none"
                    style={fieldStyle} />
            )}
            {showSpecialChars && !disabled && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {SPECIAL_CHARS.map(ch => (
                        <button key={ch} type="button" onClick={() => insertSpecial(ch)}
                            className="w-9 h-9 rounded-lg text-[14px] font-bold border transition-all hover:scale-105 active:scale-95"
                            style={{ borderColor: '#8B5CF6', color: '#8B5CF6', backgroundColor: 'rgba(139,92,246,.06)' }}>
                            {ch}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════ */
/*  Reorder — Clickable Word Chips             */
/* ═══════════════════════════════════════════ */
function ReorderInput({ words, value, onChange, disabled }: {
    words: string[]; value: string[]; onChange: (v: string[]) => void; disabled: boolean;
}) {
    // Lọc theo số lần xuất hiện — cho phép từ trùng lặp (VD: "der" 2 lần trong câu)
    const available = (() => {
        const remaining = [...words];
        for (const selected of value) {
            const idx = remaining.indexOf(selected);
            if (idx !== -1) remaining.splice(idx, 1);
        }
        return remaining;
    })();

    return (
        <div className="space-y-4">
            {/* Selected zone */}
            <div className="min-h-14 p-3 rounded-xl border-2 border-dashed flex flex-wrap gap-2 items-center"
                style={{
                    borderColor: value.length > 0 ? '#8B5CF6' : 'var(--theme-border)',
                    backgroundColor: 'rgba(139,92,246,.03)',
                }}>
                {value.length === 0 && (
                    <span className="text-[13px] italic" style={{ color: 'var(--theme-text-muted)' }}>
                        Nhấn vào các từ bên dưới để sắp xếp...
                    </span>
                )}
                {value.map((word, idx) => (
                    <button key={`s-${idx}`}
                        onClick={() => { if (!disabled) { const n = [...value]; n.splice(idx, 1); onChange(n); } }}
                        disabled={disabled}
                        className="px-3.5 py-2 rounded-lg text-[14px] font-semibold transition-all duration-150 hover:scale-105 active:scale-95"
                        style={{
                            background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                            color: 'white',
                            boxShadow: '0 2px 8px rgba(139,92,246,.25)',
                        }}>
                        {word} <span className="ml-1 opacity-60 text-[12px]">×</span>
                    </button>
                ))}
                {value.length > 0 && !disabled && (
                    <button onClick={() => onChange([])}
                        className="ml-auto px-2 py-1 rounded-md text-[11px] font-medium transition-colors"
                        style={{ color: 'var(--theme-text-muted)' }}>
                        Xóa hết
                    </button>
                )}
            </div>

            {/* Available chips */}
            {available.length > 0 && !disabled && (
                <div className="flex flex-wrap gap-2">
                    {available.map((word, idx) => (
                        <button key={`a-${idx}`}
                            onClick={() => onChange([...value, word])}
                            className="px-3.5 py-2 rounded-lg border-2 text-[14px] font-medium transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                            style={{
                                borderColor: 'var(--theme-border)',
                                backgroundColor: 'var(--theme-bg-card)',
                                color: 'var(--theme-text-primary)',
                            }}>
                            {word}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════ */
/*  Result Screen                              */
/* ═══════════════════════════════════════════ */
function ResultScreen({ result, exercises, onRetry }: {
    result: SubmitResult; exercises: Exercise[]; onRetry: () => void;
}) {
    const accuracy = result.totalQuestions > 0
        ? Math.round((result.correctCount / result.totalQuestions) * 100) : 0;

    const gradient = result.passed
        ? 'linear-gradient(135deg, #F59E0B, #D97706)'
        : accuracy >= 50
            ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
            : 'linear-gradient(135deg, #8B5CF6, #7C3AED)';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Score card */}
            <div className="rounded-2xl border p-8 text-center"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
                    style={{ background: gradient }}>
                    <IconTrophy size={28} style={{ color: 'white' }} />
                </div>
                <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
                    {result.passed ? 'Xuất sắc!' : accuracy >= 50 ? 'Cố gắng thêm!' : 'Cần luyện thêm'}
                </h2>
                <p className="text-[14px] mb-6" style={{ color: 'var(--theme-text-muted)' }}>
                    {result.passed ? 'Bạn đã hoàn thành bài học này' : 'Cần đạt 80% để hoàn thành'}
                </p>

                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                        { value: result.score, label: 'Điểm', color: '#8B5CF6', bg: 'rgba(139,92,246,' },
                        { value: `${result.correctCount}/${result.totalQuestions}`, label: 'Đúng', color: '#22C55E', bg: 'rgba(34,197,94,' },
                        { value: `${accuracy}%`, label: 'Chính xác', color: '#3B82F6', bg: 'rgba(59,130,246,' },
                    ].map((s, i) => (
                        <div key={i} className="rounded-xl p-3"
                            style={{ background: `linear-gradient(135deg, ${s.bg}.1), ${s.bg}.05))` }}>
                            <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                            <div className="text-[11px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                <button onClick={onRetry}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', boxShadow: '0 4px 12px rgba(139,92,246,.25)' }}>
                    <IconRefresh size={16} style={{ color: 'white' }} /> Làm lại
                </button>
            </div>

            {/* Answer detail */}
            <div className="rounded-2xl border overflow-hidden"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                <div className="px-5 py-4 border-b flex items-center gap-2"
                    style={{ borderColor: 'var(--theme-border)' }}>
                    <IconLightbulb size={16} style={{ color: '#F59E0B' }} />
                    <h3 className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>Chi tiết câu trả lời</h3>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                    {exercises.map((ex, i) => {
                        const fb = result.feedback.find(f => f.exerciseId === ex.id);
                        if (!fb) return null;
                        const t = TYPE_LABELS[ex.exerciseType] || { label: ex.exerciseType, color: '#6B7280' };

                        return (
                            <div key={i} className="px-5 py-3 flex items-start gap-3"
                                style={{ background: fb.correct ? 'rgba(34,197,94,.03)' : 'rgba(239,68,68,.03)' }}>
                                <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                    style={{ background: fb.correct ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)' }}>
                                    {fb.correct
                                        ? <IconCheck size={12} style={{ color: '#22C55E' }} />
                                        : <IconX size={12} style={{ color: '#EF4444' }} />}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                            style={{ backgroundColor: `${t.color}15`, color: t.color }}>
                                            {t.label}
                                        </span>
                                        <span className="text-[13px] font-medium truncate"
                                            style={{ color: 'var(--theme-text-primary)' }}>
                                            {ex.questionVi}
                                        </span>
                                    </div>
                                    {fb.explanation && (
                                        <p className="text-[12px] mt-1" style={{ color: fb.correct ? '#22C55E' : '#EF4444' }}>
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

/* ═══════════════════════════════════════════ */
/*  Main Component                             */
/* ═══════════════════════════════════════════ */
export const ExerciseList = ({ exercises, onSubmit }: ExerciseListProps) => {
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
    const [currentAnswer, setCurrentAnswer] = useState<string | string[]>('');
    const [result, setResult] = useState<SubmitResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const exercise = exercises[index];
    const isLast = index === exercises.length - 1;
    const typeInfo = exercise ? TYPE_LABELS[exercise.exerciseType] || { label: '', color: '#6B7280' } : null;

    // Shuffle reorder words once per exercise
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
        if (Array.isArray(currentAnswer)) return currentAnswer.length > 0;
        return false;
    }, [currentAnswer]);

    const handleNext = useCallback(() => {
        // Save answer
        const updated = { ...answers, [exercise.order]: currentAnswer };
        setAnswers(updated);
        setCurrentAnswer('');
        setIndex(i => i + 1);
    }, [answers, exercise, currentAnswer]);

    const handleSubmit = useCallback(async () => {
        const final = { ...answers, [exercise.order]: currentAnswer };
        setAnswers(final);
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const res = await onSubmit(final);
            setResult(res);
        } catch (err: any) {
            if (process.env.NODE_ENV === 'development') console.error('Submit error:', err);
            const msg = err?.message || err?.response?.message || 'Có lỗi khi nộp bài. Vui lòng thử lại.';
            setSubmitError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setIsSubmitting(false);
        }
    }, [answers, exercise, currentAnswer, onSubmit]);

    const handleRetry = () => {
        setIndex(0); setAnswers({}); setCurrentAnswer('');
        setResult(null); setIsSubmitting(false); setSubmitError(null);
    };

    // Enter key handler
    useEffect(() => {
        const handle = (e: KeyboardEvent) => {
            if (e.key !== 'Enter' || e.shiftKey || result || !hasAnswer()) return;
            // Only for MCQ (text inputs handle Enter internally)
            if (exercise?.exerciseType === 'mcq') {
                e.preventDefault();
                if (isLast) handleSubmit();
                else handleNext();
            }
        };
        window.addEventListener('keydown', handle);
        return () => window.removeEventListener('keydown', handle);
    }, [result, hasAnswer, exercise, isLast, handleSubmit, handleNext]);

    // ─── Result Screen ───
    if (result) {
        return (
            <div className="max-w-2xl mx-auto">
                <ResultScreen result={result} exercises={exercises} onRetry={handleRetry} />
            </div>
        );
    }

    if (!exercise || !typeInfo) return null;

    // ─── Exercise Card ───
    return (
        <div className="max-w-2xl mx-auto space-y-5">
            <ProgressBar current={index} total={exercises.length} />

            <div className="rounded-2xl border overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300"
                key={index} /* re-mount animation per exercise */
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>

                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between"
                    style={{ borderColor: 'var(--theme-border)' }}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[13px] font-bold text-white"
                            style={{ background: `linear-gradient(135deg, ${typeInfo.color}, ${typeInfo.color}cc)` }}>
                            {index + 1}
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                            style={{ backgroundColor: `${typeInfo.color}12`, color: typeInfo.color }}>
                            {typeInfo.label}
                        </span>
                    </div>
                    <span className="text-[12px] font-medium px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
                        {exercise.points} điểm
                    </span>
                </div>

                {/* Question */}
                <div className="px-6 py-5">
                    <h3 className="text-[16px] font-bold mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>
                        {/* BUG FIX 5: Plain text for Vietnamese — HighlightedText only processes German */}
                        {exercise.questionVi}
                    </h3>
                    {exercise.questionDe && exercise.questionDe !== exercise.questionVi && (
                        <p className="text-[13px] italic" style={{ color: 'var(--theme-text-muted)' }}>
                            <HighlightedText text={exercise.questionDe} />
                        </p>
                    )}
                </div>

                {/* Answer Area */}
                <div className="px-6 pb-6">
                    {exercise.exerciseType === 'mcq' && (
                        <MCQInput
                            options={exercise.answerData.options}
                            value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
                            onChange={(v) => setCurrentAnswer(v)}
                            disabled={false}
                        />
                    )}

                    {exercise.exerciseType === 'fill_blank' && (
                        <TextInput
                            value={typeof currentAnswer === 'string' ? currentAnswer : ''}
                            onChange={(v) => setCurrentAnswer(v)}
                            disabled={false}
                            placeholder="Điền câu trả lời..."
                            onEnter={isLast ? handleSubmit : handleNext}
                            showSpecialChars
                        />
                    )}

                    {exercise.exerciseType === 'translate' && (
                        <TextInput
                            value={typeof currentAnswer === 'string' ? currentAnswer : ''}
                            onChange={(v) => setCurrentAnswer(v)}
                            disabled={false} multiline
                            placeholder="Nhập bản dịch..."
                            onEnter={isLast ? handleSubmit : handleNext}
                            showSpecialChars
                        />
                    )}

                    {exercise.exerciseType === 'error_correct' && (
                        <TextInput
                            value={typeof currentAnswer === 'string' ? currentAnswer : ''}
                            onChange={(v) => setCurrentAnswer(v)}
                            disabled={false} multiline
                            placeholder="Nhập câu đã sửa..."
                            onEnter={isLast ? handleSubmit : handleNext}
                            showSpecialChars
                        />
                    )}

                    {exercise.exerciseType === 'reorder' && (
                        <ReorderInput
                            words={shuffledMap[index] || exercise.answerData.correctOrder}
                            value={Array.isArray(currentAnswer) ? currentAnswer : []}
                            onChange={(v) => setCurrentAnswer(v)}
                            disabled={false}
                        />
                    )}
                </div>

                {/* Action Button */}
                <div className="px-6 pb-6">
                    <button
                        onClick={isLast ? handleSubmit : handleNext}
                        disabled={!hasAnswer() || isSubmitting}
                        className="w-full py-3.5 rounded-xl text-[14px] font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                        style={{
                            background: hasAnswer() ? 'linear-gradient(135deg, #8B5CF6, #6366F1)' : 'var(--theme-bg-secondary)',
                            color: hasAnswer() ? 'white' : 'var(--theme-text-muted)',
                            boxShadow: hasAnswer() ? '0 4px 12px rgba(139,92,246,.25)' : 'none',
                        }}>
                        {isSubmitting ? (
                            <>
                                <IconLoader size={16} />
                                Đang chấm...
                            </>
                        ) : isLast ? (
                            'Nộp bài'
                        ) : (
                            <>Tiếp theo <IconArrowRight size={16} style={{ color: 'white' }} /></>
                        )}
                    </button>
                </div>

                {/* Error banner */}
                {submitError && (
                    <div className="px-6 pb-4">
                        <div className="rounded-xl p-3.5 flex items-start gap-2.5"
                            style={{ backgroundColor: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)' }}>
                            <IconX size={16} style={{ color: '#EF4444', marginTop: 2, flexShrink: 0 }} />
                            <div>
                                <p className="text-[13px] font-semibold" style={{ color: '#EF4444' }}>
                                    Không thể nộp bài
                                </p>
                                <p className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                                    {submitError}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Hint */}
            <div className="text-center">
                <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                    Nhấn{' '}
                    <kbd className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                        style={{ backgroundColor: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
                        Enter
                    </kbd>
                    {' '}để {isLast ? 'nộp bài' : 'tiếp tục'}
                </span>
            </div>
        </div>
    );
};