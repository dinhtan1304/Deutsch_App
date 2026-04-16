'use client';

import Link from 'next/link';
import { usePhonemeDrills, usePhonemeDrillStats } from '@/hooks/usePronunciationScoring';

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  high:   { bg: 'rgba(239,68,68,.1)',  text: '#EF4444', label: 'Khó' },
  medium: { bg: 'rgba(245,158,11,.1)', text: '#F59E0B', label: 'Trung bình' },
  low:    { bg: 'rgba(34,197,94,.1)',   text: '#22C55E', label: 'Dễ' },
};

function getScoreColor(score: number) {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
}

export default function PhonemeDrillsPage() {
  const { data: drills, isLoading } = usePhonemeDrills();
  const { data: stats } = usePhonemeDrillStats();

  const statsMap = new Map(stats?.map(s => [s.phoneme, s]) ?? []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/practice-test/pronunciation"
          className="text-xs mb-2 inline-flex items-center gap-1"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          ← Luyện phát âm
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
          <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #EC4899, #A855F7)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </span>
          Drill âm khó cho người Việt
        </h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>
          Tập trung luyện từng âm mà người Việt thường phát âm sai — ü, ö, ch, r và hơn nữa
        </p>
      </div>

      {/* Drill grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {drills?.map(drill => {
            const stat = statsMap.get(drill.phoneme);
            const diff = DIFFICULTY_COLORS[drill.difficultyForVi] ?? DIFFICULTY_COLORS.medium;
            return (
              <Link
                key={drill.phoneme}
                href={`/practice-test/pronunciation/drills/${drill.phoneme}`}
                className="rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md block"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
              >
                {/* Top: phoneme label + difficulty */}
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl font-extrabold" style={{ color: '#A855F7' }}>
                    {drill.label}
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                    style={{ backgroundColor: diff.bg, color: diff.text }}
                  >
                    {diff.label}
                  </span>
                </div>

                {/* IPA + description */}
                <div className="text-[12px] font-mono mb-1" style={{ color: '#A855F7' }}>
                  {drill.ipa}
                </div>
                <p className="text-[12px] leading-relaxed mb-3" style={{ color: 'var(--theme-text-muted)' }}>
                  {drill.description}
                </p>

                {/* Stats or CTA */}
                {stat ? (
                  <div className="flex items-center gap-3 text-[11px]">
                    <span style={{ color: 'var(--theme-text-muted)' }}>
                      {stat.count} lần
                    </span>
                    <span style={{ color: getScoreColor(stat.bestScore) }}>
                      Best: {stat.bestScore}
                    </span>
                    <span style={{ color: getScoreColor(stat.avgScore) }}>
                      TB: {stat.avgScore}
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] font-medium" style={{ color: '#A855F7' }}>
                    Chưa luyện — Bắt đầu →
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
