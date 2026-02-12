'use client';

import { GrammarLesson } from '@/types/grammar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface GrammarLessonCardProps {
    lesson: GrammarLesson;
    progress?: {
        status: 'not_started' | 'in_progress' | 'completed';
        score?: number;
    };
}

export const GrammarLessonCard = ({ lesson, progress }: GrammarLessonCardProps) => {
    const isLocked = lesson.isActive === false; // Default to unlocked if undefined, or strictly check false

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${lesson.level === 'A1' ? 'bg-green-100 text-green-800' :
                        lesson.level === 'A2' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                        {lesson.level} – Bài {lesson.lessonNumber}
                    </span>
                    {progress?.status === 'completed' && (
                        <span className="text-green-600 text-xl">✓</span>
                    )}
                </div>
                <CardTitle className="text-lg mb-1">{lesson.titleVi}</CardTitle>
                <p className="text-sm text-gray-500">{lesson.titleDe}</p>
            </CardHeader>

            <CardContent className="flex-grow">
                <ul className="text-sm text-gray-600 space-y-1 mt-2">
                    {lesson.objectives.vi.slice(0, 2).map((obj, i) => (
                        <li key={i} className="flex items-center">
                            <span className="mr-2">•</span> {obj}
                        </li>
                    ))}
                    {lesson.objectives.vi.length > 2 && (
                        <li className="text-xs text-gray-400 italic">+ {lesson.objectives.vi.length - 2} mục tiêu khác</li>
                    )}
                </ul>
            </CardContent>

            <CardFooter className="pt-4 border-t mt-4">
                {isLocked ? (
                    <div className="w-full px-4 py-2 text-center text-sm font-semibold text-gray-400 bg-gray-100 rounded-xl cursor-not-allowed">
                        Đang khóa
                    </div>
                ) : (
                    <Link
                        href={`/grammar/${lesson.slug}`}
                        className={`w-full inline-flex items-center justify-center px-4 py-2 text-[14px] font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:-translate-y-0.5 ${progress?.status === 'completed'
                            ? 'bg-transparent text-gray-600 border-2 border-gray-200'
                            : 'text-white shadow-[0_4px_12px_rgba(59,130,246,.25)]'
                            }`}
                        style={progress?.status === 'completed' ? {} : { background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
                    >
                        {progress?.status === 'completed' ? 'Ôn tập lại' :
                            progress?.status === 'in_progress' ? 'Tiếp tục' : 'Bắt đầu'}
                    </Link>
                )}
            </CardFooter>
        </Card>
    );
};