'use client';

/**
 * v2 minimal-pair card: two contrast tiles (neutral vs accent-pink) + an optional
 * note. The pink (--die) accent matches the ipa.js PairCard prototype.
 */
export function MinimalPairCard({ wordA, wordB, note }: { wordA: string; wordB: string; note?: string }) {
  return (
    <div className="rounded-[13px] border p-3.5" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
      <div className="flex items-center gap-2">
        <span className="flex-1 rounded-[9px] py-2 text-center text-body font-bold"
          style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)' }}>
          {wordA}
        </span>
        <span className="shrink-0 text-caption" style={{ color: 'var(--die)' }}>↔</span>
        <span className="flex-1 rounded-[9px] py-2 text-center text-body font-bold"
          style={{ background: 'color-mix(in srgb, var(--die) 12%, transparent)', color: 'var(--die)', border: '1px solid color-mix(in srgb, var(--die) 30%, transparent)' }}>
          {wordB}
        </span>
      </div>
      {note && <p className="mt-2 text-center text-caption" style={{ color: 'var(--theme-text-muted)' }}>{note}</p>}
    </div>
  );
}
