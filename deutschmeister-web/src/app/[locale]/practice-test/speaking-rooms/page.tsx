'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FeedbackModal } from '@/components/layout/FeedbackModal';
import { useAuthStore } from '@/stores/authStore';
import {
  useSpeakingRoomsList,
  useSpeakingRoomQuota,
  useSpeakingRoomStats,
  useJoinSpeakingRoom,
  useJoinByCode,
  useMySpeakingRooms,
  useReopenSpeakingRoom,
} from '@/hooks/useSpeakingRooms';
import { QuotaBanner } from '@/components/speaking-rooms/QuotaBanner';
import { RoomCard } from '@/components/speaking-rooms/RoomCard';
import { parseSpeakingRoomInviteCode } from '@/lib/api/speakingRooms';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;

// Real topic ids → accent CSS var (mirror RoomCard).
const TOPIC_COLOR: Record<string, string> = {
  dailyLife: 'var(--cyan)', work: 'var(--streak)', travel: 'var(--success)',
  study: 'var(--der)', family: 'var(--die)', hobbies: 'var(--violet)',
  shopping: 'var(--warn)', health: 'var(--success)', food: 'var(--streak)',
};

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconUsers({ size = 22 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M7 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm0 1.5a4 4 0 0 0-4 4M14 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm0 1.5a4 4 0 0 1 4 4M11 14.5a4 4 0 0 0-4-4 4 4 0 0 0-4 4" /></svg>;
}
function IconMic({ size = 22 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M10 3a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm-5 7a5 5 0 0 0 10 0M10 15v3m-3 0h6" /></svg>;
}
function IconArrowRight({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
}
function IconPlus({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}

function fmtDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex min-w-24 flex-col gap-0.5 rounded-[10px] px-3.5 py-2" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
      <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.05em' }}>{label}</span>
      <span className="mono text-[16px] font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>{value}</span>
    </div>
  );
}

function Chip({ label, on, onClick, dotColor, mono }: { label: string; on: boolean; onClick: () => void; dotColor?: string; mono?: boolean }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-caption font-semibold transition-colors ${mono ? 'mono' : ''}`}
      style={on
        ? { background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)', border: '1px solid var(--accent)' }
        : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
      {dotColor && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor }} />}
      {label}
    </button>
  );
}

export default function SpeakingRoomsListPage() {
  const t = useTranslations('speakingRooms.list');
  const tc = useTranslations('speakingRooms.components');
  const tTopics = useTranslations('speakingRooms.topics');
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [level, setLevel] = useState<string | undefined>(undefined);
  const [topic, setTopic] = useState<string | undefined>(undefined);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const { data: rooms, isLoading } = useSpeakingRoomsList({ cefrLevel: level });
  const { data: myRooms } = useMySpeakingRooms(!!user);
  const { data: quota } = useSpeakingRoomQuota();
  const { data: stats } = useSpeakingRoomStats();
  const joinMut = useJoinSpeakingRoom();
  const joinByCodeMut = useJoinByCode();
  const reopenMut = useReopenSpeakingRoom();

  const handleJoin = async (id: string) => {
    try { const room = await joinMut.mutateAsync({ id }); router.push(`/practice-test/speaking-rooms/${room.id}`); } catch (e) { console.error(e); }
  };
  const handleReopen = async (id: string) => {
    try { const room = await reopenMut.mutateAsync({ id }); router.push(`/practice-test/speaking-rooms/${room.id}`); } catch (e) { console.error(e); }
  };
  const handleJoinByCode = async () => {
    setCodeError('');
    const inviteCode = parseSpeakingRoomInviteCode(code);
    if (!inviteCode) return;
    try { const room = await joinByCodeMut.mutateAsync({ code: inviteCode }); router.push(`/practice-test/speaking-rooms/${room.id}`); }
    catch { setCodeError(t('invalidCode')); }
  };

  const presentTopics = useMemo(() => {
    const set = new Set((rooms ?? []).map((r) => r.topic));
    return Object.keys(TOPIC_COLOR).filter((id) => set.has(id));
  }, [rooms]);
  const filteredRooms = useMemo(() => (topic ? (rooms ?? []).filter((r) => r.topic === topic) : (rooms ?? [])), [rooms, topic]);
  const topicLabel = (id: string) => { try { return tTopics(id as 'dailyLife'); } catch { return id; } };

  return (
    <div className="mx-auto max-w-360 px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--theme-text-muted)' }}>{t('eyebrow')}</span>
            <span className="v2-beta-badge rounded-[4px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide">BETA</span>
          </div>
          <h1 className="text-h1 font-extrabold leading-tight" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{t('title')}</h1>
          <p className="mt-1.5 max-w-xl text-body" style={{ color: 'var(--theme-text-muted)' }}>{t('subtitle')}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" onClick={() => setFeedbackOpen(true)} className="v2-btn-soft inline-flex items-center rounded-[8px] px-3 py-1.5 text-caption font-medium">{t('reportBug')}</button>
          <Link href="/community/rules" className="v2-btn-soft inline-flex items-center rounded-[8px] px-3 py-1.5 text-caption font-medium">{t('communityRules')}</Link>
        </div>
      </header>

      {/* Entry strip: Match / Create / Invite code */}
      <section className="mb-5 grid gap-3 lg:grid-cols-[1.4fr_1fr_1.2fr]">
        {/* Match — primary gradient */}
        <Link href="/practice-test/speaking-rooms/match" className="v2-match-grad relative flex items-center gap-3.5 overflow-hidden rounded-[14px] p-5 text-white transition-transform hover:-translate-y-0.5"
          style={{ boxShadow: '0 8px 24px color-mix(in srgb, var(--accent) 32%, transparent)' }}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,.18)' }}><IconUsers size={24} /></div>
          <div className="min-w-0 flex-1">
            <div className="text-body font-bold">{t('matchTitle')}</div>
            <div className="text-caption" style={{ color: 'rgba(255,255,255,.85)' }}>{t('matchDesc')}</div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 text-[10.5px] font-bold" style={{ background: 'rgba(74,222,128,.25)', color: 'color-mix(in srgb, var(--success) 55%, white)' }}>
              <span className="v2-pulse h-1.5 w-1.5 rounded-full" style={{ background: 'var(--success)' }} />{t('onlineUnit', { count: stats?.onlineCount ?? 0 })}
            </span>
            <IconArrowRight size={18} />
          </div>
        </Link>

        {/* Create */}
        <Link href="/practice-test/speaking-rooms/new" className="word-card-v2 flex items-center gap-3.5 rounded-[14px] p-5" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', ['--card-accent' as string]: 'var(--warn)' } as React.CSSProperties}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: 'color-mix(in srgb, var(--warn) 16%, transparent)', color: 'var(--warn)' }}><IconMic size={24} /></div>
          <div className="min-w-0 flex-1">
            <div className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('createRoom').replace(/^\+\s*/, '')}</div>
            <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t('createDesc')}</div>
          </div>
          <IconPlus size={18} />
        </Link>

        {/* Invite code */}
        <div className="flex flex-col gap-2 rounded-[14px] p-4" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <div className="text-[11px] font-semibold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.05em' }}>{t('joinByCodeLabel')}</div>
          <div className="flex gap-1.5">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('codePlaceholder')}
              className="h-9 min-w-0 flex-1 rounded-[8px] px-3 text-caption outline-none"
              style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }} />
            <button onClick={handleJoinByCode} disabled={!code.trim() || joinByCodeMut.isPending}
              className="h-9 shrink-0 rounded-[8px] px-3.5 text-caption font-bold disabled:opacity-50"
              style={code.trim() ? { background: 'var(--accent)', color: 'var(--accent-on)' } : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
              {t('joinRoom')}
            </button>
          </div>
          {codeError && <p className="text-[11px]" style={{ color: 'var(--danger)' }}>{codeError}</p>}
        </div>
      </section>

      {/* Live status bar */}
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] px-4 py-2.5" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        <span className="inline-flex items-center gap-1.5 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
          <span className="v2-pulse h-1.5 w-1.5 rounded-full" style={{ background: 'var(--success)' }} />
          <span className="mono font-bold" style={{ color: 'var(--theme-text-primary)' }}>{stats?.activeRooms ?? 0}</span> {tc('chatting')}
        </span>
        <span className="h-3 w-px" style={{ background: 'var(--theme-border)' }} />
        <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
          <span className="mono font-bold" style={{ color: 'var(--theme-text-primary)' }}>{stats?.waitingRooms ?? 0}</span> {tc('waitingRooms')}
        </span>
        <div className="flex-1" />
        <div className="flex flex-wrap gap-2">
          <MiniStat label={tc('statSessions')} value={stats?.my.sessions ?? 0} />
          <MiniStat label={tc('statRoomTime')} value={fmtDuration(stats?.my.roomSeconds ?? 0)} />
          <MiniStat label={tc('statMessages')} value={stats?.my.messages ?? 0} />
        </div>
      </div>

      <QuotaBanner quota={quota} />

      {/* Filters */}
      <div className="mb-5 mt-4 flex flex-col gap-3 rounded-xl p-3" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.05em' }}>{t('filterByLevel')}</span>
          <div className="flex flex-wrap gap-1.5">
            <Chip label={t('filterAll')} on={!level} onClick={() => setLevel(undefined)} />
            {CEFR_LEVELS.map((lvl) => <Chip key={lvl} label={lvl} mono on={level === lvl} onClick={() => setLevel(lvl)} />)}
          </div>
        </div>
        {presentTopics.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.05em' }}>{t('filterByTopic')}</span>
            <div className="flex flex-wrap gap-1.5">
              <Chip label={t('filterAll')} on={!topic} onClick={() => setTopic(undefined)} />
              {presentTopics.map((id) => <Chip key={id} label={topicLabel(id)} on={topic === id} onClick={() => setTopic(id)} dotColor={TOPIC_COLOR[id]} />)}
            </div>
          </div>
        )}
      </div>

      {/* My rooms */}
      {myRooms && myRooms.length > 0 && (
        <section className="mb-6">
          <div className="mb-2.5 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--warn)' }} />
            <h2 className="text-[12px] font-semibold uppercase" style={{ color: 'var(--theme-text-secondary)', letterSpacing: '.06em' }}>{t('myRooms')}</h2>
            <span className="mono text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{myRooms.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myRooms.map((room) => (
              <RoomCard key={room.id} room={room} variant="mine"
                onJoin={room.status === 'CLOSED' ? undefined : () => handleJoin(room.id)}
                onReopen={room.status === 'CLOSED' ? () => handleReopen(room.id) : undefined}
                loading={joinMut.isPending || reopenMut.isPending} />
            ))}
          </div>
        </section>
      )}

      {/* Open rooms */}
      <section>
        <div className="mb-2.5 flex items-center gap-2">
          <span className="v2-pulse h-1.5 w-1.5 rounded-full" style={{ background: 'var(--success)' }} />
          <h2 className="text-[12px] font-semibold uppercase" style={{ color: 'var(--theme-text-secondary)', letterSpacing: '.06em' }}>{t('publicRooms')}</h2>
          <span className="mono text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{filteredRooms.length}</span>
        </div>
        {isLoading ? (
          <p className="py-10 text-center text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t('loading')}</p>
        ) : filteredRooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-16 text-center" style={{ borderColor: 'var(--theme-border)' }}>
            <div className="mb-3 text-[32px]">🎙</div>
            <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t('empty')}</p>
            <Link href="/practice-test/speaking-rooms/new" className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-caption font-bold text-white" style={{ background: 'var(--accent)' }}>
              {t('createRoom')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => <RoomCard key={room.id} room={room} onJoin={() => handleJoin(room.id)} loading={joinMut.isPending} />)}
          </div>
        )}
      </section>

      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}
