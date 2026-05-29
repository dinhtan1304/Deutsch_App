'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Card, Input, PageHeader } from '@/components/ui';
import { useCreateUserTopic } from '@/hooks/useUserTopics';
import { createSet as createSetApi } from '@/lib/api/user-topics';
import { ACCENT } from '@/lib/tokens';
import type { CreateUserTopicDto } from '@/types/user-topic';
import { getApiErrorMessage } from '@/lib/api/client';

const COVER_COLORS = [
  ACCENT.vocab,
  ACCENT.reading,
  ACCENT.xp,
  ACCENT.listening,
  ACCENT.examWriting,
  ACCENT.cyan,
  ACCENT.speaking,
];
const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;

export default function NewUserTopicPage() {
  const t = useTranslations('vocabulary.myTopicsNew');
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<string>('A1');
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0]);
  const [firstSetTitle, setFirstSetTitle] = useState(t('defaultSetTitle'));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const createTopic = useCreateUserTopic();
  const submittingRef = useRef(false);

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError(null);
    if (!title.trim()) {
      setError(t('errorTitleRequired'));
      submittingRef.current = false;
      return;
    }
    setBusy(true);
    try {
      const dto: CreateUserTopicDto = {
        title: title.trim(),
        description: description.trim() || undefined,
        level,
        coverColor,
      };
      const topic = await createTopic.mutateAsync(dto);
      if (firstSetTitle.trim()) {
        await createSetApi(topic.id, { title: firstSetTitle.trim() });
      }
      router.push(`/my-topics/${topic.id}`);
    } catch (e) {
      setError(getApiErrorMessage(e, t('errorCreate')));
      setBusy(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        backHref="/my-topics"
        hideBackIcon
        title={t('pageTitle')}
        subtitle={t('pageSubtitle')}
        accent="vocab"
      />

      <Card variant="default" className="space-y-5" style={{ border: '1px solid var(--theme-border)' }}>
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
            {t('titleLabel')} <span style={{ color: ACCENT.speaking }}>*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
            maxLength={120}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
            {t('descLabel')}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('descPlaceholder')}
            maxLength={1000}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-primary)',
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
            {t('levelLabel')}
          </label>
          <div className="flex gap-2">
            {LEVELS.map((item) => (
              <button
                key={item}
                onClick={() => setLevel(item)}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={{
                  backgroundColor: level === item ? ACCENT.vocab : 'var(--theme-bg-secondary)',
                  color: level === item ? 'white' : 'var(--theme-text-secondary)',
                  border: '1px solid var(--theme-border)',
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
            {t('colorLabel')}
          </label>
          <div className="flex gap-2">
            {COVER_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setCoverColor(color)}
                className="w-9 h-9 rounded-full transition-all"
                style={{
                  backgroundColor: color,
                  outline:
                    coverColor === color ? `3px solid var(--theme-bg-card)` : 'none',
                  boxShadow: coverColor === color ? `0 0 0 2px ${color}` : 'none',
                }}
                aria-label={t('pickColor', { color: color ?? '' })}
              />
            ))}
          </div>
        </div>

        <div className="pt-3" style={{ borderTop: '1px solid var(--theme-border)' }}>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
            {t('firstSetLabel')}
          </label>
          <Input
            value={firstSetTitle}
            onChange={(e) => setFirstSetTitle(e.target.value)}
            placeholder={t('firstSetPlaceholder')}
            maxLength={120}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            {t('firstSetHint')}
          </p>
        </div>

        {error && (
          <div
            className="px-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: `${ACCENT.speaking}18`, color: ACCENT.speaking }}
          >
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="ghost" onClick={() => router.push('/my-topics')}>
            {t('cancel')}
          </Button>
          <Button
            variant="game"
            accent="vocab"
            isLoading={busy}
            disabled={busy}
            onClick={handleSubmit}
          >
            {t('createContinue')}
          </Button>
        </div>
      </Card>

      <p className="text-xs mt-4 text-center" style={{ color: 'var(--theme-text-muted)' }}>
        {t.rich('privacyNote', { b: (chunks) => <strong>{chunks}</strong> })}
      </p>
    </div>
  );
}
