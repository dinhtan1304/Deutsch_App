'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AUTHENTIC_RESOURCES,
  LEVEL_LABELS,
  SKILL_LABELS,
  TYPE_ICONS,
  TYPE_LABELS,
  type AuthenticResource,
  type ResourceLevel,
  type ResourceSkill,
} from '@/data/authentic-resources';

const LEVEL_COLORS: Record<ResourceLevel, string> = {
  A1: '#22C55E',
  A2: '#3B82F6',
  B1: '#8B5CF6',
  B2: '#F59E0B',
  C1: '#EF4444',
};

type LevelFilter = ResourceLevel | 'all';
type SkillFilter = ResourceSkill;

export default function ResourcesPage() {
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [skillFilter, setSkillFilter] = useState<SkillFilter>('all');

  const filtered = useMemo(() => {
    return AUTHENTIC_RESOURCES.filter((r) => {
      if (levelFilter !== 'all' && r.level !== levelFilter) return false;
      if (skillFilter !== 'all' && r.skill !== 'all' && r.skill !== skillFilter) return false;
      return true;
    });
  }, [levelFilter, skillFilter]);

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
            ← Dashboard
          </Link>
          <h1
            className="text-2xl md:text-3xl font-bold flex items-center gap-2"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            <span>🌐</span> Tài nguyên tiếng Đức thật
          </h1>
          <p className="text-[13px] mt-2" style={{ color: 'var(--theme-text-muted)' }}>
            Tài nguyên gốc từ báo, đài, podcast Đức — giúp bạn luyện tai và mắt với tiếng Đức thật.
          </p>
        </div>

        {/* Disclaimer */}
        <div
          className="rounded-xl p-3 mb-5 flex items-start gap-2 text-[12px]"
          style={{
            backgroundColor: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            color: 'var(--theme-text-secondary)',
          }}
        >
          <span>ℹ️</span>
          <span>
            Các tài nguyên bên ngoài. Chúng tôi không kiểm soát nội dung và không chịu trách
            nhiệm về những thay đổi từ bên thứ ba.
          </span>
        </div>

        {/* Level filter */}
        <div className="mb-3">
          <div className="text-[11px] font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
            Trình độ
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'A1', 'A2', 'B1', 'B2', 'C1'] as const).map((lv) => {
              const active = levelFilter === lv;
              const color = lv === 'all' ? '#6366F1' : LEVEL_COLORS[lv];
              return (
                <button
                  key={lv}
                  onClick={() => setLevelFilter(lv)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all"
                  style={{
                    backgroundColor: active ? color : 'var(--theme-bg-card)',
                    color: active ? 'white' : color,
                    border: `1.5px solid ${active ? color : 'var(--theme-border)'}`,
                  }}
                >
                  {LEVEL_LABELS[lv]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Skill filter */}
        <div className="mb-5">
          <div className="text-[11px] font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
            Kỹ năng
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'reading', 'listening'] as const).map((sk) => {
              const active = skillFilter === sk;
              return (
                <button
                  key={sk}
                  onClick={() => setSkillFilter(sk)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all"
                  style={{
                    backgroundColor: active ? '#6366F1' : 'var(--theme-bg-card)',
                    color: active ? 'white' : 'var(--theme-text-secondary)',
                    border: `1.5px solid ${active ? '#6366F1' : 'var(--theme-border)'}`,
                  }}
                >
                  {SKILL_LABELS[sk]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}
          >
            <p style={{ color: 'var(--theme-text-muted)' }}>Không có tài nguyên phù hợp bộ lọc.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {filtered.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResourceCard({ resource }: { resource: AuthenticResource }) {
  const color = LEVEL_COLORS[resource.level];

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[18px]">{TYPE_ICONS[resource.type]}</span>
          <span
            className="px-2 py-0.5 rounded-md text-[10px] font-bold"
            style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}35` }}
          >
            {resource.level}
          </span>
          <span
            className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}
          >
            {TYPE_LABELS[resource.type]}
          </span>
          {!resource.free && (
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
              style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}
            >
              Có trả phí
            </span>
          )}
        </div>
        <span style={{ color: 'var(--theme-text-muted)', fontSize: 14 }}>↗</span>
      </div>

      <h3 className="text-[15px] font-bold mb-0.5" style={{ color: 'var(--theme-text-primary)' }}>
        {resource.titleVi}
      </h3>
      <p className="text-[11px] italic mb-2" style={{ color }}>
        {resource.title} · {resource.source}
      </p>
      <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
        {resource.descriptionVi}
      </p>
    </a>
  );
}
