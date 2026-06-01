import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { IconCheck, IconArrowRight } from '@/components/ui/Icons';
import { GRADIENT } from '@/lib/tokens';
import { examSummaries, comparisonRows, whyBenefits } from '../_data/b1-content';

// Dot colours for the "why" benefit cards (matches the v2 design palette)
const WHY_DOTS = ['var(--success)', 'var(--violet)', 'var(--cyan)', 'var(--warn)', 'var(--der)', 'var(--streak)'];

// Colour comparison-table cells by their leading marker (✓ positive / ✗ absent)
function cellColor(value: string) {
  if (value.startsWith('✓')) return 'var(--success)';
  if (value.startsWith('✗')) return 'var(--theme-text-muted)';
  return 'var(--theme-text-secondary)';
}

export function ChooseExam() {
  const t = useTranslations('practice.guideB1.choose');
  return (
    <section id="chon-chung-chi" className="mb-12 scroll-mt-20">
      <div className="mb-5">
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          {t('title')}
        </h3>
        <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
          {t('subtitle')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {examSummaries.map((exam) => (
          <article
            key={exam.id}
            className="relative flex flex-col overflow-hidden rounded-2xl border p-6"
            style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ background: GRADIENT[exam.gradient] }}
            />
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <h4 className="text-xl font-black" style={{ color: 'var(--theme-text-primary)' }}>
                {exam.name}
              </h4>
              <span className="text-caption font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm"
                style={{ color: 'var(--theme-text-muted)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                {exam.shortName}
              </span>
            </div>
            <p className="text-body mb-5" style={{ color: 'var(--theme-text-secondary)', lineHeight: 1.7 }}>
              {exam.description}
            </p>
            <ul className="mb-6 flex-1 space-y-2.5">
              {exam.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2 text-body" style={{ color: 'var(--theme-text-secondary)' }}>
                  <IconCheck size={16} style={{ color: 'var(--success)', marginTop: 3, flexShrink: 0 }} />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <Link
              href={`/practice-test/huong-dan-b1?exam=${exam.id}#cau-truc-de`}
              className="flex w-full items-center justify-center gap-2 rounded-[11px] px-4 py-3 text-body font-bold text-white transition-transform hover:-translate-y-0.5"
              style={{ background: GRADIENT[exam.gradient] }}
            >
              {t('viewStructure')}
              <IconArrowRight size={15} />
            </Link>
          </article>
        ))}
      </div>

      {/* Comparison table */}
      <div className="mb-8">
        <h4 className="text-h3 font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
          {t('compareTitle')}
        </h4>
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            border: '1px solid var(--theme-border)',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-body">
              <thead>
                <tr style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                  <th className="text-left p-4 font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('colCriterion')}</th>
                  <th className="text-left p-4 font-bold" style={{ color: 'var(--theme-text-primary)' }}>Goethe B1</th>
                  <th className="text-left p-4 font-bold" style={{ color: 'var(--theme-text-primary)' }}>TELC B1</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr
                    key={row.criterion}
                    style={{
                      borderTop: idx === 0 ? 'none' : '1px solid var(--theme-border)',
                    }}
                  >
                    <td className="p-4 font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{row.criterion}</td>
                    <td className="p-4 font-medium" style={{ color: cellColor(row.goethe) }}>{row.goethe}</td>
                    <td className="p-4 font-medium" style={{ color: cellColor(row.telc) }}>{row.telc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-caption mt-3" style={{ color: 'var(--theme-text-muted)' }}>
          {t('recognizedNote')}
        </p>
      </div>

      {/* Why DeutschMeister benefits */}
      <div>
        <h4 className="text-h3 font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
          {t('whyTitle')}
        </h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {whyBenefits.map((b, i) => (
            <div
              key={b.title}
              className="rounded-2xl p-4"
              style={{
                backgroundColor: 'var(--theme-bg-card)',
                border: '1px solid var(--theme-border)',
              }}
            >
              <p className="mb-1 flex items-center gap-2 text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                <span className="h-1.75 w-1.75 shrink-0 rounded-full" style={{ background: WHY_DOTS[i % WHY_DOTS.length] }} />
                {b.title}
              </p>
              <p className="text-caption" style={{ color: 'var(--theme-text-muted)', lineHeight: 1.6 }}>{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
