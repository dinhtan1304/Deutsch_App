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
import { RoomCard, topicColor } from '@/components/speaking-rooms/RoomCard';
import { parseSpeakingRoomInviteCode } from '@/lib/api/speakingRooms';
import { ACCENT, GRADIENT } from '@/lib/tokens';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconUsers({ size = 22 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M7 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm0 1.5a4 4 0 0 0-4 4M14 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm0 1.5a4 4 0 0 1 4 4M11 14.5a4 4 0 0 0-4-4 4 4 0 0 0-4 4" /></svg>;
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

  const presentTopics = useMemo(() => Array.from(new Set((rooms ?? []).map((r) => r.topic).filter(Boolean))), [rooms]);
  const filteredRooms = useMemo(() => (topic ? (rooms ?? []).filter((r) => r.topic === topic) : (rooms ?? [])), [rooms, topic]);

  return (
    <div className="mx-auto max-w-360 px-4 py-6 sm:px-6">
      {/* Hero: who's talking now + the three ways in */}
      <section className="relative mb-5 overflow-hidden rounded-3xl border p-5 sm:p-7"
        style={{ borderColor: 'var(--theme-border)', background: `radial-gradient(110% 120% at 0% 0%, color-mix(in srgb, ${ACCENT.speaking} 14%, var(--theme-bg-card)), var(--theme-bg-card) 60%)` }}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--theme-text-muted)' }}>{t('eyebrow')}</span>
              <span className="v2-beta-badge rounded-[4px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide">BETA</span>
            </div>
            <h1 className="text-h1 font-extrabold leading-tight" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{t('title')}</h1>
            <p className="mt-1.5 max-w-xl text-body" style={{ color: 'var(--theme-text-muted)' }}>{t('subtitle')}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <LiveCount color="var(--success)" pulse value={stats?.onlineCount ?? 0} label={t('onlineLabel')} />
              <LiveCount color={ACCENT.speaking} value={stats?.activeRooms ?? 0} label={tc('chatting')} />
              <LiveCount color="var(--warn)" value={stats?.waitingRooms ?? 0} label={tc('waitingRooms')} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
              <span>{tc('statSessions')}: <b className="mono" style={{ color: 'var(--theme-text-primary)' }}>{stats?.my.sessions ?? 0}</b></span>
              <span>{tc('statRoomTime')}: <b className="mono" style={{ color: 'var(--theme-text-primary)' }}>{fmtDuration(stats?.my.roomSeconds ?? 0)}</b></span>
              <span>{tc('statMessages')}: <b className="mono" style={{ color: 'var(--theme-text-primary)' }}>{stats?.my.messages ?? 0}</b></span>
              <span className="flex-1" />
              <button type="button" onClick={() => setFeedbackOpen(true)} className="underline-offset-2 hover:underline">{t('reportBug')}</button>
              <Link href="/community/rules" className="underline-offset-2 hover:underline">{t('communityRules')}</Link>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/practice-test/speaking-rooms/match"
              className="group relative flex items-center gap-4 overflow-hidden rounded-2xl p-5 text-white transition-transform hover:-translate-y-0.5"
              style={{ background: GRADIENT.speaking, boxShadow: `0 12px 30px color-mix(in srgb, ${ACCENT.speaking} 35%, transparent)` }}>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={{ background: 'rgba(255,255,255,.2)' }}><IconUsers size={28} /></div>
              <div className="min-w-0 flex-1">
                <div className="text-lead font-extrabold">{t('matchTitle')}</div>
                <div className="text-caption" style={{ color: 'rgba(255,255,255,.88)' }}>{t('matchDesc')}</div>
              </div>
              <span className="transition-transform group-hover:translate-x-1"><IconArrowRight size={22} /></span>
            </Link>

            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
              <Link href="/practice-test/speaking-rooms/new"
                className="flex items-center gap-2 rounded-xl border px-4 text-caption font-bold transition-colors hover:bg-(--theme-bg-secondary)"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)', background: 'var(--theme-bg-card)' }}
                title={t('createDesc')}>
                <IconPlus size={16} />{t('createRoom').replace(/^\+\s*/, '')}
              </Link>
              <div className="flex gap-1.5">
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('codePlaceholder')}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleJoinByCode(); }}
                  aria-label={t('joinByCodeLabel')}
                  className="h-11 min-w-0 flex-1 rounded-xl px-3 text-caption outline-none"
                  style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }} />
                <button onClick={handleJoinByCode} disabled={!code.trim() || joinByCodeMut.isPending}
                  className="h-11 shrink-0 rounded-xl px-4 text-caption font-bold disabled:opacity-50"
                  style={code.trim() ? { background: ACCENT.speaking, color: 'white' } : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
                  {t('joinRoom')}
                </button>
              </div>
            </div>
            {codeError && <p className="text-[11px]" style={{ color: 'var(--danger)' }}>{codeError}</p>}
          </div>
        </div>
      </section>

      <QuotaBanner quota={quota} />

      {/* Filters: level segmented + topic chips */}
      <div className="mb-5 mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex shrink-0 gap-1 rounded-xl p-1" role="tablist" aria-label={t('filterByLevel')}
          style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
          {[undefined, ...CEFR_LEVELS].map((lvl) => {
            const on = level === lvl;
            return (
              <button key={lvl ?? 'all'} type="button" role="tab" aria-selected={on} onClick={() => setLevel(lvl)}
                className={`rounded-lg px-3 py-1.5 text-caption font-bold transition-colors ${lvl ? 'mono' : ''}`}
                style={on ? { background: 'var(--theme-bg-card)', color: ACCENT.speaking, boxShadow: '0 1px 3px rgba(0,0,0,.12)' } : { color: 'var(--theme-text-muted)' }}>
                {lvl ?? t('filterAll')}
              </button>
            );
          })}
        </div>
        {presentTopics.length > 0 && (
          <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <Chip label={t('filterAll')} on={!topic} onClick={() => setTopic(undefined)} />
            {presentTopics.map((tp) => <Chip key={tp} label={tp} on={topic === tp} onClick={() => setTopic(tp)} dotColor={topicColor(tp)} />)}
          </div>
        )}
      </div>

      {/* My rooms */}
      {myRooms && myRooms.length > 0 && (
        <section className="mb-6">
          <SectionHead dot="var(--warn)" title={t('myRooms')} count={myRooms.length} />
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
        <SectionHead dot="var(--success)" pulse title={t('publicRooms')} count={filteredRooms.length} />
        {isLoading ? (
          <p className="py-10 text-center text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t('loading')}</p>
        ) : filteredRooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-16 text-center" style={{ borderColor: 'var(--theme-border)' }}>
            <div className="mb-3 text-[32px]">🎙</div>
            <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t('empty')}</p>
            <div className="mt-4 flex justify-center gap-2">
              <Link href="/practice-test/speaking-rooms/match" className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-caption font-bold text-white" style={{ background: GRADIENT.speaking }}>
                {t('findPartner')}
              </Link>
              <Link href="/practice-test/speaking-rooms/new" className="inline-flex items-center gap-1.5 rounded-xl border px-5 py-2.5 text-caption font-bold" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}>
                {t('createRoom')}
              </Link>
            </div>
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

function LiveCount({ value, label, color, pulse }: { value: number; label: string; color: string; pulse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-caption"
      style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)', color: 'var(--theme-text-muted)' }}>
      <span className={`h-2 w-2 rounded-full ${pulse ? 'v2-pulse' : ''}`} style={{ background: color }} />
      <b className="mono text-body" style={{ color: 'var(--theme-text-primary)' }}>{value}</b>{label}
    </span>
  );
}

function SectionHead({ dot, pulse, title, count }: { dot: string; pulse?: boolean; title: string; count: number }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${pulse ? 'v2-pulse' : ''}`} style={{ background: dot }} />
      <h2 className="text-[12px] font-semibold uppercase" style={{ color: 'var(--theme-text-secondary)', letterSpacing: '.06em' }}>{title}</h2>
      <span className="mono text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{count}</span>
    </div>
  );
}
