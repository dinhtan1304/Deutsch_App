'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AppPageShell, SectionHeader, SurfaceCard } from '@/components/ui';
import { ACCENT, GRADIENT, type AccentKey } from '@/lib/tokens';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStats } from '@/hooks/useProgress';
import { IconInfo } from '@/components/ui/Icons';
import {
  IconGamepad, IconTarget, IconClock, IconPenTool, IconLayers,
  IconBookOpen, IconLink, IconHeadphones, IconSpellCheck,
  IconLightbulb, IconKeyboard, IconFlame, IconZap, KBD,
  IconChevronRight,
} from '@/components/games/GameUI';

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

// Game metadata: structural only (id, icon, accent, href). Display name +
// description are looked up at render via `games.definitions.<id>`. The
// `enName` field is a stable, locale-independent fallback shown when no
// translation is available.
type GameDef = {
  id: string;
  enName: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  accent: AccentKey;
  href: string;
  badge?: string;
};

const games: GameDef[] = [
  { id: 'gender-quiz',     enName: 'Gender Quiz',      icon: IconTarget,      accent: 'srs',       href: '/games/gender-quiz' },
  { id: 'timed-challenge', enName: 'Timed Challenge',  icon: IconClock,       accent: 'speaking',  href: '/games/time-challenge' },
  { id: 'fill-blank',      enName: 'Fill in the Blank', icon: IconPenTool,    accent: 'vocab',     href: '/games/fill-blank' },
  { id: 'flashcards',      enName: 'Flashcards',       icon: IconLayers,      accent: 'reading',   href: '/games/flashcards' },
  { id: 'srs-review',      enName: 'SRS Review',       icon: IconBookOpen,    accent: 'xp',        href: '/review', badge: 'SM-2' },
  { id: 'word-match',      enName: 'Word Match',       icon: IconLink,        accent: 'cyan',      href: '/games/word-match' },
  { id: 'listening',       enName: 'Listening Quiz',   icon: IconHeadphones,  accent: 'games',     href: '/games/listening' },
  { id: 'spelling',        enName: 'Spelling Bee',     icon: IconSpellCheck,  accent: 'listening', href: '/games/spelling' },
  { id: 'typing',          enName: 'Typing speed',     icon: IconKeyboard,    accent: 'games',     href: '/games/typing' },
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

function GameCard({ game, onPlay }: { game: GameDef; onPlay: () => void }) {
  const t = useTranslations('games');
  const Icon = game.icon;
  const color = ACCENT[game.accent];

  return (
    <Link href={game.href} onClick={onPlay} className="block h-full">
      <SurfaceCard variant="interactive" accent={game.accent} className="flex h-full flex-col">
        <div className="flex items-start gap-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${color}14`, border: `1px solid ${color}22`, color }}
          >
            <Icon size={21} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
                {t(`definitions.${game.id}.nameVi` as 'definitions.gender-quiz.nameVi')}
              </h3>
              {game.badge && (
                <span className="rounded-md px-1.5 py-0.5 text-[9px] font-black text-white" style={{ background: gradientFor(game.accent) }}>
                  {game.badge}
                </span>
              )}
            </div>
            <p className="text-caption font-semibold" style={{ color }}>
              {game.enName}
            </p>
          </div>
        </div>
        <p className="mt-4 flex-1 text-body leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
          {t(`definitions.${game.id}.description` as 'definitions.gender-quiz.description')}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-dashed pt-4" style={{ borderColor: 'var(--theme-border)' }}>
          <span className="text-caption font-black uppercase tracking-wider" style={{ color }}>
            {t('landing.allGames.playNow')}
          </span>
          <IconChevronRight size={14} style={{ color }} />
        </div>
      </SurfaceCard>
    </Link>
  );
}

function RecommendationCard({
  game,
  reason,
  onPlay,
}: {
  game: GameDef;
  reason: string;
  onPlay: () => void;
}) {
  const t = useTranslations('games');
  const Icon = game.icon;
  return (
    <Link href={game.href} onClick={onPlay} className="block h-full">
      <SurfaceCard variant="featured" accent={game.accent} interactive className="h-full">
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ background: gradientFor(game.accent) }}
          >
            <Icon size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-caption font-bold" style={{ color: ACCENT[game.accent] }}>
              {reason}
            </p>
            <h3 className="mt-0.5 text-h3 font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
              {t(`definitions.${game.id}.nameVi` as 'definitions.gender-quiz.nameVi')}
            </h3>
            <p className="mt-1 text-body leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
              {t(`definitions.${game.id}.description` as 'definitions.gender-quiz.description')}
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-body font-bold" style={{ color: ACCENT[game.accent] }}>
              {t('landing.recommendations.startCta')} <IconChevronRight size={14} />
            </span>
          </div>
        </div>
      </SurfaceCard>
    </Link>
  );
}

export default function GamesPage() {
  const t = useTranslations('games');
  const { playClick } = useSoundEffects();
  const { settings, isLoaded } = useSettingsStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: progressStats } = useProgressStats(isAuthenticated);

  const preferredLevel = settings.preferredLevel;
  const maxIdx = LEVEL_ORDER.indexOf(preferredLevel as typeof LEVEL_ORDER[number]);
  const allowedLevels =
    preferredLevel === 'all'
      ? [...LEVEL_ORDER]
      : maxIdx >= 0 ? LEVEL_ORDER.slice(0, maxIdx + 1) : ['A1'];
  const levelLabel = t(`levels.${preferredLevel}` as 'levels.A1');

  const due = progressStats?.due ?? 0;
  const recommendationIds = due > 0 ? ['srs-review', 'gender-quiz', 'flashcards'] : fallbackRecommendationIds;
  const recommendations = recommendationIds
    .map((id) => games.find((game) => game.id === id))
    .filter(Boolean) as GameDef[];

  return (
    <AppPageShell
      title={t('landing.title')}
      subtitle={t('landing.subtitle')}
      icon={<IconGamepad size={24} />}
      accent="games"
      right={(
        <Link
          href="/review"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-body font-bold text-white shadow-soft transition-transform hover:-translate-y-0.5"
          style={{ background: GRADIENT.action }}
        >
          <IconZap size={16} />
          {t('landing.srsCta')}
        </Link>
      )}
    >
      <div className="space-y-8">
        {isLoaded && (
          <SurfaceCard variant="subtle" className="px-4 py-3">
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${ACCENT.srs}14`, color: ACCENT.srs }}
              >
                <IconInfo size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                  {t('landing.levelBanner.levelLabel')} <span style={{ color: ACCENT.srs }}>{preferredLevel === 'all' ? levelLabel : `${preferredLevel} (${levelLabel})`}</span>
                </p>
                <p className="text-caption leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                  {t('landing.levelBanner.vocabRange')} <span className="font-bold">{allowedLevels.join(', ')}</span>. {t('landing.levelBanner.rangeNote')}
                </p>
              </div>
            </div>
          </SurfaceCard>
        )}

        <section>
          <SectionHeader
            title={t('landing.recommendations.title')}
            subtitle={due > 0
              ? t('landing.recommendations.subtitleDue', { count: due })
              : t('landing.recommendations.subtitleDefault')}
            icon={<IconZap size={18} />}
            accent="games"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {recommendations.map((game, index) => (
              <RecommendationCard
                key={game.id}
                game={game}
                reason={index === 0 && due > 0
                  ? t('landing.recommendations.reasonDue', { count: due })
                  : index === 0
                    ? t('landing.recommendations.reasonStart')
                    : t('landing.recommendations.reasonFit')}
                onPlay={playClick}
              />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            title={t('landing.allGames.title')}
            subtitle={t('landing.allGames.subtitle')}
            icon={<IconTarget size={18} />}
            accent="srs"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => <GameCard key={game.id} game={game} onPlay={playClick} />)}
          </div>
        </section>

        <SurfaceCard variant="default" className="relative overflow-hidden">
          <IconLightbulb size={110} className="absolute -right-8 -bottom-8 opacity-[0.035] rotate-12" />
          <SectionHeader
            title={t('landing.tips.title')}
            subtitle={t('landing.tips.subtitle')}
            icon={<IconLightbulb size={18} />}
            accent="xp"
            className="mb-5"
          />
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
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${ACCENT[tip.accent]}12`, color: ACCENT[tip.accent] }}>
                    <TipIcon size={18} />
                  </div>
                  <div>
                    <h3 className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{tip.title}</h3>
                    <p className="text-caption leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{tip.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </SurfaceCard>
      </div>
    </AppPageShell>
  );
}
