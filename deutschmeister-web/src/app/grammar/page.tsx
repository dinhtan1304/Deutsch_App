'use client';

import { useState, useEffect } from 'react';
import { grammarApi } from '@/lib/api/grammar';
import { GrammarLesson, GrammarProgress } from '@/types/grammar';
import { GrammarLessonCard } from '@/components/grammar/GrammarLessonCard';
import { Loading } from '@/components/ui/Loading'; // Assuming Loading component exists
import { Button } from '@/components/ui/Button';

export default function GrammarDashboardPage() {
    const [lessons, setLessons] = useState<GrammarLesson[]>([]);
    const [progress, setProgress] = useState<GrammarProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterLevel, setFilterLevel] = useState<string>('ALL');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [lessonsData, progressData] = await Promise.all([
                    grammarApi.getLessons(),
                    grammarApi.getUserProgress().catch(() => []) // Handle unauth or empty gracefully
                ]);
                setLessons(lessonsData);
                setProgress(progressData);
            } catch (error) {
                console.error('Failed to fetch grammar data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredLessons = filterLevel === 'ALL'
        ? lessons
        : lessons.filter(l => l.level === filterLevel);

    const getLessonProgress = (lessonId: string) => {
        return progress.find(p => p.lessonId === lessonId);
    };

    if (loading) return <Loading />; // Or a skeleton loader

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Ngữ pháp tiếng Đức</h1>
                    <p className="text-gray-600">Lộ trình học ngữ pháp từ A1 đến B1</p>
                </div>

                <div className="flex gap-2 mt-4 md:mt-0 bg-gray-100 p-1 rounded-xl">
                    {['ALL', 'A1', 'A2', 'B1'].map(level => (
                        <button
                            key={level}
                            onClick={() => setFilterLevel(level)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterLevel === level
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {level === 'ALL' ? 'Tất cả' : level}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLessons.map(lesson => (
                    <GrammarLessonCard
                        key={lesson.id}
                        lesson={lesson}
                        progress={getLessonProgress(lesson.id)}
                    />
                ))}
            </div>

            {filteredLessons.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500">Chưa có bài học nào cho trình độ này.</p>
                </div>
            )}
        </div>
    );
}
