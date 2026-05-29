'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { arenaApi, type ArenaMatchSummary } from '@/lib/api/arena';
import { Card, Button, Loading } from '@/components/ui';
import { GRADIENT, STATUS } from '@/lib/tokens';

type HistoryFilter = 'all' | 'pvp' | 'bot';

export default function ArenaHistoryPage() {
  const t = useTranslations('arena');
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<ArenaMatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<HistoryFilter>('all');

  useEffect(() => {
    arenaApi
      .getHistory(1, 30)
      .then((r) => setItems(r.data))
      .catch((err) => setError(err?.message ?? t('history.loadError')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'bot') return items.filter((m) => m.isBotMatch);
    if (filter === 'pvp') return items.filter((m) => !m.isBotMatch);
    return items;
  }, [filter, items]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
          {t('history.title')}
        </h1>
        <Link href="/arena">
          <Button variant="outline">{t('backToLobby')}</Button>
        </Link>
      </div>

      {error && (
        <Card className="text-center py-10">
          <div className="text-lead mb-3" style={{ color: STATUS.danger }}>{error}</div>
          <Button variant="primary" style={{ background: GRADIENT.vocab }} onClick={() => window.location.reload()}>
            {t('retry')}
          </Button>
        </Card>
      )}

      {!error && (
        <>
          <div className="flex gap-2 mb-4">
            {[
              ['all', t('history.filterAll')],
              ['pvp', t('history.filterPvp')],
              ['bot', t('history.filterBot')],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key as HistoryFilter)}
                className="px-3 py-2 rounded-lg text-caption font-semibold"
                style={{
                  background: filter === key ? GRADIENT.vocab : 'var(--theme-bg-card)',
                  color: filter === key ? '#fff' : 'var(--theme-text-secondary)',
                  border: `1px solid ${filter === key ? 'transparent' : 'var(--theme-border)'}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <Card className="text-center py-10">
              <div className="text-lead mb-3" style={{ color: 'var(--theme-text-primary)' }}>
                {t('history.emptyFilter')}
              </div>
              <Link href="/arena">
                <Button variant="primary" style={{ background: GRADIENT.vocab }}>
                  {t('history.playFirst')}
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((m) => {
                const isP1 = m.player1Id === user?.id;
                const myScore = isP1 ? m.player1Score : m.player2Score;
                const oppScore = isP1 ? m.player2Score : m.player1Score;
                const opp = isP1 ? m.player2 : m.player1;
                const isDraw = !m.winnerId;
                const iWon = !isDraw && m.winnerId === user?.id;
                return (
                  <Link key={m.id} href={`/arena/match/${m.id}/result`} className="block">
                    <div
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-opacity-80"
                      style={{
                        background: 'var(--theme-bg-card)',
                        border: '1px solid var(--theme-border)',
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-caption"
                        style={{
                          background: isDraw
                            ? 'var(--theme-bg-secondary)'
                            : iWon
                              ? 'rgba(34,197,94,.14)'
                              : 'rgba(239,68,68,.14)',
                          color: isDraw ? 'var(--theme-text-secondary)' : iWon ? STATUS.success : STATUS.danger,
                        }}
                      >
                        {isDraw ? 'H' : iWon ? 'W' : 'L'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate" style={{ color: 'var(--theme-text-primary)' }}>
                          {t('vs')} {opp?.name ?? t('bot')}
                          {m.isBotMatch && (
                            <span className="ml-2 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                              · {t('bot')}
                            </span>
                          )}
                        </div>
                        <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                          {new Date(m.createdAt).toLocaleString()} · {m.mode} · {m.level}
                        </div>
                      </div>
                      <div
                        className="text-lead font-bold tabular-nums"
                        style={{
                          color: isDraw
                            ? 'var(--theme-text-secondary)'
                            : iWon
                              ? STATUS.success
                              : STATUS.danger,
                        }}
                      >
                        {myScore} - {oppScore}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
