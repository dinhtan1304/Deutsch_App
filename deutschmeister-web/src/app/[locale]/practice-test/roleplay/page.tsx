'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  useRoleplayScenarios,
  useStartRoleplay,
  useRoleplayHistory,
  useDeleteRoleplay,
} from '@/hooks/useRoleplay';
import { useCheckQuota } from '@/hooks/useSubscription';
import { ScenarioCard } from '@/components/roleplay/ScenarioCard';
import { PracticePageShell, GridSkeleton } from '@/components/ui';
import { FilterChip } from '@/components/ui/FilterChip';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import type { RoleplayLevel, RoleplayScenario } from '@/lib/api/roleplay';

// ─── Local Icons ─────────────────────────────────────────────────────────────
function IconTrash({ size = 15, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>;
}

const LEVELS: (RoleplayLevel | 'all')[] = ['all', 'A1', 'A2', 'B1'];

export default function RoleplayPage() {
  const router = useRouter();
  const t = useTranslations('practice.roleplay.list');
  const formatter = useFormatter();
  const formatDate = (dateStr: string) =>
    formatter.dateTime(new Date(dateStr), { dateStyle: 'short', timeStyle: 'short' });
  const { data: quota } = useCheckQuota('roleplay');
  const quotaExhausted = quota && !quota.allowed;
  const [levelFilter, setLevelFilter] = useState<RoleplayLevel | 'all'>('all');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: scenarios, isLoading } = useRoleplayScenarios();
  const { data: history } = useRoleplayHistory({ page: 1, limit: 10 });
  const startMut = useStartRoleplay();
  const deleteMut = useDeleteRoleplay();

  const filtered = useMemo(() => {
    if (!scenarios) return [];
    if (levelFilter === 'all') return scenarios;
    return scenarios.filter((s) => s.level === levelFilter);
  }, [scenarios, levelFilter]);

  const handleStart = async (scenario: RoleplayScenario) => {
    if (quotaExhausted) { setUpgradeOpen(true); return; }
    try {
      const session = await startMut.mutateAsync({ scenario: scenario.code, level: scenario.level });
      router.push(`/practice-test/roleplay/${session.id}`);
    } catch { /* handled */ }
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try { await deleteMut.mutateAsync({ sessionId: confirmDeleteId }); } catch { /* handled */ }
    setConfirmDeleteId(null);
  };

  return (
    <PracticePageShell
      backHref="/practice-test"
      title={t('title')}
      subtitle={t('subtitle')}
      accent="writing"
      className="pb-16"
      right={
        quota && (
          <span className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide"
            style={{
              background: `color-mix(in srgb, ${quotaExhausted ? 'var(--danger)' : 'var(--success)'} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${quotaExhausted ? 'var(--danger)' : 'var(--success)'} 30%, transparent)`,
              color: quotaExhausted ? 'var(--danger)' : 'var(--success)',
            }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'currentColor' }} />
            {t('quotaLabel', { used: quota.used, limit: quota.limit })}
          </span>
        )
      }
    >
      {/* Level filter */}
      <div className="mb-6 flex flex-wrap items-center gap-1.5">
        {LEVELS.map((lv) => (
          <FilterChip key={lv} active={levelFilter === lv} size="sm" onClick={() => setLevelFilter(lv)}>
            <span className={lv === 'all' ? '' : 'mono'}>{lv === 'all' ? t('allLevels') : lv}</span>
          </FilterChip>
        ))}
      </div>

      {/* Scenarios grid */}
      <section className="mb-10">
        <h2 className="mb-3 text-caption font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{t('scenariosTitle')}</h2>
        {isLoading ? (
          <GridSkeleton cols={3} count={6} height="h-36" gap="gap-4" />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((sc) => (
              <ScenarioCard key={sc.code} scenario={sc} locked={!!quotaExhausted} onClick={() => handleStart(sc)} />
            ))}
          </div>
        )}
      </section>

      {/* Delete confirm */}
      {confirmDeleteId && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"
          style={{ border: '1px solid color-mix(in srgb, var(--danger) 40%, transparent)', background: 'color-mix(in srgb, var(--danger) 6%, transparent)' }}>
          <div>
            <h4 className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('confirmDeleteTitle')}</h4>
            <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t('confirmDeleteSubtitle')}</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => setConfirmDeleteId(null)} className="rounded-[10px] px-4 py-2 text-caption font-bold" style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)' }}>{t('cancel')}</button>
            <button onClick={confirmDelete} className="rounded-[10px] px-4 py-2 text-caption font-bold text-white" style={{ background: 'var(--danger)' }}>{t('deletePermanently')}</button>
          </div>
        </div>
      )}

      {/* History */}
      {history && history.data.length > 0 && (
        <section>
          <h2 className="mb-3 text-caption font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{t('historyTitle')}</h2>
          <div className="grid grid-cols-1 gap-3">
            {history.data.map((h) => {
              const done = h.status === 'completed';
              const sColor = done ? 'var(--success)' : 'var(--accent)';
              return (
                <div key={h.id}
                  className="word-card-v2 flex items-center gap-4 rounded-[13px] p-4"
                  style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', ['--card-accent' as string]: 'var(--accent)' } as React.CSSProperties}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-2xl" style={{ background: 'var(--theme-bg-tertiary)' }}>
                    {h.scenarioInfo?.icon ?? '💬'}
                  </div>
                  <button onClick={() => router.push(`/practice-test/roleplay/${h.id}`)} className="min-w-0 flex-1 text-left">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span className="mono rounded-[5px] px-1.5 py-0.5 text-[10px] font-bold" style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>{h.level}</span>
                      <span className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: `color-mix(in srgb, ${sColor} 16%, transparent)`, color: sColor, letterSpacing: '.04em' }}>
                        <span className="h-1 w-1 rounded-full" style={{ background: sColor }} />{done ? t('statusCompleted') : t('statusActive')}
                      </span>
                    </div>
                    <h3 className="truncate text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{h.scenarioInfo?.titleDe ?? h.scenario}</h3>
                    <div className="mono mt-0.5 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{formatDate(h.updatedAt)}</div>
                  </button>
                  <div className="flex shrink-0 items-center gap-2">
                    {h.overallScore !== null && (
                      <span className="mono text-lead font-bold" style={{ color: 'var(--accent)' }}>{h.overallScore}%</span>
                    )}
                    <button onClick={() => setConfirmDeleteId(h.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg opacity-60 transition-colors hover:text-red-500"
                      style={{ color: 'var(--theme-text-muted)' }} aria-label="delete"><IconTrash size={15} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </PracticePageShell>
  );
}
