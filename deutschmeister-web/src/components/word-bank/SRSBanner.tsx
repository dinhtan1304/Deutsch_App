'use client';
  
import Link from 'next/link';
import { STATUS, GRADIENT } from '@/lib/tokens';

const monoSoftBg = (color: string) => `linear-gradient(135deg, ${color}26, ${color}14)`;
import { IconBrain, IconTarget, IconRefresh } from '@/components/ui/Icons';
import type { SRSStats } from '@/lib/api/personal-words';

interface SRSBannerProps {
  srsStats: SRSStats;
  statTotal: number;
}

export function SRSBanner({ srsStats, statTotal }: SRSBannerProps) {
  const isDue = srsStats.due > 0;
  return (
    <div
      className="mb-6 p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-all hover:shadow-md"
      style={{
        borderColor: isDue ? `${STATUS.danger}30` : `${STATUS.success}30`,
        backgroundColor: isDue ? `${STATUS.danger}0D` : `${STATUS.success}0D`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: monoSoftBg(isDue ? STATUS.danger : STATUS.success),
          }}
        >
          <IconBrain size={20} style={{ color: isDue ? STATUS.danger : STATUS.success }} />
        </div>
        <div>
          <p className="text-sm" style={{ color: 'var(--theme-text-primary)' }}>
            {isDue ? (
              <>Có <span className="font-bold" style={{ color: STATUS.danger }}>{srsStats.due}</span> từ cần ôn tập hôm nay</>
            ) : (
              <span className="font-medium" style={{ color: STATUS.success }}>Tuyệt vời! Bạn đã ôn hết từ cho hôm nay.</span>
            )}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            <span>{srsStats.mature} / {statTotal} đã thuộc ({Math.round((srsStats.mature / statTotal) * 100)}%)</span>
            {srsStats.new > 0 && <span>• {srsStats.new} từ mới</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/word-bank/review?mode=weak"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs transition-all hover:scale-105"
          style={{ background: `${STATUS.danger}1A`, color: STATUS.danger }}
        >
          <IconTarget size={14} /> Từ yếu
        </Link>
        <Link
          href="/word-bank/review"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs text-white transition-all hover:scale-105"
          style={{ background: isDue ? GRADIENT.dangerSolid : GRADIENT.action }}
        >
          <IconRefresh size={14} /> {isDue ? 'Ôn ngay' : 'Học thêm'}
        </Link>
      </div>
    </div>
  );
}
