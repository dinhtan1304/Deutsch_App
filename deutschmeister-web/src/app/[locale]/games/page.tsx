'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useTranslations, useFormatter, useNow } from 'next-intl';
import { ACCENT, type AccentKey } from '@/lib/tokens';
import type { GameType } from '@/types';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStats } from '@/hooks/useProgress';
import { useGameHistory } from '@/hooks/useGames';
import {
  IconTarget, IconClock, IconPenTool, IconLayers,
  IconBookOpen, IconLink, IconHeadphones, IconSpellCheck,
  IconLightbulb, IconKeyboard, IconFlame, KBD,
  IconChevronRight,
} from '@/components/games/GameUI';

// Game metadata: structural + static (category/diff/minutes/color) + the
// backend GameType used to match recorded sessions for real per-game stats.
type GameCat = 'vocab' | 'grammar' | 'audio' | 'speed';
type GameDef = {
  id: string;
  enName: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  accent: AccentKey;
  href: string;
  badge?: string;
  cat: GameCat;
  diff: 1 | 2 | 3;
  minutes: number;
  color: string;          // CSS var — per-game accent
  sessionType?: GameType; // maps to GameSession.gameType (undefined = no history)
};

const games: GameDef[] = [
  { id: 'flashcards',      enName: 'Flashcards',        icon: IconLayers,      accent: 'reading',   href: '/games/flashcards',     cat: 'vocab',   diff: 1, minutes: 5,  color: 'var(--success)', sessionType: 'flashcard' },
  { id: 'srs-review',      enName: 'SRS Review',        icon: IconBookOpen,    accent: 'xp',        href: '/review', badge: 'SM-2', cat: 'vocab',   diff: 2, minutes: 10, color: 'var(--streak)' },
  { id: 'word-match',      enName: 'Word Match',        icon: IconLink,        accent: 'cyan',      href: '/games/word-match',     cat: 'vocab',   diff: 1, minutes: 3,  color: 'var(--cyan)',    sessionType: 'matching' },
  { id: 'gender-quiz',     enName: 'Gender Quiz',       icon: IconTarget,      accent: 'srs',       href: '/games/gender-quiz',    cat: 'grammar', diff: 2, minutes: 3,  color: 'var(--violet)',  sessionType: 'gender-quiz' },
  { id: 'fill-blank',      enName: 'Fill in the Blank', icon: IconPenTool,     accent: 'vocab',     href: '/games/fill-blank',     cat: 'grammar', diff: 3, minutes: 5,  color: 'var(--violet)',  sessionType: 'fill-blank' },
  { id: 'listening',       enName: 'Listening Quiz',    icon: IconHeadphones,  accent: 'games',     href: '/games/listening',      cat: 'audio',   diff: 2, minutes: 4,  color: 'var(--die)',     sessionType: 'listening' },
  { id: 'spelling',        enName: 'Spelling Bee',      icon: IconSpellCheck,  accent: 'listening', href: '/games/spelling',       cat: 'audio',   diff: 3, minutes: 5,  color: 'var(--die)',     sessionType: 'spelling' },
  { id: 'typing',          enName: 'Typing speed',      icon: IconKeyboard,    accent: 'games',     href: '/games/typing',         cat: 'audio',   diff: 1, minutes: 1,  color: 'var(--streak)' },
  { id: 'timed-challenge', enName: 'Timed Challenge',   icon: IconClock,       accent: 'speaking',  href: '/games/time-challenge', cat: 'speed',   diff: 3, minutes: 2,  color: 'var(--danger)',  sessionType: 'timed-challenge' },
];

const GAME_CATEGORIES: { id: GameCat; color: string }[] = [
  { id: 'vocab', color: 'var(--der)' },
  { id: 'grammar', color: 'var(--violet)' },
  { id: 'audio', color: 'var(--die)' },
  { id: 'speed', color: 'var(--streak)' },
];

const DIFF_DOT: Record<1 | 2 | 3, string> = { 1: 'var(--success)', 2: 'var(--warn)', 3: 'var(--danger)' };

type GameStat = { plays: number; best: number; last: string };

// ─── Difficulty: 3 dots + label ───────────────────────────────────────────────
function DiffStars({ diff }: { diff: 1 | 2 | 3 }) {
  const t = useTranslations('games');
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: i <= diff ? DIFF_DOT[diff as 1 | 2 | 3] : 'var(--theme-bg-tertiary)' }} />
      ))}
      <span className="ml-1">{t(`hub.diff${diff}` as 'hub.diff1')}</span>
    </span>
  );
}
function Sep() { return <span className="h-2.5 w-px" style={{ background: 'var(--theme-border)' }} />; }

// ─── Recommend hero ───────────────────────────────────────────────────────────
function PrimaryPick({ game, due, onPlay }: { game: GameDef; due: number; onPlay: () => void }) {
  const t = useTranslations('games');
  const tHub = useTranslations('games.hub');
  const Icon = game.icon;
  return (
    <Link href={game.href} onClick={onPlay} className="group relative z-10 block outline-none">
      <div className="flex h-full flex-col gap-3 rounded-xl p-4.5" style={{ background: 'var(--theme-bg-card)', border: `1px solid color-mix(in srgb, ${game.color} 40%, transparent)` }}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: game.color }}>{tHub('rec1Label')}</span>
          {due > 0 && <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{tHub('recommendReason', { count: due })}</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className="v2-game-icongrad flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white" style={{ ['--gc' as string]: game.color, boxShadow: `0 6px 16px color-mix(in srgb, ${game.color} 40%, transparent)` } as React.CSSProperties}>
            <Icon size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-h3 font-extrabold" style={{ letterSpacing: '-.01em', color: 'var(--theme-text-primary)' }}>{t(`definitions.${game.id}.nameVi` as 'definitions.gender-quiz.nameVi')}</h3>
            <p className="mono text-caption italic" style={{ color: 'var(--theme-text-muted)' }}>{game.enName}</p>
          </div>
        </div>
        <p className="text-body leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{t(`definitions.${game.id}.description` as 'definitions.gender-quiz.description')}</p>
        <span className="mt-auto inline-flex h-10 items-center justify-center gap-1.5 rounded-[7px] text-body font-bold text-white" style={{ background: game.color, boxShadow: `0 4px 12px color-mix(in srgb, ${game.color} 40%, transparent)` }}>
          {tHub('play')} <IconChevronRight size={14} />
        </span>
      </div>
    </Link>
  );
}

function SecondaryPick({ game, onPlay }: { game: GameDef; onPlay: () => void }) {
  const t = useTranslations('games');
  const tHub = useTranslations('games.hub');
  const Icon = game.icon;
  return (
    <Link href={game.href} onClick={onPlay} className="relative z-10 block outline-none">
      <div className="word-card-v2 flex h-full flex-col gap-2.5 rounded-xl p-4" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', ['--card-accent' as string]: game.color } as React.CSSProperties}>
        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: game.color }}>{tHub('fitToday')}</span>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]" style={{ background: `color-mix(in srgb, ${game.color} 18%, transparent)`, color: game.color }}>
            <Icon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t(`definitions.${game.id}.nameVi` as 'definitions.gender-quiz.nameVi')}</div>
            <div className="mono text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{game.enName}</div>
          </div>
        </div>
        <p className="text-caption leading-relaxed line-clamp-2" style={{ color: 'var(--theme-text-muted)' }}>{t(`definitions.${game.id}.description` as 'definitions.gender-quiz.description')}</p>
        <div className="mt-auto flex items-center justify-between text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
          <span>{tHub('minutesShort', { min: game.minutes })}</span>
          <span className="font-semibold" style={{ color: game.color }}>{t('landing.recommendations.startCta')} →</span>
        </div>
      </div>
    </Link>
  );
}

// ─── Game card ────────────────────────────────────────────────────────────────
function GameCard({ game, stat, onPlay }: { game: GameDef; stat?: GameStat; onPlay: () => void }) {
  const t = useTranslations('games');
  const tHub = useTranslations('games.hub');
  const fmt = useFormatter();
  const now = useNow();
  const Icon = game.icon;
  const plays = stat?.plays ?? 0;
  const hasScore = !!stat && plays > 0;
  const bestColor = !stat ? 'var(--theme-text-muted)' : stat.best >= 80 ? 'var(--success)' : stat.best >= 60 ? 'var(--warn)' : 'var(--theme-text-secondary)';

  return (
    <Link href={game.href} onClick={onPlay} className="block h-full outline-none">
      <article className="word-card-v2 relative flex h-full flex-col gap-3 overflow-hidden rounded-[13px] p-4"
        style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', ['--card-accent' as string]: game.color, ['--gc' as string]: game.color } as React.CSSProperties}>
        {/* header */}
        <header className="flex items-center gap-3">
          <div className="flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-[10px]" style={{ background: `color-mix(in srgb, ${game.color} 18%, transparent)`, color: game.color }}>
            <Icon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-body font-bold" style={{ letterSpacing: '-.01em', color: 'var(--theme-text-primary)' }}>{t(`definitions.${game.id}.nameVi` as 'definitions.gender-quiz.nameVi')}</h3>
              {!stat && plays === 0 && game.sessionType === undefined && (
                <span className="mono shrink-0 rounded-xs px-1.5 py-0.5 text-[9px] font-bold uppercase" style={{ background: 'color-mix(in srgb, var(--success) 15%, transparent)', color: 'var(--success)', letterSpacing: '.04em' }}>NEW</span>
              )}
              {game.badge && (
                <span className="mono shrink-0 rounded-xs px-1.5 py-0.5 text-[9px] font-bold" style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>{game.badge}</span>
              )}
            </div>
            <div className="mono truncate text-[11px] italic" style={{ color: 'var(--theme-text-muted)' }}>{game.enName}</div>
          </div>
        </header>

        <p className="text-caption leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{t(`definitions.${game.id}.description` as 'definitions.gender-quiz.description')}</p>

        {/* meta */}
        <div className="flex items-center gap-2.5 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
          <span className="inline-flex items-center gap-1"><IconClock size={11} />{tHub('minutesShort', { min: game.minutes })}</span>
          <Sep />
          <DiffStars diff={game.diff} />
          {plays > 0 && (<><Sep /><span className="mono">{plays} {tHub('playsUnit')}</span></>)}
        </div>

        {/* footer */}
        <footer className="mt-auto flex items-center justify-between gap-2 border-t border-dashed pt-3" style={{ borderColor: 'var(--theme-border)' }}>
          {hasScore && stat ? (
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.04em' }}>{tHub('bestLabel')}</div>
              <div className="flex items-baseline gap-1">
                <span className="mono text-body font-bold" style={{ color: bestColor }}>{stat.best}%</span>
                <span className="truncate text-[10.5px]" style={{ color: 'var(--theme-text-muted)' }}>· {fmt.relativeTime(new Date(stat.last), now)}</span>
              </div>
            </div>
          ) : (
            <span className="text-[11.5px] italic" style={{ color: 'var(--theme-text-muted)' }}>{tHub('notTried')}</span>
          )}
          <span className="v2-game-cta inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-caption font-semibold" style={{ ['--gc' as string]: game.color } as React.CSSProperties}>
            {plays > 0 ? tHub('playMore') : tHub('tryIt')} <IconChevronRight size={12} />
          </span>
        </footer>
      </article>
    </Link>
  );
}

// ─── Category tab (segmented) ─────────────────────────────────────────────────
function CatTab({ label, count, color, active, onClick }: { label: string; count: number; color?: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-[7px] px-3.5 py-1.5 text-body transition-colors"
      style={active
        ? { background: 'var(--theme-bg-tertiary)', color: 'var(--theme-text-primary)', fontWeight: 600 }
        : { background: 'transparent', color: 'var(--theme-text-secondary)', fontWeight: 500 }}>
      {color && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
      {label}
      <span className="mono text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{count}</span>
    </button>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex min-w-22 flex-col gap-0.5 rounded-[10px] px-3.5 py-2" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.05em' }}>{label}</span>
      </div>
      <span className="mono text-[17px] font-extrabold" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{value}</span>
    </div>
  );
}

export default function GamesPage() {
  const t = useTranslations('games');
  const tHub = useTranslations('games.hub');
  const { playClick } = useSoundEffects();
  const { settings } = useSettingsStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: progressStats } = useProgressStats(isAuthenticated);
  const { data: history } = useGameHistory(100);
  const [activeCat, setActiveCat] = useState<'all' | GameCat>('all');
  const [nowTs] = useState(() => Date.now());

  const preferredLevel = settings.preferredLevel;
  const levelLabel = t(`levels.${preferredLevel}` as 'levels.A1');
  const due = progressStats?.due ?? 0;

  // Real per-game stats from recorded sessions.
  const statsByType = useMemo(() => {
    const map: Partial<Record<GameType, GameStat>> = {};
    (history ?? []).forEach((s) => {
      const pct = s.totalQuestions > 0 ? Math.round((s.correctAnswers / s.totalQuestions) * 100) : 0;
      const e = map[s.gameType] ?? { plays: 0, best: 0, last: s.startedAt };
      e.plays += 1;
      if (pct > e.best) e.best = pct;
      if (new Date(s.startedAt) > new Date(e.last)) e.last = s.startedAt;
      map[s.gameType] = e;
    });
    return map;
  }, [history]);

  const statFor = (g: GameDef): GameStat | undefined => (g.sessionType ? statsByType[g.sessionType] : undefined);

  // Header stats.
  const playedCount = games.filter((g) => (statFor(g)?.plays ?? 0) > 0).length;
  const weekAgo = nowTs - 7 * 86400000;
  const weeklyCount = (history ?? []).filter((s) => new Date(s.startedAt).getTime() >= weekAgo).length;
  const playedStats = games.map(statFor).filter((s): s is GameStat => !!s && s.plays > 0);
  const avgScore = playedStats.length ? Math.round(playedStats.reduce((a, s) => a + s.best, 0) / playedStats.length) : 0;

  // Recommendations.
  const recIds = due > 0 ? ['srs-review', 'gender-quiz', 'flashcards'] : ['flashcards', 'gender-quiz', 'timed-challenge'];
  const recs = recIds.map((id) => games.find((g) => g.id === id)).filter(Boolean) as GameDef[];
  const [primary, ...secondary] = recs;

  const catCount = (cat: GameCat) => games.filter((g) => g.cat === cat).length;
  const visibleCats = GAME_CATEGORIES.filter((c) => activeCat === 'all' || c.id === activeCat);

  return (
    <div className="mx-auto max-w-360 px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mono mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-text-muted)' }}>{tHub('eyebrow')}</p>
          <h1 className="text-h1 font-extrabold" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{t('landing.title')}</h1>
          <p className="mt-1.5 text-body" style={{ color: 'var(--theme-text-muted)' }}>
            <span className="mono" style={{ color: 'var(--theme-text-primary)' }}>{games.length}</span> {tHub('gamesUnit')} · <span className="font-semibold" style={{ color: 'var(--accent)' }}>{preferredLevel === 'all' ? levelLabel : preferredLevel}</span> · {tHub('subtitleNote')}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <MiniStat label={tHub('statPlayed')} value={`${playedCount}/${games.length}`} color="var(--der)" />
          <MiniStat label={tHub('statWeek')} value={weeklyCount} color="var(--violet)" />
          <MiniStat label={tHub('statAvg')} value={`${avgScore}%`} color="var(--success)" />
        </div>
      </header>

      {/* Recommend hero — single container, 3-col grid */}
      {primary && (
        <section className="v2-recommend-hero relative mb-6 grid gap-3.5 overflow-hidden rounded-2xl p-5 lg:grid-cols-[1.5fr_1fr_1fr]"
          style={{ border: '1px solid color-mix(in srgb, var(--violet) 30%, transparent)' }}>
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full opacity-60 blur-3xl" style={{ background: 'color-mix(in srgb, var(--violet) 15%, transparent)' }} />
          <PrimaryPick game={primary} due={due} onPlay={playClick} />
          {secondary.map((g) => <SecondaryPick key={g.id} game={g} onPlay={playClick} />)}
        </section>
      )}

      {/* Category tabs — segmented pill */}
      <div className="mb-4 inline-flex flex-wrap gap-1.5 rounded-[11px] p-1" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        <CatTab label={tHub('categories.all')} count={games.length} active={activeCat === 'all'} onClick={() => setActiveCat('all')} />
        {GAME_CATEGORIES.map((c) => (
          <CatTab key={c.id} label={tHub(`categories.${c.id}` as 'categories.vocab')} count={catCount(c.id)} color={c.color} active={activeCat === c.id} onClick={() => setActiveCat(c.id)} />
        ))}
      </div>

      {/* Grouped grid */}
      <div className="space-y-6">
        {visibleCats.map((cat) => {
          const list = games.filter((g) => g.cat === cat.id);
          if (list.length === 0) return null;
          return (
            <section key={cat.id}>
              <div className="mb-2.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: cat.color }} />
                <h2 className="text-[12px] font-semibold uppercase" style={{ color: 'var(--theme-text-secondary)', letterSpacing: '.06em' }}>{tHub(`categories.${cat.id}` as 'categories.vocab')}</h2>
                <span className="mono text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{list.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {list.map((game) => <GameCard key={game.id} game={game} stat={statFor(game)} onPlay={playClick} />)}
              </div>
            </section>
          );
        })}
      </div>

      {/* Tips */}
      <section className="mt-7">
        <div className="mb-3 flex items-center gap-2">
          <IconLightbulb size={15} style={{ color: ACCENT.xp }} />
          <h2 className="text-[12px] font-semibold uppercase" style={{ color: 'var(--theme-text-secondary)', letterSpacing: '.06em' }}>{t('landing.tips.title')}</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { icon: IconKeyboard, title: t('landing.tips.hotkeys.title'), text: t.rich('landing.tips.hotkeys.text', { kbd: (chunks) => <KBD>{chunks}</KBD> }), accent: 'srs' as AccentKey },
            { icon: IconFlame, title: t('landing.tips.combo.title'), text: t('landing.tips.combo.text'), accent: 'speaking' as AccentKey },
            { icon: IconBookOpen, title: t('landing.tips.preReview.title'), text: t('landing.tips.preReview.text'), accent: 'xp' as AccentKey },
          ].map((tip) => {
            const TipIcon = tip.icon;
            return (
              <div key={tip.title} className="flex gap-3 rounded-[11px] p-3.5" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${ACCENT[tip.accent]} 14%, transparent)`, color: ACCENT[tip.accent] }}>
                  <TipIcon size={16} />
                </div>
                <div>
                  <h3 className="text-caption font-bold" style={{ color: 'var(--theme-text-primary)' }}>{tip.title}</h3>
                  <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{tip.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
