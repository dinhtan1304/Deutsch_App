'use client';
// UI_REFRESH_FORCE_SYNC: 2026-05-01_v3

import { useState, useMemo } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
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
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import type { RoleplayLevel, RoleplayScenario } from '@/lib/api/roleplay';

// ─── Local Icons ─────────────────────────────────────────────────────────────
function IconTrash({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
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
    if (quotaExhausted) {
      setUpgradeOpen(true);
      return;
    }
    try {
      const session = await startMut.mutateAsync({
        scenario: scenario.code,
        level: scenario.level,
      });
      router.push(`/practice-test/roleplay/${session.id}`);
    } catch {
      // Handled
    }
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteMut.mutateAsync({ sessionId: confirmDeleteId });
    } catch {
      // Handled
    }
    setConfirmDeleteId(null);
  };

  return (
    <PracticePageShell
      backHref="/practice-test"
      title={t('title')}
      subtitle={t('subtitle')}
      accent="speaking"
      className="pb-32"
      right={
        quota && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl border backdrop-blur-md"
            style={{
              backgroundColor: quotaExhausted ? 'rgba(239,68,68,0.05)' : 'rgba(34,197,94,0.05)',
              borderColor: quotaExhausted ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
              color: quotaExhausted ? STATUS.danger : STATUS.success
            }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'currentColor' }} />
            <span className="text-xs font-black uppercase tracking-widest">{t('quotaLabel', { used: quota.used, limit: quota.limit })}</span>
          </div>
        )
      }
    >
      {/* Level filter */}
      <div className="flex gap-2.5 mb-10 overflow-x-auto no-scrollbar">
        {LEVELS.map((lv) => {
          const active = levelFilter === lv;
          return (
            <button key={lv} type="button" onClick={() => setLevelFilter(lv)}
              className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-sm"
              style={{
                background: active ? GRADIENT.speaking : 'var(--theme-bg-card)',
                color: active ? 'white' : 'var(--theme-text-muted)',
                border: active ? 'none' : '1px solid var(--theme-border)',
                boxShadow: active ? '0 10px 20px rgba(99, 102, 241, 0.2)' : 'none'
              }}>
              {lv === 'all' ? t('allLevels') : lv}
            </button>
          );
        })}
      </div>

      {/* Scenarios grid */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-6 rounded-full" style={{ background: GRADIENT.speaking }} />
          <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>{t('scenariosTitle')}</h2>
        </div>
        
        {isLoading ? (
          <GridSkeleton cols={3} count={6} height="h-44" rounded="rounded-[2.5rem]" gap="gap-6" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((sc) => (
              <ScenarioCard
                key={sc.code}
                scenario={sc}
                locked={!!quotaExhausted}
                onClick={() => handleStart(sc)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Delete Confirmation Banner */}
      {confirmDeleteId && (
        <div className="mb-10 rounded-[2.5rem] border-2 p-8 flex items-center justify-between gap-8 flex-wrap animate-in fade-in slide-in-from-top-4 duration-500"
          style={{ borderColor: `${STATUS.danger}40`, backgroundColor: `${STATUS.danger}05` }}>
          <div>
            <h4 className="text-xl font-black mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>{t('confirmDeleteTitle')}</h4>
            <p className="text-base opacity-50 font-medium" style={{ color: 'var(--theme-text-primary)' }}>{t('confirmDeleteSubtitle')}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setConfirmDeleteId(null)} className="px-6 py-3 rounded-xl text-xs font-black border transition-all hover:bg-white/5"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>{t('cancel')}</button>
            <button onClick={confirmDelete} className="px-6 py-3 rounded-xl text-xs font-black text-white transition-all hover:brightness-110 shadow-xl shadow-red-500/30"
              style={{ backgroundColor: STATUS.danger }}>{t('deletePermanently')}</button>
          </div>
        </div>
      )}

      {/* History */}
      {history && history.data.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 rounded-full bg-slate-400/20" />
            <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>{t('historyTitle')}</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {history.data.map((h) => (
              <div key={h.id}
                className="group rounded-4xl p-5 flex items-center gap-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden border border-transparent hover:border-indigo-500/20"
                style={{ 
                  backgroundColor: 'var(--theme-bg-card)', 
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03), inset 0 0 0 1px rgba(255, 255, 255, 0.05)' 
                }}>
                
                <div className="text-4xl w-16 h-16 rounded-2xl flex items-center justify-center bg-black/3 dark:bg-white/5 transition-transform duration-500 group-hover:scale-110">
                  {h.scenarioInfo?.icon ?? '💬'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10"
                      style={{ color: 'var(--theme-text-primary)' }}>{h.level}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg"
                      style={{
                        backgroundColor: h.status === 'completed' ? `${STATUS.success}15` : `${ACCENT.srs}15`,
                        color: h.status === 'completed' ? STATUS.success : ACCENT.srs,
                      }}>
                      {h.status === 'completed' ? t('statusCompleted') : t('statusActive')}
                    </span>
                  </div>
                  <button onClick={() => router.push(`/practice-test/roleplay/${h.id}`)} className="block text-left w-full group/title">
                    <h3 className="text-lg font-black tracking-tight group-hover/title:text-indigo-500 transition-colors">{h.scenarioInfo?.titleDe ?? h.scenario}</h3>
                  </button>
                  <div className="text-[11px] font-bold opacity-40 uppercase tracking-widest mt-1" style={{ color: 'var(--theme-text-primary)' }}>
                    {formatDate(h.updatedAt)}
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  {h.overallScore !== null && (
                    <div className="text-2xl font-black tracking-tighter text-indigo-500">
                      {h.overallScore}<span className="text-xs ml-0.5">%</span>
                    </div>
                  )}
                  <button onClick={() => setConfirmDeleteId(h.id)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500/10 hover:text-red-500"
                    style={{ color: 'var(--theme-text-muted)' }}>
                    <IconTrash size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </PracticePageShell>
  );
}
