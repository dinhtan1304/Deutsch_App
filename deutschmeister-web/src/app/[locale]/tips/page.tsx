'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
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

// ─── Gender color map — v2 article tokens (der=blue, die=pink, das=green) ───
const GENDER_COLORS = {
  masculine: { color: 'var(--der)', label: 'DER' },
  feminine:  { color: 'var(--die)', label: 'DIE' },
  neuter:    { color: 'var(--das)', label: 'DAS' },
};
// Subtle calm tint of a gender/accent color over the card surface.
const tint = (c: string, pct = 6) => `color-mix(in srgb, ${c} ${pct}%, var(--theme-bg-card))`;

type TabType = 'all' | 'der' | 'die' | 'das' | 'tricks';

type TabKey = 'tabAll' | 'tabTricks';
const TABS: { id: TabType; labelKey?: TabKey; literal?: string; color: string }[] = [
  { id: 'all',    labelKey: 'tabAll',    color: 'var(--accent)' },
  { id: 'der',    literal: 'der',        color: 'var(--der)' },
  { id: 'die',    literal: 'die',        color: 'var(--die)' },
  { id: 'das',    literal: 'das',        color: 'var(--das)' },
  { id: 'tricks', labelKey: 'tabTricks', color: 'var(--warn)' },
];

// ─── Rule Card ───
function RuleCard({ rule }: { rule: GenderRule }) {
  const t = useTranslations('learn.tips');
  const gc = GENDER_COLORS[rule.gender];
  return (
    <div className="rounded-[13px] border p-4 transition-transform duration-200 hover:-translate-y-0.5"
      style={{ backgroundColor: tint(gc.color), borderColor: gc.color }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-bold" style={{ color: gc.color }}>
          {rule.type === 'ending' && t('endingPrefix', { pattern: rule.pattern.replace('$', '') })}
          {rule.type === 'prefix' && t('prefixPrefix', { pattern: rule.pattern.replace('^', '') })}
          {rule.type === 'category' && rule.description}
          {rule.type === 'special' && rule.description}
        </h3>
        <span className="mono px-2 py-0.5 rounded-full text-caption font-bold shrink-0"
          style={{ backgroundColor: `color-mix(in srgb, ${gc.color} 16%, transparent)`, color: gc.color }}>
          {rule.reliability}%
        </span>
      </div>

      <p className="text-body mb-2.5" style={{ color: 'var(--theme-text-secondary)' }}>
        {rule.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {rule.examples.map((ex, i) => (
          <span key={i} className="px-2 py-0.5 rounded-md text-xs font-semibold"
            style={{ backgroundColor: `color-mix(in srgb, ${gc.color} 14%, transparent)`, color: gc.color }}>
            {ex}
          </span>
        ))}
      </div>

      {rule.exceptions && rule.exceptions.length > 0 && (
        <p className="text-caption flex items-center gap-1" style={{ color: 'var(--theme-text-muted)' }}>
          <IconAlertTriangle size={12} style={{ color: 'var(--warn)' }} />
          {t('exceptions', { list: rule.exceptions.join(', ') })}
        </p>
      )}
    </div>
  );
}

export default function TipsPage() {
  const t = useTranslations('learn.tips');
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const learnTips: { num: string; titleKey: 'learnTip1Title' | 'learnTip2Title' | 'learnTip3Title' | 'learnTip4Title' | 'learnTip5Title'; descKey: 'learnTip1Desc' | 'learnTip2Desc' | 'learnTip3Desc' | 'learnTip4Desc' | 'learnTip5Desc' }[] = [
    { num: '1', titleKey: 'learnTip1Title', descKey: 'learnTip1Desc' },
    { num: '2', titleKey: 'learnTip2Title', descKey: 'learnTip2Desc' },
    { num: '3', titleKey: 'learnTip3Title', descKey: 'learnTip3Desc' },
    { num: '4', titleKey: 'learnTip4Title', descKey: 'learnTip4Desc' },
    { num: '5', titleKey: 'learnTip5Title', descKey: 'learnTip5Desc' },
  ];

  return (
      <div className="max-w-360 mx-auto py-6">

        {/* ─── Header ─── */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-md flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--warn) 16%, transparent)', border: '1px solid color-mix(in srgb, var(--warn) 30%, transparent)', color: 'var(--warn)' }}>
              <IconLightbulb size={22} />
            </div>
            <div>
              <h1 className="font-bold" style={{ fontSize: 30, letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>
                {t('title')}
              </h1>
              <p className="text-body mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
                {t('subtitle')}
              </p>
            </div>
          </div>
          <Link href="/words"
            className="flex items-center gap-1 px-3 py-2 rounded-[10px] border text-body font-semibold transition-transform duration-200 hover:-translate-y-0.5 shrink-0"
            style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
            <IconChevronLeft size={14} /> {t('dictionaryLink')}
          </Link>
        </div>

        {/* ─── Quick Reference ─── */}
        <div className="rounded-2xl border overflow-hidden mb-6"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--warn) 16%, transparent)', color: 'var(--warn)' }}>
              <IconZap size={16} />
            </div>
            <h2 className="text-base font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('quickRef')}</h2>
          </div>
          <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['der', 'die', 'das'] as const).map(article => {
              const gender = article === 'der' ? 'masculine' : article === 'die' ? 'feminine' : 'neuter';
              const gc = GENDER_COLORS[gender];
              const endings = quickReference[article];
              return (
                <div key={article} className="rounded-[13px] border p-4"
                  style={{ backgroundColor: tint(gc.color), borderColor: gc.color }}>
                  <div className="text-sm font-bold mb-2" style={{ color: gc.color }}>
                    {gc.label}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {endings.map((e, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md text-xs font-semibold"
                        style={{ backgroundColor: `color-mix(in srgb, ${gc.color} 16%, transparent)`, color: gc.color }}>
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
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] border text-body font-semibold whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5"
                style={isActive
                  ? { background: `color-mix(in srgb, ${tab.color} 14%, transparent)`, borderColor: tab.color, color: tab.color }
                  : { background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }
                }>
                {tab.id === 'tricks' && <IconBrain size={14} />}
                {tab.labelKey ? t(tab.labelKey) : tab.literal}
              </button>
            );
          })}
        </div>

        {/* ─── Memory Tricks ─── */}
        {(activeTab === 'all' || activeTab === 'tricks') && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-[9px] flex items-center justify-center"
                style={{ background: 'color-mix(in srgb, var(--warn) 16%, transparent)', color: 'var(--warn)' }}>
                <IconBrain size={14} />
              </div>
              <h2 className="text-title font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                {t('tricksTitle')}
              </h2>
            </div>
            <div className="grid gap-3">
              {memoryTricks.map((trick, i) => {
                const gc = GENDER_COLORS[trick.gender];
                return (
                  <div key={i} className="rounded-[13px] border p-4 transition-transform duration-200 hover:-translate-y-0.5"
                    style={{ backgroundColor: tint(gc.color), borderColor: gc.color }}>
                    <h3 className="text-sm font-bold mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>
                      {trick.title}
                    </h3>
                    <p className="text-base italic mb-1.5 font-medium" style={{ color: gc.color }}>
                      &ldquo;{trick.rhyme}&rdquo;
                    </p>
                    <p className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>
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
              <div className="w-7 h-7 rounded-[9px] flex items-center justify-center"
                style={{ background: 'color-mix(in srgb, var(--der) 16%, transparent)', color: 'var(--der)' }}>
                <IconShield size={14} />
              </div>
              <h2 className="text-title font-bold" style={{ color: 'var(--der)' }}>
                {t('rulesDer')}
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
              <div className="w-7 h-7 rounded-[9px] flex items-center justify-center"
                style={{ background: 'color-mix(in srgb, var(--die) 16%, transparent)', color: 'var(--die)' }}>
                <IconShield size={14} />
              </div>
              <h2 className="text-title font-bold" style={{ color: 'var(--die)' }}>
                {t('rulesDie')}
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
              <div className="w-7 h-7 rounded-[9px] flex items-center justify-center"
                style={{ background: 'color-mix(in srgb, var(--das) 16%, transparent)', color: 'var(--das)' }}>
                <IconShield size={14} />
              </div>
              <h2 className="text-title font-bold" style={{ color: 'var(--das)' }}>
                {t('rulesDas')}
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
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--violet) 16%, transparent)', color: 'var(--violet)' }}>
              <IconBookOpen size={16} />
            </div>
            <h2 className="text-base font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('learnTipsTitle')}</h2>
          </div>
          <div className="px-5 pb-5 space-y-3">
            {learnTips.map(tip => (
              <div key={tip.num} className="flex items-start gap-3 py-2">
                <div className="mono w-7 h-7 rounded-[9px] flex items-center justify-center shrink-0 text-xs font-bold"
                  style={{ background: 'color-mix(in srgb, var(--violet) 16%, transparent)', color: 'var(--violet)' }}>
                  {tip.num}
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{t(tip.titleKey)}</div>
                  <div className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>{t(tip.descKey)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
  );
}