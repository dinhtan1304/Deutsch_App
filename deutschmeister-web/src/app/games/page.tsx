'use client';

import Link from 'next/link';
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
const LEVEL_LABELS: Record<string, string> = {
  A1: 'Sơ cấp',
  A2: 'Cơ bản',
  B1: 'Trung cấp',
  B2: 'Trung cấp cao',
  C1: 'Nâng cao',
  C2: 'Thành thạo',
  all: 'Tất cả trình độ',
};

type GameDef = {
  id: string;
  name: string;
  nameVi: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  accent: AccentKey;
  href: string;
  badge?: string;
};

const games: GameDef[] = [
  { id: 'gender-quiz', name: 'Gender Quiz', nameVi: 'Mạo từ der/die/das', description: 'Chọn mạo từ đúng cho từng danh từ.', icon: IconTarget, accent: 'srs', href: '/games/gender-quiz' },
  { id: 'timed-challenge', name: 'Timed Challenge', nameVi: 'Thử thách tốc độ', description: 'Trả lời nhanh trong thời gian giới hạn.', icon: IconClock, accent: 'speaking', href: '/games/time-challenge' },
  { id: 'fill-blank', name: 'Fill in the Blank', nameVi: 'Điền vào chỗ trống', description: 'Điền mạo từ hoặc từ phù hợp trong câu.', icon: IconPenTool, accent: 'vocab', href: '/games/fill-blank' },
  { id: 'flashcards', name: 'Flashcards', nameVi: 'Thẻ ghi nhớ', description: 'Ôn nghĩa, mạo từ và ví dụ bằng thẻ.', icon: IconLayers, accent: 'reading', href: '/games/flashcards' },
  { id: 'srs-review', name: 'SRS Review', nameVi: 'Ôn SRS', description: 'Ôn tập thông minh với thuật toán SM-2.', icon: IconBookOpen, accent: 'xp', href: '/review', badge: 'SM-2' },
  { id: 'word-match', name: 'Word Match', nameVi: 'Ghép từ', description: 'Ghép từ tiếng Đức với nghĩa tương ứng.', icon: IconLink, accent: 'cyan', href: '/games/word-match' },
  { id: 'listening', name: 'Listening Quiz', nameVi: 'Nghe từ', description: 'Nghe audio và chọn từ đúng.', icon: IconHeadphones, accent: 'games', href: '/games/listening' },
  { id: 'spelling', name: 'Spelling Bee', nameVi: 'Chính tả', description: 'Gõ đúng chính tả từ tiếng Đức.', icon: IconSpellCheck, accent: 'listening', href: '/games/spelling' },
  { id: 'typing', name: 'Luyện gõ phím', nameVi: 'Tốc độ gõ', description: '60 giây luyện WPM và độ chính xác.', icon: IconKeyboard, accent: 'games', href: '/games/typing' },
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
                {game.nameVi}
              </h3>
              {game.badge && (
                <span className="rounded-md px-1.5 py-0.5 text-[9px] font-black text-white" style={{ background: gradientFor(game.accent) }}>
                  {game.badge}
                </span>
              )}
            </div>
            <p className="text-caption font-semibold" style={{ color }}>
              {game.name}
            </p>
          </div>
        </div>
        <p className="mt-4 flex-1 text-body leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
          {game.description}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-dashed pt-4" style={{ borderColor: 'var(--theme-border)' }}>
          <span className="text-caption font-black uppercase tracking-wider" style={{ color }}>
            Chơi ngay
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
              {game.nameVi}
            </h3>
            <p className="mt-1 text-body leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
              {game.description}
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-body font-bold" style={{ color: ACCENT[game.accent] }}>
              Bắt đầu <IconChevronRight size={14} />
            </span>
          </div>
        </div>
      </SurfaceCard>
    </Link>
  );
}

export default function GamesPage() {
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
  const levelLabel = LEVEL_LABELS[preferredLevel] ?? preferredLevel;

  const due = progressStats?.due ?? 0;
  const recommendationIds = due > 0 ? ['srs-review', 'gender-quiz', 'flashcards'] : fallbackRecommendationIds;
  const recommendations = recommendationIds
    .map((id) => games.find((game) => game.id === id))
    .filter(Boolean) as GameDef[];

  return (
    <AppPageShell
      title="Trò chơi luyện từ"
      subtitle="Luyện mạo từ, ghi nhớ nghĩa, nghe từ và chính tả bằng các phiên ngắn dễ bắt đầu."
      icon={<IconGamepad size={24} />}
      accent="games"
      right={(
        <Link
          href="/review"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-body font-bold text-white shadow-soft transition-transform hover:-translate-y-0.5"
          style={{ background: GRADIENT.action }}
        >
          <IconZap size={16} />
          Ôn SRS
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
                  Trình độ: <span style={{ color: ACCENT.srs }}>{preferredLevel === 'all' ? levelLabel : `${preferredLevel} (${levelLabel})`}</span>
                </p>
                <p className="text-caption leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                  Phạm vi từ vựng: <span className="font-bold">{allowedLevels.join(', ')}</span>. Game ưu tiên 70% từ bạn đã học và 30% từ mới.
                </p>
              </div>
            </div>
          </SurfaceCard>
        )}

        <section>
          <SectionHeader
            title="Gợi ý chơi ngay"
            subtitle={due > 0 ? `Bạn có ${due} từ cần ôn. Bắt đầu bằng SRS để giữ trí nhớ.` : 'Ba phiên ngắn phù hợp để khởi động hôm nay.'}
            icon={<IconZap size={18} />}
            accent="games"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {recommendations.map((game, index) => (
              <RecommendationCard
                key={game.id}
                game={game}
                reason={index === 0 && due > 0 ? `${due} từ cần ôn` : index === 0 ? 'Khởi động nhanh' : 'Phù hợp hôm nay'}
                onPlay={playClick}
              />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            title="Tất cả trò chơi"
            subtitle="Chọn một dạng luyện phù hợp với thời gian và kỹ năng bạn muốn củng cố."
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
            title="Mẹo chơi hiệu quả"
            subtitle="Dùng game như một phiên ôn nhanh, không thay thế hoàn toàn SRS."
            icon={<IconLightbulb size={18} />}
            accent="xp"
            className="mb-5"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: IconKeyboard, title: 'Phím tắt', text: <>Dùng <KBD>1</KBD> <KBD>2</KBD> <KBD>3</KBD> để trả lời nhanh.</>, accent: 'srs' as AccentKey },
              { icon: IconFlame, title: 'Combo', text: 'Trả lời đúng liên tiếp để giữ nhịp và tăng điểm.', accent: 'speaking' as AccentKey },
              { icon: IconBookOpen, title: 'Ôn trước khi chơi', text: 'Ôn SRS trước giúp các game từ vựng hiệu quả hơn.', accent: 'xp' as AccentKey },
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
