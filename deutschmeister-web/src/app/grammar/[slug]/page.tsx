'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { grammarApi } from '@/lib/api/grammar';
import { GrammarLessonDetail } from '@/types/grammar';
import { TheorySection } from '@/components/grammar/TheorySection';
import { ExerciseList } from '@/components/grammar/ExerciseList';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { IconArrowLeft, IconBookOpen, IconPenLine } from '@/components/ui/Icons';
import Link from 'next/link';
import { cn } from '@/lib/utils'; // Assuming utils exist

export default function GrammarLessonPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [lesson, setLesson] = useState<GrammarLessonDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'theory' | 'exercises'>('theory');

    useEffect(() => {
        if (!slug) return;

        const fetchLesson = async () => {
            try {
                const data = await grammarApi.getLessonBySlug(slug);
                setLesson(data);
            } catch (error) {
                console.error('Failed to fetch lesson', error);
                // router.push('/404'); // Redirect if not found
            } finally {
                setLoading(false);
            }
        };

        fetchLesson();
    }, [slug, router]);

    const handleSubmitExercises = async (answers: Record<number, string | string[]>) => {
        if (!lesson) throw new Error('No lesson loaded');
        return await grammarApi.submitExercises(lesson.id, answers);
    };

    if (loading) return
<Loading />
;
    if (!lesson) return
<div className="text-center py-12">Lesson not found</div>
;

    return (
        <div className="py-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link href="/grammar" className="inline-flex items-center text-gray-500 hover:text-blue-600 mb-4 transition-colors">
                    <IconArrowLeft size={16} className="mr-1" /> Quay lại danh sách
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${lesson.level === 'A1' ? 'bg-green-100 text-green-800' :
                                lesson.level === 'A2' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                {lesson.level}
                            </span>
                            <span className="text-gray-400 text-sm">Bài {lesson.lessonNumber}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">{lesson.titleVi}</h1>
                        <p className="text-lg text-gray-600 mt-1">{lesson.titleDe}</p>
                    </div>

                    {/* Progress or Stats could go here */}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b mb-8">
                <button
                    onClick={() => setActiveTab('theory')}
                    className={cn(
                        "flex items-center px-6 py-3 font-medium text-sm transition-colors border-b-2",
                        activeTab === 'theory'
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    <IconBookOpen size={18} className="mr-2" />
                    Lý thuyết
                </button>
                <button
                    onClick={() => setActiveTab('exercises')}
                    className={cn(
                        "flex items-center px-6 py-3 font-medium text-sm transition-colors border-b-2",
                        activeTab === 'exercises'
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    <IconPenLine size={18} className="mr-2" />
                    Bài tập ({lesson.exercises.length})
                </button>
            </div>

            {/* Content */}
            <div className="min-h-125">
                {activeTab === 'theory' ? (
                    <div>
                        <TheorySection content={lesson.theoryContent} />
                        <div className="mt-8 text-center">
                            <Button onClick={() => setActiveTab('exercises')} size="lg">
                                Chuyển sang làm bài tập
                            </Button>
                        </div>
                    </div>
                ) : (
                    <ExerciseList
                        exercises={lesson.exercises}
                        onSubmit={handleSubmitExercises}
                    />
                )}
            </div>
        </div>
    );
}