'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatedModal, Button } from '@/components/ui';
import { useVideoQuiz } from '@/hooks/useDictation';
import { ACCENT, STATUS } from '@/lib/tokens';

interface Props {
  videoId: string;
  open: boolean;
  onClose: () => void;
  /** Replays the transcript segment a question was taken from. */
  onReplay: (segmentId: string) => void;
}

export function VideoQuiz({ videoId, open, onClose, onReplay }: Props) {
  const t = useTranslations('practice.dictation.watch');
  const { data, isLoading, isError, refetch, isFetching } = useVideoQuiz(videoId, open);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const items = data?.items ?? [];
  const item = items[index];

  function choose(option: string) {
    if (picked || !item) return;
    setPicked(option);
    if (option === item.answer) setCorrect(c => c + 1);
  }

  function next() {
    if (index + 1 >= items.length) { setDone(true); return; }
    setIndex(i => i + 1);
    setPicked(null);
  }

  function restart() {
    setIndex(0);
    setPicked(null);
    setCorrect(0);
    setDone(false);
  }

  const [before, after] = item ? splitGap(item.sentence) : ['', ''];
  const filled = picked ? item?.answer : null;

  return (
    <AnimatedModal open={open} onClose={onClose} size="md" ariaLabel={t('quizTitle')}>
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-h3 font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{t('quizTitle')}</h2>
          {item && !done && (
            <span className="mono text-caption font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
              {t('quizProgress', { current: index + 1, total: items.length })}
            </span>
          )}
        </div>

        {isLoading || (isFetching && !items.length) ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4"
              style={{ borderColor: `${ACCENT.listening}33`, borderTopColor: ACCENT.listening }} />
            <p className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>{t('quizLoading')}</p>
          </div>
        ) : isError || !items.length ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>{t('quizError')}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>{t('quizRetry')}</Button>
          </div>
        ) : done ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <p className="text-h1 font-bold" style={{ color: ACCENT.listening }}>
              {Math.round((correct / items.length) * 100)}%
            </p>
            <p className="text-lead" style={{ color: 'var(--theme-text-primary)' }}>
              {t('quizScore', { correct, total: items.length })}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={restart}>{t('quizRestart')}</Button>
              <Button onClick={onClose}>{t('quizClose')}</Button>
            </div>
          </div>
        ) : item ? (
          <div className="space-y-4">
            <p className="text-lead font-semibold leading-relaxed" style={{ color: 'var(--theme-text-primary)' }}>
              {before}
              <span
                className="mx-1 inline-block min-w-12 rounded-sm border-b-2 px-1 text-center"
                style={{
                  borderColor: filled ? (picked === item.answer ? STATUS.success : STATUS.danger) : ACCENT.listening,
                  color: filled ? (picked === item.answer ? STATUS.success : STATUS.danger) : 'var(--theme-text-muted)',
                }}
              >
                {filled ?? '…'}
              </span>
              {after}
            </p>

            <div className="grid grid-cols-2 gap-2">
              {item.options.map(option => {
                const isAnswer = option === item.answer;
                const isPicked = option === picked;
                const tone = picked && isAnswer ? STATUS.success : isPicked ? STATUS.danger : null;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={!!picked}
                    onClick={() => choose(option)}
                    className="rounded-md border px-3 py-2 text-body font-semibold transition-colors disabled:cursor-default enabled:hover:bg-(--theme-bg-secondary)"
                    style={{
                      borderColor: tone ?? 'var(--theme-border)',
                      background: tone ? `color-mix(in srgb, ${tone} 12%, transparent)` : 'var(--theme-bg-card)',
                      color: tone ?? 'var(--theme-text-primary)',
                    }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {picked && (
              <div className="space-y-2 rounded-md border p-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-secondary)' }}>
                <p className="text-body font-semibold" style={{ color: picked === item.answer ? STATUS.success : STATUS.danger }}>
                  {picked === item.answer ? t('quizCorrect') : t('quizWrong', { answer: item.answer })}
                </p>
                {item.translationVi && (
                  <p className="text-body italic" style={{ color: 'var(--theme-text-secondary)' }}>{item.translationVi}</p>
                )}
                {item.explanationVi && (
                  <p className="text-body" style={{ color: 'var(--theme-text-primary)' }}>{item.explanationVi}</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              {item.segmentId ? (
                <Button variant="ghost" size="sm" onClick={() => onReplay(item.segmentId!)}>
                  ▶ {t('quizReplay')}
                </Button>
              ) : <span />}
              <Button size="sm" disabled={!picked} onClick={next}>
                {index + 1 >= items.length ? t('quizFinish') : t('quizNext')}
              </Button>
            </div>

            <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t('quizAiNote')}</p>
          </div>
        ) : null}
      </div>
    </AnimatedModal>
  );
}

function splitGap(sentence: string): [string, string] {
  const i = sentence.indexOf('___');
  if (i < 0) return [sentence, ''];
  return [sentence.slice(0, i), sentence.slice(i).replace(/^_+/, '')];
}
