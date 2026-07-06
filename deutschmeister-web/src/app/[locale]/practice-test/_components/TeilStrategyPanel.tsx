'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  getTeilStrategy,
  getRedemittelForSkill,
  type StrategySkill,
  type RedemittelGroup,
} from '../_data/teil-strategies';

function IconBook({ size = 15, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
}
function IconChevron({ open, size = 14 }: { open: boolean; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><polyline points="6 9 12 15 18 9" /></svg>;
}

function RedemittelList({ groups }: { groups: RedemittelGroup[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {groups.map((g) => (
        <div key={g.label}>
          <div className="mb-1 text-[10.5px] font-bold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.05em' }}>{g.label}</div>
          <div className="flex flex-wrap gap-1.5">
            {g.items.map((item) => (
              <span key={item} className="mono rounded-[6px] border px-2 py-1 text-[11.5px]"
                style={{ background: 'var(--theme-bg-tertiary)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Collapsible "how to crack this Teil" panel fed by the static
 * `teil-strategies` data (B1 Goethe/TELC for now). Renders nothing when no
 * strategy exists for the provider/level/skill/Teil — and must NOT be shown
 * in mock-exam mode (callers gate on `?mock=`): a real sitting has no hints.
 */
export function TeilStrategyPanel({
  examType,
  cefrLevel,
  skill,
  teilNumber,
  defaultOpen = false,
}: {
  examType: string;
  cefrLevel: string;
  skill: StrategySkill;
  teilNumber: number;
  defaultOpen?: boolean;
}) {
  const t = useTranslations('practice.teilStrategy');
  const [open, setOpen] = useState(defaultOpen);
  const strategy = getTeilStrategy(examType, cefrLevel, skill, teilNumber);
  if (!strategy) return null;

  return (
    <div className="mb-4 overflow-hidden rounded-[11px] border"
      style={{ borderColor: 'color-mix(in srgb, var(--warn) 35%, transparent)', background: 'color-mix(in srgb, var(--warn) 5%, transparent)' }}>
      <button onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left">
        <IconBook size={15} style={{ color: 'var(--warn)' }} />
        <span className="flex-1 text-caption font-bold" style={{ color: 'var(--theme-text-primary)' }}>
          {t('title', { teil: teilNumber })}
        </span>
        {strategy.timeBudgetMin != null && (
          <span className="mono text-[10.5px] font-bold" style={{ color: 'var(--warn)' }}>
            ~{strategy.timeBudgetMin}′
          </span>
        )}
        <span style={{ color: 'var(--theme-text-muted)' }}><IconChevron open={open} /></span>
      </button>

      {open && (
        <div className="border-t px-4 py-3.5" style={{ borderColor: 'color-mix(in srgb, var(--warn) 20%, transparent)' }}>
          <p className="text-caption leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
            <strong style={{ color: 'var(--theme-text-primary)' }}>{t('goal')}:</strong> {strategy.goal}
            {' · '}
            <span style={{ color: 'var(--theme-text-muted)' }}>{strategy.taskFormat}</span>
          </p>

          <div className="mt-3 text-[10.5px] font-bold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.05em' }}>{t('steps')}</div>
          <ol className="mt-1 space-y-1">
            {strategy.steps.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-caption leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                <span className="mono mt-0.5 shrink-0 text-[10.5px] font-bold" style={{ color: 'var(--warn)' }}>{i + 1}.</span>
                {s}
              </li>
            ))}
          </ol>

          <div className="mt-3 text-[10.5px] font-bold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.05em' }}>{t('traps')}</div>
          <ul className="mt-1 space-y-1">
            {strategy.traps.map((tr, i) => (
              <li key={i} className="flex items-start gap-2 text-caption leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                <span className="mt-0.5 shrink-0" style={{ color: 'var(--danger)' }}>⚠</span>
                {tr}
              </li>
            ))}
          </ul>

          {strategy.redemittel && strategy.redemittel.length > 0 && (
            <>
              <div className="mt-3 mb-1.5 text-[10.5px] font-bold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.05em' }}>{t('redemittel')}</div>
              <RedemittelList groups={strategy.redemittel} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Standalone Redemittel lookup for the free writing/speaking practice pages —
 * aggregates every Redemittel group of a skill (defaults to Goethe B1 data,
 * merged with TELC where labels differ).
 */
export function RedemittelPanel({ skill }: { skill: 'writing' | 'speaking' }) {
  const t = useTranslations('practice.teilStrategy');
  const [open, setOpen] = useState(false);
  const goetheGroups = getRedemittelForSkill('GOETHE', 'B1', skill);
  const groups = [
    ...goetheGroups,
    ...getRedemittelForSkill('TELC', 'B1', skill).filter(
      (g) => !goetheGroups.some((x) => x.label === g.label),
    ),
  ];
  if (!groups.length) return null;

  return (
    <div className="mb-4 overflow-hidden rounded-[11px] border"
      style={{ borderColor: 'color-mix(in srgb, var(--cyan) 35%, transparent)', background: 'color-mix(in srgb, var(--cyan) 5%, transparent)' }}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left">
        <IconBook size={15} style={{ color: 'var(--cyan)' }} />
        <span className="flex-1 text-caption font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('redemittelPanelTitle')}</span>
        <span style={{ color: 'var(--theme-text-muted)' }}><IconChevron open={open} /></span>
      </button>
      {open && (
        <div className="border-t px-4 py-3.5" style={{ borderColor: 'color-mix(in srgb, var(--cyan) 20%, transparent)' }}>
          <RedemittelList groups={groups} />
        </div>
      )}
    </div>
  );
}
