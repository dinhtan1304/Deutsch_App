'use client';
/* eslint-disable no-restricted-syntax -- custom UI gradients */

import { useState } from 'react';
import Link from 'next/link';
import {
  IconPenLine, IconHeadphones, IconBookOpen, IconMic,
  IconArrowRight, IconStar, IconZap, IconGraduationCap,
} from '@/components/ui/Icons';
import { useIsExamUnlocked } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { ACCENT, STATUS } from '@/lib/tokens';

// ─── Data ──────────────────────────────────────────────────────────────────────
type CardDef = {
  title: string; titleDe: string; description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string; gradient: string; color: string; locked?: boolean;
};

const freeCards: CardDef[] = [
  {
    title: 'Luyện Đọc', titleDe: 'Leseübung',
    description: 'Tạo bài đọc tiếng Đức, hỏi và kiểm tra hiểu bài',
    icon: IconBookOpen, href: '/practice-test/reading',
    gradient: 'linear-gradient(135deg, #22C55E, #14B8A6)', color: STATUS.success,
  },
  {
    title: 'Luyện Nghe', titleDe: 'Hörübung',
    description: 'Tạo audio tiếng Đức, nghe và trả lời câu hỏi',
    icon: IconHeadphones, href: '/practice-test/listening',
    gradient: 'linear-gradient(135deg, #EC4899, #8B5CF6)', color: ACCENT.listening,
  },
  {
    title: 'Luyện Viết', titleDe: 'Schreibübung',
    description: 'Tạo đề bài tiếng Đức, chấm và sửa lỗi chi tiết',
    icon: IconPenLine, href: '/practice-test/writing',
    gradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: ACCENT.writing,
  },
  {
    title: 'Luyện Nói', titleDe: 'Sprechübung',
    description: 'Tạo prompt tiếng Đức, ghi âm trả lời, Gemini chấm điểm chi tiết',
    icon: IconMic, href: '/practice-test/speaking',
    gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)', color: ACCENT.xp,
  },
  {
    title: 'Roleplay AI', titleDe: 'Rollenspiel',
    description: 'Luyện hội thoại thực tế với AI (bác sĩ, phỏng vấn, thuê nhà...)',
    icon: IconZap, href: '/practice-test/roleplay',
    gradient: 'linear-gradient(135deg, #6366F1, #A855F7)', color: ACCENT.examWriting,
  },
  {
    title: 'Phát Âm AI', titleDe: 'Aussprachetraining',
    description: 'Ghi âm và nhận đánh giá phát âm từng từ bằng AI',
    icon: IconMic, href: '/practice-test/pronunciation',
    gradient: 'linear-gradient(135deg, #EC4899, #A855F7)', color: ACCENT.listening,
  },
  {
    title: 'Chép Chính Tả', titleDe: 'Diktat',
    description: 'Nghe video YouTube tiếng Đức, điền từ còn thiếu theo câu',
    icon: IconHeadphones, href: '/practice-test/dictation',
    gradient: 'linear-gradient(135deg, #06B6D4, #3B82F6)', color: ACCENT.dictation,
  },
];

const examCards: CardDef[] = [
  {
    title: 'Đọc Theo Đề', titleDe: 'Prüfungslesen',
    description: 'Goethe & TELC · A1/A2/B1 · Đầy đủ tất cả Teile như đề thi thật',
    icon: IconBookOpen, href: '/practice-test/reading/exam',
    gradient: 'linear-gradient(135deg, #22C55E, #0EA5E9)', color: STATUS.success,
  },
  {
    title: 'Nghe Theo Đề', titleDe: 'Prüfungshören',
    description: 'Goethe & TELC · A1/A2/B1 · Đầy đủ tất cả Teile Hören như đề thi thật',
    icon: IconHeadphones, href: '/practice-test/listening/exam',
    gradient: 'linear-gradient(135deg, #EC4899, #A855F7)', color: ACCENT.listening,
  },
  {
    title: 'Viết Theo Đề', titleDe: 'Prüfungsschreiben',
    description: 'Goethe & TELC · A1/A2/B1 · Chấm theo tiêu chí chính thức',
    icon: IconPenLine, href: '/practice-test/writing/exam',
    gradient: 'linear-gradient(135deg, #A855F7, #6366F1)', color: ACCENT.examWriting,
  },
  {
    title: 'Nói Theo Đề', titleDe: 'Prüfungssprechen',
    description: 'Goethe & TELC · A1/A2/B1 · Đầy đủ tất cả Teile Sprechen như đề thi thật',
    icon: IconMic, href: '/practice-test/speaking/exam',
    gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)', color: ACCENT.xp,
  },
];

// ─── Card ──────────────────────────────────────────────────────────────────────
function Card({
  card,
  premiumLocked,
  onPremiumClick,
}: {
  card: CardDef;
  premiumLocked?: boolean;
  onPremiumClick?: () => void;
}) {
  const Ic = card.icon;

  if (card.locked) {
    return (
      <div className="rounded-3xl p-6 opacity-60 cursor-not-allowed select-none relative overflow-hidden shadow-sm"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)', backgroundColor: 'var(--theme-bg-card)' }}>
        <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: card.gradient, opacity: 0.8 }}>
          <Ic size={24} className="text-white" />
          <span className="absolute -top-2 -right-2 text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow-sm"
            style={{ backgroundColor: '#6B7280' }}>Sắp ra mắt</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--theme-text-muted)' }}>{card.titleDe}</p>
        <h3 className="text-lg font-black mb-2" style={{ color: 'var(--theme-text-primary)' }}>{card.title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{card.description}</p>
      </div>
    );
  }

  if (premiumLocked) {
    return (
      <button
        type="button"
        onClick={onPremiumClick}
        className="group text-left w-full rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden shadow-sm"
        style={{ backgroundColor: 'var(--theme-bg-card)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)' }}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" style={{ background: card.gradient }} />
        
        {/* Icon with lock overlay */}
        <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 shadow-md"
          style={{ background: card.gradient }}>
          <Ic size={24} className="text-white" />
          <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
        </div>
        
        {/* PREMIUM badge */}
        <span
          className="absolute top-5 right-5 text-[10px] font-black px-2.5 py-1 rounded-full text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}
        >
          PREMIUM
        </span>
        
        {/* Text */}
        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--theme-text-muted)' }}>{card.titleDe}</p>
        <h3 className="text-lg font-black mb-2" style={{ color: 'var(--theme-text-primary)' }}>{card.title}</h3>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--theme-text-secondary)' }}>{card.description}</p>
        
        {/* CTA */}
        <div className="flex items-center gap-2 text-sm font-bold opacity-80 group-hover:opacity-100 transition-opacity duration-300"
          style={{ color: card.color }}>
          Nâng cấp để mở khoá <IconArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
        </div>
      </button>
    );
  }

  return (
    <Link href={card.href}
      className="group block rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden shadow-sm"
      style={{ backgroundColor: 'var(--theme-bg-card)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)' }}>
      
      {/* Background Hover Glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none" style={{ background: card.gradient }} />

      {/* Dynamic Border Glow via inset box-shadow trick */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl" 
        style={{ boxShadow: `inset 0 0 0 2px ${card.color}50` }} />

      {/* Icon */}
      <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 shadow-md group-hover:shadow-lg"
        style={{ background: card.gradient }}>
        <Ic size={24} className="text-white" />
      </div>
      
      {/* Text */}
      <p className="text-xs font-bold uppercase tracking-wider mb-1 transition-colors group-hover:text-opacity-80" style={{ color: card.color }}>{card.titleDe}</p>
      <h3 className="text-lg font-black mb-2 transition-colors duration-300 group-hover:text-opacity-90" style={{ color: 'var(--theme-text-primary)' }}>{card.title}</h3>
      <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--theme-text-secondary)' }}>{card.description}</p>
      
      {/* CTA */}
      <div className="flex items-center gap-2 text-sm font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
        style={{ color: card.color }}>
        Bắt đầu ngay <IconArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon, iconGradient, label, sub, badge,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconGradient: string; label: string; sub: string; badge?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: iconGradient }}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[15px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>{label}</span>
          {badge && (
            <span className="inline-flex items-center gap-1 text-caption font-extrabold px-2 py-0.5 rounded-full text-white"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}>
              <IconStar size={8} /> {badge}
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--theme-text-muted)' }}>{sub}</p>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function PracticeTestPage() {
  const examUnlocked = useIsExamUnlocked();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <div className="py-6 max-w-7xl mx-auto px-4">

      {/* Page header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
          <IconGraduationCap size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>Luyện Test</h1>
          <p className="text-body mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            Chọn dạng bài luyện tập phù hợp — từ luyện tự do đến đề thi chuẩn Goethe & TELC
          </p>
        </div>
      </div>

      {/* ── Luyện tự do ── */}
      <SectionHeader
        icon={IconZap}
        iconGradient="linear-gradient(135deg, #6366F1, #8B5CF6)"
        label="Luyện tự do"
        sub="AI tạo đề ngẫu nhiên · Tối đa 3 lượt/tuần"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {freeCards.map(card => <Card key={card.href} card={card} />)}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--theme-border)' }} />
        <span className="text-caption font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full"
          style={{ color: 'var(--theme-text-muted)', backgroundColor: 'var(--theme-bg-secondary)' }}>
          Đề chuẩn
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--theme-border)' }} />
      </div>

      {/* ── Theo đề chuẩn ── */}
      <SectionHeader
        icon={IconGraduationCap}
        iconGradient="linear-gradient(135deg, #F59E0B, #EF4444)"
        label="Theo đề chuẩn"
        sub={examUnlocked
          ? 'Goethe & TELC · A1/A2/B1 · Đầy đủ tất cả Teile như đề thi thật'
          : 'Goethe & TELC · A1/A2/B1 · Yêu cầu gói Premium'}
        badge="Đề chuẩn"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {examCards.map(card => (
          <Card
            key={card.href}
            card={card}
            premiumLocked={!examUnlocked}
            onPremiumClick={() => setUpgradeOpen(true)}
          />
        ))}
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        defaultPeriod="yearly"
      />
    </div>
  );
}
