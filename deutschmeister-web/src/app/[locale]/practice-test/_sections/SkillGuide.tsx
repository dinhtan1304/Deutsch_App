'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { IconPenLine, IconMic, IconBookOpen, IconList, IconLightbulb, IconCheck } from '@/components/ui/Icons';
import { ACCENT } from '@/lib/tokens';
import {
  schreibenTemplateTelc, schreibenGoetheTeil1, schreibenGoetheTeil2, schreibenMistakes,
  sprechenRedemittel, sprechenGoetheCriteria, sprechenTelcTeile,
  lesenTips, sprachbausteineGroups,
  type TemplateStep,
} from '../_data/b1-content';

type GuideTab = 'schreiben' | 'sprechen' | 'lesen' | 'sprachbausteine';

const TAB_META: Record<GuideTab, {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}> = {
  schreiben: { label: 'Schreiben', icon: IconPenLine, color: ACCENT.writing },
  sprechen: { label: 'Sprechen', icon: IconMic, color: ACCENT.speaking },
  lesen: { label: 'Lesen', icon: IconBookOpen, color: 'var(--warn)' },
  sprachbausteine: { label: 'Sprachbausteine', icon: IconList, color: ACCENT.vocab },
};

export function SkillGuide() {
  const t = useTranslations('practice.guideB1.skill');
  const [tab, setTab] = useState<GuideTab>('schreiben');

  return (
    <section id="cam-nang" className="mb-12 scroll-mt-20">
      <div className="mb-5">
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          {t('title')}
        </h3>
        <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
          {t('subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex flex-wrap gap-1 p-1 rounded-xl mb-5"
        style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
        role="tablist"
        aria-label={t('tabAria')}
      >
        {(Object.keys(TAB_META) as GuideTab[]).map((t) => {
          const meta = TAB_META[t];
          const Icon = meta.icon;
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-body font-bold border transition-all"
              style={{
                background: active ? `color-mix(in srgb, ${meta.color} 16%, transparent)` : 'transparent',
                borderColor: active ? meta.color : 'transparent',
                color: active ? meta.color : 'var(--theme-text-secondary)',
              }}
            >
              <Icon size={14} />
              {meta.label}
            </button>
          );
        })}
      </div>

      <div style={{ ['--skill' as string]: TAB_META[tab].color } as React.CSSProperties}>
        {tab === 'schreiben' && <SchreibenPanel />}
        {tab === 'sprechen' && <SprechenPanel />}
        {tab === 'lesen' && <LesenPanel />}
        {tab === 'sprachbausteine' && <SprachbausteinePanel />}
      </div>
    </section>
  );
}

// ─── Schreiben ──────────────────────────────────────────────────────────────

function SchreibenPanel() {
  const t = useTranslations('practice.guideB1.skill');
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <TemplateBlock
        title={t('telcEmailTitle')}
        subtitle={t('telcEmailSub')}
        steps={schreibenTemplateTelc}
      />
      <TemplateBlock
        title={t('goetheT1Title')}
        subtitle={t('goetheT1Sub')}
        steps={schreibenGoetheTeil1}
      />
      <TemplateBlock
        title={t('goetheT2Title')}
        subtitle={t('goetheT2Sub')}
        steps={schreibenGoetheTeil2}
      />

      <div
        className="word-card-v2 rounded-2xl p-5 lg:col-span-3"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          border: '1px solid color-mix(in srgb, var(--skill) 26%, var(--theme-border))',
          ['--card-accent' as string]: 'var(--skill)',
        } as React.CSSProperties}
      >
        <h4 className="text-h3 font-bold mb-3 inline-flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
          <IconLightbulb size={18} style={{ color: 'var(--warn)' }} />
          {t('mistakesTitle')}
        </h4>
        <ul className="space-y-2">
          {schreibenMistakes.map((m) => (
            <li
              key={m}
              className="flex items-start gap-2 text-body"
              style={{ color: 'var(--theme-text-secondary)', lineHeight: 1.6 }}
            >
              <span style={{ color: 'var(--theme-text-muted)' }}>•</span>
              <span>{m}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TemplateBlock({
  title, subtitle, steps,
}: { title: string; subtitle: string; steps: TemplateStep[] }) {
  return (
    <div
      className="word-card-v2 rounded-2xl p-5"
      style={{
        backgroundColor: 'var(--theme-bg-card)',
        border: '1px solid color-mix(in srgb, var(--skill) 26%, var(--theme-border))',
        ['--card-accent' as string]: 'var(--skill)',
      } as React.CSSProperties}
    >
      <div className="mb-4">
        <h4 className="text-h3 font-bold" style={{ color: 'var(--skill)' }}>{title}</h4>
        <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{subtitle}</p>
      </div>
      <ol className="space-y-3">
        {steps.map((step, idx) => (
          <li key={step.label} className="flex gap-3">
            <span
              className="mono w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-caption font-bold mt-0.5"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--skill) 16%, transparent)',
                color: 'var(--skill)',
              }}
            >
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{step.label}</p>
              {step.example !== '...' && (
                <p
                  className="text-body italic my-1"
                  style={{ color: 'var(--theme-text-secondary)', lineHeight: 1.6 }}
                >
                  &ldquo;{step.example}&rdquo;
                </p>
              )}
              <p className="text-caption" style={{ color: 'var(--theme-text-muted)', lineHeight: 1.6 }}>{step.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─── Sprechen ───────────────────────────────────────────────────────────────

function SprechenPanel() {
  const t = useTranslations('practice.guideB1.skill');
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sprechenRedemittel.map((g) => (
        <div
          key={g.category}
          className="word-card-v2 rounded-2xl p-5"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            border: '1px solid color-mix(in srgb, var(--skill) 26%, var(--theme-border))',
            ['--card-accent' as string]: 'var(--skill)',
          } as React.CSSProperties}
        >
          <h4 className="text-h3 font-bold mb-3" style={{ color: 'var(--skill)' }}>{g.category}</h4>
          <ul className="space-y-1.5">
            {g.phrases.map((p) => (
              <li
                key={p}
                className="text-body"
                style={{ color: 'var(--theme-text-secondary)', lineHeight: 1.6 }}
              >
                • {p}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          border: '1px solid var(--theme-border)',
        }}
      >
        <h4 className="text-h3 font-bold mb-3" style={{ color: 'var(--skill)' }}>
          {t('goetheCriteriaTitle')}
        </h4>
        <ul className="space-y-2">
          {sprechenGoetheCriteria.map((c) => (
            <li key={c.name} className="flex items-start gap-2">
              <IconCheck size={16} style={{ color: 'var(--skill)', marginTop: 3 }} />
              <div>
                <p className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{c.name}</p>
                <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{c.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          border: '1px solid var(--theme-border)',
        }}
      >
        <h4 className="text-h3 font-bold mb-3" style={{ color: 'var(--skill)' }}>
          {t('telcTeileTitle')}
        </h4>
        <div className="space-y-3">
          {sprechenTelcTeile.map((t) => (
            <div key={t.teil}>
              <p className="text-body font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>{t.teil}</p>
              <ul className="space-y-1">
                {t.tips.map((tip) => (
                  <li
                    key={tip}
                    className="text-caption"
                    style={{ color: 'var(--theme-text-secondary)', lineHeight: 1.6 }}
                  >
                    • {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Lesen ──────────────────────────────────────────────────────────────────

function LesenPanel() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {lesenTips.map((tip, idx) => (
        <div
          key={tip.title}
          className="word-card-v2 rounded-2xl p-5"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            border: '1px solid var(--theme-border)',
            ['--card-accent' as string]: 'var(--warn)',
          } as React.CSSProperties}
        >
          <div className="flex items-baseline gap-2 mb-2">
            <span
              className="mono w-6 h-6 rounded-full flex items-center justify-center text-caption font-bold"
              style={{
                background: 'color-mix(in srgb, var(--warn) 18%, transparent)',
                color: 'var(--warn)',
              }}
            >
              {idx + 1}
            </span>
            <h4 className="text-h3 font-bold" style={{ color: 'var(--warn)' }}>{tip.title}</h4>
          </div>
          <p className="text-body" style={{ color: 'var(--theme-text-secondary)', lineHeight: 1.7 }}>
            {tip.description}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Sprachbausteine ────────────────────────────────────────────────────────

function SprachbausteinePanel() {
  const t = useTranslations('practice.guideB1.skill');
  return (
    <>
      <div
        className="rounded-2xl p-4 mb-4 text-body"
        style={{
          background: 'color-mix(in srgb, var(--skill) 8%, var(--theme-bg-secondary))',
          border: '1px solid color-mix(in srgb, var(--skill) 26%, transparent)',
          color: 'var(--theme-text-secondary)',
        }}
      >
        <span className="font-bold" style={{ color: 'var(--skill)' }}>{t('sprachHintLabel')}</span>{' '}
        {t.rich('sprachHintBody', { b: (chunks) => <span className="font-bold">{chunks}</span> })}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {sprachbausteineGroups.map((g) => (
          <div
            key={g.title}
            className="word-card-v2 rounded-2xl p-5"
            style={{
              backgroundColor: 'var(--theme-bg-card)',
              border: '1px solid color-mix(in srgb, var(--skill) 26%, var(--theme-border))',
              ['--card-accent' as string]: 'var(--skill)',
            } as React.CSSProperties}
          >
            <h4 className="text-h3 font-bold mb-3" style={{ color: 'var(--skill)' }}>{g.title}</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {g.items.map((item) => (
                <li
                  key={item}
                  className="text-body"
                  style={{ color: 'var(--theme-text-secondary)', lineHeight: 1.5 }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
