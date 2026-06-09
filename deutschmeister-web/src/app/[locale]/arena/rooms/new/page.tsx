'use client';

import { ComponentType, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { arenaApi } from '@/lib/api/arena';
import type {
  ArenaMode,
  ArenaRoomVisibility,
  CefrLevel,
} from '@/types/arena-events.types';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAllLevelsUnlocked } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { Card, Button, BetaBadge } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import {
  IconGlobe,
  IconLink,
  IconLock,
  IconZap,
  IconCheck,
  IconLogIn,
} from '@/components/ui/Icons';

const MODES: { key: ArenaMode; labelKey: 'viToDe' | 'deToVi' | 'mixed'; subKey: 'modeMixedSub' | 'modeViToDeSub' | 'modeDeToViSub' }[] = [
  { key: 'mixed', labelKey: 'mixed', subKey: 'modeMixedSub' },
  { key: 'vi_to_de', labelKey: 'viToDe', subKey: 'modeViToDeSub' },
  { key: 'de_to_vi', labelKey: 'deToVi', subKey: 'modeDeToViSub' },
];

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

type VisibilityIcon = ComponentType<{ size?: number; className?: string }>;
const VISIBILITIES: {
  key: ArenaRoomVisibility;
  labelKey: 'visPublic' | 'visLink' | 'visPassword';
  subKey: 'visPublicSub' | 'visLinkSub' | 'visPasswordSub';
  Icon: VisibilityIcon;
}[] = [
  { key: 'public', labelKey: 'visPublic', subKey: 'visPublicSub', Icon: IconGlobe },
  { key: 'link', labelKey: 'visLink', subKey: 'visLinkSub', Icon: IconLink },
  { key: 'password', labelKey: 'visPassword', subKey: 'visPasswordSub', Icon: IconLock },
];

export default function CreateArenaRoomPage() {
  const t = useTranslations('arena');
  const router = useRouter();
  const preferredLevel = useSettingsStore((s) => s.settings.preferredLevel);
  const allLevelsUnlocked = useAllLevelsUnlocked();
  // 'all' is a learning-filter option, not a CEFR target — fall back to B1.
  // Free/guest can only host A1 rooms, so force A1 as the default for them.
  const defaultLevel: CefrLevel = !allLevelsUnlocked
    ? 'A1'
    : preferredLevel === 'all' ? 'B1' : preferredLevel;
  const [mode, setMode] = useState<ArenaMode>('mixed');
  const [level, setLevel] = useState<CefrLevel>(defaultLevel);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [visibility, setVisibility] = useState<ArenaRoomVisibility>('public');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    !submitting && (visibility !== 'password' || password.trim().length >= 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await arenaApi.createRoom({
        mode,
        level,
        visibility,
        password: visibility === 'password' ? password : undefined,
        name: name.trim() || undefined,
      });
      router.push(`/arena/rooms/${res.inviteCode}`);
    } catch (err) {
      const e = err as { body?: { code?: string }; code?: string; message?: string };
      const code = e?.body?.code ?? e?.code;
      if (code === 'ALREADY_QUEUED') {
        setError(t('roomNew.errAlreadyQueued'));
      } else if (code === 'ALREADY_OWNS_ROOM') {
        setError(t('roomNew.errAlreadyOwns'));
      } else if (code === 'LEVEL_LOCKED') {
        setUpgradeOpen(true);
        setSubmitting(false);
        return;
      } else {
        setError(e?.message ?? t('roomNew.errCreateFailed'));
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {t('roomNew.title')}
          </h1>
          <BetaBadge size="md" />
        </div>
        <Link href="/arena">
          <Button variant="outline">{t('backToLobby')}</Button>
        </Link>
      </div>

      <div
        className="rounded-xl px-4 py-3 mb-4 text-caption flex items-start gap-2"
        style={{
          background: 'rgba(245,158,11,.1)',
          border: '1px solid rgba(245,158,11,.3)',
          color: ACCENT.xp,
        }}
      >
        <IconZap size={16} className="shrink-0 mt-0.5" />
        <span>
          {t.rich('roomNew.friendlyNote', { b: (chunks) => <strong>{chunks}</strong> })}
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Mode */}
        <Section title={t('roomNew.sectionMode')}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {MODES.map((m) => {
              const sel = mode === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMode(m.key)}
                  className="text-left rounded-xl p-3"
                  style={{
                    background: sel ? GRADIENT.vocab : 'var(--theme-bg-card)',
                    color: sel ? '#fff' : 'var(--theme-text-primary)',
                    border: `1px solid ${sel ? 'transparent' : 'var(--theme-border)'}`,
                  }}
                >
                  <div className="font-semibold">{t(`modes.${m.labelKey}` as 'modes.mixed')}</div>
                  <div
                    className="text-caption mt-0.5"
                    style={{ color: sel ? 'rgba(255,255,255,.8)' : 'var(--theme-text-muted)' }}
                  >
                    {t(`roomNew.${m.subKey}` as 'roomNew.modeMixedSub')}
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Level */}
        <Section title={t('roomNew.sectionLevel')}>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((lv) => {
              const sel = level === lv;
              const locked = !allLevelsUnlocked && lv !== 'A1';
              return (
                <button
                  key={lv}
                  type="button"
                  onClick={() => (locked ? setUpgradeOpen(true) : setLevel(lv))}
                  className="px-4 py-2 rounded-lg font-bold text-body inline-flex items-center gap-1.5"
                  style={{
                    background: sel ? GRADIENT.vocab : 'var(--theme-bg-card)',
                    color: sel ? '#fff' : 'var(--theme-text-secondary)',
                    border: `1px solid ${sel ? 'transparent' : 'var(--theme-border)'}`,
                    opacity: locked ? 0.6 : 1,
                  }}
                >
                  {lv}
                  {locked && <IconLock size={11} />}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Visibility */}
        <Section title={t('roomNew.sectionVisibility')}>
          <div className="space-y-2">
            {VISIBILITIES.map((v) => {
              const sel = visibility === v.key;
              const Icon = v.Icon;
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setVisibility(v.key)}
                  className="w-full text-left rounded-xl p-3 flex items-center gap-3"
                  style={{
                    background: sel ? 'rgba(139,92,246,.12)' : 'var(--theme-bg-card)',
                    border: `1px solid ${sel ? 'rgba(139,92,246,.45)' : 'var(--theme-border)'}`,
                  }}
                >
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: sel ? 'rgba(139,92,246,.18)' : 'var(--theme-bg-secondary)',
                      color: sel ? ACCENT.vocab : 'var(--theme-text-secondary)',
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <div
                      className="font-semibold"
                      style={{ color: sel ? ACCENT.vocab : 'var(--theme-text-primary)' }}
                    >
                      {t(`roomNew.${v.labelKey}` as 'roomNew.visPublic')}
                    </div>
                    <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                      {t(`roomNew.${v.subKey}` as 'roomNew.visPublicSub')}
                    </div>
                  </div>
                  {sel && (
                    <span
                      aria-hidden="true"
                      style={{ color: ACCENT.vocab, display: 'inline-flex' }}
                    >
                      <IconCheck size={18} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {visibility === 'password' && (
            <div className="mt-3">
              <label
                className="text-caption font-semibold mb-1 block"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                {t('roomNew.passwordLabel')}
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('roomNew.passwordPlaceholder')}
                maxLength={32}
                className="w-full px-3 py-2 rounded-lg"
                style={{
                  background: 'var(--theme-bg-card)',
                  border: '1px solid var(--theme-border)',
                  color: 'var(--theme-text-primary)',
                }}
              />
              <div className="text-caption mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                {t('roomNew.passwordHint')}
              </div>
            </div>
          )}
        </Section>

        {/* Optional name */}
        <Section title={t('roomNew.sectionName')}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('roomNew.namePlaceholder')}
            maxLength={60}
            className="w-full px-3 py-2 rounded-lg"
            style={{
              background: 'var(--theme-bg-card)',
              border: '1px solid var(--theme-border)',
              color: 'var(--theme-text-primary)',
            }}
          />
        </Section>

        {error && (
          <div
            className="rounded-xl px-3 py-2 mb-3 text-body"
            style={{
              background: 'rgba(239,68,68,.1)',
              border: '1px solid rgba(239,68,68,.35)',
              color: STATUS.danger,
            }}
          >
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canSubmit}
          isLoading={submitting}
          style={{ background: GRADIENT.vocab }}
        >
          <span className="inline-flex items-center gap-2">
            <IconLogIn size={18} />
            <span>{t('roomNew.create')}</span>
          </span>
        </Button>
      </form>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} defaultPeriod="yearly" featureContext="arena" />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="mb-3">
      <div
        className="text-caption font-bold uppercase tracking-wider mb-2"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        {title}
      </div>
      {children}
    </Card>
  );
}
