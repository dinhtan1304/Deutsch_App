'use client';

import Link from 'next/link';
import {
  IconPenLine, IconHeadphones, IconBookOpen, IconMic,
  IconArrowRight, IconStar, IconZap, IconGraduationCap,
} from '@/components/ui/Icons';
import { useAuthStore } from '@/stores/authStore';

// ─── Data ──────────────────────────────────────────────────────────────────────
type CardDef = {
  title: string; titleDe: string; description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string; gradient: string; color: string; locked?: boolean;
};

const freeCards: CardDef[] = [
  {
    title: 'Luyện Đọc', titleDe: 'Leseübung',
    description: 'AI tạo bài đọc tiếng Đức, hỏi và kiểm tra hiểu bài',
    icon: IconBookOpen, href: '/practice-test/reading',
    gradient: 'linear-gradient(135deg, #22C55E, #14B8A6)', color: '#22C55E',
  },
  {
    title: 'Luyện Nghe', titleDe: 'Hörübung',
    description: 'AI tạo audio tiếng Đức, nghe và trả lời câu hỏi',
    icon: IconHeadphones, href: '/practice-test/listening',
    gradient: 'linear-gradient(135deg, #EC4899, #8B5CF6)', color: '#EC4899',
  },
  {
    title: 'Luyện Viết', titleDe: 'Schreibübung',
    description: 'AI tạo đề bài tiếng Đức, chấm và sửa lỗi chi tiết',
    icon: IconPenLine, href: '/practice-test/writing',
    gradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#6366F1',
  },
  {
    title: 'Luyện Nói', titleDe: 'Sprechübung',
    description: 'AI tạo prompt tiếng Đức, ghi âm trả lời, Gemini chấm điểm chi tiết',
    icon: IconMic, href: '/practice-test/speaking',
    gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)', color: '#F59E0B',
  },
];

const examCards: CardDef[] = [
  {
    title: 'Đọc Theo Đề', titleDe: 'Prüfungslesen',
    description: 'Goethe & TELC · A1/A2/B1 · Đầy đủ tất cả Teile như đề thi thật',
    icon: IconBookOpen, href: '/practice-test/reading/exam',
    gradient: 'linear-gradient(135deg, #22C55E, #0EA5E9)', color: '#22C55E',
  },
  {
    title: 'Nghe Theo Đề', titleDe: 'Prüfungshören',
    description: 'Goethe & TELC · A1/A2/B1 · Đầy đủ tất cả Teile Hören như đề thi thật',
    icon: IconHeadphones, href: '/practice-test/listening/exam',
    gradient: 'linear-gradient(135deg, #EC4899, #A855F7)', color: '#EC4899',
  },
  {
    title: 'Viết Theo Đề', titleDe: 'Prüfungsschreiben',
    description: 'Goethe & TELC · A1/A2/B1 · AI chấm theo tiêu chí chính thức',
    icon: IconPenLine, href: '/practice-test/writing/exam',
    gradient: 'linear-gradient(135deg, #A855F7, #6366F1)', color: '#A855F7',
  },
  {
    title: 'Nói Theo Đề', titleDe: 'Prüfungssprechen',
    description: 'Goethe & TELC · A1/A2/B1 · Đầy đủ tất cả Teile Sprechen như đề thi thật',
    icon: IconMic, href: '/practice-test/speaking/exam',
    gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)', color: '#F59E0B',
  },
];

// ─── Card ──────────────────────────────────────────────────────────────────────
function Card({ card, premiumLocked }: { card: CardDef; premiumLocked?: boolean }) {
  const Ic = card.icon;
  if (premiumLocked) {
    return (
      <Link href="/billing"
        className="group block rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg relative overflow-hidden"
        style={{ borderColor: '#6366F1', backgroundColor: 'var(--theme-bg-card)' }}>
        <div className="absolute top-3 right-3">
          <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20, backgroundColor: 'rgba(99,102,241,.2)', color: '#818CF8', letterSpacing: '0.05em' }}>⭐ PREMIUM</span>
        </div>
        <div className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ background: card.gradient, opacity: 0.6 }}>
          <Ic size={22} className="text-white" />
        </div>
        <p className="text-[11px] font-semibold mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>{card.titleDe}</p>
        <h3 className="text-[16px] font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>{card.title}</h3>
        <p className="text-[12.5px] leading-relaxed mb-3" style={{ color: 'var(--theme-text-secondary)' }}>{card.description}</p>
        <div className="text-[12px] font-semibold" style={{ color: '#6366F1' }}>Nâng cấp để mở khóa →</div>
      </Link>
    );
  }
  if (card.locked) {
    return (
      <div className="rounded-2xl border p-5 opacity-55 cursor-not-allowed select-none"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <div className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ background: card.gradient }}>
          <Ic size={22} className="text-white" />
          <span className="absolute -top-1.5 -right-1.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full text-white"
            style={{ backgroundColor: '#6B7280' }}>Soon</span>
        </div>
        <p className="text-[11px] font-semibold mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>{card.titleDe}</p>
        <h3 className="text-[16px] font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>{card.title}</h3>
        <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{card.description}</p>
      </div>
    );
  }
  return (
    <Link href={card.href}
      className="group block rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      {/* Icon */}
      <div className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110"
        style={{ background: card.gradient }}>
        <Ic size={22} className="text-white" />
      </div>
      {/* Text */}
      <p className="text-[11px] font-semibold mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>{card.titleDe}</p>
      <h3 className="text-[16px] font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>{card.title}</h3>
      <p className="text-[12.5px] leading-relaxed mb-4" style={{ color: 'var(--theme-text-secondary)' }}>{card.description}</p>
      {/* CTA */}
      <div className="flex items-center gap-1.5 text-[12.5px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ color: card.color }}>
        Bắt đầu <IconArrowRight size={13} />
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
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}>
              <IconStar size={8} /> {badge}
            </span>
          )}
        </div>
        <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--theme-text-muted)' }}>{sub}</p>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function PracticeTestPage() {
  const { user } = useAuthStore();
  const sub = user?.subscription;
  const isPremium =
    sub?.plan === 'premium' &&
    sub?.status === 'active' &&
    (!sub?.expiresAt || new Date(sub.expiresAt) > new Date());

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
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            Chọn dạng bài luyện tập phù hợp — từ luyện tự do đến đề thi chuẩn Goethe & TELC
          </p>
        </div>
      </div>

      {/* Upgrade banner for free users */}
      {!isPremium && user && (
        <div className="flex items-center gap-4 rounded-2xl border p-4 mb-8 flex-wrap"
          style={{ borderColor: '#6366F1', backgroundColor: 'rgba(99,102,241,.08)' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p className="text-[13px] font-bold" style={{ color: '#818CF8' }}>⭐ Nâng cấp Premium</p>
            <p className="text-[12px] mt-0.5" style={{ color: '#64748B' }}>
              Mở khóa 4 chế độ thi thử chuẩn Goethe/TELC + luyện tập không giới hạn.
            </p>
          </div>
          <Link href="/billing"
            style={{ padding: '8px 18px', borderRadius: 10, backgroundColor: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Xem gói Premium →
          </Link>
        </div>
      )}

      {/* ── Luyện tự do ── */}
      <SectionHeader
        icon={IconZap}
        iconGradient="linear-gradient(135deg, #6366F1, #8B5CF6)"
        label="Luyện tự do"
        sub={isPremium ? 'AI tạo đề ngẫu nhiên, phù hợp mọi cấp độ' : 'AI tạo đề ngẫu nhiên · Tối đa 3 lượt/ngày (Free)'}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {freeCards.map(card => <Card key={card.href} card={card} />)}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--theme-border)' }} />
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full"
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
        sub={isPremium ? 'Goethe & TELC · A1/A2/B1 · Đầy đủ tất cả Teile như đề thi thật' : 'Yêu cầu gói Premium · Goethe & TELC · A1/A2/B1'}
        badge="Đề chuẩn"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {examCards.map(card => <Card key={card.href} card={card} premiumLocked={!isPremium} />)}
      </div>
    </div>
  );
}
