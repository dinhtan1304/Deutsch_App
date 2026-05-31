'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface BreadcrumbProps {
  labelMap?: Record<string, string>;
  className?: string;
}

const DYNAMIC_ID_RE = /^[0-9a-f-]{8,}$/i;
const LOCALE_SEGMENTS = new Set(['vi', 'en', 'de']);

export function Breadcrumb({ labelMap, className }: BreadcrumbProps) {
  const t = useTranslations('common.breadcrumb');
  const pathname = usePathname() || '';
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 2) return null;

  const prettify = (segment: string): string | null => {
    if (!segment) return null;
    if (DYNAMIC_ID_RE.test(segment)) return null;
    if (LOCALE_SEGMENTS.has(segment)) return null;
    if (labelMap?.[segment]) return labelMap[segment];
    if (t.has(segment as 'dashboard')) return t(segment as 'dashboard');
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
  };

  const crumbs: Array<{ label: string; href: string }> = [];
  let acc = '';
  for (const seg of segments) {
    acc += '/' + seg;
    const label = prettify(seg);
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
