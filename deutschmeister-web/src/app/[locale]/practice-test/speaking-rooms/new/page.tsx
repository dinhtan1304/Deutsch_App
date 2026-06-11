'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { FilterChip } from '@/components/ui/FilterChip';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCreateSpeakingRoom, useSpeakingRoomStats } from '@/hooks/useSpeakingRooms';
import { SpeakingRoomStatsCard, SpeakingRoomsActivityBar } from '@/components/speaking-rooms/SpeakingRoomStatsPanel';
import { SetupSection } from '../../_components/createSetup';
import { getApiErrorMessage } from '@/lib/api/client';

const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;
type SpeakingRoomLevel = (typeof LEVELS)[number];

/**
 * Map the user's preferred CEFR level to one of the supported speaking-room
 * levels. C1/C2 clamp to B2 (highest supported); 'all' / unknown → B1.
 */
function resolveDefaultLevel(preferred: string): SpeakingRoomLevel {
  if ((LEVELS as readonly string[]).includes(preferred)) return preferred as SpeakingRoomLevel;
  if (preferred === 'C1' || preferred === 'C2') return 'B2';
  return 'B1';
}
const TOPIC_KEYS = [
  'travel', 'family', 'work', 'hobbies', 'shopping',
  'health', 'food', 'study', 'dailyLife',
] as const;

// Shared input styling (calm v2).
const inputStyle: React.CSSProperties = {
  backgroundColor: 'var(--theme-bg-card)',
  borderColor: 'var(--theme-border)',
  color: 'var(--theme-text-primary)',
};

export default function NewSpeakingRoomPage() {
  const t = useTranslations('speakingRooms');
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const preferredLevel = useSettingsStore((s) => s.settings.preferredLevel);
  const suggestedTopics = TOPIC_KEYS.map((k) => t(`topics.${k}` as 'topics.travel'));
  const [cefrLevel, setCefrLevel] = useState<string>(() => resolveDefaultLevel(preferredLevel));
  const [topic, setTopic] = useState<string>(() => t('topics.travel'));
  const [title, setTitle] = useState<string>('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [errorMsg, setErrorMsg] = useState('');

  const createMut = useCreateSpeakingRoom();
  const { data: stats } = useSpeakingRoomStats();

  const effectiveTitle = title.trim() || `${topic} (${cefrLevel})`;

  const handleCreate = async () => {
    setErrorMsg('');
    try {
      const room = await createMut.mutateAsync({ title: effectiveTitle, cefrLevel, topic, visibility });
      router.push(`/practice-test/speaking-rooms/${room.id}`);
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, t('new.createError')));
    }
  };

  return (
    <div className="max-w-360 mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        backHref="/practice-test/speaking-rooms"
        title={t('new.title')}
        subtitle={t('new.subtitle')}
      />

      <div className="space-y-6">
        {/* Step 1 — level */}
        <SetupSection n={1} label={t('new.step1')}>
          <div className="flex gap-2">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setCefrLevel(lvl)}
                className="mono flex-1 py-3 rounded-[11px] border font-bold text-[15px] transition-all"
                style={cefrLevel === lvl
                  ? { background: 'color-mix(in srgb, var(--accent) 14%, transparent)', borderColor: 'var(--accent)', color: 'var(--accent)' }
                  : { borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)', background: 'transparent' }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </SetupSection>

        {/* Step 2 — topic */}
        <SetupSection n={2} label={t('new.step2')}>
          <div className="flex gap-1.5 flex-wrap mb-2.5">
            {suggestedTopics.map((label) => (
              <FilterChip key={label} active={topic === label} size="sm" onClick={() => setTopic(label)}>
                {label}
              </FilterChip>
            ))}
          </div>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('new.topicPlaceholder')}
            className="w-full px-3.5 py-2.5 rounded-[11px] border text-body outline-none"
            style={inputStyle}
          />
        </SetupSection>

        {/* Step 3 — title */}
        <SetupSection n={3} label={t('new.step3')}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={effectiveTitle}
            maxLength={80}
            className="w-full px-3.5 py-2.5 rounded-[11px] border text-body outline-none"
            style={inputStyle}
          />
        </SetupSection>

        {/* Step 4 — visibility */}
        <SetupSection n={4} label={t('new.step4')}>
          <div className="grid grid-cols-2 gap-3">
            {([
              { v: 'PUBLIC' as const, title: t('new.visPublic'), sub: t('new.visPublicSub') },
              { v: 'PRIVATE' as const, title: t('new.visPrivate'), sub: t('new.visPrivateSub') },
            ]).map(({ v, title: vt, sub }) => {
              const on = visibility === v;
              return (
                <button
                  key={v}
                  onClick={() => setVisibility(v)}
                  className="p-4 rounded-[14px] border-[1.5px] text-left transition-all"
                  style={on
                    ? { borderColor: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }
                    : { borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}
                >
                  <div className="font-bold" style={{ color: on ? 'var(--accent)' : 'var(--theme-text-primary)' }}>{vt}</div>
                  <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{sub}</div>
                </button>
              );
            })}
          </div>
        </SetupSection>
      </div>

      {errorMsg && (
        <p className="mt-5 text-sm" style={{ color: 'var(--danger)' }}>{errorMsg}</p>
      )}

      <button
        onClick={handleCreate}
        disabled={createMut.isPending}
        className="mt-6 w-full py-3 rounded-md font-bold text-[15px] transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
        style={{ background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 4px 14px color-mix(in srgb, var(--accent) 35%, transparent)' }}
      >
        {createMut.isPending ? t('new.creating') : t('new.create')}
      </button>

      <SpeakingRoomsActivityBar stats={stats} />
      <SpeakingRoomStatsCard stats={stats} user={user} />
    </div>
  );
}
