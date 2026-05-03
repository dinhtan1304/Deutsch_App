'use client';

import type { CriterionScores } from '@/lib/api/writing';
import { ACCENT, STATUS } from '@/lib/tokens';

interface CriterionRadarProps {
  scores: CriterionScores;
  size?: number;
}

const AXES = [
  { key: 'aufgabenerfuellung' as const, label: 'Đáp ứng\nyêu cầu', color: ACCENT.examWriting },
  { key: 'grammatik' as const,          label: 'Ngữ pháp',         color: ACCENT.writing },
  { key: 'wortschatz' as const,         label: 'Từ vựng',          color: STATUS.success },
  { key: 'kohaerenz' as const,          label: 'Mạch lạc',         color: ACCENT.xp },
];

const CRITERION_LABELS_VI: Record<keyof CriterionScores, string> = {
  aufgabenerfuellung: 'Đáp ứng yêu cầu',
  grammatik: 'Ngữ pháp',
  wortschatz: 'Từ vựng',
  kohaerenz: 'Mạch lạc',
};

const CRITERION_HINTS: Record<keyof CriterionScores, string> = {
  aufgabenerfuellung: 'Tập trung trả lời đủ các điểm yêu cầu trong đề — đọc kỹ và viết đủ độ dài.',
  grammatik: 'Ôn lại quán từ, chia động từ, cách (Kasus) và trật tự từ trong câu.',
  wortschatz: 'Mở rộng từ vựng theo chủ đề và dùng collocation phù hợp.',
  kohaerenz: 'Dùng các từ nối (weil, deshalb, außerdem, trotzdem) để liên kết câu.',
};

/**
 * 4-axis radar chart for Goethe-style writing criteria.
 * Pure SVG — no external chart dependency.
 */
export function CriterionRadar({ scores, size = 260 }: CriterionRadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  // 4 axes at N, E, S, W
  const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

  const axisEnd = (i: number, r: number) => ({
    x: cx + Math.cos(angles[i]!) * r,
    y: cy + Math.sin(angles[i]!) * r,
  });

  const scoreValues = AXES.map((a) => scores[a.key]);
  const polygonPoints = AXES.map((_, i) => {
    const r = (scoreValues[i]! / 100) * radius;
    const p = axisEnd(i, r);
    return `${p.x},${p.y}`;
  }).join(' ');

  // Find weakest axis for highlighting
  const weakestIdx = scoreValues.indexOf(Math.min(...scoreValues));
  const weakest = AXES[weakestIdx]!;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid polygons (25, 50, 75, 100) */}
        {[0.25, 0.5, 0.75, 1].map((factor) => {
          const points = AXES.map((_, i) => {
            const p = axisEnd(i, radius * factor);
            return `${p.x},${p.y}`;
          }).join(' ');
          return (
            <polygon
              key={factor}
              points={points}
              fill="none"
              stroke="var(--theme-border)"
              strokeWidth={1}
              opacity={factor === 1 ? 0.6 : 0.3}
            />
          );
        })}

        {/* Axes */}
        {AXES.map((_, i) => {
          const end = axisEnd(i, radius);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="var(--theme-border)"
              strokeWidth={1}
              opacity={0.4}
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill="url(#radarFill)"
          fillOpacity={0.35}
          stroke={ACCENT.writing}
          strokeWidth={2}
        />
        <defs>
          <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={ACCENT.vocab} stopOpacity={0.6} />
            <stop offset="100%" stopColor={ACCENT.writing} stopOpacity={0.2} />
          </radialGradient>
        </defs>

        {/* Dots + score bubbles at each axis */}
        {AXES.map((axis, i) => {
          const r = (scoreValues[i]! / 100) * radius;
          const p = axisEnd(i, r);
          return (
            <circle key={i} cx={p.x} cy={p.y} r={4} fill={axis.color} stroke="white" strokeWidth={1.5} />
          );
        })}

        {/* Labels (outside axes) */}
        {AXES.map((axis, i) => {
          const labelR = radius + 28;
          const lp = axisEnd(i, labelR);
          const lines = axis.label.split('\n');
          return (
            <g key={i}>
              {lines.map((ln, li) => (
                <text
                  key={li}
                  x={lp.x}
                  y={lp.y + li * 13 - (lines.length - 1) * 6}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill={axis.color}
                >
                  {ln}
                </text>
              ))}
              {/* Score below label */}
              <text
                x={lp.x}
                y={lp.y + lines.length * 13 - (lines.length - 1) * 6}
                textAnchor="middle"
                fontSize={11}
                fontWeight={800}
                fill="var(--theme-text-primary)"
              >
                {Math.round(scoreValues[i]!)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Weakest criterion hint */}
      <div
        className="w-full max-w-md rounded-xl p-3 text-[12.5px] leading-relaxed"
        style={{
          backgroundColor: `${weakest.color}12`,
          border: `1px solid ${weakest.color}30`,
          color: 'var(--theme-text-secondary)',
        }}
      >
        <div className="font-bold mb-1" style={{ color: weakest.color }}>
          Cần cải thiện nhất: {CRITERION_LABELS_VI[weakest.key]} ({Math.round(scoreValues[weakestIdx]!)}/100)
        </div>
        <div>{CRITERION_HINTS[weakest.key]}</div>
      </div>
    </div>
  );
}
