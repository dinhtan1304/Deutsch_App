'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { useTopic, useUpdateTopicProgress } from '@/hooks/useTopics';
import { useAuthStore } from '@/stores/authStore';
import type { TopicWord } from '@/types/topic';

// ============================================
// Article Colors
// ============================================
const ArticleColor: Record<string, string> = {
  der: '#3B82F6',
  die: '#EC4899',
  das: '#10B981',
};

// ============================================
// Word Card Component
// ============================================
interface WordCardProps {
  word: TopicWord;
  index: number;
  isLearned: boolean;
  onToggleLearned: (wordId: string) => void;
}

function WordCard({ word, index, isLearned, onToggleLearned }: WordCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const articleColor = ArticleColor[word.article] || '#6B7280';

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = word.article ? `${word.article} ${word.word}` : word.word;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border transition-all duration-300
        ${isLearned ? 'opacity-60' : ''}
        ${showDetails ? 'ring-2' : ''}`}
      style={{
        borderColor: showDetails ? articleColor : 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
        ...(showDetails && { '--ring-color': articleColor } as React.CSSProperties),
      }}
    >
      {/* Core badge */}
      {word.isCore && (
        <div
          className="absolute top-0 right-0 px-2 py-0.5 text-xs font-medium text-white rounded-bl-lg"
          style={{ backgroundColor: articleColor }}
        >
          ⭐ Core
        </div>
      )}

      {/* Main content */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left: Word info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-400 font-mono">{index}.</span>
              {word.article && (
                <span className="text-sm font-medium" style={{ color: articleColor }}>
                  {word.article}
                </span>
              )}
              <span
                className="text-lg font-bold"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                {word.word}
              </span>
            </div>

            {word.plural && (
              <p className="text-xs text-gray-400 mt-0.5">Pl. {word.plural}</p>
            )}

            <div className="mt-2 space-y-0.5">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                🇬🇧 {word.translationEn}
              </p>
              {word.translationVi && (
                <p className="text-sm text-gray-500">🇻🇳 {word.translationVi}</p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handlePlayAudio}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Nghe phát âm"
            >
              🔊
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLearned(word.id);
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                ${isLearned
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300 hover:border-green-400'
                }`}
              title={isLearned ? 'Đã học' : 'Đánh dấu đã học'}
            >
              {isLearned ? '✓' : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {showDetails && (
        <div
          className="px-4 pb-4 pt-2 border-t space-y-3"
          style={{ borderColor: 'var(--theme-border)' }}
        >
          {word.examples && word.examples.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">📝 Ví dụ:</p>
              <ul className="space-y-1">
                {word.examples.map((ex, i) => (
                  <li
                    key={i}
                    className="text-sm italic pl-3 border-l-2"
                    style={{ borderColor: articleColor, color: 'var(--theme-text-secondary)' }}
                  >
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {word.tips && word.tips.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">💡 Mẹo nhớ:</p>
              <ul className="space-y-1">
                {word.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-gray-400">
                    • {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Filter Types
// ============================================
type FilterMode = 'all' | 'core' | 'learned' | 'unlearned';

// ============================================
// Main Page Component
// ============================================
export default function TopicDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { isAuthenticated } = useAuthStore();
  const { data: topic, isLoading, error } = useTopic(slug);
  const updateProgressMutation = useUpdateTopicProgress();

  const [learnedWords, setLearnedWords] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load learned words from localStorage
  useEffect(() => {
    if (topic) {
      const stored = localStorage.getItem(`topic-learned-${topic.id}`);
      if (stored) {
        try {
          setLearnedWords(new Set(JSON.parse(stored)));
        } catch (e) {
          console.error('Error loading learned words:', e);
        }
      }
    }
  }, [topic]);

  // Sync progress to server
  const syncProgressToServer = (newLearnedCount: number) => {
    if (isAuthenticated && topic) {
      updateProgressMutation.mutate({
        topicId: topic.id,
        wordsLearned: newLearnedCount,
      });
    }
  };

  // Save learned words to localStorage AND sync to server
  const saveLearned = (newSet: Set<string>) => {
    if (topic) {
      // Save to localStorage
      localStorage.setItem(`topic-learned-${topic.id}`, JSON.stringify([...newSet]));
      
      // Sync to server (for dashboard and topics list)
      syncProgressToServer(newSet.size);
    }
  };

  // Toggle learned status
  const toggleLearned = (wordId: string) => {
    const newSet = new Set(learnedWords);
    if (newSet.has(wordId)) {
      newSet.delete(wordId);
    } else {
      newSet.add(wordId);
    }
    setLearnedWords(newSet);
    saveLearned(newSet);
  };

  // Mark all as learned
  const markAllLearned = () => {
    if (topic?.words) {
      const allIds = new Set(topic.words.map((w) => w.id));
      setLearnedWords(allIds);
      saveLearned(allIds);
    }
  };

  // Reset progress
  const resetProgress = () => {
    const newSet = new Set<string>();
    setLearnedWords(newSet);
    saveLearned(newSet);
  };

  // Filter words
  const filteredWords = useMemo(() => {
    if (!topic?.words) return [];

    let words = [...topic.words];

    switch (filterMode) {
      case 'core':
        words = words.filter((w) => w.isCore);
        break;
      case 'learned':
        words = words.filter((w) => learnedWords.has(w.id));
        break;
      case 'unlearned':
        words = words.filter((w) => !learnedWords.has(w.id));
        break;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      words = words.filter(
        (w) =>
          w.word.toLowerCase().includes(q) ||
          w.translationEn.toLowerCase().includes(q) ||
          w.translationVi?.toLowerCase().includes(q)
      );
    }

    return words;
  }, [topic?.words, filterMode, searchQuery, learnedWords]);

  // Progress
  const progress = topic?.words
    ? Math.round((learnedWords.size / topic.words.length) * 100)
    : 0;

  // Loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (error || !topic) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
            Không tìm thấy chủ đề
          </h1>
          <p className="text-gray-500 mb-4">
            Chủ đề "{slug}" không tồn tại hoặc đã bị xóa
          </p>
          <Link href="/topics" className="text-blue-600 hover:underline">
            ← Quay lại danh sách
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/topics" className="hover:text-blue-600">
            Chủ đề
          </Link>
          <span>›</span>
          <span style={{ color: 'var(--theme-text-primary)' }}>{topic.nameDe}</span>
        </div>

        {/* Header */}
        <div
          className="p-6 rounded-2xl mb-6"
          style={{
            background: `linear-gradient(135deg, ${topic.color}20, ${topic.color}05)`,
            border: `1px solid ${topic.color}30`,
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl"
                style={{ backgroundColor: `${topic.color}30` }}
              >
                {topic.icon || '📚'}
              </div>
              <div>
                <h1
                  className="text-2xl font-bold"
                  style={{ color: 'var(--theme-text-primary)' }}
                >
                  {topic.nameDe}
                </h1>
                <p className="text-gray-500">{topic.nameVi}</p>
                {topic.descriptionVi && (
                  <p className="text-sm text-gray-400 mt-1">{topic.descriptionVi}</p>
                )}
              </div>
            </div>

            <span
              className="px-3 py-1 rounded-lg text-sm font-medium"
              style={{ backgroundColor: `${topic.color}20`, color: topic.color }}
            >
              {topic.level}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">
                Đã học: {learnedWords.size}/{topic.words?.length || 0} từ
              </span>
              <span className="font-bold" style={{ color: topic.color }}>
                {progress}%
              </span>
            </div>
            <div
              className="h-3 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: topic.color }}
              />
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={markAllLearned}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
            >
              ✓ Đánh dấu tất cả
            </button>
            <button
              onClick={resetProgress}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              ↺ Học lại từ đầu
            </button>
            <Link
              href={`/games/quick-quiz?topic=${topic.slug}`}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
            >
              🎮 Chơi Quiz
            </Link>
          </div>

          {/* Sync status */}
          {updateProgressMutation.isPending && (
            <div className="mt-2 text-xs text-gray-500">
              ⏳ Đang lưu...
            </div>
          )}
        </div>

        {/* Filters */}
        <div
          className="p-4 rounded-xl border mb-6"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: 'var(--theme-bg-card)',
          }}
        >
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-50">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Tìm từ..."
                className="w-full px-4 py-2 rounded-lg border text-sm"
                style={{
                  borderColor: 'var(--theme-border)',
                  backgroundColor: 'var(--theme-bg-secondary)',
                  color: 'var(--theme-text-primary)',
                }}
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'core', label: '⭐ Core' },
                { key: 'unlearned', label: 'Chưa học' },
                { key: 'learned', label: 'Đã học' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilterMode(item.key as FilterMode)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${filterMode === item.key
                      ? 'text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  style={filterMode === item.key ? { backgroundColor: topic.color } : undefined}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            Hiển thị {filteredWords.length} / {topic.words?.length || 0} từ
          </div>
        </div>

        {/* Word list */}
        <div className="space-y-3">
          {filteredWords.map((word, index) => (
            <WordCard
              key={word.id}
              word={word}
              index={index + 1}
              isLearned={learnedWords.has(word.id)}
              onToggleLearned={toggleLearned}
            />
          ))}
        </div>

        {/* Empty state */}
        {filteredWords.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500">
              {searchQuery
                ? `Không tìm thấy từ nào khớp với "${searchQuery}"`
                : filterMode === 'learned'
                ? 'Bạn chưa học từ nào trong chủ đề này'
                : filterMode === 'unlearned'
                ? '🎉 Bạn đã học hết tất cả từ trong chủ đề này!'
                : 'Chủ đề này chưa có từ vựng'}
            </p>
          </div>
        )}

        {/* Bottom navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Link href="/topics" className="text-gray-500 hover:text-blue-600 transition-colors">
            ← Quay lại
          </Link>

          {progress === 100 && (
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-medium">🎉 Hoàn thành!</span>
              <Link
                href="/topics"
                className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
              >
                Chủ đề tiếp theo
              </Link>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}