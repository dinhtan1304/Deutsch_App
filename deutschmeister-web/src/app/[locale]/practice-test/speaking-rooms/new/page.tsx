'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { ACCENT, GRADIENT } from '@/lib/tokens';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCreateSpeakingRoom, useSpeakingRoomStats } from '@/hooks/useSpeakingRooms';
import { SpeakingRoomStatsCard, SpeakingRoomsActivityBar } from '@/components/speaking-rooms/SpeakingRoomStatsPanel';
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
      const room = await createMut.mutateAsync({
        title: effectiveTitle,
        cefrLevel,
        topic,
        visibility,
      });
      router.push(`/practice-test/speaking-rooms/${room.id}`);
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, t('new.createError')));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <PageHeader
        backHref="/practice-test/speaking-rooms"
        title={t('new.title')}
        subtitle={t('new.subtitle')}
        accent="speaking"
      />

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          {t('new.step1')}
        </p>
        <div className="flex gap-2">
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setCefrLevel(lvl)}
              className="flex-1 py-3 rounded-2xl border-2 font-bold text-[15px] transition-all"
              style={
                cefrLevel === lvl
                  ? { borderColor: ACCENT.speaking, backgroundColor: `${ACCENT.speaking}1A`, color: ACCENT.speaking }
                  : { borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)', backgroundColor: 'transparent' }
              }
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          {t('new.step2')}
        </p>
        <div className="flex gap-2 flex-wrap mb-2">
          {suggestedTopics.map((label) => (
            <button
              key={label}
              onClick={() => setTopic(label)}
              className="px-3 py-1.5 rounded-full text-sm border"
              style={
                topic === label
                  ? { backgroundColor: ACCENT.speaking, borderColor: ACCENT.speaking, color: '#fff' }
                  : { borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }
              }
            >
              {label}
            </button>
          ))}
        </div>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={t('new.topicPlaceholder')}
          className="w-full px-3 py-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }}
        />
      </div>

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          {t('new.step3')}
        </p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={effectiveTitle}
          maxLength={80}
          className="w-full px-3 py-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }}
        />
      </div>

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          {t('new.step4')}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setVisibility('PUBLIC')}
            className="p-4 rounded-2xl border-2 text-left transition-all"
            style={
              visibility === 'PUBLIC'
                ? { borderColor: ACCENT.speaking, backgroundColor: `${ACCENT.speaking}1A` }
                : { borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }
            }
          >
            <div className="font-bold" style={{ color: visibility === 'PUBLIC' ? ACCENT.speaking : 'var(--theme-text-primary)' }}>
              {t('new.visPublic')}
            </div>
            <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
              {t('new.visPublicSub')}
            </div>
          </button>
          <button
            onClick={() => setVisibility('PRIVATE')}
            className="p-4 rounded-2xl border-2 text-left transition-all"
            style={
              visibility === 'PRIVATE'
                ? { borderColor: ACCENT.speaking, backgroundColor: `${ACCENT.speaking}1A` }
                : { borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }
            }
          >
            <div className="font-bold" style={{ color: visibility === 'PRIVATE' ? ACCENT.speaking : 'var(--theme-text-primary)' }}>
              {t('new.visPrivate')}
            </div>
            <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
              {t('new.visPrivateSub')}
            </div>
          </button>
        </div>
      </div>

      {errorMsg && (
        <p className="mb-4 text-sm" style={{ color: '#EF4444' }}>
          {errorMsg}
        </p>
      )}

      <button
        onClick={handleCreate}
        disabled={createMut.isPending}
        className="w-full py-3 rounded-2xl text-white font-bold text-[15px] disabled:opacity-60"
        style={{ background: GRADIENT.speaking }}
      >
        {createMut.isPending ? t('new.creating') : t('new.create')}
      </button>

      <SpeakingRoomsActivityBar stats={stats} />
      <SpeakingRoomStatsCard stats={stats} user={user} />
    </div>
  );
}
