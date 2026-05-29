'use client';

import Link from 'next/link';
import { GRADIENT, ACCENT, STATUS } from '@/lib/tokens';
import { IconGamepad, IconBook, IconBookOpen, IconGraduationCap, IconArrowRight } from '@/components/ui/Icons';

const ACTIONS = [
  { href: '/games', label: 'Chơi game', sub: 'Luyện mạo từ', icon: IconGamepad, gradient: GRADIENT.action, shadow: `${ACCENT.srs}47` },
  { href: '/words', label: 'Từ điển', sub: 'Học từ mới', icon: IconBook, gradient: GRADIENT.reading, shadow: `${STATUS.success}47` },
  { href: '/grammar', label: 'Ngữ pháp', sub: 'Luyện bài tập', icon: IconBookOpen, gradient: GRADIENT.history, shadow: `${ACCENT.vocab}47` },
  { href: '/practice-test', label: 'Luyện thi', sub: 'Đề Goethe/TELC', icon: IconGraduationCap, gradient: GRADIENT.speaking, shadow: `${ACCENT.xp}47` },
];

export function ProfileQuickActions() {
  return (
    <div className="rounded-2xl border p-5"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <h2 className="text-[15px] font-bold mb-4" style={{ color: 'var(--theme-text-primary)' }}>
        Truy cập nhanh
      </h2>
      <div className="grid grid-cols-2 gap-2.5">
        {ACTIONS.map((qa, i) => {
          const QaIcon = qa.icon;
          return (
            <Link key={i} href={qa.href}
              className="flex flex-col gap-2 p-3.5 rounded-xl text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: qa.gradient, boxShadow: `0 4px 12px ${qa.shadow}` }}>
              <QaIcon size={20} style={{ color: 'white' }} />
              <div>
                <div className="text-body font-bold leading-tight">{qa.label}</div>
                <div className="text-caption opacity-75 mt-0.5">{qa.sub}</div>
              </div>
              <div className="flex justify-end">
                <IconArrowRight size={14} style={{ color: 'white', opacity: 0.6 }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
