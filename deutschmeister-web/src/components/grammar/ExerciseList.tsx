'use client';

import { useState } from 'react';
import { Exercise, SubmitResult } from '@/types/grammar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconCheckCircle, IconXCircle } from '@/components/ui/Icons';
import { usePronunciation } from '@/hooks/usePronunciation';

interface ExerciseListProps {
    exercises: Exercise[];
    onSubmit: (answers: Record<number, string | string[]>) => Promise<SubmitResult>;
}

export const ExerciseList = ({ exercises, onSubmit }: ExerciseListProps) => {
    const { speak } = usePronunciation();
    const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
    const [result, setResult] = useState<SubmitResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAnswerChange = (order: number, value: string | string[]) => {
        setAnswers(prev => ({ ...prev, [order]: value }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const res = await onSubmit(answers);
            setResult(res);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            {exercises.map((exercise, index) => {
                const feedback = result?.feedback.find(f => f.exerciseId === exercise.id);

                return (
                    <Card key={exercise.id} className={`transition-colors ${feedback ? (feedback.correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50') : ''}`}>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-medium text-gray-900 mb-1 flex items-center gap-2">
                                        <span>Câu {index + 1}:</span>
                                        {exercise.questionDe && (
                                            <button
                                                onClick={() => speak(exercise.questionDe || '')}
                                                className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                                                title="Nghe câu hỏi"
                                            >
                                                🔊
                                            </button>
                                        )}
                                    </h3>
                                    <p className="text-gray-600">{exercise.questionVi} <span className="text-gray-500 italic">({exercise.questionDe})</span></p>
                                </div>
                                <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded text-gray-500">
                                    {exercise.points} điểm
                                </span>
                            </div>

                            {feedback && (
                                <div className="flex items-center text-sm font-medium mb-4">
                                    {feedback.correct ? (
                                        <span className="text-green-600 flex items-center gap-1"><IconCheckCircle size={16} /> Đúng</span>
                                    ) : (
                                        <span className="text-red-600 flex items-center gap-1"><IconXCircle size={16} /> Sai</span>
                                    )}
                                </div>
                            )}

                            <h3 className="text-lg font-medium text-gray-800 mb-2">{exercise.questionVi}</h3>
                            {exercise.questionDe && <p className="text-sm text-gray-500 mb-4 italic">{exercise.questionDe}</p>}

                            <div className="mt-4">
                                {renderExerciseInput(exercise, answers[exercise.order], (val) => handleAnswerChange(exercise.order, val), !!result)}
                            </div>

                            {feedback && !feedback.correct && feedback.explanation && (
                                <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                                    <strong>Giải thích:</strong> {feedback.explanation.vi}
                                </div>
                            )}
                        </div>
                    </Card>
                );
            })}

            <div className="sticky bottom-4 bg-white p-4 shadow-xl rounded-2xl border border-gray-100 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Đã làm: {Object.keys(answers).length} / {exercises.length} câu
                </div>
                {result ? (
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-xl font-bold">{result.score}/100</div>
                            <div className={`text-xs ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                                {result.passed ? 'Đạt yêu cầu' : 'Cần luyện thêm'}
                            </div>
                        </div>
                        <Button onClick={() => window.location.reload()}>Làm lại</Button>
                    </div>
                ) : (
                    <Button onClick={handleSubmit} isLoading={isSubmitting} disabled={Object.keys(answers).length === 0}>
                        Nộp bài
                    </Button>
                )}
            </div>
        </div>
    );
};

// Helper function to render different input types (kept simple for this file)
// Ideally this would be split into sub-components
const renderExerciseInput = (
    exercise: Exercise,
    value: string | string[] | undefined,
    onChange: (val: string | string[]) => void,
    disabled: boolean
) => {
    switch (exercise.exerciseType) {
        case 'mcq':
            return (
                <div className="space-y-2">
                    {exercise.answerData.options.map((opt: string, idx: number) => (
                        <label key={idx} className={`flex items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${value === String(idx) ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : 'border-gray-200'
                            }`}>
                            <input
                                type="radio"
                                name={`ex-${exercise.id}`}
                                value={idx}
                                checked={value === String(idx)}
                                onChange={() => onChange(String(idx))}
                                disabled={disabled}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="ml-3 text-gray-700">{opt}</span>
                        </label>
                    ))}
                </div>
            );
        case 'fill_blank':
            return (
                <input
                    type="text"
                    value={(value as string) || ''}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder="Điền câu trả lời..."
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    autoComplete="off"
                />
            );
        case 'translate':
        case 'error_correct':
            return (
                <textarea
                    value={(value as string) || ''}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder="Nhập câu trả lời của bạn..."
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                />
            );
        case 'reorder':
            // Simple comma separated input for now, ideally drag and drop
            return (
                <div className="space-y-2">
                    <p className="text-xs text-gray-500">Sắp xếp các từ sau: <strong>{(exercise.answerData.correctOrder as string[]).sort().join(' / ')}</strong></p>
                    <input
                        type="text"
                        value={Array.isArray(value) ? value.join(' ') : (value as string || '')}
                        onChange={(e) => onChange(e.target.value.split(' '))} // Naive implementation
                        disabled={disabled}
                        placeholder="Nhập thứ tự đúng (cách nhau bằng dấu cách)..."
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <p className="text-xs text-gray-400">Ví dụ nhập: Ich bin Student</p>
                </div>
            );
        default:
            return <div className="text-red-500">Unsupported exercise type</div>;
    }
};
