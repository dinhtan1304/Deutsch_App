'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { arenaApi } from '@/lib/api/arena';
import type { ArenaRoomSummary } from '@/types/arena-events.types';
import { Button, Loading } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { ARENA_MODE_LABEL } from '@/lib/arena/labels';
import { parseArenaInviteCode } from '@/lib/arena/invite-code';
import { IconLogIn, IconKey, IconPlus } from '@/components/ui/Icons';

export function RoomList() {
  const t = useTranslations('arena.components');
  const router = useRouter();
  const [rooms, setRooms] = useState<ArenaRoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchRooms = () => {
      arenaApi
        .listRooms(10)
        .then((data) => {
          if (!cancelled) setRooms(data);
        })
        .catch(() => {
          if (!cancelled) setRooms([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    fetchRooms();
    // Light auto-refresh while user lingers on lobby — every 15s
    const id = setInterval(fetchRooms, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <section
      className="rounded-2xl p-4 mt-6"
      style={{
        background: 'var(--theme-bg-card)',
        border: '1px solid var(--theme-border)',
      }}
    >
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h3
          className="text-lead font-semibold flex items-center gap-2"
          style={{ color: 'var(--theme-text-primary)' }}
        >
          <IconLogIn size={16} />
          <span>{t('openRooms')}</span>
          <span
            className="text-caption font-normal"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            {t('friendlyNote')}
          </span>
        </h3>
        <Link href="/arena/rooms/new">
          <Button variant="primary" size="sm" style={{ background: GRADIENT.vocab }}>
            <span className="inline-flex items-center gap-1">
              <IconPlus size={14} />
              <span>{t('createRoom')}</span>
            </span>
          </Button>
        </Link>
      </div>

      {/* Join by code / link */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setCodeError(null);
          const code = parseArenaInviteCode(codeInput);
          if (!code) {
            setCodeError(t('invalidCode'));
            return;
          }
          router.push(`/arena/rooms/${code}`);
        }}
        className="mb-3"
      >
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <input
            type="text"
            value={codeInput}
            onChange={(e) => {
              setCodeInput(e.target.value);
              if (codeError) setCodeError(null);
            }}
            placeholder={t('codePlaceholder')}
            maxLength={200}
            autoComplete="off"
            className="flex-1 min-w-0 px-3 py-2 rounded-lg font-mono"
            style={{
              background: 'var(--theme-bg-secondary)',
              border: `1px solid ${codeError ? STATUS.danger : 'var(--theme-border)'}`,
              color: 'var(--theme-text-primary)',
              letterSpacing: '.08em',
              textTransform: 'uppercase',
            }}
          />
          <Button
            type="submit"
            variant="outline"
            disabled={!codeInput.trim()}
          >
            <span className="inline-flex items-center gap-1.5">
              <IconKey size={14} />
              <span>{t('enterRoom')}</span>
            </span>
          </Button>
        </div>
        {codeError && (
          <div className="text-caption mt-1" style={{ color: STATUS.danger }}>
            {codeError}
          </div>
        )}
        <div
          className="text-caption mt-1"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {t('haveCodeHint')}
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-6"><Loading /></div>
      ) : rooms.length === 0 ? (
        <div
          className="text-caption text-center py-6"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {t('noPublicRooms')}
        </div>
      ) : (
        <div className="space-y-2">
          {rooms.map((r) => (
            <Link key={r.id} href={`/arena/rooms/${r.inviteCode}`} className="block">
              <div
                className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors hover:opacity-90"
                style={{
                  background: 'var(--theme-bg-secondary)',
                  border: '1px solid var(--theme-border)',
                }}
              >
                {r.owner.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.owner.avatar}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-body text-white shrink-0"
                    style={{ background: GRADIENT.writing }}
                  >
                    {(r.owner.name ?? '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className="font-semibold truncate"
                    style={{ color: 'var(--theme-text-primary)' }}
                  >
                    {r.name ?? t('roomOf', { name: r.owner.name ?? t('playerFallback') })}
                  </div>
                  <div
                    className="text-caption"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    {ARENA_MODE_LABEL[r.mode]} · {r.level}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  {t('enter')}
                </Button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
