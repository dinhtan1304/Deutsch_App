'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DEFAULT_LABELS: Record<string, string> = {
  dashboard: 'Trang chủ',
  'practice-test': 'Luyện thi',
  reading: 'Đọc',
  listening: 'Nghe',
  writing: 'Viết',
  speaking: 'Nói',
  exam: 'Theo đề',
  new: 'Tạo mới',
  result: 'Kết quả',
  games: 'Trò chơi',
  grammar: 'Ngữ pháp',
  topics: 'Chủ đề',
  words: 'Từ vựng',
  favorites: 'Yêu thích',
  history: 'Lịch sử',
  profile: 'Hồ sơ',
  settings: 'Cài đặt',
  review: 'Ôn tập',
  'study-plan': 'Lộ trình',
  'word-bank': 'Kho từ',
  pricing: 'Gói dịch vụ',
  tips: 'Mẹo',
  resources: 'Tài liệu',
};

interface BreadcrumbProps {
  labelMap?: Record<string, string>;
  className?: string;
}

const DYNAMIC_ID_RE = /^[0-9a-f-]{8,}$/i;

function prettify(segment: string, labelMap: Record<string, string>): string | null {
  if (!segment) return null;
  if (DYNAMIC_ID_RE.test(segment)) return null;
  return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
}

export function Breadcrumb({ labelMap, className }: BreadcrumbProps) {
  const pathname = usePathname() || '';
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 2) return null;

  const map = { ...DEFAULT_LABELS, ...labelMap };
  const crumbs: Array<{ label: string; href: string }> = [];
  let acc = '';
  for (const seg of segments) {
    acc += '/' + seg;
    const label = prettify(seg, map);
    if (label) crumbs.push({ label, href: acc });
  }
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1.5 text-body flex-wrap" style={{ color: 'var(--theme-text-muted)' }}>
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={c.href} className="flex items-center gap-1.5">
              {i > 0 && (
                <span aria-hidden="true" className="opacity-50">/</span>
              )}
              {isLast ? (
                <span style={{ color: 'var(--theme-text-primary)' }} className="font-medium">{c.label}</span>
              ) : (
                <Link href={c.href} className="transition-opacity hover:opacity-70">{c.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
