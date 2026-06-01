'use client';
/* eslint-disable no-restricted-syntax */

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ACCENT, STATUS } from '@/lib/tokens';
import { useSkills } from '@/hooks/useUser';
import type { SkillScores, SkillScore } from '@/lib/api/users';

// ─── Config ──────────────────────────────────────────────────────────────────
// Labels live in messages → progress.profile.skillRadar.skills.<key>

const SKILLS: {
  key: keyof Pick<SkillScores, 'reading' | 'writing' | 'listening' | 'speaking' | 'grammar'>;
  color: string;
  href: string;
}[] = [
  { key: 'reading',   color: STATUS.success, href: '/practice-test/reading' },
  { key: 'writing',   color: ACCENT.writing, href: '/practice-test/writing' },
  { key: 'listening', color: ACCENT.cyan, href: '/practice-test/listening' },
  { key: 'speaking',  color: ACCENT.xp, href: '/practice-test/pronunciation' },
  { key: 'grammar',   color: ACCENT.vocab, href: '/grammar' },
];

const CX = 140;
const CY = 140;
const R = 100;           // max radius
const LEVELS = [20, 40, 60, 80, 100]; // grid rings (%)
const ANGLE_OFFSET = -90; // start top

function polarToXY(angleDeg: number, radius: number): [number, number] {
  const rad = ((angleDeg + ANGLE_OFFSET) * Math.PI) / 180;
  return [CX + radius * Math.cos(rad), CY + radius * Math.sin(rad)];
}

// ─── Radar SVG ───────────────────────────────────────────────────────────────

function RadarChart({ data }: { data: SkillScores }) {
  const t = useTranslations('progress.profile.skillRadar');
  const n = SKILLS.length;
  const step = 360 / n;

  // Build polygon points from scores (null → 0)
  const values = SKILLS.map((s) => {
    const sk = data[s.key] as SkillScore;
    return sk.score ?? 0;
  });

  const polyPoints = values
    .map((v, i) => {
      const [x, y] = polarToXY(i * step, (v / 100) * R);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 280 280" className="w-full max-w-70 mx-auto drop-shadow-[0_0_15px_rgba(99,102,241,0.1)]">
      {/* Grid rings */}
      {LEVELS.map((pct) => {
        const pts = Array.from({ length: n }, (_, i) => {
          const [x, y] = polarToXY(i * step, (pct / 100) * R);
          return `${x},${y}`;
        }).join(' ');
        return (
          <polygon
            key={pct}
            points={pts}
            fill="none"
            stroke="var(--theme-border)"
            strokeWidth={pct === 100 ? 1.5 : 0.5}
            opacity={pct === 100 ? 0.4 : 0.15}
          />
        );
      })}

      {/* Axis lines */}
      {SKILLS.map((_, i) => {
        const [x, y] = polarToXY(i * step, R);
        return (
          <line
            key={i}
            x1={CX}
            y1={CY}
            x2={x}
            y2={y}
            stroke="var(--theme-border)"
            strokeWidth={0.5}
            opacity={0.15}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={polyPoints}
        fill="color-mix(in srgb, var(--accent) 18%, transparent)"
        stroke="var(--accent)"
        strokeWidth={2.5}
        strokeLinejoin="round"
        className="transition-all duration-1000"
      />

      {/* Data dots */}
      {values.map((v, i) => {
        const [x, y] = polarToXY(i * step, (v / 100) * R);
        const sk = data[SKILLS[i]!.key] as SkillScore;
        if (sk.score === null) return null;
        return (
          <g key={i} className="transition-all duration-500">
            <circle cx={x} cy={y} r={6} fill={SKILLS[i]!.color} opacity={0.2} />
            <circle
              cx={x}
              cy={y}
              r={3.5}
              fill={SKILLS[i]!.color}
              stroke="white"
              strokeWidth={2}
            />
          </g>
        );
      })}

      {/* Axis labels */}
      {SKILLS.map((s, i) => {
        const labelR = R + 26;
        const [x, y] = polarToXY(i * step, labelR);
        const sk = data[s.key] as SkillScore;
        return (
          <text
            key={s.key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            className="text-[10px] font-black uppercase tracking-widest"
            style={{
              fill: sk.score !== null ? s.color : 'var(--theme-text-muted)',
              opacity: sk.score !== null ? 1 : 0.4
            }}
          >
            {t(`skills.${s.key}` as 'skills.reading')}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Main Widget ─────────────────────────────────────────────────────────────

export function SkillRadar() {
  const t = useTranslations('progress.profile.skillRadar');
  const { data, isLoading } = useSkills();

  // Loading state
  if (isLoading) {
    return (
      <div
        className="rounded-2xl border p-5 animate-pulse"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
      >
        <div
          className="h-4 w-40 rounded mb-4"
          style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
        />
        <div
          className="h-60 rounded-xl"
          style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
        />
      </div>
    );
  }

  // No data at all — empty state
  if (!data || data.overall === null) {
    return (
      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h2 className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {t('title')}
          </h2>
        </div>
        <div className="text-center py-8">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-3"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,.1), rgba(139,92,246,.06))' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <p
            className="text-sm font-semibold mb-1"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            {t('noDataTitle')}
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--theme-text-muted)' }}>
            {t('noDataBody')}
          </p>
          <Link
            href="/practice-test"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-body font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              boxShadow: '0 4px 12px rgba(99,102,241,.3)',
            }}
          >
            {t('practiceNow')}
          </Link>
        </div>
      </div>
    );
  }

  // Weakest skill CTA
  const weakLabel = data.weakestSkill
    ? SKILLS.find((s) => s.key === data.weakestSkill)
    : null;

  // Skills sorted by score (desc) for the right-hand bars
  const sorted = [...SKILLS]
    .map((s) => ({ s, sd: data[s.key] as SkillScore }))
    .sort((a, b) => (b.sd.score ?? 0) - (a.sd.score ?? 0));

  return (
    <div
      className="rounded-lg border p-5"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="v2-match-grad flex h-10 w-10 items-center justify-center rounded-[11px] shadow-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
              {t('title')}
            </h2>
            <p className="text-[11px] opacity-50 font-medium" style={{ color: 'var(--theme-text-muted)' }}>
              {t('subtitle')}
            </p>
          </div>
        </div>
        {data.overall !== null && (
          <span
            className="mono text-[20px] font-extrabold"
            style={{ color: 'var(--accent)' }}
          >
            {data.overall}
            <span className="text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>
              /100
            </span>
          </span>
        )}
      </div>

      {/* Radar + bars side by side (compact, one row) */}
      <div className="flex items-center gap-3 sm:gap-5">
        <div className="w-36 shrink-0 sm:w-52"><RadarChart data={data} /></div>
        <div className="min-w-0 flex-1 space-y-2.5">
          {sorted.map(({ s, sd }) => {
            const isWeakest = data.weakestSkill === s.key;
            return (
              <div key={s.key}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-caption font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                    <span className="h-1.75 w-1.75 rounded-full" style={{ background: s.color }} />
                    {t(`skills.${s.key}` as 'skills.reading')}
                    {isWeakest && (
                      <span className="rounded-[3px] px-1.5 py-px text-[8.5px] font-bold uppercase tracking-wide"
                        style={{ background: 'color-mix(in srgb, var(--danger) 16%, transparent)', color: 'var(--danger)' }}>
                        {t('weakest')}
                      </span>
                    )}
                  </span>
                  <span className="mono text-caption font-bold" style={{ color: sd.score !== null ? s.color : 'var(--theme-text-muted)' }}>
                    {sd.score !== null ? sd.score : '—'}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full" style={{ background: 'var(--theme-bg-secondary)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${sd.score ?? 0}%`, background: s.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weakest skill CTA */}
      {weakLabel && (
        <Link
          href={weakLabel.href}
          className="mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-body font-semibold text-white transition-all hover:-translate-y-0.5"
          style={{
            background: `linear-gradient(135deg, ${weakLabel.color}, ${weakLabel.color}cc)`,
            boxShadow: `0 4px 12px ${weakLabel.color}30`,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 16 16 12 12 8" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          {t('focusImprove', { skill: t(`skills.${weakLabel.key}` as 'skills.reading') })}
        </Link>
      )}
    </div>
  );
}
