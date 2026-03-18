export interface GrammarLesson {
  id: string;
  slug: string;
  level: string;
  lessonNumber: number;
  titleDe: string;
  titleEn: string;
  titleVi: string;
  objectives: { de: string[]; en: string[]; vi: string[] };
  estimatedMinutes: number;
  exerciseCount?: number;
  isActive?: boolean;
}

export interface Exercise {
  id: string;
  exerciseType: 'mcq' | 'fill_blank' | 'reorder' | 'translate' | 'error_correct';
  order: number;
  questionDe?: string;
  questionEn?: string;
  questionVi?: string;
  answerData: any;
  explanation?: any;
  points: number;
}

export interface GrammarLessonDetail extends GrammarLesson {
  theoryContent: any;
  exercises: Exercise[];
}

export interface GrammarProgress {
  lessonId: string;
  lessonSlug: string;
  lessonTitle: string;
  level: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;
  correctCount: number;
  totalAttempts: number;
  completedAt?: string;
}

export interface SubmitResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  feedback: {
    exerciseId: string;
    correct: boolean;
    explanation?: any;
  }[];
}

export interface GrammarStats {
  totalLessons: number;
  byLevel: Record<string, number>;
}
