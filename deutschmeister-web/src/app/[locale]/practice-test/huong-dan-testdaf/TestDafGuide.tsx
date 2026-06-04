'use client';

import { Link } from '@/i18n/navigation';
import {
  IconBookOpen, IconHeadphones, IconPenLine, IconMic, IconLightbulb,
  IconArrowLeft, IconArrowRight, IconClock, IconTarget,
} from '@/components/ui/Icons';
import { ACCENT } from '@/lib/tokens';

// ─── Content (Vietnamese, like _data/b1-content.ts) ──────────────────────────

interface Module {
  key: 'lesen' | 'hoeren' | 'schreiben' | 'sprechen';
  title: string;
  titleVi: string;
  duration: string;
  summary: string;
  parts: string;
  tip: string;
  practiceHref: string;
  color: string;
}

const MODULES: Module[] = [
  {
    key: 'lesen',
    title: 'Leseverstehen',
    titleVi: 'Đọc hiểu',
    duration: '60 phút',
    summary: '3 phần, ~30 câu: tìm thông tin nhanh, đọc hiểu chi tiết và xử lý văn bản khoa học.',
    parts:
      'Teil 1 (~8 câu): ghép các đề mục/tình huống với mẩu văn bản phù hợp (Zuordnung). Teil 2 (~10 câu): bài báo dài → chọn a/b/c (MCQ). Teil 3 (~10 câu): văn bản khoa học → "Ja / Nein / Der Text sagt dazu nichts".',
    tip: 'Đọc câu hỏi trước, gạch chân từ khóa học thuật. Phần 3 khó nhất — phân biệt "thông tin sai" với "văn bản không đề cập".',
    practiceHref: '/practice-test/reading/exam',
    color: ACCENT.reading,
  },
  {
    key: 'hoeren',
    title: 'Hörverstehen',
    titleVi: 'Nghe hiểu',
    duration: '~40 phút',
    summary: '3 phần với độ khó tăng dần: hội thoại đời sống sinh viên, phỏng vấn và bài giảng chuyên gia.',
    parts:
      'Teil 1 (~8 câu): hội thoại ngắn → ghi chú thông tin (nghe 1 lần). Teil 2 (~10 câu): phỏng vấn/thảo luận → Richtig/Falsch (nghe 1 lần). Teil 3 (~7 câu): bài giảng/độc thoại chuyên gia → MCQ (nghe 2 lần).',
    tip: 'Tập ghi chú nhanh bằng từ khóa & ký hiệu. Chú ý các từ nối thể hiện lập luận (jedoch, allerdings, dennoch).',
    practiceHref: '/practice-test/listening/exam',
    color: ACCENT.listening,
  },
  {
    key: 'schreiben',
    title: 'Schriftlicher Ausdruck',
    titleVi: 'Viết',
    duration: '60 phút',
    summary: '1 bài viết: mô tả số liệu/biểu đồ (Grafikbeschreibung) rồi lập luận về một chủ đề.',
    parts:
      'Phần 1 — mô tả dữ liệu: trình bày các số liệu chính của biểu đồ một cách khách quan (xu hướng tăng/giảm, so sánh, mốc thời gian). Phần 2 — argumentation: nêu quan điểm về chủ đề, đưa lý lẽ Pro/Contra và kết luận. Khoảng 250–350 từ.',
    tip: 'Học thuộc bộ Redemittel mô tả số liệu (steigt um, sinkt auf, im Vergleich zu, der Anteil beträgt) và bộ từ lập luận. Chia rõ 2 phần mô tả + bình luận.',
    practiceHref: '/practice-test/writing/exam',
    color: ACCENT.writing,
  },
  {
    key: 'sprechen',
    title: 'Mündlicher Ausdruck',
    titleVi: 'Nói',
    duration: '~35 phút',
    summary: '7 nhiệm vụ thực hiện trên máy tính (ghi âm), độ phức tạp tăng dần.',
    parts:
      '7 tình huống điển hình: hỏi/xin thông tin, kể về bản thân, mô tả một biểu đồ, nêu & bảo vệ quan điểm (Stellung nehmen), đưa giả thuyết (Hypothesen), cho lời khuyên, và cân nhắc các phương án để đưa ra quyết định. Mỗi câu có thời gian chuẩn bị + thời gian nói riêng.',
    tip: 'Luyện nói theo đồng hồ bấm giờ. Trả lời đúng "đăng ký giao tiếp" (formell/informell) mà đề yêu cầu — đây là tiêu chí chấm quan trọng.',
    practiceHref: '/practice-test/speaking/exam',
    color: ACCENT.speaking,
  },
];

const MODULE_ICON: Record<Module['key'], React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  lesen: IconBookOpen,
  hoeren: IconHeadphones,
  schreiben: IconPenLine,
  sprechen: IconMic,
};

interface TdnBand {
  label: string;
  cefr: string;
  desc: string;
  color: string;
}
const TDN_BANDS: TdnBand[] = [
  { label: 'TDN 5', cefr: '≈ C1', desc: 'Vượt yêu cầu ngôn ngữ của mọi ngành học tại đại học Đức.', color: 'var(--success)' },
  { label: 'TDN 4', cefr: '≈ B2.2–C1.1', desc: 'Đủ điều kiện nhập học hầu hết các chương trình đại học.', color: 'var(--der)' },
  { label: 'TDN 3', cefr: '≈ B2.1', desc: 'Đủ cho một số ngành hoặc điều kiện nhập học nhất định.', color: 'var(--warn)' },
  { label: 'dưới TDN 3', cefr: '< B2.1', desc: 'Chưa đạt chuẩn ngôn ngữ tối thiểu cho bậc đại học.', color: 'var(--theme-text-muted)' },
];

const ROADMAP: { phase: string; bullets: string[] }[] = [
  { phase: 'Tuần 1–4 · Củng cố B2', bullets: ['Ôn ngữ pháp B2 trọng tâm (Konjunktiv II, Passiv, Nominalisierung)', 'Xây vốn từ học thuật theo chủ đề (môi trường, giáo dục, công nghệ)'] },
  { phase: 'Tuần 5–8 · Làm quen định dạng', bullets: ['Luyện từng Teil Lesen & Hören đúng format TestDaF', 'Học Redemittel mô tả Grafik và lập luận'] },
  { phase: 'Tuần 9–12 · Viết & Nói', bullets: ['Viết 1 bài Schriftlicher Ausdruck mỗi 2 ngày, bấm giờ 60 phút', 'Luyện 7 nhiệm vụ Mündlicher Ausdruck theo đồng hồ'] },
  { phase: 'Tuần 13+ · Thi thử', bullets: ['Làm full đề bấm giờ, tự chấm theo thang TDN', 'Tập trung vào kỹ năng yếu nhất'] },
];

const TIPS = [
  'Đọc báo khoa học phổ thông tiếng Đức (Spektrum, ZEIT Wissen) để quen văn phong học thuật.',
  'Lập sổ tay Redemittel riêng cho mô tả số liệu và cho lập luận.',
  'Phần Nói thi trên máy — hãy luyện ghi âm chính mình và nghe lại để sửa.',
  'Quản lý thời gian: TestDaF rất chặt về thời gian, luôn luyện với đồng hồ.',
];

// ─── Component ────────────────────────────────────────────────────────────────

export function TestDafGuide() {
  return (
    <div className="py-6 max-w-360 mx-auto px-4 sm:px-6">
      <Link
        href="/practice-test"
        className="inline-flex items-center gap-2 text-body font-semibold mb-4 transition-colors hover:opacity-80"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        <IconArrowLeft size={14} />
        Quay lại Luyện thi
      </Link>

      {/* Header */}
      <header className="mb-10">
        <span className="mono inline-block rounded-md px-2.5 py-1 text-caption font-bold uppercase tracking-wider mb-3"
          style={{ color: 'var(--der)', backgroundColor: 'color-mix(in srgb, var(--der) 14%, transparent)' }}>
          TestDaF · B2–C1
        </span>
        <h1 className="text-h1 font-extrabold mb-2" style={{ color: 'var(--theme-text-primary)', letterSpacing: '-.02em' }}>
          Cẩm nang luyện thi TestDaF
        </h1>
        <p className="text-lead" style={{ color: 'var(--theme-text-secondary)', lineHeight: 1.7, maxWidth: '52rem' }}>
          TestDaF (Test Deutsch als Fremdsprache) là kỳ thi tiếng Đức học thuật dành cho mục đích du học, đánh giá ở
          bậc B2–C1 và chấm theo thang <strong>TDN 3/4/5</strong>. Gồm 4 phần độc lập: Đọc, Nghe, Viết và Nói.
        </p>
      </header>

      {/* TDN scale */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Thang điểm TDN là gì?</h2>
        <p className="text-body mb-5" style={{ color: 'var(--theme-text-muted)' }}>
          Mỗi phần thi được chấm độc lập theo bậc TestDaF-Niveaustufe. Đa số trường đại học yêu cầu TDN 4 ở cả 4 phần.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TDN_BANDS.map((b) => (
            <div key={b.label} className="rounded-2xl p-4" style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="mono text-h3 font-extrabold" style={{ color: b.color }}>{b.label}</span>
                <span className="text-caption font-semibold" style={{ color: 'var(--theme-text-muted)' }}>{b.cefr}</span>
              </div>
              <p className="text-caption" style={{ color: 'var(--theme-text-secondary)', lineHeight: 1.6 }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Cấu trúc đề thi</h2>
        <p className="text-body mb-5" style={{ color: 'var(--theme-text-muted)' }}>4 phần thi · Nhấn từng phần để xem chi tiết và luyện tập.</p>
        <div className="grid gap-3">
          {MODULES.map((m) => {
            const Icon = MODULE_ICON[m.key];
            return (
              <details key={m.key} className="word-card-v2 group rounded-2xl overflow-hidden"
                style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', ['--card-accent' as string]: m.color } as React.CSSProperties}>
                <summary className="flex items-center gap-4 p-4 cursor-pointer list-none" style={{ color: 'var(--theme-text-primary)' }}>
                  <div className="w-11 h-11 rounded-[11px] flex items-center justify-center shrink-0"
                    style={{ background: `color-mix(in srgb, ${m.color} 16%, transparent)`, color: m.color }}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-h3 font-bold">{m.title}</span>
                      <span className="text-caption font-semibold" style={{ color: 'var(--theme-text-muted)' }}>· {m.titleVi}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-caption" style={{ color: 'var(--theme-text-secondary)' }}>
                        <IconClock size={12} /> {m.duration}
                      </span>
                      <span className="inline-flex items-center gap-1 text-caption" style={{ color: 'var(--theme-text-secondary)' }}>
                        <IconTarget size={12} /> TDN 3–5
                      </span>
                    </div>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="transition-transform group-open:rotate-180 shrink-0" style={{ color: 'var(--theme-text-muted)' }}>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </summary>
                <div className="px-4 pb-4 pt-1" style={{ color: 'var(--theme-text-secondary)' }}>
                  <p className="text-body mb-3" style={{ lineHeight: 1.7 }}>{m.summary}</p>
                  <p className="text-body mb-4" style={{ lineHeight: 1.7 }}>{m.parts}</p>
                  <div className="word-card-v2 flex items-start gap-2 p-3 rounded-[11px] mb-4"
                    style={{ background: 'color-mix(in srgb, var(--warn) 9%, transparent)', border: '1px solid color-mix(in srgb, var(--warn) 26%, transparent)', ['--card-accent' as string]: 'var(--warn)' } as React.CSSProperties}>
                    <IconLightbulb size={16} style={{ color: 'var(--warn)', marginTop: 2 }} />
                    <p className="text-body font-medium" style={{ color: 'var(--warn)' }}>{m.tip}</p>
                  </div>
                  <Link href={m.practiceHref} className="inline-flex items-center gap-2 text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                    Luyện phần này <IconArrowRight size={14} />
                  </Link>
                </div>
              </details>
            );
          })}
        </div>
      </section>

      {/* Roadmap */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Lộ trình ôn B2 → C1</h2>
        <p className="text-body mb-5" style={{ color: 'var(--theme-text-muted)' }}>Khoảng 12–14 tuần cho người đã ở mức B2.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {ROADMAP.map((p) => (
            <div key={p.phase} className="rounded-2xl p-4" style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
              <p className="text-body font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>{p.phase}</p>
              <ul className="space-y-1.5">
                {p.bullets.map((b) => (
                  <li key={b} className="text-caption flex items-start gap-2" style={{ color: 'var(--theme-text-secondary)' }}>
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full mt-1.5" style={{ background: 'var(--der)' }} />
                    <span style={{ lineHeight: 1.6 }}>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Tips */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--theme-text-primary)' }}>Mẹo luyện thi</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {TIPS.map((tip, i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl p-4" style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
              <span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-caption font-bold"
                style={{ background: 'color-mix(in srgb, var(--der) 16%, transparent)', color: 'var(--der)' }}>{i + 1}</span>
              <p className="text-body" style={{ color: 'var(--theme-text-secondary)', lineHeight: 1.6 }}>{tip}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-[18px] p-6 text-center" style={{ background: 'color-mix(in srgb, var(--der) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--der) 24%, transparent)' }}>
        <h2 className="text-h2 font-extrabold mb-2" style={{ color: 'var(--theme-text-primary)' }}>Sẵn sàng luyện TestDaF?</h2>
        <p className="text-body mb-5" style={{ color: 'var(--theme-text-secondary)' }}>Tạo đề mô phỏng B2–C1 cho cả 4 kỹ năng và nhận chấm điểm AI theo thang TDN.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/practice-test/reading/exam/new" className="inline-flex items-center gap-2 rounded-[11px] px-5 py-3 text-body font-bold text-white transition-transform hover:-translate-y-0.5"
            style={{ background: 'var(--der)', boxShadow: '0 4px 12px color-mix(in srgb, var(--der) 35%, transparent)' }}>
            Bắt đầu luyện <IconArrowRight size={15} />
          </Link>
          <Link href="/practice-test/huong-dan-b1" className="inline-flex items-center gap-2 rounded-[11px] px-5 py-3 text-body font-bold transition-colors"
            style={{ color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' }}>
            Xem cẩm nang B1
          </Link>
        </div>
      </section>
    </div>
  );
}
