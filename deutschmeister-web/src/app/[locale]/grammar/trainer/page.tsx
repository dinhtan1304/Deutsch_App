'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ACCENT } from '@/lib/tokens';
import { IconRefresh, IconLayers } from '@/components/ui/Icons';
import { useTrainerStats } from '@/hooks/useGrammarTrainer';
import { TrainerTheory } from '@/lib/grammarTrainer/theory';
import { TrainerMode } from '@/lib/api/grammarTrainer';
import DrillRunner from '@/components/grammar/trainer/DrillRunner';

type Tab = 'practice' | 'theory';
type IconCmp = React.ComponentType<{ size?: number; className?: string }>;

const MODES: { key: TrainerMode; color: string; accClass: string; icon: IconCmp; title: string; desc: string }[] = [
  { key: 'conjugation', color: ACCENT.v2Cyan, accClass: 'acc-cyan', icon: IconRefresh, title: 'Chia động từ & các thì', desc: 'Präsens · Präteritum · Perfekt · Futur I' },
  { key: 'cases', color: ACCENT.v2Violet, accClass: 'acc-violet', icon: IconLayers, title: 'Các cách (Kasus)', desc: 'Nominativ · Akkusativ · Dativ · Genitiv' },
];

export default function TrainerHubPage() {
  const [tab, setTab] = useState<Tab>('practice');
  const [mode, setMode] = useState<TrainerMode>('conjugation');
  const { data: stats } = useTrainerStats();

  const activeMode = MODES.find((m) => m.key === mode)!;

  return (
    <div className="max-w-360 mx-auto px-4 py-2 pb-24">
      <Link href="/grammar" className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>← Ngữ pháp</Link>

      <header className="mt-3 mb-6">
        <div className="text-caption font-medium uppercase mb-1.5" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.08em' }}>Luyện ngữ pháp</div>
        <h1 className="font-bold" style={{ fontSize: 30, letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>Grammar Trainer</h1>
        <p className="mt-1.5 text-body" style={{ color: 'var(--theme-text-secondary)' }}>
          Luyện phản xạ chia động từ, các thì và các cách — chấm điểm tức thì, giữ streak.
        </p>
      </header>

      {stats && stats.totalSessions > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Lượt luyện', value: String(stats.totalSessions), color: ACCENT.srs },
            { label: 'Câu đã làm', value: String(stats.totalItems), color: ACCENT.vocab },
            { label: 'Độ chính xác', value: `${stats.accuracy}%`, color: ACCENT.reading },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl px-5 py-4 border" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
              <div className="font-bold" style={{ fontSize: 22, color: s.color }}>{s.value}</div>
              <div className="text-caption mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-5 mb-6 border-b" style={{ borderColor: 'var(--theme-border)' }}>
        {(['practice', 'theory'] as Tab[]).map((tb) => (
          <button key={tb} onClick={() => setTab(tb)} className="pb-2 text-sm transition-colors"
            style={{
              fontWeight: tab === tb ? 600 : 400,
              color: tab === tb ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)',
              borderBottom: `2px solid ${tab === tb ? 'var(--accent)' : 'transparent'}`,
              marginBottom: -1,
            }}>
            {tb === 'practice' ? 'Luyện tập' : 'Lý thuyết'}
          </button>
        ))}
      </div>

      {tab === 'practice' ? (
        <>
          {/* Mode selector — chọn là luyện ngay, không qua trang khác */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = mode === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMode(m.key)}
                  aria-pressed={active}
                  className="word-card-v2 rounded-2xl p-4 flex items-center gap-3 text-left"
                  style={{
                    background: active ? `color-mix(in srgb, ${m.color} 9%, var(--theme-bg-card))` : 'var(--theme-bg-card)',
                    border: `${active ? 1.5 : 1}px solid ${active ? m.color : `color-mix(in srgb, ${m.color} 38%, var(--theme-border))`}`,
                    ['--card-accent' as string]: m.color,
                  } as React.CSSProperties}
                >
                  <span className="w-11 h-11 rounded-[11px] flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${m.color} 16%, transparent)`, color: m.color }}>
                    <Icon size={22} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold" style={{ fontSize: 15, color: 'var(--theme-text-primary)' }}>{m.title}</span>
                    <span className="block text-caption truncate" style={{ color: 'var(--theme-text-secondary)' }}>{m.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Drill inline cho mode đang chọn (key → reset state khi đổi mode) */}
          <div className={activeMode.accClass}>
            <DrillRunner key={mode} mode={mode} />
          </div>
        </>
      ) : (
        <TrainerTheory />
      )}
    </div>
  );
}
