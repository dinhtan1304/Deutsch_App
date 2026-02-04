'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { TopicCard } from '@/components/topics/TopicCard';
import { useTopics, useUserTopicsProgress, useTopicsStats } from '@/hooks/useTopics';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';

// Helper to get progress from localStorage
function getLocalProgress(topicId: string, totalWords: number): { wordsLearned: number; percent: number } {
  try {
    const stored = localStorage.getItem(`topic-learned-${topicId}`);
    if (stored) {
      const learnedIds = JSON.parse(stored);
      const wordsLearned = Array.isArray(learnedIds) ? learnedIds.length : 0;
      const percent = totalWords > 0 ? Math.round((wordsLearned / totalWords) * 100) : 0;
      return { wordsLearned, percent };
    }
  } catch (e) {
    console.error('Error reading localStorage:', e);
  }
  return { wordsLearned: 0, percent: 0 };
}

export default function TopicsPage() {
  const { isAuthenticated } = useAuthStore();
  const [selectedLevel, setSelectedLevel] = useState<string>('A1');
  const [localProgressMap, setLocalProgressMap] = useState<Map<string, { wordsLearned: number; percent: number }>>(new Map());

  // Fetch topics (public)
  const { data: topicsData, isLoading: topicsLoading } = useTopics({
    level: selectedLevel,
    isActive: true,
  });

  // Fetch user progress from server (if authenticated)
  const { data: serverProgressData, isLoading: progressLoading } = useUserTopicsProgress();

  // Fetch stats
  const { data: stats } = useTopicsStats();

  // Load progress from localStorage when topics load
  useEffect(() => {
    if (topicsData?.data) {
      const progressMap = new Map<string, { wordsLearned: number; percent: number }>();
      topicsData.data.forEach((topic) => {
        const localProgress = getLocalProgress(topic.id, topic.wordCount);
        progressMap.set(topic.id, localProgress);
      });
      setLocalProgressMap(progressMap);
    }
  }, [topicsData]);

  // Merge topics with progress (prefer server data, fallback to localStorage)
  const topicsWithProgress = topicsData?.data.map((topic) => {
    // Try server data first
    const serverProgress = serverProgressData?.find((p) => p.id === topic.id);
    
    // Get localStorage progress
    const localProgress = localProgressMap.get(topic.id) || { wordsLearned: 0, percent: 0 };
    
    // Use server data if available and has progress, otherwise use localStorage
    const hasServerProgress = serverProgress && serverProgress.wordsLearned > 0;
    const wordsLearned = hasServerProgress ? serverProgress.wordsLearned : localProgress.wordsLearned;
    const masteryPercent = hasServerProgress ? serverProgress.masteryPercent : localProgress.percent;
    
    return {
      ...topic,
      wordsLearned,
      wordsTotal: topic.wordCount,
      masteryPercent,
      lastStudiedAt: serverProgress?.lastStudiedAt || null,
      completedAt: serverProgress?.completedAt || null,
    };
  });

  const isLoading = topicsLoading;

  // Calculate overall progress
  const totalWords = topicsWithProgress?.reduce((sum, t) => sum + t.wordCount, 0) || 0;
  const learnedWords = topicsWithProgress?.reduce((sum, t) => sum + t.wordsLearned, 0) || 0;
  const overallProgress = totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0;
  const completedTopics = topicsWithProgress?.filter((t) => t.masteryPercent >= 100).length || 0;

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            📚 Chủ đề từ vựng
          </h1>
          <p className="text-gray-500">
            Học từ vựng theo 12 chủ đề chuẩn Goethe A1
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div
            className="p-4 rounded-xl border"
            style={{
              borderColor: 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-card)',
            }}
          >
            <div className="text-2xl font-bold text-blue-600">
              {stats?.totalTopics || topicsData?.total || 12}
            </div>
            <div className="text-sm text-gray-500">Chủ đề</div>
          </div>
          <div
            className="p-4 rounded-xl border"
            style={{
              borderColor: 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-card)',
            }}
          >
            <div className="text-2xl font-bold text-green-600">
              {stats?.totalWords || totalWords}
            </div>
            <div className="text-sm text-gray-500">Tổng từ vựng</div>
          </div>
          <div
            className="p-4 rounded-xl border"
            style={{
              borderColor: 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-card)',
            }}
          >
            <div className="text-2xl font-bold text-purple-600">{learnedWords}</div>
            <div className="text-sm text-gray-500">Đã học</div>
          </div>
          <div
            className="p-4 rounded-xl border"
            style={{
              borderColor: 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-card)',
            }}
          >
            <div className="text-2xl font-bold text-amber-600">
              {completedTopics}/{topicsWithProgress?.length || 12}
            </div>
            <div className="text-sm text-gray-500">Hoàn thành</div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div
          className="p-4 rounded-xl border mb-8"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: 'var(--theme-bg-card)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium" style={{ color: 'var(--theme-text-primary)' }}>
              Tiến độ tổng
            </span>
            <span className="text-sm font-bold text-blue-600">{overallProgress}%</span>
          </div>
          <div
            className="h-3 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
          >
            <div
              className="h-full rounded-full bg-linear-to-r from-blue-500 to-green-500 transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Level filter */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-gray-500">Cấp độ:</span>
          {['A1', 'A2', 'B1', 'B2'].map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${selectedLevel === level
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Topics grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="h-48 rounded-2xl animate-pulse"
                style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {topicsWithProgress?.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                showProgress={true}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!topicsWithProgress || topicsWithProgress.length === 0) && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <h3
              className="text-xl font-bold mb-2"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              Chưa có chủ đề nào
            </h3>
            <p className="text-gray-500">
              Vui lòng chọn cấp độ khác hoặc liên hệ admin
            </p>
          </div>
        )}

        {/* Tips section */}
        <div
          className="mt-12 p-6 rounded-2xl border"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: 'var(--theme-bg-secondary)',
          }}
        >
          <h3
            className="text-lg font-bold mb-4"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            💡 Mẹo học từ vựng hiệu quả
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex gap-2">
              <span>📌</span>
              <span>Học theo chủ đề giúp nhớ từ theo ngữ cảnh</span>
            </div>
            <div className="flex gap-2">
              <span>🔁</span>
              <span>Ôn tập mỗi ngày với SRS để nhớ lâu</span>
            </div>
            <div className="flex gap-2">
              <span>🎮</span>
              <span>Chơi game Der/Die/Das để ghi nhớ giống</span>
            </div>
            <div className="flex gap-2">
              <span>📝</span>
              <span>Thêm từ mới vào Sổ từ vựng cá nhân</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}