'use client';

import type { FC, CSSProperties } from 'react';

export function ProfileStatCard({
  label, value, color, icon: Icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: FC<{ size?: number; style?: CSSProperties; className?: string }>;
}) {
  return (
    <div
      className="group rounded-3xl border p-5 text-center relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
        backgroundImage: `radial-gradient(circle at 50% 0%, ${color}15, transparent 70%)`,
      }}
    >
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div
        className="w-11 h-11 rounded-2xl mx-auto flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 8px 20px ${color}33` }}
      >
        <Icon size={20} className="text-white" />
      </div>
      <div className="text-2xl font-black tracking-tight mb-1" style={{ color: 'var(--theme-text-primary)' }}>
        {value}
      </div>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40" style={{ color: 'var(--theme-text-muted)' }}>
        {label}
      </div>
    </div>
  );
}
