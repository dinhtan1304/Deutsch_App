import { useTranslations } from 'next-intl';
import { faqList } from '../_data/b1-content';

export function B1Faq() {
  const t = useTranslations('practice.guideB1.faq');
  return (
    <section id="faq" className="mb-12 scroll-mt-20">
      <div className="mb-5">
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          {t('title')}
        </h3>
        <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
          {t('subtitle')}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {faqList.map(({ q, a }) => (
          <details
            key={q}
            className="group rounded-2xl"
            style={{
              backgroundColor: 'var(--theme-bg-card)',
              border: '1px solid var(--theme-border)',
            }}
          >
            <summary
              className="flex items-center justify-between gap-3 p-4 cursor-pointer list-none"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              <span className="text-body font-bold">{q}</span>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="transition-transform group-open:rotate-180 shrink-0"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <p
              className="text-body px-4 pb-4"
              style={{ color: 'var(--theme-text-secondary)', lineHeight: 1.75 }}
            >
              {a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
