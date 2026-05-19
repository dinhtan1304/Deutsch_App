'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { IPA_CHART, IPA_CATEGORY_LABELS, IPA_VIDEOS } from '@/lib/data/ipaChart';
import type { IpaCategory, IpaSymbol } from '@/lib/data/ipaChart';
import { IpaSymbolCard } from '@/components/ipa/IpaSymbolCard';
import { IpaDetailPanel } from '@/components/ipa/IpaDetailPanel';

type Filter = 'all' | IpaCategory;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'vowel-short', label: IPA_CATEGORY_LABELS['vowel-short'] },
  { key: 'vowel-long', label: IPA_CATEGORY_LABELS['vowel-long'] },
  { key: 'diphthong', label: IPA_CATEGORY_LABELS['diphthong'] },
  { key: 'consonant', label: IPA_CATEGORY_LABELS['consonant'] },
  { key: 'affricate', label: IPA_CATEGORY_LABELS['affricate'] },
];

export default function IpaChartPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<IpaSymbol | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);

  const groups = useMemo(() => {
    const visible = filter === 'all' ? IPA_CHART : IPA_CHART.filter(s => s.category === filter);
    const map = new Map<IpaCategory, IpaSymbol[]>();
    for (const s of visible) {
      const arr = map.get(s.category) ?? [];
      arr.push(s);
      map.set(s.category, arr);
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }, [filter]);

  useEffect(() => {
    if (!selected) return;
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selected]);

  const drillCount = IPA_CHART.filter(s => s.drillPhonemeKey).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-xs mb-2 inline-flex items-center gap-1"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            ← Trang chủ
          </Link>
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white"
              style={{ background: GRADIENT.pronunciation }}
              aria-hidden
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16M4 12h10M4 18h16" />
                <circle cx="18" cy="12" r="2" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1
                className="text-2xl md:text-3xl font-bold flex items-center gap-2 flex-wrap"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                Bảng IPA tiếng Đức
              </h1>
              <p
                className="text-sm mt-1"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                {IPA_CHART.length} ký hiệu phiên âm chuẩn — click để nghe ví dụ và xem mẹo phát âm
              </p>
            </div>
          </div>
        </div>

        {/* Legend + drill CTA */}
        <div className="flex flex-wrap items-center gap-3 mb-5 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS.danger }} />
            Khó với người Việt
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS.warning }} />
            Trung bình
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS.success }} />
            Dễ
          </span>
          <span className="hidden sm:inline" style={{ color: 'var(--theme-border)' }}>·</span>
          <span>{drillCount} âm có drill chuyên sâu</span>
        </div>

        {/* Video tutorials */}
        <section className="mb-6">
          <h2
            className="text-sm font-bold mb-3 flex items-center gap-2"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: ACCENT.examWriting }} aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
            Video hướng dẫn
            <span
              className="text-caption font-normal px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--theme-bg-secondary)',
                color: 'var(--theme-text-muted)',
              }}
            >
              {IPA_VIDEOS.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {IPA_VIDEOS.map(v => (
              <div
                key={v.id}
                className="rounded-2xl border overflow-hidden"
                style={{
                  borderColor: 'var(--theme-border)',
                  backgroundColor: 'var(--theme-bg-card)',
                }}
              >
                <div className="relative w-full aspect-video bg-black">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${v.id}`}
                    title={v.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                  />
                </div>
                <div className="px-3 py-2 text-xs font-medium truncate" style={{ color: 'var(--theme-text-primary)' }}>
                  {v.title}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Filter chips */}
        <div className="flex gap-2 mb-5 overflow-x-auto">
          {FILTERS.map(f => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all"
                style={{
                  background: active ? GRADIENT.pronunciation : 'var(--theme-bg-card)',
                  color: active ? 'white' : 'var(--theme-text-secondary)',
                  border: `1px solid ${active ? 'transparent' : 'var(--theme-border)'}`,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Grid grouped by category */}
        <div className="space-y-6">
          {groups.map(g => (
            <section key={g.category}>
              <h3
                className="text-sm font-bold mb-3 flex items-center gap-2"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                {IPA_CATEGORY_LABELS[g.category]}
                <span
                  className="text-caption font-normal px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'var(--theme-bg-secondary)',
                    color: 'var(--theme-text-muted)',
                  }}
                >
                  {g.items.length}
                </span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {g.items.map(s => (
                  <IpaSymbolCard
                    key={s.ipa + s.category}
                    symbol={s}
                    active={selected?.ipa === s.ipa && selected?.category === s.category}
                    onSelect={setSelected}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div ref={detailRef} className="mt-8 scroll-mt-4">
            <IpaDetailPanel symbol={selected} onClose={() => setSelected(null)} />
          </div>
        )}

        {/* Footer note */}
        <div
          className="mt-10 rounded-xl border p-4 text-xs leading-relaxed"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: 'var(--theme-bg-card)',
            color: 'var(--theme-text-muted)',
          }}
        >
          <strong style={{ color: ACCENT.examWriting }}>Lưu ý:</strong> âm IPA đứng một mình
          không phát âm tự nhiên được. Khi click nút loa, hệ thống sẽ đọc từ ví dụ tiêu biểu chứa âm đó
          qua giọng Coqui TTS (Thorsten) để bạn nghe trong ngữ cảnh thực tế.
        </div>
      </div>
    </div>
  );
}
