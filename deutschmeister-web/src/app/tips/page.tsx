'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  derRules,
  dieRules,
  dasRules,
  memoryTricks,
  quickReference,
  GenderRule,
} from '@/lib/genderRules';

// ─── Inline SVG Icons ───
function IconLightbulb({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" /><path d="M10 22h4" />
    </svg>
  );
}
function IconZap({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function IconBrain({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M12 5v13" />
    </svg>
  );
}
function IconBookOpen({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
function IconShield({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconChevronLeft({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function IconAlertTriangle({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  );
}

// ─── Color map ───
const GENDER_COLORS = {
  masculine: { color: '#3B82F6', bg: 'rgba(59,130,246,.08)', border: 'rgba(59,130,246,.2)', label: 'DER' },
  feminine:  { color: '#EC4899', bg: 'rgba(236,72,153,.08)', border: 'rgba(236,72,153,.2)', label: 'DIE' },
  neuter:    { color: '#22C55E', bg: 'rgba(34,197,94,.08)',  border: 'rgba(34,197,94,.2)',  label: 'DAS' },
};

type TabType = 'all' | 'der' | 'die' | 'das' | 'tricks';

const TABS: { id: TabType; label: string; color: string }[] = [
  { id: 'all',    label: 'Tất cả',  color: '#6B7280' },
  { id: 'der',    label: 'der',     color: '#3B82F6' },
  { id: 'die',    label: 'die',     color: '#EC4899' },
  { id: 'das',    label: 'das',     color: '#22C55E' },
  { id: 'tricks', label: 'Mẹo nhớ', color: '#F59E0B' },
];

// ─── Rule Card ───
function RuleCard({ rule }: { rule: GenderRule }) {
  const gc = GENDER_COLORS[rule.gender];
  return (
    <div className="rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{ backgroundColor: gc.bg, borderLeft: `4px solid ${gc.color}` }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-[14px] font-bold" style={{ color: gc.color }}>
          {rule.type === 'ending' && `Đuôi ${rule.pattern.replace('$', '')}`}
          {rule.type === 'prefix' && `Tiền tố ${rule.pattern.replace('^', '')}`}
          {rule.type === 'category' && rule.description}
          {rule.type === 'special' && rule.description}
        </h3>
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white shrink-0"
          style={{ backgroundColor: gc.color }}>
          {rule.reliability}%
        </span>
      </div>

      <p className="text-[13px] mb-2.5" style={{ color: 'var(--theme-text-secondary)' }}>
        {rule.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {rule.examples.map((ex, i) => (
          <span key={i} className="px-2 py-0.5 rounded-md text-[12px] font-semibold"
            style={{ backgroundColor: `${gc.color}15`, color: gc.color }}>
            {ex}
          </span>
        ))}
      </div>

      {rule.exceptions && rule.exceptions.length > 0 && (
        <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--theme-text-muted)' }}>
          <IconAlertTriangle size={12} style={{ color: '#F59E0B' }} />
          Ngoại lệ: {rule.exceptions.join(', ')}
        </p>
      )}
    </div>
  );
}

export default function TipsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');

  return (
    <MainLayout>
      <div className="py-6">

        {/* ─── Header ─── */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #F97316)' }}>
              <IconLightbulb size={22} style={{ color: 'white' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                Mẹo nhớ Der / Die / Das
              </h1>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                Các quy tắc giúp bạn đoán đúng mạo từ tiếng Đức
              </p>
            </div>
          </div>
          <Link href="/words"
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
            <IconChevronLeft size={14} /> Từ điển
          </Link>
        </div>

        {/* ─── Quick Reference ─── */}
        <div className="rounded-2xl border overflow-hidden mb-6"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #F59E0Bcc)' }}>
              <IconZap size={16} style={{ color: 'white' }} />
            </div>
            <h2 className="text-[16px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>Tra cứu nhanh</h2>
          </div>
          <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['der', 'die', 'das'] as const).map(article => {
              const gender = article === 'der' ? 'masculine' : article === 'die' ? 'feminine' : 'neuter';
              const gc = GENDER_COLORS[gender];
              const endings = quickReference[article];
              return (
                <div key={article} className="rounded-xl p-4"
                  style={{ backgroundColor: gc.bg, borderLeft: `4px solid ${gc.color}` }}>
                  <div className="text-[14px] font-bold mb-2" style={{ color: gc.color }}>
                    {gc.label}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {endings.map((e, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md text-[12px] font-semibold"
                        style={{ backgroundColor: `${gc.color}18`, color: gc.color }}>
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5"
                style={isActive
                  ? { background: `linear-gradient(135deg, ${tab.color}, ${tab.color}cc)`, color: 'white', boxShadow: `0 4px 12px ${tab.color}30` }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                }>
                {tab.id === 'tricks' && <IconBrain size={14} />}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ─── Memory Tricks ─── */}
        {(activeTab === 'all' || activeTab === 'tricks') && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #F59E0Bcc)' }}>
                <IconBrain size={14} style={{ color: 'white' }} />
              </div>
              <h2 className="text-[18px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                Câu vần dễ nhớ
              </h2>
            </div>
            <div className="grid gap-3">
              {memoryTricks.map((trick, i) => {
                const gc = GENDER_COLORS[trick.gender];
                return (
                  <div key={i} className="rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5"
                    style={{ backgroundColor: gc.bg, borderLeft: `4px solid ${gc.color}` }}>
                    <h3 className="text-[14px] font-bold mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>
                      {trick.title}
                    </h3>
                    <p className="text-[16px] italic mb-1.5 font-medium" style={{ color: gc.color }}>
                      &ldquo;{trick.rhyme}&rdquo;
                    </p>
                    <p className="text-[13px]" style={{ color: 'var(--theme-text-secondary)' }}>
                      → {trick.translation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── DER Rules ─── */}
        {(activeTab === 'all' || activeTab === 'der') && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #3B82F6cc)' }}>
                <IconShield size={14} style={{ color: 'white' }} />
              </div>
              <h2 className="text-[18px] font-bold" style={{ color: '#3B82F6' }}>
                Quy tắc DER (Maskulinum)
              </h2>
            </div>
            <div className="grid gap-3">
              {derRules.map(rule => <RuleCard key={rule.id} rule={rule} />)}
            </div>
          </div>
        )}

        {/* ─── DIE Rules ─── */}
        {(activeTab === 'all' || activeTab === 'die') && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #EC4899, #EC4899cc)' }}>
                <IconShield size={14} style={{ color: 'white' }} />
              </div>
              <h2 className="text-[18px] font-bold" style={{ color: '#EC4899' }}>
                Quy tắc DIE (Femininum)
              </h2>
            </div>
            <div className="grid gap-3">
              {dieRules.map(rule => <RuleCard key={rule.id} rule={rule} />)}
            </div>
          </div>
        )}

        {/* ─── DAS Rules ─── */}
        {(activeTab === 'all' || activeTab === 'das') && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #22C55E, #22C55Ecc)' }}>
                <IconShield size={14} style={{ color: 'white' }} />
              </div>
              <h2 className="text-[18px] font-bold" style={{ color: '#22C55E' }}>
                Quy tắc DAS (Neutrum)
              </h2>
            </div>
            <div className="grid gap-3">
              {dasRules.map(rule => <RuleCard key={rule.id} rule={rule} />)}
            </div>
          </div>
        )}

        {/* ─── Learning Tips ─── */}
        <div className="rounded-2xl border overflow-hidden"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #8B5CF6cc)' }}>
              <IconBookOpen size={16} style={{ color: 'white' }} />
            </div>
            <h2 className="text-[16px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>Lời khuyên học tập</h2>
          </div>
          <div className="px-5 pb-5 space-y-3">
            {[
              { num: '1', text: 'Học cùng mạo từ', desc: 'Luôn học "der Tisch" thay vì chỉ "Tisch"' },
              { num: '2', text: 'Dùng màu sắc', desc: 'der = xanh, die = hồng, das = xanh lá' },
              { num: '3', text: 'Hình ảnh hóa', desc: 'Tưởng tượng der = đàn ông, die = phụ nữ, das = em bé cầm vật đó' },
              { num: '4', text: 'Học theo nhóm đuôi', desc: 'Gom các từ cùng đuôi để nhớ quy tắc' },
              { num: '5', text: 'Ôn tập SRS', desc: 'Dùng tính năng SRS Review để nhớ lâu hơn' },
            ].map(tip => (
              <div key={tip.num} className="flex items-start gap-3 py-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[12px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #8B5CF6cc)' }}>
                  {tip.num}
                </div>
                <div>
                  <div className="text-[14px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{tip.text}</div>
                  <div className="text-[13px]" style={{ color: 'var(--theme-text-secondary)' }}>{tip.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </MainLayout>
  );
}