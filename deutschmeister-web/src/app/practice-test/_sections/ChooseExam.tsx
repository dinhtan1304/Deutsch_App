import Link from 'next/link';
import { IconCheck, IconArrowRight } from '@/components/ui/Icons';
import { GRADIENT } from '@/lib/tokens';
import { examSummaries, comparisonRows, whyBenefits } from '../_data/b1-content';

export function ChooseExam() {
  return (
    <section id="chon-chung-chi" className="mb-12 scroll-mt-20">
      <div className="mb-5">
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          Chọn chứng chỉ phù hợp
        </h3>
        <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
          Goethe và TELC đều được công nhận quốc tế. Chọn theo điểm mạnh của bạn.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {examSummaries.map((exam) => (
          <article
            key={exam.id}
            className="rounded-3xl p-6 relative overflow-hidden shadow-sm"
            style={{
              backgroundColor: 'var(--theme-bg-card)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ background: GRADIENT[exam.gradient] }}
            />
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <h4 className="text-xl font-black" style={{ color: 'var(--theme-text-primary)' }}>
                {exam.name}
              </h4>
              <span className="text-caption font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ color: 'var(--theme-text-muted)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                {exam.shortName}
              </span>
            </div>
            <p className="text-body mb-5" style={{ color: 'var(--theme-text-secondary)', lineHeight: 1.7 }}>
              {exam.description}
            </p>
            <ul className="space-y-2 mb-6">
              {exam.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2 text-body" style={{ color: 'var(--theme-text-secondary)' }}>
                  <IconCheck size={16} style={{ color: 'var(--theme-text-muted)', marginTop: 3 }} />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <Link
              href={`/practice-test/huong-dan-b1?exam=${exam.id}#cau-truc-de`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-body font-bold text-white shadow-md transition-transform hover:-translate-y-0.5"
              style={{ background: GRADIENT[exam.gradient] }}
            >
              Xem chi tiết cấu trúc đề
              <IconArrowRight size={14} />
            </Link>
          </article>
        ))}
      </div>

      {/* Comparison table */}
      <div className="mb-8">
        <h4 className="text-h3 font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
          So sánh Goethe B1 vs TELC B1
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
                  <th className="text-left p-4 font-bold" style={{ color: 'var(--theme-text-primary)' }}>Tiêu chí</th>
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
                    <td className="p-4" style={{ color: 'var(--theme-text-secondary)' }}>{row.goethe}</td>
                    <td className="p-4" style={{ color: 'var(--theme-text-secondary)' }}>{row.telc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-caption mt-3" style={{ color: 'var(--theme-text-muted)' }}>
          Cả hai chứng chỉ đều được công nhận quốc tế và dùng được cho visa định cư tại Đức.
        </p>
      </div>

      {/* Why DeutschMeister benefits */}
      <div>
        <h4 className="text-h3 font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
          Vì sao luyện B1 trên DeutschMeister?
        </h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {whyBenefits.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl p-4"
              style={{
                backgroundColor: 'var(--theme-bg-card)',
                border: '1px solid var(--theme-border)',
              }}
            >
              <p className="text-body font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>{b.title}</p>
              <p className="text-caption" style={{ color: 'var(--theme-text-muted)', lineHeight: 1.6 }}>{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
