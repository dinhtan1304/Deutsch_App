// ============================================
// Dashboard Types
// ============================================

export interface DashboardStats {
  streak: number;
  streakFreezesAvailable: number;
  totalWordsLearned: number;
  totalWords: number;
  accuracy: number;
  totalMinutes: number;
  topicsCompleted: number;
  totalTopics: number;
  wordsToReview: number;
  gamesPlayed: number;
  startedAt: string;
  grammarCompleted: number;
  grammarTotal: number;
}

export interface ActivityDay {
  date: string;
  count: number;
  level: number; // 0-4
}

export interface ActivityHeatmap {
  data: ActivityDay[];
  totalActiveDays: number;
  currentStreak: number;
  longestStreak: number;
}

export interface WeeklyProgress {
  day: string;
  date: string;
  wordsLearned: number;
  gamesPlayed: number;
  minutes: number;
}

export interface TopicProgress {
  id: string;
  slug: string;
  nameDe: string;
  nameVi: string;
  icon: string;
  color: string;
  wordsLearned: number;
  totalWords: number;
  percent: number;
}

export interface RecentActivity {
  type: 'game' | 'word' | 'topic' | 'review' | 'grammar'
    | 'writing' | 'reading' | 'listening'
    | 'exam_reading' | 'exam_writing' | 'exam_listening' | 'exam_speaking'
    | 'free_speaking' | 'roleplay';
  description: string;
  timestamp: string;
  metadata?: string;
}

export interface FullDashboard {
  stats: DashboardStats;
  heatmap: ActivityHeatmap;
  weeklyProgress: WeeklyProgress[];
  topicProgress: TopicProgress[];
  recentActivity: RecentActivity[];
}

export interface PublicStats {
  totalWords: number;
  totalTopics: number;
  totalUsers: number;
}
