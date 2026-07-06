'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useGrammarExplain } from '@/hooks/useGrammarExplain';
import { HighlightedText } from '@/components/word-highlight/HighlightedText';
import { ACCENT } from '@/lib/tokens';

function IconBulb({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1v.2h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
    </svg>
  );
}
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/**
 * Point-of-need rule explanation shown at a wrong answer. Fetches the curated
 * grammar theory for the given concept (errorType / trainer skillTag) and, if a
 * rule exists, renders a collapsible "Hiểu quy tắc" card + a link to the full
 * lesson. Renders nothing when there's no mapped rule — never disrupts the flow.
 */
export function WhyExplainer({ concept }: { concept: string }) {
  const [open, setOpen] = useState(false);
  const { data } = useGrammarExplain(concept, !!concept);

  if (!data?.found || !data.section) return null;
  const { section, slug } = data;

  return (
    <div className="mt-2.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-caption font-semibold transition-opacity hover:opacity-80"
        style={{ color: ACCENT.brand }}
      >
        <IconBulb /> Hiểu quy tắc <IconChevron open={open} />
      </button>

      {open && (
        <div className="mt-2 rounded-xl p-3.5" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
          {section.titleVi && (
            <p className="mb-1.5 text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{section.titleVi}</p>
          )}
          {section.content && (
            <HighlightedText text={section.content} className="text-body" style={{ color: 'var(--theme-text-secondary)', lineHeight: 1.6 }} />
          )}

          {section.table && section.table.headers?.length > 0 && (
            <div className="mt-2.5 overflow-x-auto">
              <table className="w-full text-caption" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {section.table.headers.map((h, i) => (
                      <th key={i} className="px-2.5 py-1.5 text-left font-bold" style={{ color: 'var(--theme-text-primary)', borderBottom: '1px solid var(--theme-border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.table.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td key={c} className="px-2.5 py-1.5" style={{ color: 'var(--theme-text-secondary)', borderBottom: '1px solid var(--theme-border)' }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {slug && (
            <Link href={`/grammar/${slug}`} className="mt-2.5 inline-flex items-center gap-1 text-caption font-semibold" style={{ color: ACCENT.brand }}>
              Học bài đầy đủ →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
