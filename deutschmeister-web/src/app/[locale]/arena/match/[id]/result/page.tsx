'use client';

import { use, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { arenaApi, type ArenaMatchAnswer, type ArenaMatchDetail, type ArenaMatchRound } from '@/lib/api/arena';
import { Card, Button, Loading } from '@/components/ui';
import { GRADIENT, STATUS } from '@/lib/tokens';
import { IconUsers } from '@/components/ui/Icons';

interface MatchResultPageProps {
  params: Promise<{ id: string }>;
}

export default function MatchResultPage({ params }: MatchResultPageProps) {
  const { id } = use(params);
  const t = useTranslations('arena');
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<ArenaMatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    arenaApi
      .getMatch(id)
      .then((d) => setData(d))
      .catch((err) => setError(err?.message ?? t('result.loadError')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const summary = (() => {
    if (!data || !user?.id) return null;
    const isP1 = data.player1Id === user.id;
    const myScore = isP1 ? data.player1Score : data.player2Score;
    const oppScore = isP1 ? data.player2Score : data.player1Score;
    const opp = isP1 ? data.player2 : data.player1;
    const isDraw = !data.winnerId;
    const iWon = !isDraw && data.winnerId === user.id;
    const myAnswers = data.rounds
      .map((r: ArenaMatchRound) => r.answers?.find((a: ArenaMatchAnswer) => a.userId === user.id))
      .filter((a): a is ArenaMatchAnswer => Boolean(a));
    const correctAnswers = myAnswers.filter((a: ArenaMatchAnswer) => a.isCorrect).length;
    const avgResponse = myAnswers.length
      ? Math.round(myAnswers.reduce((sum: number, a: ArenaMatchAnswer) => sum + a.responseTimeMs, 0) / myAnswers.length)
      : null;
    return {
      isP1,
      myScore,
      oppScore,
      opp,
      isDraw,
      iWon,
      correctAnswers,
      totalAnswered: myAnswers.length,
      avgResponse,
    };
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading />
      </div>
    );
  }

  if (error || !data || !summary) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <Card className="text-center py-10">
          <div className="text-lead mb-2" style={{ color: 'var(--theme-text-primary)' }}>
            {error ?? t('result.notFound')}
          </div>
          <Link href="/arena">
            <Button variant="primary" style={{ background: GRADIENT.vocab }}>
              {t('result.backToArena')}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const title = summary.isDraw ? t('result.draw') : summary.iWon ? t('result.youWon') : t('result.youLost');
  const titleColor = summary.isDraw ? STATUS.info : summary.iWon ? STATUS.success : STATUS.danger;
  const accuracy = summary.totalAnswered
    ? `${Math.round((summary.correctAnswers / summary.totalAnswered) * 100)}%`
    : '0%';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <div
        className="rounded-2xl p-6 sm:p-8 text-center text-white mb-6"
        style={{ background: GRADIENT.vocab }}
      >
        <div className="text-2xl sm:text-3xl font-bold" style={{ color: titleColor }}>
          {title}
        </div>
        <div className="text-4xl font-bold tabular-nums mt-3">
          {summary.myScore} - {summary.oppScore}
        </div>
        <div className="text-caption mt-2 opacity-90">
          {t('vs')} {summary.opp?.name ?? t('bot')} {data.isBotMatch && `· ${t('bot')}`}
        </div>
        {data.isCustomMatch && (
          <div
            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-caption font-semibold"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
          >
            <IconUsers size={14} />
            <span>{t('result.friendlyBadge')}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Metric label={t('result.metricRoundsWon')} value={summary.myScore} />
        <Metric label={t('result.metricAccuracy')} value={accuracy} />
        <Metric label={t('result.metricAnswered')} value={summary.totalAnswered} />
        <Metric
          label={t('result.metricAvgSpeed')}
          value={summary.avgResponse === null ? '-' : `${(summary.avgResponse / 1000).toFixed(1)}s`}
        />
      </div>

      <div
        className="rounded-2xl p-4 mb-6"
        style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}
      >
        <div className="text-lead font-semibold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
          {t('result.roundsTitle')}
        </div>
        <div className="space-y-2">
          {data.rounds.map((r: ArenaMatchRound) => {
            const myAnswer = r.answers?.find((a: ArenaMatchAnswer) => a.userId === user?.id);
            const winner = r.winnerPlayerId;
            const won = winner === user?.id;
            const botWin = winner === 'BOT';
            return (
              <div
                key={r.id}
                className="grid grid-cols-[auto_1fr_auto] gap-3 px-3 py-2 rounded-lg"
                style={{
                  background:
                    winner === null
                      ? 'rgba(156,163,175,.08)'
                      : won
                        ? 'rgba(34,197,94,.08)'
                        : 'rgba(239,68,68,.08)',
                  border: '1px solid var(--theme-border)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-caption"
                  style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}
                >
                  {r.roundNumber}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-body truncate" style={{ color: 'var(--theme-text-primary)' }}>
                    {r.mode === 'vi_to_de' && r.word?.article ? `${r.word.article} ` : ''}
                    {r.word?.word ?? 'Word'}
                    <span className="ml-2 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                      {r.mode === 'vi_to_de' ? t('result.dirViToDe') : t('result.dirDeToVi')}
                    </span>
                  </div>
                  {r.word?.translationVi && (
                    <div className="text-caption truncate" style={{ color: 'var(--theme-text-muted)' }}>
                      {r.word.translationVi}
                    </div>
                  )}
                  {myAnswer && (
                    <div className="text-caption truncate" style={{ color: 'var(--theme-text-secondary)' }}>
                      {t('result.yourAnswer', { answer: myAnswer.answer, seconds: (myAnswer.responseTimeMs / 1000).toFixed(1) })}
                    </div>
                  )}
                </div>
                <div
                  className="text-caption font-semibold text-right"
                  style={{
                    color: winner === null ? 'var(--theme-text-muted)' : won ? STATUS.success : STATUS.danger,
                  }}
                >
                  {winner === null ? t('result.timeUp') : won ? t('result.winnerYou') : botWin ? t('result.winnerBot') : t('result.winnerOpponent')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/arena" className="flex-1">
          <Button variant="primary" fullWidth style={{ background: GRADIENT.vocab }}>
            {t('result.playAnother')}
          </Button>
        </Link>
        <Link href="/arena/history" className="flex-1">
          <Button variant="outline" fullWidth>
            {t('result.viewHistory')}
          </Button>
        </Link>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}
    >
      <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{label}</div>
      <div className="text-lead font-bold tabular-nums" style={{ color: 'var(--theme-text-primary)' }}>{value}</div>
    </div>
  );
}
