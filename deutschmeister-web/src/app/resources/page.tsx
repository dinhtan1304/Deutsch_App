'use client';
/* eslint-disable no-restricted-syntax */

import { useMemo, useState } from 'react';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import Link from 'next/link';
import {
  AUTHENTIC_RESOURCES,
  LEVEL_LABELS,
  SKILL_LABELS,
  TYPE_LABELS,
  type AuthenticResource,
  type ResourceLevel,
  type ResourceSkill,
  type ResourceType,
} from '@/data/authentic-resources';
import {
  IconChevronLeft, IconGlobe, IconFileText, IconVideo, IconMicrophone,
  IconExternalLink, IconSearch, IconLock, IconBook, IconZap, IconStar, IconShieldCheck
} from '@/components/ui/Icons';

const LEVEL_COLORS: Record<ResourceLevel, string> = {
  A1: '#10B981',
  A2: ACCENT.srs,
  B1: ACCENT.vocab,
  B2: ACCENT.xp,
  C1: STATUS.danger,
};

const TYPE_ICONS: Record<ResourceType, React.ElementType> = {
  news: IconFileText,
  podcast: IconMicrophone,
  video: IconVideo,
  blog: IconBook,
  website: IconGlobe,
  youtube: IconVideo,
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
    <div className="min-h-screen py-10 px-4" style={{ backgroundColor: 'var(--theme-bg-body)', backgroundImage: 'radial-gradient(circle at 50% -20%, var(--color-accent-brand)12, transparent 70%)' }}>
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-12 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 transition-all hover:bg-theme-bg-secondary"
            style={{ color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}
          >
            <IconChevronLeft size={12} />
            Dashboard
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4" style={{ color: 'var(--theme-text-primary)' }}>
            Tài nguyên <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-emerald-500 to-amber-500">Bản xứ</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-body font-medium leading-relaxed opacity-70" style={{ color: 'var(--theme-text-muted)' }}>
            Thư viện tổng hợp từ báo chí, truyền hình và podcast Đức — giúp bạn rèn luyện kỹ năng với ngôn ngữ thực tế.
          </p>
        </div>

        {/* Disclaimer / Notice */}
        <div className="max-w-3xl mx-auto mb-10 p-5 rounded-[1.5rem] border flex items-start gap-4 transition-all hover:shadow-lg"
          style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', backgroundImage: 'linear-gradient(135deg, rgba(245,158,11,0.05) 0%, transparent 100%)' }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
            <IconShieldCheck size={20} className="text-amber-500" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-amber-500 mb-1">Lưu ý bản quyền</h4>
            <p className="text-xs leading-relaxed opacity-60" style={{ color: 'var(--theme-text-muted)' }}>
              Đây là các liên kết đến tài nguyên bên thứ ba. Chúng tôi không sở hữu nội dung và khuyến khích bạn tuân thủ các quy định của nhà cung cấp.
            </p>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="mb-10 p-6 rounded-[2rem] border shadow-xl backdrop-blur-md"
          style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Level Filter */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <IconZap size={14} className="text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--theme-text-muted)' }}>Trình độ</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'A1', 'A2', 'B1', 'B2', 'C1'] as const).map((lv) => {
                  const active = levelFilter === lv;
                  const color = lv === 'all' ? 'var(--theme-text-primary)' : LEVEL_COLORS[lv];
                  return (
                    <button
                      key={lv}
                      onClick={() => setLevelFilter(lv)}
                      className="px-4 py-2 rounded-xl text-[11px] font-black transition-all duration-300 relative group overflow-hidden"
                      style={{
                        backgroundColor: active ? (lv === 'all' ? ACCENT.writing : color) : 'var(--theme-bg-secondary)44',
                        color: active ? 'white' : 'var(--theme-text-muted)',
                        border: `1.5px solid ${active ? 'transparent' : 'var(--theme-border)'}`,
                        boxShadow: active ? `0 8px 20px ${lv === 'all' ? ACCENT.writing : color}44` : 'none'
                      }}
                    >
                      {LEVEL_LABELS[lv]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skill Filter */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <IconSearch size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--theme-text-muted)' }}>Kỹ năng</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'reading', 'listening'] as const).map((sk) => {
                  const active = skillFilter === sk;
                  return (
                    <button
                      key={sk}
                      onClick={() => setSkillFilter(sk)}
                      className="px-4 py-2 rounded-xl text-[11px] font-black transition-all duration-300"
                      style={{
                        backgroundColor: active ? '#10B981' : 'var(--theme-bg-secondary)44',
                        color: active ? 'white' : 'var(--theme-text-muted)',
                        border: `1.5px solid ${active ? 'transparent' : 'var(--theme-border)'}`,
                        boxShadow: active ? '0 8px 20px rgba(16,185,129,0.3)' : 'none'
                      }}
                    >
                      {SKILL_LABELS[sk]}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center gap-3 mb-6 px-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-theme-border to-transparent opacity-30" />
          <span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: 'var(--theme-text-muted)' }}>
            {filtered.length} Tài nguyên tìm thấy
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-theme-border via-theme-border to-transparent opacity-30" />
        </div>

        {/* Results Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-[2rem] p-16 text-center border-2 border-dashed"
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)44' }}>
            <div className="w-16 h-16 rounded-full bg-theme-bg-secondary flex items-center justify-center mx-auto mb-4 opacity-50">
              <IconSearch size={32} />
            </div>
            <p className="text-lg font-bold opacity-50" style={{ color: 'var(--theme-text-muted)' }}>
              Không tìm thấy tài nguyên phù hợp...
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
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
  const TypeIcon = TYPE_ICONS[resource.type] || IconGlobe;

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-[2rem] border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden"
      style={{
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
        backgroundImage: `radial-gradient(circle at 100% 100%, ${color}08, transparent 70%)`
      }}
    >
      {/* Decorative background glow */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 blur-[60px] transition-all group-hover:opacity-40" 
           style={{ backgroundColor: color, opacity: 0.1 }} />

      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
               style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 8px 15px ${color}33` }}>
            <TypeIcon size={18} className="text-white" />
          </div>
          
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
            style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}>
            {resource.level}
          </span>
          
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 opacity-50"
            style={{ color: 'var(--theme-text-muted)' }}>
            {TYPE_LABELS[resource.type]}
          </span>

          {!resource.free && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <IconLock size={10} />
              Paid
            </div>
          )}
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover:bg-white/5" style={{ color: 'var(--theme-text-muted)' }}>
          <IconExternalLink size={16} />
        </div>
      </div>

      <h3 className="text-lg font-black leading-tight mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r transition-all"
          style={{ color: 'var(--theme-text-primary)', backgroundImage: `linear-gradient(to right, white, ${color})` }}>
        {resource.titleVi}
      </h3>
      
      <div className="flex items-center gap-2 mb-4">
        <div className="h-px w-4" style={{ backgroundColor: color, opacity: 0.5 }} />
        <p className="text-[11px] font-bold uppercase tracking-widest truncate" style={{ color }}>
          {resource.title} · {resource.source}
        </p>
      </div>

      <p className="text-sm font-medium leading-relaxed opacity-60 line-clamp-3" style={{ color: 'var(--theme-text-secondary)' }}>
        {resource.descriptionVi}
      </p>
      
      {/* Bottom accent bar */}
      <div className="absolute bottom-0 left-6 right-6 h-1 rounded-t-full transition-all scale-x-0 group-hover:scale-x-100"
           style={{ backgroundColor: color, opacity: 0.5 }} />
    </a>
  );
}
