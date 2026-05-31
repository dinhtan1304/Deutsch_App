'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ACCENT, GRADIENT, type AccentKey } from '@/lib/tokens';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStats } from '@/hooks/useProgress';
import {
  IconGamepad, IconTarget, IconClock, IconPenTool, IconLayers,
  IconBookOpen, IconLink, IconHeadphones, IconSpellCheck,
  IconLightbulb, IconKeyboard, IconFlame, IconZap, KBD,
  IconChevronRight,
} from '@/components/games/GameUI';

// Game metadata: structural only (id, icon, accent, href). Display name +
// description are looked up at render via `games.definitions.<id>`. The
// `enName` field is a stable, locale-independent fallback shown when no
// translation is available.
type GameCat = 'vocab' | 'grammar' | 'audio' | 'speed';
type GameDef = {
  id: string;
  enName: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  accent: AccentKey;
  href: string;
  badge?: string;
  cat: GameCat;
  diff: 1 | 2 | 3;       // Dễ / TB / Khó — static metadata
  minutes: number;        // estimated session length
};

const games: GameDef[] = [
  { id: 'gender-quiz',     enName: 'Gender Quiz',      icon: IconTarget,      accent: 'srs',       href: '/games/gender-quiz',   cat: 'grammar', diff: 2, minutes: 3 },
  { id: 'timed-challenge', enName: 'Timed Challenge',  icon: IconClock,       accent: 'speaking',  href: '/games/time-challenge', cat: 'speed',  diff: 3, minutes: 2 },
  { id: 'fill-blank',      enName: 'Fill in the Blank', icon: IconPenTool,    accent: 'vocab',     href: '/games/fill-blank',    cat: 'grammar', diff: 3, minutes: 5 },
  { id: 'flashcards',      enName: 'Flashcards',       icon: IconLayers,      accent: 'reading',   href: '/games/flashcards',    cat: 'vocab',   diff: 1, minutes: 5 },
  { id: 'srs-review',      enName: 'SRS Review',       icon: IconBookOpen,    accent: 'xp',        href: '/review', badge: 'SM-2', cat: 'vocab',  diff: 2, minutes: 10 },
  { id: 'word-match',      enName: 'Word Match',       icon: IconLink,        accent: 'cyan',      href: '/games/word-match',    cat: 'vocab',   diff: 1, minutes: 3 },
  { id: 'listening',       enName: 'Listening Quiz',   icon: IconHeadphones,  accent: 'games',     href: '/games/listening',     cat: 'audio',   diff: 2, minutes: 4 },
  { id: 'spelling',        enName: 'Spelling Bee',     icon: IconSpellCheck,  accent: 'listening', href: '/games/spelling',      cat: 'audio',   diff: 3, minutes: 5 },
  { id: 'typing',          enName: 'Typing speed',     icon: IconKeyboard,    accent: 'games',     href: '/games/typing',        cat: 'audio',   diff: 1, minutes: 1 },
];

const GAME_CATEGORIES: { id: GameCat; color: string }[] = [
  { id: 'vocab', color: ACCENT.srs },
  { id: 'grammar', color: ACCENT.vocab },
  { id: 'audio', color: ACCENT.listening },
  { id: 'speed', color: ACCENT.speaking },
];

const fallbackRecommendationIds = ['gender-quiz', 'flashcards', 'timed-challenge'];

function gradientFor(accent: AccentKey) {
  const map: Partial<Record<AccentKey, string>> = {
    brand: GRADIENT.brand,
    srs: GRADIENT.action,
    speaking: GRADIENT.speaking,
    vocab: GRADIENT.vocab,
    reading: GRADIENT.reading,
    xp: GRADIENT.xp,
    cyan: GRADIENT.dictation,
    games: GRADIENT.xp,
    listening: GRADIENT.listening,
  };
  return map[accent] ?? GRADIENT.brand;
}

// Difficulty rendered as 3 bars (filled = current level).
function DiffBars({ diff, color }: { diff: 1 | 2 | 3; color: string }) {
  return (
    <span className="inline-flex items-end gap-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1 rounded-full"
          style={{ height: 5 + i * 3, background: i < diff ? color : 'var(--theme-border)' }}
        />
      ))}
    </span>
  );
}

function GameMeta({ game, color }: { game: GameDef; color: string }) {
  const t = useTranslations('games');
  return (
    <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
      <span className="inline-flex items-center gap-1">
        <IconClock size={12} />
        {t('hub.minutesShort', { min: game.minutes })}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <DiffBars diff={game.diff} color={color} />
        {t(`hub.diff${game.diff}` as 'hub.diff1')}
      </span>
    </div>
  );
}

function GameCard({ game, onPlay }: { game: GameDef; onPlay: () => void }) {
  const t = useTranslations('games');
  const Icon = game.icon;
  const color = ACCENT[game.accent];

  return (
    <Link href={game.href} onClick={onPlay} className="block h-full outline-none">
      <div
        className="word-card-v2 flex h-full flex-col rounded-[14px] p-4"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          border: '1px solid var(--theme-border)',
          ['--card-accent' as string]: color,
        } as React.CSSProperties}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 24%, transparent)`, color }}
          >
            <Icon size={21} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-[15px] font-extrabold" style={{ letterSpacing: '-.01em', color: 'var(--theme-text-primary)' }}>
                {t(`definitions.${game.id}.nameVi` as 'definitions.gender-quiz.nameVi')}
              </h3>
              {game.badge && (
                <span className="mono shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-black text-white" style={{ background: gradientFor(game.accent) }}>
                  {game.badge}
                </span>
              )}
            </div>
            <p className="mono text-[11px] font-semibold" style={{ color }}>
              {game.enName}
            </p>
          </div>
        </div>
        <p className="mt-3 flex-1 text-[12.5px] leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
          {t(`definitions.${game.id}.description` as 'definitions.gender-quiz.description')}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-dashed pt-3" style={{ borderColor: 'var(--theme-border)' }}>
          <GameMeta game={game} color={color} />
          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider" style={{ color }}>
            {t('hub.play')}
            <IconChevronRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}

// Primary recommendation: large gradient row inside the recommend hero.
function PrimaryPick({ game, reason, onPlay }: { game: GameDef; reason: string; onPlay: () => void }) {
  const t = useTranslations('games');
  const Icon = game.icon;
  return (
    <Link href={game.href} onClick={onPlay} className="group block outline-none">
      <div
        className="flex h-full flex-col justify-between rounded-2xl p-5 text-white transition-transform group-hover:-translate-y-0.5"
        style={{ background: gradientFor(game.accent), boxShadow: `0 8px 24px color-mix(in srgb, ${ACCENT[game.accent]} 30%, transparent)` }}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,.18)' }}>
              <Icon size={22} />
            </div>
            <span className="mono rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide" style={{ background: 'rgba(255,255,255,.18)' }}>
              {reason}
            </span>
          </div>
          <h3 className="mt-3 text-[20px] font-extrabold" style={{ letterSpacing: '-.02em' }}>
            {t(`definitions.${game.id}.nameVi` as 'definitions.gender-quiz.nameVi')}
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,.85)' }}>
            {t(`definitions.${game.id}.description` as 'definitions.gender-quiz.description')}
          </p>
        </div>
        <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-bold" style={{ background: 'rgba(255,255,255,.92)', color: ACCENT[game.accent] }}>
          {t('landing.recommendations.startCta')} <IconChevronRight size={14} />
        </span>
      </div>
    </Link>
  );
}

// Secondary recommendation: compact row.
function SecondaryPick({ game, reason, onPlay }: { game: GameDef; reason: string; onPlay: () => void }) {
  const t = useTranslations('games');
  const Icon = game.icon;
  const color = ACCENT[game.accent];
  return (
    <Link href={game.href} onClick={onPlay} className="block outline-none">
      <div
        className="word-card-v2 flex items-center gap-3 rounded-[12px] p-3"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          border: '1px solid var(--theme-border)',
          ['--card-accent' as string]: color,
        } as React.CSSProperties}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
        >
          <Icon size={19} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-[13.5px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {t(`definitions.${game.id}.nameVi` as 'definitions.gender-quiz.nameVi')}
          </h4>
          <p className="truncate text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{reason}</p>
        </div>
        <IconChevronRight size={15} style={{ color }} />
      </div>
    </Link>
  );
}

function StatPill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div
      className="rounded-2xl px-4 py-2.5 text-center"
      style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}
    >
      <p className="mono text-[20px] font-extrabold leading-none" style={{ color }}>{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.04em' }}>{label}</p>
    </div>
  );
}

export default function GamesPage() {
  const t = useTranslations('games');
  const { playClick } = useSoundEffects();
  const { settings } = useSettingsStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: progressStats } = useProgressStats(isAuthenticated);
  const [activeCat, setActiveCat] = useState<'all' | GameCat>('all');

  const preferredLevel = settings.preferredLevel;
  const levelLabel = t(`levels.${preferredLevel}` as 'levels.A1');

  const due = progressStats?.due ?? 0;
  const mastered = progressStats?.mastered ?? 0;

  const recommendationIds = due > 0 ? ['srs-review', 'gender-quiz', 'flashcards'] : fallbackRecommendationIds;
  const recs = recommendationIds
    .map((id) => games.find((game) => game.id === id))
    .filter(Boolean) as GameDef[];
  const [primary, ...secondary] = recs;

  const catCount = (cat: GameCat) => games.filter((g) => g.cat === cat).length;
  const visibleCats = GAME_CATEGORIES.filter((c) => activeCat === 'all' || c.id === activeCat);

  return (
    <div className="mx-auto max-w-300 px-4 py-6 sm:px-6">
      {/* Header: eyebrow + title + subtitle + stat strip + SRS CTA */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mono mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>
            {t('hub.eyebrow')}
          </p>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: GRADIENT.xp, color: 'white' }}>
              <IconGamepad size={20} />
            </div>
            <h1 className="text-[26px] font-extrabold" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>
              {t('landing.title')}
            </h1>
          </div>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
            {t('landing.subtitle')}
          </p>
        </div>
        <div className="flex shrink-0 items-stretch gap-2.5">
          <StatPill value={games.length} label={t('hub.statGames')} color="var(--accent)" />
          <StatPill value={due} label={t('hub.statDue')} color="var(--m-learning)" />
          <StatPill value={mastered} label={t('hub.statMastered')} color="var(--m-learned)" />
        </div>
      </header>

      {/* Recommend hero: primary pick + 2 secondary picks */}
      {primary && (
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <IconZap size={17} style={{ color: 'var(--accent)' }} />
            <h2 className="text-[15px] font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>{t('hub.recommend')}</h2>
            <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
              · {preferredLevel === 'all' ? levelLabel : `${preferredLevel} (${levelLabel})`}
            </span>
            <Link
              href="/review"
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-caption font-bold text-white transition-transform hover:-translate-y-0.5"
              style={{ background: GRADIENT.action }}
            >
              <IconZap size={14} />
              {t('landing.srsCta')}
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <PrimaryPick
              game={primary}
              reason={due > 0 ? t('landing.recommendations.reasonDue', { count: due }) : t('hub.primaryReason')}
              onPlay={playClick}
            />
            <div className="flex flex-col gap-3">
              {secondary.map((game) => (
                <SecondaryPick
                  key={game.id}
                  game={game}
                  reason={t(`definitions.${game.id}.description` as 'definitions.gender-quiz.description')}
                  onPlay={playClick}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {([{ id: 'all' as const, color: 'var(--accent)' }, ...GAME_CATEGORIES]).map((cat) => {
          const active = activeCat === cat.id;
          const count = cat.id === 'all' ? games.length : catCount(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className="inline-flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
              style={active
                ? { background: 'var(--accent)', color: 'var(--accent-on)', border: '1px solid var(--accent)' }
                : { background: 'var(--theme-bg-card)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: active ? 'var(--accent-on)' : (cat.id === 'all' ? 'var(--accent)' : cat.color) }} />
              {t(`hub.categories.${cat.id}` as 'hub.categories.all')}
              <span className="mono text-[10.5px] opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grouped game grid */}
      <div className="space-y-8">
        {visibleCats.map((cat) => {
          const list = games.filter((g) => g.cat === cat.id);
          if (list.length === 0) return null;
          return (
            <section key={cat.id}>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: cat.color }} />
                <h2 className="text-body font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
                  {t(`hub.categories.${cat.id}` as 'hub.categories.all')}
                </h2>
                <span className="mono text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{list.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((game) => <GameCard key={game.id} game={game} onPlay={playClick} />)}
              </div>
            </section>
          );
        })}
      </div>

      {/* Tips strip */}
      <div className="relative mt-8 overflow-hidden rounded-2xl p-5" style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        <IconLightbulb size={110} className="absolute -right-8 -bottom-8 rotate-12 opacity-[0.04]" />
        <div className="mb-4 flex items-center gap-2">
          <IconLightbulb size={17} style={{ color: ACCENT.xp }} />
          <h2 className="text-body font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>{t('landing.tips.title')}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: IconKeyboard,
              title: t('landing.tips.hotkeys.title'),
              text: t.rich('landing.tips.hotkeys.text', { kbd: (chunks) => <KBD>{chunks}</KBD> }),
              accent: 'srs' as AccentKey,
            },
            {
              icon: IconFlame,
              title: t('landing.tips.combo.title'),
              text: t('landing.tips.combo.text'),
              accent: 'speaking' as AccentKey,
            },
            {
              icon: IconBookOpen,
              title: t('landing.tips.preReview.title'),
              text: t('landing.tips.preReview.text'),
              accent: 'xp' as AccentKey,
            },
          ].map((tip) => {
            const TipIcon = tip.icon;
            return (
              <div key={tip.title} className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `color-mix(in srgb, ${ACCENT[tip.accent]} 12%, transparent)`, color: ACCENT[tip.accent] }}>
                  <TipIcon size={18} />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{tip.title}</h3>
                  <p className="text-caption leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{tip.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
