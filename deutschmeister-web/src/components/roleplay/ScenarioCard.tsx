'use client';
/* eslint-disable no-restricted-syntax */

import { RoleplayScenario } from '@/lib/api/roleplay';
import { ACCENT, STATUS } from '@/lib/tokens';

const LEVEL_COLORS: Record<string, string> = {
  A1: STATUS.success,
  A2: ACCENT.srs,
  B1: ACCENT.examWriting,
};

interface Props {
  scenario: RoleplayScenario;
  locked?: boolean;
  onClick: () => void;
}

export function ScenarioCard({ scenario, locked, onClick }: Props) {
  const levelColor = LEVEL_COLORS[scenario.level] ?? ACCENT.writing;

  return (
    <button
      type="button"
      onClick={onClick}
      className="word-card-v2 group relative h-full text-left rounded-[13px] border p-4"
      style={{
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
        ['--card-accent' as string]: levelColor,
      } as React.CSSProperties}
    >
      {locked && (
        <div
          className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-caption font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}
        >
          PREMIUM
        </div>
      )}

      <div className="flex items-start gap-3.5">
        <div
          className="w-14 h-14 rounded-[13px] flex items-center justify-center text-3xl shrink-0"
          style={{ background: `${levelColor}1a` }}
        >
          {scenario.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2 py-0.5 rounded-md text-caption font-bold"
              style={{ backgroundColor: `${levelColor}1a`, color: levelColor }}
            >
              {scenario.level}
            </span>
          </div>
          <h3
            className="text-base font-bold leading-tight mb-0.5"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            {scenario.titleDe}
          </h3>
          <p
            className="text-xs mb-2"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            {scenario.titleVi}
          </p>
          <p
            className="text-xs line-clamp-2"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            {scenario.descriptionVi}
          </p>
        </div>
      </div>
    </button>
  );
}
