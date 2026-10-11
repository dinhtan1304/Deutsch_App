'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button, Card } from '@/components/ui';
import { apiGet } from '@/lib/api/client';
import { writingApi, WritingSession } from '@/lib/api/writing';
import { writingKeys } from '@/hooks/useWriting';
import { ACCENT } from '@/lib/tokens';

interface Revision {
  id: string;
  userText: string;
  score: number;
  createdAt: string;
}
export function WritingRevisions({ session }: { session: WritingSession }) {
  const t = useTranslations('common.revisions');
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const revisions = useQuery({
    queryKey: [...writingKeys.session(session.id), 'revisions'],
    queryFn: () => apiGet<Revision[]>(`/writing/${session.id}/revisions`),
    enabled: open,
  });
  const submit = useMutation({
    mutationFn: () =>
      writingApi.submitWriting(session.id, text ?? session.userText ?? ''),
    onSuccess: async (updated) => {
      queryClient.setQueryData(writingKeys.session(session.id), updated);
      setText(null);
      await queryClient.invalidateQueries({
        queryKey: [...writingKeys.session(session.id), 'revisions'],
      });
      void queryClient.invalidateQueries({ queryKey: ['learning', 'errors'] });
      void queryClient.invalidateQueries({ queryKey: writingKeys.history() });
    },
  });
  const currentText = text ?? session.userText ?? '';
  return (
    <Card className="mb-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-h3 font-semibold">{t('title')}</h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          {t('title')}
        </Button>
      </div>
      {open && (
        <>
          <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
            {t('intro')}
          </p>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!submit.isPending) submit.mutate();
            }}
          >
            <label
              htmlFor={`revision-${session.id}`}
              className="block text-body font-semibold"
            >
              {t('answer')}
            </label>
            <textarea
              id={`revision-${session.id}`}
              lang="de"
              className="min-h-64 w-full rounded-lg border p-4 text-body"
              style={{
                background: 'var(--theme-bg-secondary)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-primary)',
              }}
              value={currentText}
              onChange={(event) => setText(event.target.value)}
              maxLength={15000}
              disabled={submit.isPending}
            />
            <Button
              type="submit"
              disabled={
                submit.isPending ||
                revisions.isPending ||
                revisions.isError ||
                (revisions.data?.length ?? 0) >= 5 ||
                currentText.trim() === session.userText?.trim() ||
                currentText.trim().split(/\s+/).length < session.wordCountMin
              }
            >
              {t(submit.isPending ? 'saving' : 'submit')}
            </Button>
            {submit.isError && <p role="alert">{t('error')}</p>}
          </form>
          <p
            className="text-caption"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            {t('rewardNote')}
          </p>
          <h3 className="text-body font-semibold">{t('history')}</h3>
          {revisions.isError ? (
            <p role="alert">{t('error')}</p>
          ) : revisions.isPending ? (
            <p>{t('saving')}</p>
          ) : revisions.data?.length ? (
            revisions.data.map((revision, index) => (
              <Card key={revision.id} variant="bordered" className="space-y-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setExpandedId(
                      expandedId === revision.id ? null : revision.id,
                    )
                  }
                  aria-expanded={expandedId === revision.id}
                >
                  #{index + 1} ·{' '}
                  {t('score', { score: Math.round(revision.score) })}
                </Button>
                {expandedId === revision.id && (
                  <p lang="de" className="whitespace-pre-wrap text-body">
                    {revision.userText}
                  </p>
                )}
              </Card>
            ))
          ) : (
            <p className="text-body">{t('empty')}</p>
          )}
          {revisions.data?.length && (
            <p className="text-body">
              {t('changed', {
                delta: Math.round(
                  (session.overallScore ?? 0) -
                    (revisions.data.at(-1)?.score ?? 0),
                ),
              })}
            </p>
          )}
        </>
      )}
      <Link
        className="text-body font-semibold"
        href="/error-notebook"
        style={{ color: ACCENT.brand }}
      >
        {t('notebook')}
      </Link>
    </Card>
  );
}
