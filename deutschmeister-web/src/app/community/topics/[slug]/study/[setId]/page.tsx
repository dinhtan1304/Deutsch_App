'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, EmptyState, PageHeader } from '@/components/ui';
import { TopicFlashcard } from '@/components/topics/TopicFlashcard';
import { TopicQuiz } from '@/components/topics/TopicQuiz';
import { TopicMatching } from '@/components/topics/TopicMatching';
import {
  useCommunityTopic,
  useRecordStudyEvent,
  useSetCards,
} from '@/hooks/useCommunityTopics';
import { ACCENT } from '@/lib/tokens';
import type { UserTopicCard } from '@/types/user-topic';
import type { TopicWord } from '@/types/topic';

type Mode = 'flashcard' | 'quiz' | 'matching';

const MODES: Array<{ v: Mode; label: string; icon: string }> = [
  { v: 'flashcard', label: 'Flashcard', icon: '🎴' },
  { v: 'quiz', label: 'Quiz', icon: '❓' },
  { v: 'matching', label: 'Ghép cặp', icon: '🔗' },
];

/**
 * Map a UserTopicCard snapshot to the TopicWord shape used by existing
 * study components. Gender is inferred from the article when present.
 */
function adaptCard(c: UserTopicCard, idx: number): TopicWord {
  const gender: TopicWord['gender'] =
    c.article === 'der'
      ? 'masculine'
      : c.article === 'die'
        ? 'feminine'
        : c.article === 'das'
          ? 'neuter'
          : 'masculine';
  return {
    id: c.id,
    word: c.word,
    article: c.article ?? '',
    gender,
    plural: c.plural ?? undefined,
    pronunciation: c.pronunciation ?? undefined,
    translationEn: c.translationEn ?? '',
    translationVi: c.translationVi ?? undefined,
    imageUrl: c.imageUrl ?? undefined,
    examples: c.examples,
    tips: undefined,
    isCore: false,
    order: idx,
  };
}

export default function CommunityStudyPage() {
  const router = useRouter();
  const { slug, setId } = useParams<{ slug: string; setId: string }>();
  const { data: topic } = useCommunityTopic(slug);
  const { data: setData, isLoading } = useSetCards(slug, setId);
  const recordStudy = useRecordStudyEvent(topic?.id ?? '');

  const [mode, setMode] = useState<Mode>('flashcard');
  const [studyEventSent, setStudyEventSent] = useState(false);

  const adaptedWords = useMemo(
    () => (setData?.cards ?? []).map(adaptCard),
    [setData],
  );

  // Fire study event once when the user starts studying.
  useEffect(() => {
    if (!topic?.id || !setData || adaptedWords.length === 0 || studyEventSent) return;
    setStudyEventSent(true);
    recordStudy.mutate(
      { setId, cardsStudied: 0, mode },
      { onError: () => setStudyEventSent(false) },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic?.id, setData, adaptedWords.length]);

  if (isLoading || !setData) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Card className="h-72 animate-pulse opacity-60" />
      </div>
    );
  }

  if (adaptedWords.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <PageHeader
          backHref={`/community/topics/${slug}`}
          title={setData.set.title}
          accent="vocab"
        />
        <EmptyState icon="📭" title="Bộ thẻ này chưa có thẻ nào" />
      </div>
    );
  }

  const topicColor = topic?.coverColor || ACCENT.vocab;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        backHref={`/community/topics/${slug}`}
        title={setData.set.title}
        subtitle={`${adaptedWords.length} thẻ${topic ? ` · từ "${topic.title}"` : ''}`}
        accent="vocab"
      />

      {/* Mode switcher */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {MODES.map((m) => {
          const active = mode === m.v;
          return (
            <button
              key={m.v}
              onClick={() => setMode(m.v)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                backgroundColor: active ? `${topicColor}18` : 'var(--theme-bg-card)',
                color: active ? topicColor : 'var(--theme-text-secondary)',
                border: active ? `2px solid ${topicColor}` : '1px solid var(--theme-border)',
              }}
            >
              {m.icon} {m.label}
            </button>
          );
        })}
      </div>

      {mode === 'flashcard' && (
        <TopicFlashcard words={adaptedWords} topicColor={topicColor} />
      )}
      {mode === 'quiz' && (
        <TopicQuiz words={adaptedWords} topicColor={topicColor} />
      )}
      {mode === 'matching' && (
        <TopicMatching words={adaptedWords} topicColor={topicColor} />
      )}

      <div className="mt-6 flex justify-end">
        <Button
          variant="ghost"
          onClick={() => router.push(`/community/topics/${slug}`)}
        >
          ← Quay lại bộ chủ đề
        </Button>
      </div>
    </div>
  );
}
