'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { arenaApi, type ArenaLeaderboardRow } from '@/lib/api/arena';
import { Card, Button, Loading } from '@/components/ui';
import { GRADIENT, STATUS } from '@/lib/tokens';

export default function ArenaLeaderboardPage() {
  const t = useTranslations('arena');
  const user = useAuthStore((s) => s.user);
  const [rows, setRows] = useState<ArenaLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    arenaApi
      .getLeaderboard(50)
      .then(setRows)
      .catch((err) => setError(err?.message ?? t('leaderboard.loadError')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          {t('leaderboard.title')}
        </h1>
        <Link href="/arena">
          <Button variant="outline">{t('backToLobby')}</Button>
        </Link>
      </div>

      {error ? (
        <Card className="text-center py-10">
          <div className="text-lead mb-3" style={{ color: STATUS.danger }}>{error}</div>
          <Button variant="primary" style={{ background: GRADIENT.vocab }} onClick={() => window.location.reload()}>
            {t('retry')}
          </Button>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="text-center py-10">
          <div className="text-lead mb-3" style={{ color: 'var(--theme-text-primary)' }}>
            {t('leaderboard.empty')}
          </div>
          <Link href="/arena">
            <Button variant="primary" style={{ background: GRADIENT.vocab }}>
              {t('leaderboard.beFirst')}
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => {
            const isMe = r.userId === user?.id;
            return (
              <div
                key={r.userId}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: isMe ? 'rgba(139,92,246,.10)' : 'var(--theme-bg-card)',
                  border: `1px solid ${isMe ? 'rgba(139,92,246,.35)' : 'var(--theme-border)'}`,
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0"
                  style={{
                    background:
                      i === 0
                        ? GRADIENT.xpGold
                        : i === 1
                          ? GRADIENT.silver
                          : i === 2
                            ? GRADIENT.bronze
                            : 'var(--theme-bg-secondary)',
                    color: i < 3 ? '#fff' : 'var(--theme-text-secondary)',
                  }}
                >
                  {i + 1}
                </div>
                <Avatar name={r.user.name ?? t('player')} avatar={r.user.avatar} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate" style={{ color: 'var(--theme-text-primary)' }}>
                    {r.user.name ?? t('player')}
                    {isMe && <span className="ml-2 text-caption" style={{ color: STATUS.success }}>{t('you')}</span>}
                  </div>
                  <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                    {t('leaderboard.statLine', { wins: r.wins, losses: r.losses, draws: r.draws, streak: r.currentStreak })}
                  </div>
                </div>
                <div className="text-lead font-bold tabular-nums shrink-0" style={{ color: 'var(--theme-text-primary)' }}>
                  {r.rating}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover shrink-0" />
    );
  }
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{ background: GRADIENT.vocab }}
    >
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}
