'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { arenaApi } from '@/lib/api/arena';
import type { ArenaRoomSummary } from '@/types/arena-events.types';
import { Button, Loading } from '@/components/ui';
import { GRADIENT } from '@/lib/tokens';
import { ARENA_MODE_LABEL } from '@/lib/arena/labels';
import { parseArenaInviteCode } from '@/lib/arena/invite-code';
import { IconLogIn, IconPlus } from '@/components/ui/Icons';

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
      {/* Private-room bar (design) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]" style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)', color: 'var(--accent)' }}>
            <svg width={18} height={18} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M7 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm0 1.5a4 4 0 0 0-4 4M14 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm0 1.5a4 4 0 0 1 4 4M11 14.5a4 4 0 0 0-4-4 4 4 0 0 0-4 4" /></svg>
          </div>
          <div className="min-w-0">
            <div className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('playFriends')}</div>
            <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t('playFriendsSub')}</div>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setCodeError(null);
            const code = parseArenaInviteCode(codeInput);
            if (!code) { setCodeError(t('invalidCode')); return; }
            router.push(`/arena/rooms/${code}`);
          }}
          className="flex min-w-0 flex-1 gap-2 sm:max-w-lg"
        >
          <input
            type="text"
            value={codeInput}
            onChange={(e) => { setCodeInput(e.target.value); if (codeError) setCodeError(null); }}
            placeholder={t('codePlaceholder')}
            maxLength={200}
            autoComplete="off"
            className="mono min-w-0 flex-1 rounded-[8px] px-3 text-caption uppercase outline-none"
            style={{ height: 38, background: 'var(--theme-bg-secondary)', border: `1px solid ${codeError ? 'var(--danger)' : 'var(--theme-border)'}`, color: 'var(--theme-text-primary)', letterSpacing: '.08em' }}
          />
          <button type="submit" disabled={!codeInput.trim()} className="shrink-0 rounded-[8px] px-4 text-caption font-bold disabled:opacity-50"
            style={codeInput.trim() ? { background: 'var(--accent)', color: 'var(--accent-on)' } : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
            {t('enterRoom')}
          </button>
          <Link href="/arena/rooms/new" className="inline-flex shrink-0 items-center gap-1.5 rounded-[8px] px-3.5 text-caption font-bold transition-colors" style={{ border: '1px solid color-mix(in srgb, var(--accent) 55%, transparent)', color: 'var(--accent)' }}>
            <IconPlus size={13} /> {t('createRoom')}
          </Link>
        </form>
      </div>
      {codeError && <p className="mt-2 text-caption" style={{ color: 'var(--danger)' }}>{codeError}</p>}

      {/* Open rooms list */}
      <h3 className="mt-4 mb-2 flex items-center gap-2 text-caption font-semibold uppercase tracking-widest" style={{ color: 'var(--theme-text-secondary)' }}>
        <IconLogIn size={14} /> {t('openRooms')}
      </h3>

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
