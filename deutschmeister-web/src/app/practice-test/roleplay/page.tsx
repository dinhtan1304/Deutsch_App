'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useRoleplayScenarios,
  useStartRoleplay,
  useRoleplayHistory,
  useDeleteRoleplay,
} from '@/hooks/useRoleplay';
import { useCheckQuota } from '@/hooks/useSubscription';
import { ScenarioCard } from '@/components/roleplay/ScenarioCard';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import type { RoleplayLevel, RoleplayScenario } from '@/lib/api/roleplay';

const LEVELS: (RoleplayLevel | 'all')[] = ['all', 'A1', 'A2', 'B1'];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RoleplayPage() {
  const router = useRouter();
  const { data: quota } = useCheckQuota('roleplay');
  const quotaExhausted = quota && !quota.allowed;
  const [levelFilter, setLevelFilter] = useState<RoleplayLevel | 'all'>('all');
  const [upgradeOpen, setUpgradeOpen] = useState(false);

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
    } catch (err: any) {
      alert(err?.message || 'Không thể bắt đầu hội thoại');
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Xóa cuộc hội thoại này?')) return;
    try {
      await deleteMut.mutateAsync({ sessionId });
    } catch (err: any) {
      alert(err?.message || 'Xóa thất bại');
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--theme-bg-primary)' }}
    >
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/practice-test"
            className="text-xs mb-2 inline-flex items-center gap-1"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            ← Luyện thi
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1
                className="text-2xl md:text-3xl font-bold flex items-center gap-2"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                <span>💬</span> Roleplay AI
                {quota && (
                  <span
                    className="px-2 py-0.5 rounded-md text-caption font-bold"
                    style={{
                      backgroundColor: quotaExhausted ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                      color: quotaExhausted ? '#EF4444' : '#22C55E',
                    }}
                  >
                    {quota.used}/{quota.limit} lượt/tuần
                  </span>
                )}
              </h1>
              <p
                className="text-sm mt-1"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                Luyện hội thoại tiếng Đức với AI theo các tình huống thực tế
              </p>
            </div>
          </div>
        </div>

        {/* Level filter */}
        <div className="flex gap-2 mb-5 overflow-x-auto">
          {LEVELS.map((lv) => {
            const active = levelFilter === lv;
            return (
              <button
                key={lv}
                type="button"
                onClick={() => setLevelFilter(lv)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all"
                style={{
                  background: active
                    ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                    : 'var(--theme-bg-card)',
                  color: active ? 'white' : 'var(--theme-text-secondary)',
                  border: `1px solid ${active ? 'transparent' : 'var(--theme-border)'}`,
                }}
              >
                {lv === 'all' ? 'Tất cả' : lv}
              </button>
            );
          })}
        </div>

        {/* Scenarios grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-32 rounded-2xl animate-pulse"
                style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {/* History */}
        {history && history.data.length > 0 && (
          <div className="mt-10">
            <h2
              className="text-lg font-bold mb-3"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              Lịch sử gần đây
            </h2>
            <div className="space-y-2">
              {history.data.map((h) => (
                <div
                  key={h.id}
                  className="rounded-xl border p-3 flex items-center gap-3"
                  style={{
                    borderColor: 'var(--theme-border)',
                    backgroundColor: 'var(--theme-bg-card)',
                  }}
                >
                  <div className="text-2xl">{h.scenarioInfo?.icon ?? '💬'}</div>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/practice-test/roleplay/${h.id}`)
                    }
                    className="flex-1 min-w-0 text-left"
                  >
                    <div
                      className="text-sm font-semibold truncate"
                      style={{ color: 'var(--theme-text-primary)' }}
                    >
                      {h.scenarioInfo?.titleDe ?? h.scenario}
                    </div>
                    <div
                      className="text-caption flex items-center gap-2"
                      style={{ color: 'var(--theme-text-muted)' }}
                    >
                      <span>{h.level}</span>
                      <span>•</span>
                      <span>{formatDate(h.updatedAt)}</span>
                      <span>•</span>
                      <span
                        className="px-1.5 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor:
                            h.status === 'completed'
                              ? 'rgba(34,197,94,0.1)'
                              : 'rgba(59,130,246,0.1)',
                          color: h.status === 'completed' ? '#22C55E' : '#3B82F6',
                        }}
                      >
                        {h.status === 'completed' ? 'Hoàn thành' : 'Đang chat'}
                      </span>
                    </div>
                  </button>
                  {h.overallScore !== null && (
                    <div
                      className="text-sm font-bold"
                      style={{ color: '#A855F7' }}
                    >
                      {h.overallScore}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(h.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 hover:bg-red-500/10"
                    style={{ color: 'var(--theme-text-muted)' }}
                    aria-label="Xóa"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
      />
    </div>
  );
}
