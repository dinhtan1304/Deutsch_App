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

const MODES: Array<{ v: Mode; label: string }> = [
  { v: 'flashcard', label: 'Flashcard' },
  { v: 'quiz', label: 'Quiz' },
  { v: 'matching', label: 'Ghép cặp' },
];

function adaptCard(card: UserTopicCard, idx: number): TopicWord {
  const gender: TopicWord['gender'] =
    card.article === 'der'
      ? 'masculine'
      : card.article === 'die'
        ? 'feminine'
        : card.article === 'das'
          ? 'neuter'
          : 'masculine';
  return {
    id: card.id,
    word: card.word,
    article: card.article ?? '',
    gender,
    plural: card.plural ?? undefined,
    pronunciation: card.pronunciation ?? undefined,
    translationEn: card.translationEn ?? '',
    translationVi: card.translationVi ?? undefined,
    imageUrl: card.imageUrl ?? undefined,
    examples: card.examples,
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
          hideBackIcon
          title={setData.set.title}
          accent="vocab"
        />
        <EmptyState icon={null} title="Bộ thẻ này chưa có thẻ nào" />
      </div>
    );
  }

  const topicColor = topic?.coverColor || ACCENT.vocab;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        backHref={`/community/topics/${slug}`}
        hideBackIcon
        title={setData.set.title}
        subtitle={`${adaptedWords.length} thẻ${topic ? ` | từ "${topic.title}"` : ''}`}
        accent="vocab"
      />

      <div className="flex gap-2 mb-5 flex-wrap">
        {MODES.map((item) => {
          const active = mode === item.v;
          return (
            <button
              key={item.v}
              onClick={() => setMode(item.v)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                backgroundColor: active ? `${topicColor}18` : 'var(--theme-bg-card)',
                color: active ? topicColor : 'var(--theme-text-secondary)',
                border: active ? `2px solid ${topicColor}` : '1px solid var(--theme-border)',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {mode === 'flashcard' && (
        <TopicFlashcard words={adaptedWords} topicColor={topicColor} hideIcons />
      )}
      {mode === 'quiz' && (
        <TopicQuiz words={adaptedWords} topicColor={topicColor} hideIcons />
      )}
      {mode === 'matching' && (
        <TopicMatching words={adaptedWords} topicColor={topicColor} hideIcons />
      )}

      <div className="mt-6 flex justify-end">
        <Button
          variant="ghost"
          onClick={() => router.push(`/community/topics/${slug}`)}
        >
          Quay lại bộ chủ đề
        </Button>
      </div>
    </div>
  );
}
