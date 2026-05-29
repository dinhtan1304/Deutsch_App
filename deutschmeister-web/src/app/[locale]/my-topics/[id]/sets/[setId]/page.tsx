'use client';

import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Card, EmptyState, Input, PageHeader } from '@/components/ui';
import {
  useAddCards,
  useDeleteCards,
  useMyTopic,
  useUpdateCard,
} from '@/hooks/useUserTopics';
import { usePersonalWords } from '@/hooks/usePersonalWords';
import { wordsApi } from '@/lib/api/words';
import { ACCENT } from '@/lib/tokens';
import type { ManualCardDto, UserTopicCard } from '@/types/user-topic';
import { getApiErrorMessage } from '@/lib/api/client';

type AddTab = 'manual' | 'system' | 'personal';

export default function SetEditorPage() {
  const t = useTranslations('vocabulary.setEditor');
  const { id, setId } = useParams<{ id: string; setId: string }>();
  const { data: topic, isLoading } = useMyTopic(id);
  const addCards = useAddCards(id);
  const deleteCards = useDeleteCards(id);
  const updateCard = useUpdateCard(id);

  const [tab, setTab] = useState<AddTab>('manual');
  const [error, setError] = useState<string | null>(null);

  const set = useMemo(() => topic?.sets.find((item) => item.id === setId), [topic, setId]);

  if (isLoading || !topic) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Card className="h-32 animate-pulse opacity-60" />
      </div>
    );
  }

  if (!set) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <EmptyState icon={null} title={t('setNotFound')} />
      </div>
    );
  }

  const handleDelete = async (cardId: string) => {
    if (!confirm(t('deleteCardConfirm'))) return;
    try {
      await deleteCards.mutateAsync({ setId, cardIds: [cardId] });
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        backHref={`/my-topics/${id}`}
        hideBackIcon
        title={set.title}
        subtitle={t('subtitle', { count: set.wordCount, topicTitle: topic.title })}
        accent="vocab"
      />

      <Card variant="default" className="mb-5" style={{ border: '1px solid var(--theme-border)' }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--theme-text-secondary)' }}>
          {t('addCardsHeader')}
        </h3>
        <div className="flex gap-2 mb-4 flex-wrap">
          {([
            { v: 'manual', label: t('tabManual') },
            { v: 'system', label: t('tabSystem') },
            { v: 'personal', label: t('tabPersonal') },
          ] as Array<{ v: AddTab; label: string }>).map((item) => (
            <button
              key={item.v}
              onClick={() => setTab(item.v)}
              className="px-3 py-2 rounded-xl text-sm font-bold"
              style={{
                backgroundColor: tab === item.v ? `${ACCENT.vocab}18` : 'var(--theme-bg-secondary)',
                color: tab === item.v ? ACCENT.vocab : 'var(--theme-text-secondary)',
                border: tab === item.v ? `1px solid ${ACCENT.vocab}` : '1px solid var(--theme-border)',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'manual' && (
          <ManualCardForm
            isLoading={addCards.isPending}
            onSubmit={async (cards) => {
              try {
                await addCards.mutateAsync({ setId, dto: { source: 'manual', cards } });
              } catch (e) {
                setError(getApiErrorMessage(e));
              }
            }}
          />
        )}

        {tab === 'system' && (
          <SystemWordPicker
            isLoading={addCards.isPending}
            onAdd={async (wordIds) => {
              try {
                await addCards.mutateAsync({ setId, dto: { source: 'system_word', wordIds } });
              } catch (e) {
                setError(getApiErrorMessage(e));
              }
            }}
          />
        )}

        {tab === 'personal' && (
          <PersonalWordPicker
            isLoading={addCards.isPending}
            onAdd={async (personalWordIds) => {
              try {
                await addCards.mutateAsync({
                  setId,
                  dto: { source: 'personal_word', personalWordIds },
                });
              } catch (e) {
                setError(getApiErrorMessage(e));
              }
            }}
          />
        )}
      </Card>

      {error && (
        <div
          className="mb-4 px-3 py-2 rounded-lg text-sm"
          style={{ backgroundColor: `${ACCENT.speaking}18`, color: ACCENT.speaking }}
        >
          {error}
        </div>
      )}

      <h2 className="text-h3 font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
        {t('cardsInSet', { count: set.cards.length })}
      </h2>
      {set.cards.length === 0 ? (
        <EmptyState
          icon={null}
          title={t('emptyTitle')}
          description={t('emptyBody')}
        />
      ) : (
        <div className="space-y-2">
          {set.cards.map((card) => (
            <CardRow
              key={card.id}
              card={card}
              onDelete={() => handleDelete(card.id)}
              onSave={async (dto) => {
                try {
                  await updateCard.mutateAsync({ setId, cardId: card.id, dto });
                } catch (e) {
                  setError(getApiErrorMessage(e));
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ManualCardForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (cards: ManualCardDto[]) => Promise<void>;
  isLoading: boolean;
}) {
  const t = useTranslations('vocabulary.setEditor');
  const [word, setWord] = useState('');
  const [article, setArticle] = useState('');
  const [translationVi, setTranslationVi] = useState('');
  const [examples, setExamples] = useState('');

  const reset = () => {
    setWord('');
    setArticle('');
    setTranslationVi('');
    setExamples('');
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Input
        label={t('fieldWord')}
        value={word}
        onChange={(e) => setWord(e.target.value)}
        placeholder={t('fieldWordPlaceholder')}
      />
      <Input
        label={t('fieldArticle')}
        value={article}
        onChange={(e) => setArticle(e.target.value)}
        placeholder={t('fieldArticlePlaceholder')}
      />
      <div className="sm:col-span-2">
        <Input
          label={t('fieldTranslation')}
          value={translationVi}
          onChange={(e) => setTranslationVi(e.target.value)}
          placeholder={t('fieldTranslationPlaceholder')}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-body font-semibold mb-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
          {t('fieldExamples')}
        </label>
        <textarea
          value={examples}
          onChange={(e) => setExamples(e.target.value)}
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
          style={{
            backgroundColor: 'var(--theme-bg-secondary)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }}
        />
      </div>
      <div className="sm:col-span-2 flex justify-end">
        <Button
          variant="game"
          accent="vocab"
          isLoading={isLoading}
          disabled={!word.trim()}
          onClick={async () => {
            await onSubmit([
              {
                word: word.trim(),
                article: article.trim() || undefined,
                translationVi: translationVi.trim() || undefined,
                examples: examples
                  .split('\n')
                  .map((item) => item.trim())
                  .filter(Boolean),
              },
            ]);
            reset();
          }}
        >
          {t('addCard')}
        </Button>
      </div>
    </div>
  );
}

interface SystemWordRow {
  id: string;
  word: string;
  article: string;
  translationVi: string | null;
  level: string;
}

function SystemWordPicker({
  onAdd,
  isLoading,
}: {
  onAdd: (wordIds: string[]) => Promise<void>;
  isLoading: boolean;
}) {
  const t = useTranslations('vocabulary.setEditor');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SystemWordRow[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const searchWords = async () => {
    setLoading(true);
    try {
      const data = await wordsApi.search({
        search: search.trim() || undefined,
        limit: 30,
      });
      setResults(
        data.data.map((word) => ({
          id: word.id,
          word: word.word,
          article: word.article,
          translationVi: word.translationVi ?? null,
          level: word.level,
        })),
      );
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchWords()}
          placeholder={t('searchSystemPlaceholder')}
          className="flex-1 px-4 py-2 rounded-xl text-sm outline-none"
          style={{
            backgroundColor: 'var(--theme-bg-secondary)',
            border: '1px solid var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }}
        />
        <Button variant="secondary" onClick={searchWords} isLoading={loading}>
          {t('searchBtn')}
        </Button>
      </div>

      {results.length > 0 && (
        <>
          <div
            className="max-h-72 overflow-y-auto rounded-xl"
            style={{ border: '1px solid var(--theme-border)' }}
          >
            {results.map((word) => {
              const checked = picked.has(word.id);
              return (
                <button
                  key={word.id}
                  onClick={() => toggle(word.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors"
                  style={{
                    backgroundColor: checked ? `${ACCENT.vocab}18` : 'transparent',
                  }}
                >
                  <input type="checkbox" checked={checked} readOnly />
                  <span className="font-bold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                    {word.article} {word.word}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                    {word.translationVi}
                  </span>
                  <span
                    className="ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                    style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}
                  >
                    {word.level}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="game"
              accent="vocab"
              isLoading={isLoading}
              disabled={picked.size === 0}
              onClick={async () => {
                await onAdd(Array.from(picked));
                setPicked(new Set());
              }}
            >
              {t('addNCards', { count: picked.size })}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function PersonalWordPicker({
  onAdd,
  isLoading,
}: {
  onAdd: (ids: string[]) => Promise<void>;
  isLoading: boolean;
}) {
  const t = useTranslations('vocabulary.setEditor');
  const [search, setSearch] = useState('');
  const { data, isLoading: loading } = usePersonalWords({ search: search || undefined, limit: 50 });
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const items = data?.data ?? [];

  const toggle = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };

  return (
    <div>
      <div className="mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchWordBankPlaceholder')}
          className="w-full px-4 py-2 rounded-xl text-sm outline-none"
          style={{
            backgroundColor: 'var(--theme-bg-secondary)',
            border: '1px solid var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }}
        />
      </div>

      <div
        className="max-h-72 overflow-y-auto rounded-xl"
        style={{ border: '1px solid var(--theme-border)' }}
      >
        {loading ? (
          <div className="p-4 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            {t('loading')}
          </div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            {t('wordBankEmpty')}
          </div>
        ) : (
          items.map((word) => {
            const checked = picked.has(word.id);
            return (
              <button
                key={word.id}
                onClick={() => toggle(word.id)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors"
                style={{
                  backgroundColor: checked ? `${ACCENT.vocab}18` : 'transparent',
                }}
              >
                <input type="checkbox" checked={checked} readOnly />
                <span className="font-bold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                  {word.word}
                </span>
                <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  {word.translationVi}
                </span>
              </button>
            );
          })
        )}
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          variant="game"
          accent="vocab"
          isLoading={isLoading}
          disabled={picked.size === 0}
          onClick={async () => {
            await onAdd(Array.from(picked));
            setPicked(new Set());
          }}
        >
          Thêm {picked.size} thẻ
        </Button>
      </div>
    </div>
  );
}

function CardRow({
  card,
  onDelete,
  onSave,
}: {
  card: UserTopicCard;
  onDelete: () => void;
  onSave: (dto: Partial<ManualCardDto>) => Promise<void>;
}) {
  const t = useTranslations('vocabulary.setEditor');
  const [editing, setEditing] = useState(false);
  const [word, setWord] = useState(card.word);
  const [article, setArticle] = useState(card.article ?? '');
  const [translationVi, setTranslationVi] = useState(card.translationVi ?? '');

  return (
    <Card
      variant="default"
      className="!p-3"
      style={{ border: '1px solid var(--theme-border)' }}
    >
      {editing ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            value={article}
            onChange={(e) => setArticle(e.target.value)}
            placeholder={t('editArticlePlaceholder')}
            className="px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              border: '1px solid var(--theme-border)',
              color: 'var(--theme-text-primary)',
            }}
          />
          <input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder={t('editWordPlaceholder')}
            className="px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              border: '1px solid var(--theme-border)',
              color: 'var(--theme-text-primary)',
            }}
          />
          <input
            value={translationVi}
            onChange={(e) => setTranslationVi(e.target.value)}
            placeholder={t('editTranslationPlaceholder')}
            className="px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              border: '1px solid var(--theme-border)',
              color: 'var(--theme-text-primary)',
            }}
          />
          <div className="sm:col-span-3 flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="game"
              accent="vocab"
              size="sm"
              onClick={async () => {
                await onSave({
                  word: word.trim(),
                  article: article.trim() || undefined,
                  translationVi: translationVi.trim() || undefined,
                });
                setEditing(false);
              }}
            >
              {t('save')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-bold uppercase px-2 py-0.5 rounded shrink-0"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}
          >
            {card.article || '-'}
          </span>
          <span className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {card.word}
          </span>
          <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            {card.translationVi || ''}
          </span>
          <span
            className="ml-auto text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}
          >
            {card.source === 'system_word' ? t('sourceSystem') : card.source === 'personal_word' ? t('sourceWordBank') : card.source === 'fork' ? t('sourceFork') : t('sourceManual')}
          </span>
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-bold px-2 py-1 rounded-md"
            style={{ color: ACCENT.srs }}
          >
            {t('edit')}
          </button>
          <button
            onClick={onDelete}
            className="text-xs font-bold px-2 py-1 rounded-md"
            style={{ color: ACCENT.speaking }}
          >
            {t('delete')}
          </button>
        </div>
      )}
    </Card>
  );
}
