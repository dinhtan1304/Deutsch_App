import { useTranslations } from 'next-intl';
import { GRADIENT } from '@/lib/tokens';
import { roadmap12w } from '../_data/b1-content';

export function RoadmapB1() {
  const t = useTranslations('practice.guideB1.roadmap');
  return (
    <section id="lo-trinh" className="mb-12 scroll-mt-20">
      <div className="mb-5">
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          {t('title')}
        </h3>
        <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
          {t('subtitle')}
        </p>
      </div>

      <ol className="relative pl-8">
        <span
          aria-hidden
          className="absolute left-3 top-2 bottom-2 w-px"
          style={{ backgroundColor: 'var(--theme-border)' }}
        />
        {roadmap12w.map((phase, idx) => (
          <li key={phase.weeks} className="relative mb-4 last:mb-0">
            <span
              aria-hidden
              className="absolute -left-8 top-3 w-7 h-7 rounded-full flex items-center justify-center text-caption font-black text-white shadow-md"
              style={{ background: GRADIENT.brand }}
            >
              {idx + 1}
            </span>
            <div
              className="rounded-2xl p-4"
              style={{
                backgroundColor: 'var(--theme-bg-card)',
                border: '1px solid var(--theme-border)',
              }}
            >
              <div className="flex items-baseline gap-2 flex-wrap mb-2">
                <span
                  className="inline-block text-caption font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'var(--theme-bg-secondary)',
                    color: 'var(--theme-text-muted)',
                  }}
                >
                  {phase.weeks}
                </span>
                <h4 className="text-h3 font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                  {phase.title}
                </h4>
              </div>
              <ul className="space-y-1.5 mt-2">
                {phase.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 text-body"
                    style={{ color: 'var(--theme-text-secondary)', lineHeight: 1.6 }}
                  >
                    <span style={{ color: 'var(--theme-text-muted)' }}>•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
