'use client';

import Link from 'next/link';
import { useSkills } from '@/hooks/useUser';
import type { SkillScores, SkillScore } from '@/lib/api/users';

// ─── Config ──────────────────────────────────────────────────────────────────

const SKILLS: {
  key: keyof Pick<SkillScores, 'reading' | 'writing' | 'listening' | 'speaking' | 'grammar'>;
  label: string;
  color: string;
  href: string;
}[] = [
  { key: 'reading',   label: 'Đọc',      color: '#22C55E', href: '/practice-test/reading' },
  { key: 'writing',   label: 'Viết',      color: '#6366F1', href: '/practice-test/writing' },
  { key: 'listening', label: 'Nghe',      color: '#06B6D4', href: '/practice-test/listening' },
  { key: 'speaking',  label: 'Nói',       color: '#F59E0B', href: '/practice-test/pronunciation' },
  { key: 'grammar',   label: 'Ngữ pháp', color: '#8B5CF6', href: '/grammar' },
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

// ─── Trend Arrow ─────────────────────────────────────────────────────────────

function TrendArrow({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M5 1L9 6H1L5 1Z" fill="#22C55E" />
      </svg>
    );
  }
  if (trend === 'down') {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M5 9L1 4H9L5 9Z" fill="#EF4444" />
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <rect x="1" y="4" width="8" height="2" rx="1" fill="#94A3B8" />
    </svg>
  );
}

// ─── Radar SVG ───────────────────────────────────────────────────────────────

function RadarChart({ data }: { data: SkillScores }) {
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
    <svg viewBox="0 0 280 280" className="w-full max-w-[280px] mx-auto">
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
            strokeWidth={pct === 100 ? 1.5 : 0.8}
            opacity={pct === 100 ? 0.6 : 0.3}
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
            strokeWidth={0.8}
            opacity={0.3}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={polyPoints}
        fill="rgba(99,102,241,.12)"
        stroke="#6366F1"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Data dots */}
      {values.map((v, i) => {
        const [x, y] = polarToXY(i * step, (v / 100) * R);
        const sk = data[SKILLS[i].key] as SkillScore;
        if (sk.score === null) return null;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={4}
            fill={SKILLS[i].color}
            stroke="white"
            strokeWidth={2}
          />
        );
      })}

      {/* Axis labels */}
      {SKILLS.map((s, i) => {
        const labelR = R + 22;
        const [x, y] = polarToXY(i * step, labelR);
        const sk = data[s.key] as SkillScore;
        return (
          <text
            key={s.key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            fontWeight={700}
            fill={sk.score !== null ? s.color : 'var(--theme-text-muted)'}
          >
            {s.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Legend Row ───────────────────────────────────────────────────────────────

function SkillRow({
  skill,
  data,
  isWeakest,
}: {
  skill: (typeof SKILLS)[number];
  data: SkillScore;
  isWeakest: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors"
      style={{
        backgroundColor: isWeakest ? 'rgba(239,68,68,.06)' : 'var(--theme-bg-secondary)',
        border: isWeakest ? '1px solid rgba(239,68,68,.18)' : '1px solid transparent',
      }}
    >
      {/* Color dot */}
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: skill.color }}
      />
      {/* Label */}
      <span
        className="flex-1 text-body font-medium"
        style={{ color: 'var(--theme-text-primary)' }}
      >
        {skill.label}
      </span>
      {/* Score */}
      <span
        className="text-sm font-bold min-w-10 text-right"
        style={{ color: data.score !== null ? skill.color : 'var(--theme-text-muted)' }}
      >
        {data.score !== null ? data.score : '—'}
      </span>
      {/* Trend arrow */}
      {data.sampleCount >= 4 && <TrendArrow trend={data.trend} />}
      {/* Weakest badge */}
      {isWeakest && (
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0"
          style={{ background: 'rgba(239,68,68,.12)', color: '#EF4444' }}
        >
          yếu
        </span>
      )}
    </div>
  );
}

// ─── Main Widget ─────────────────────────────────────────────────────────────

export function SkillRadar() {
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
            Phân tích kỹ năng
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
            Chưa đủ dữ liệu
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--theme-text-muted)' }}>
            Hoàn thành thêm bài tập để xem phân tích kỹ năng
          </p>
          <Link
            href="/practice-test"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-body font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              boxShadow: '0 4px 12px rgba(99,102,241,.3)',
            }}
          >
            Luyện tập ngay
          </Link>
        </div>
      </div>
    );
  }

  // Weakest skill CTA
  const weakLabel = data.weakestSkill
    ? SKILLS.find((s) => s.key === data.weakestSkill)
    : null;

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <h2 className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Phân tích kỹ năng
            </h2>
            <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
              Tổng quan 5 kỹ năng
            </p>
          </div>
        </div>
        {data.overall !== null && (
          <span
            className="text-[20px] font-extrabold"
            style={{ color: '#6366F1' }}
          >
            {data.overall}
            <span className="text-caption font-medium" style={{ color: 'var(--theme-text-muted)' }}>
              /100
            </span>
          </span>
        )}
      </div>

      {/* Radar chart */}
      <RadarChart data={data} />

      {/* Legend rows */}
      <div className="space-y-1.5 mt-2">
        {SKILLS.map((s) => (
          <SkillRow
            key={s.key}
            skill={s}
            data={data[s.key] as SkillScore}
            isWeakest={data.weakestSkill === s.key}
          />
        ))}
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
          Tập trung cải thiện: {weakLabel.label}
        </Link>
      )}
    </div>
  );
}
