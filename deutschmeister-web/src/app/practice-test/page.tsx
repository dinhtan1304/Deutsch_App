'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import {
  IconPenLine, IconHeadphones, IconBookOpen, IconMic,
  IconArrowRight, IconZap, IconGraduationCap, IconTarget,
} from '@/components/ui/Icons';
import { useIsExamUnlocked } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { ACCENT, GRADIENT, type AccentKey } from '@/lib/tokens';
import { PracticePageShell, SectionHeader, SurfaceCard } from '@/components/ui';
import { ChooseExam } from './_sections/ChooseExam';

type PracticeCard = {
  title: string;
  titleDe: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: AccentKey;
};

const skillCards: PracticeCard[] = [
  {
    title: 'Luyện Đọc',
    titleDe: 'Leseübung',
    description: 'Tạo bài đọc tiếng Đức và kiểm tra mức hiểu bài.',
    icon: IconBookOpen,
    href: '/practice-test/reading',
    accent: 'reading',
  },
  {
    title: 'Luyện Nghe',
    titleDe: 'Hörübung',
    description: 'Nghe audio tiếng Đức và trả lời câu hỏi theo cấp độ.',
    icon: IconHeadphones,
    href: '/practice-test/listening',
    accent: 'listening',
  },
  {
    title: 'Luyện Viết',
    titleDe: 'Schreibübung',
    description: 'Viết bài, nhận điểm và gợi ý sửa lỗi bằng tiếng Việt.',
    icon: IconPenLine,
    href: '/practice-test/writing',
    accent: 'writing',
  },
  {
    title: 'Luyện Nói',
    titleDe: 'Sprechübung',
    description: 'Ghi âm câu trả lời, nhận đánh giá phát âm và nội dung.',
    icon: IconMic,
    href: '/practice-test/speaking',
    accent: 'speaking',
  },
];

const aiCards: PracticeCard[] = [
  {
    title: 'Roleplay AI',
    titleDe: 'Rollenspiel',
    description: 'Luyện hội thoại thực tế: bác sĩ, phỏng vấn, thuê nhà.',
    icon: IconZap,
    href: '/practice-test/roleplay',
    accent: 'examWriting',
  },
  {
    title: 'Phát âm AI',
    titleDe: 'Aussprachetraining',
    description: 'Ghi âm từng từ và nhận phản hồi phát âm chi tiết.',
    icon: IconMic,
    href: '/practice-test/pronunciation',
    accent: 'listening',
  },
  {
    title: 'Chép chính tả',
    titleDe: 'Diktat',
    description: 'Nghe video tiếng Đức và điền từ còn thiếu theo câu.',
    icon: IconHeadphones,
    href: '/practice-test/dictation',
    accent: 'dictation',
  },
];

const examCards: PracticeCard[] = [
  {
    title: 'Đọc theo đề',
    titleDe: 'Prüfungslesen',
    description: 'Goethe & TELC A1/A2/B1, đủ các Teile như đề thật.',
    icon: IconBookOpen,
    href: '/practice-test/reading/exam',
    accent: 'reading',
  },
  {
    title: 'Nghe theo đề',
    titleDe: 'Prüfungshören',
    description: 'Audio và câu hỏi theo định dạng thi Goethe/TELC.',
    icon: IconHeadphones,
    href: '/practice-test/listening/exam',
    accent: 'listening',
  },
  {
    title: 'Viết theo đề',
    titleDe: 'Prüfungsschreiben',
    description: 'Schreiben theo prompt chuẩn, chấm theo tiêu chí chính thức.',
    icon: IconPenLine,
    href: '/practice-test/writing/exam',
    accent: 'examWriting',
  },
  {
    title: 'Nói theo đề',
    titleDe: 'Prüfungssprechen',
    description: 'Luyện đủ phần Sprechen theo format Goethe/TELC.',
    icon: IconMic,
    href: '/practice-test/speaking/exam',
    accent: 'xp',
  },
];

const quickStarts = [
  {
    href: '#practice-skills',
    title: 'Tôi muốn luyện kỹ năng',
    subtitle: 'Đọc, nghe, viết, nói với bài tự do.',
    icon: <IconTarget size={18} />,
    accent: 'writing' as AccentKey,
  },
  {
    href: '#exam-practice',
    title: 'Tôi muốn thi thử',
    subtitle: 'Đề chuẩn Goethe/TELC A1-B1.',
    icon: <IconGraduationCap size={18} />,
    accent: 'xp' as AccentKey,
  },
  {
    href: '#ai-support',
    title: 'Tôi muốn luyện giao tiếp',
    subtitle: 'Roleplay, phát âm và chép chính tả.',
    icon: <IconMic size={18} />,
    accent: 'listening' as AccentKey,
  },
];

function iconGradient(accent: AccentKey) {
  const map: Partial<Record<AccentKey, string>> = {
    brand: GRADIENT.brand,
    reading: GRADIENT.reading,
    listening: GRADIENT.listening,
    writing: GRADIENT.writing,
    speaking: GRADIENT.speaking,
    examWriting: GRADIENT.examWriting,
    dictation: GRADIENT.dictation,
    xp: GRADIENT.xp,
  };
  return map[accent] ?? GRADIENT.brand;
}

function QuickStartCard({ item }: { item: typeof quickStarts[number] }) {
  return (
    <a href={item.href} className="block">
      <SurfaceCard variant="interactive" accent={item.accent} className="h-full">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ background: iconGradient(item.accent) }}
          >
            {item.icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              {item.title}
            </h3>
            <p className="mt-0.5 text-caption leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
              {item.subtitle}
            </p>
          </div>
        </div>
      </SurfaceCard>
    </a>
  );
}

function PracticeActionCard({
  card,
  locked,
  onLockedClick,
}: {
  card: PracticeCard;
  locked?: boolean;
  onLockedClick?: () => void;
}) {
  const Icon = card.icon;
  const accentColor = ACCENT[card.accent];
  const body = (
    <SurfaceCard
      variant={locked ? 'locked' : 'interactive'}
      accent={card.accent}
      className="relative flex h-full flex-col"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-soft"
          style={{ background: iconGradient(card.accent) }}
        >
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-caption font-bold" style={{ color: accentColor }}>
            {card.titleDe}
          </p>
          <h3 className="mt-0.5 text-h3 font-extrabold leading-tight" style={{ color: 'var(--theme-text-primary)' }}>
            {card.title}
          </h3>
        </div>
        {locked && (
          <span className="rounded-full px-2 py-1 text-[10px] font-black text-white" style={{ background: GRADIENT.xp }}>
            PREMIUM
          </span>
        )}
      </div>
      <p className="mt-4 flex-1 text-body leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
        {card.description}
      </p>
      <div className="mt-5 inline-flex items-center gap-2 text-body font-bold" style={{ color: accentColor }}>
        {locked ? 'Xem gói Premium' : 'Bắt đầu'} <IconArrowRight size={16} />
      </div>
    </SurfaceCard>
  );

  if (locked) {
    return (
      <button type="button" onClick={onLockedClick} className="h-full w-full text-left">
        {body}
      </button>
    );
  }

  return (
    <Link href={card.href} className="block h-full">
      {body}
    </Link>
  );
}

function CardGrid({
  cards,
  locked,
  onLockedClick,
}: {
  cards: PracticeCard[];
  locked?: boolean;
  onLockedClick?: () => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <PracticeActionCard
          key={card.href}
          card={card}
          locked={locked}
          onLockedClick={onLockedClick}
        />
      ))}
    </div>
  );
}

function Section({
  id,
  title,
  subtitle,
  icon,
  accent,
  badge,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  accent: AccentKey;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <SectionHeader title={title} subtitle={subtitle} icon={icon} accent={accent} badge={badge} />
      {children}
    </section>
  );
}

export default function PracticeTestPage() {
  const examUnlocked = useIsExamUnlocked();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <PracticePageShell
      title="Luyện thi & kỹ năng"
      subtitle="Chọn hướng luyện phù hợp: củng cố kỹ năng hằng ngày, luyện giao tiếp với AI, hoặc làm đề chuẩn Goethe/TELC."
      icon={<IconGraduationCap size={22} />}
      accent="writing"
    >
      <div className="space-y-10">
        <section>
          <SectionHeader
            title="Bắt đầu nhanh"
            subtitle="Chọn mục tiêu trước, rồi đi vào bài luyện phù hợp."
            icon={<IconZap size={18} />}
            accent="writing"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {quickStarts.map((item) => <QuickStartCard key={item.href} item={item} />)}
          </div>
        </section>

        <Section
          id="practice-skills"
          title="Luyện kỹ năng"
          subtitle="Các bài luyện tự do để duy trì nhịp học và cải thiện từng kỹ năng."
          icon={<IconTarget size={18} />}
          accent="reading"
        >
          <CardGrid cards={skillCards} />
        </Section>

        <Section
          id="ai-support"
          title="AI bổ trợ"
          subtitle="Dùng AI cho các tình huống khó tự luyện một mình: hội thoại, phát âm và nghe chép."
          icon={<IconMic size={18} />}
          accent="listening"
        >
          <div className="grid gap-4 md:grid-cols-3">
            {aiCards.map((card) => <PracticeActionCard key={card.href} card={card} />)}
          </div>
        </Section>

        <Section
          id="exam-practice"
          title="Đề chuẩn Goethe/TELC"
          subtitle={examUnlocked
            ? 'Làm đề A1/A2/B1 theo format thi thật và xem lại kết quả chi tiết.'
            : 'Các đề chuẩn yêu cầu Premium. Bạn vẫn có thể luyện kỹ năng tự do ở trên.'}
          icon={<IconGraduationCap size={18} />}
          accent="xp"
          badge="Đề chuẩn"
        >
          <CardGrid cards={examCards} locked={!examUnlocked} onLockedClick={() => setUpgradeOpen(true)} />
        </Section>

        <div className="space-y-4">
          <ChooseExam />
          <Link href="/practice-test/huong-dan-b1" className="block">
            <SurfaceCard variant="interactive" accent="examWriting">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: GRADIENT.examWriting }}>
                  <IconBookOpen size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-h3 font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                    Cẩm nang luyện thi B1
                  </h3>
                  <p className="mt-1 text-body leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                    Cấu trúc đề, lộ trình 12 tuần, mẫu Schreiben, Redemittel Sprechen, ngữ pháp và FAQ.
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-body font-bold" style={{ color: ACCENT.examWriting }}>
                    Mở cẩm nang <IconArrowRight size={16} />
                  </span>
                </div>
              </div>
            </SurfaceCard>
          </Link>
        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} defaultPeriod="yearly" />
    </PracticePageShell>
  );
}
