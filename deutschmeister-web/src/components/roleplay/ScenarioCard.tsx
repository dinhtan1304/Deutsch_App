'use client';

import { RoleplayScenario } from '@/lib/api/roleplay';

const LEVEL_COLORS: Record<string, string> = {
  A1: '#22C55E',
  A2: '#3B82F6',
  B1: '#A855F7',
};

interface Props {
  scenario: RoleplayScenario;
  locked?: boolean;
  onClick: () => void;
}

export function ScenarioCard({ scenario, locked, onClick }: Props) {
  const levelColor = LEVEL_COLORS[scenario.level] ?? '#6366F1';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative text-left rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
      }}
    >
      {locked && (
        <div
          className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-caption font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}
        >
          PREMIUM
        </div>
      )}

      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
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
