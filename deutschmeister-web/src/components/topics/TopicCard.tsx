'use client';

import Link from 'next/link';
import type { Topic, TopicWithProgress } from '@/types/topic';

interface TopicCardProps {
  topic: Topic | TopicWithProgress;
  showProgress?: boolean;
}

export function TopicCard({ topic, showProgress = false }: TopicCardProps) {
  const progress = 'masteryPercent' in topic ? topic.masteryPercent : 0;
  const wordsLearned = 'wordsLearned' in topic ? topic.wordsLearned : 0;
  const isCompleted = progress >= 100;

  return (
    <Link href={`/topics/${topic.slug}`}>
      <div
        className="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300
          hover:shadow-lg hover:scale-[1.02] hover:border-transparent cursor-pointer"
        style={{
          borderColor: 'var(--theme-border)',
          backgroundColor: 'var(--theme-bg-card)',
        }}
      >
        {/* Background gradient on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
          style={{ backgroundColor: topic.color || '#3B82F6' }}
        />

        {/* Completed badge */}
        {isCompleted && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600">
              ✓ Hoàn thành
            </span>
          </div>
        )}

        {/* Icon */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-4
            transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${topic.color}20` || 'rgba(59,130,246,0.1)' }}
        >
          {topic.icon || '📚'}
        </div>

        {/* Content */}
        <div className="space-y-1">
          <h3
            className="font-bold text-lg leading-tight"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            {topic.nameDe}
          </h3>
          <p className="text-sm text-gray-500">{topic.nameVi}</p>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center justify-between">
          <span
            className="text-xs font-medium px-2 py-1 rounded-lg"
            style={{
              backgroundColor: `${topic.color}15` || 'rgba(59,130,246,0.1)',
              color: topic.color || '#3B82F6',
            }}
          >
            {topic.wordCount} từ
          </span>

          <span className="text-xs text-gray-400">{topic.level}</span>
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">
                {wordsLearned}/{topic.wordCount} từ
              </span>
              <span
                className="font-medium"
                style={{ color: progress > 0 ? topic.color : 'var(--theme-text-secondary)' }}
              >
                {Math.round(progress)}%
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: topic.color || '#3B82F6',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}