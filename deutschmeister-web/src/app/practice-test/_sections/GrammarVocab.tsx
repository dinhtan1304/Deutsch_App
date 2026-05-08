import Link from 'next/link';
import { IconArrowRight } from '@/components/ui/Icons';
import { grammarTable, vocabByTopic } from '../_data/b1-content';

export function GrammarVocab() {
  return (
    <section id="ngu-phap-tu-vung" className="mb-12 scroll-mt-20">
      <div className="mb-5">
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
          Ngữ pháp & Từ vựng B1 trọng tâm
        </h3>
        <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
          6 cấu trúc ngữ pháp hay xuất hiện nhất + 6 chủ đề từ vựng phổ biến trong đề thi.
        </p>
      </div>

      {/* Grammar table */}
      <div className="mb-8">
        <h4 className="text-h3 font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
          6 cấu trúc ngữ pháp quan trọng nhất
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
                  <th className="text-left p-4 font-bold whitespace-nowrap" style={{ color: 'var(--theme-text-primary)' }}>Cấu trúc</th>
                  <th className="text-left p-4 font-bold" style={{ color: 'var(--theme-text-primary)' }}>Ví dụ</th>
                  <th className="text-left p-4 font-bold whitespace-nowrap" style={{ color: 'var(--theme-text-primary)' }}>Ứng dụng</th>
                </tr>
              </thead>
              <tbody>
                {grammarTable.map((row, idx) => (
                  <tr
                    key={row.name}
                    style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--theme-border)' }}
                  >
                    <td className="p-4 font-bold whitespace-nowrap" style={{ color: 'var(--theme-text-primary)' }}>{row.name}</td>
                    <td className="p-4 italic" style={{ color: 'var(--theme-text-secondary)' }}>{row.example}</td>
                    <td className="p-4" style={{ color: 'var(--theme-text-muted)' }}>{row.usage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Vocab by topic */}
      <div>
        <div className="flex items-baseline justify-between mb-3 gap-2 flex-wrap">
          <h4 className="text-h3 font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            Từ vựng B1 theo chủ đề
          </h4>
          <Link
            href="/topics"
            className="inline-flex items-center gap-1 text-body font-bold"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            Xem tất cả chủ đề <IconArrowRight size={14} />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vocabByTopic.map((topic) => (
            <div
              key={topic.titleDe}
              className="rounded-2xl p-4"
              style={{
                backgroundColor: 'var(--theme-bg-card)',
                border: '1px solid var(--theme-border)',
              }}
            >
              <p className="text-caption font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                {topic.titleDe}
              </p>
              <p className="text-body font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
                {topic.title}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {topic.words.map((w) => (
                  <span
                    key={w}
                    className="inline-block text-caption px-2 py-1 rounded-md"
                    style={{
                      backgroundColor: 'var(--theme-bg-secondary)',
                      color: 'var(--theme-text-secondary)',
                    }}
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
