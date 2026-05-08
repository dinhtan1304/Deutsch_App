import { IconBookOpen, IconGraduationCap, IconRocket, IconList, IconLightbulb } from '@/components/ui/Icons';
import { GRADIENT } from '@/lib/tokens';

const ANCHORS = [
  { href: '#chon-chung-chi', label: 'Chọn chứng chỉ', icon: IconGraduationCap },
  { href: '#cau-truc-de', label: 'Cấu trúc đề', icon: IconBookOpen },
  { href: '#lo-trinh', label: 'Lộ trình 12 tuần', icon: IconRocket },
  { href: '#cam-nang', label: 'Cẩm nang kỹ năng', icon: IconLightbulb },
  { href: '#faq', label: 'FAQ', icon: IconList },
];

export function GuideHeader() {
  return (
    <section id="huong-dan-b1" className="mt-16 mb-8 scroll-mt-20">
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: GRADIENT.examWriting }}
        >
          <IconBookOpen size={24} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            Cẩm nang luyện thi B1
          </h2>
          <p className="text-body mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            Mọi thông tin về Goethe-Zertifikat B1 và TELC Deutsch B1 — cấu trúc đề, lộ trình 12 tuần, mẫu Schreiben, Redemittel Sprechen, ngữ pháp & từ vựng quan trọng nhất.
          </p>
        </div>
      </div>

      <nav aria-label="Mục lục cẩm nang B1" className="flex flex-wrap gap-2">
        {ANCHORS.map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={href}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-body font-semibold transition-colors hover:opacity-90"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              color: 'var(--theme-text-secondary)',
              border: '1px solid var(--theme-border)',
            }}
          >
            <Icon size={14} />
            {label}
          </a>
        ))}
      </nav>
    </section>
  );
}
