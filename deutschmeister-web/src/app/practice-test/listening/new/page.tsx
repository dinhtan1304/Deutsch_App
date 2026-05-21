'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGenerateListening } from '@/hooks/useListening';
import { QuotaPaywall } from '@/components/subscription/QuotaPaywall';
import { QuotaBanner } from '@/components/subscription/QuotaBanner';
import { PageHeader } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

function IconLoader({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}

const LEVELS = [
  { id: 'A1', desc: 'Hội thoại đơn giản · 80-120 từ' },
  { id: 'A2', desc: 'Tình huống hàng ngày · 130-180 từ' },
  { id: 'B1', desc: 'Nội dung phong phú · 200-280 từ' },
];

const SCRIPT_TYPES = [
  { id: 'dialogue', label: 'Dialog', desc: 'Hội thoại 2 người', emoji: '💬' },
  { id: 'monologue', label: 'Monolog', desc: 'Bài nói một người', emoji: '🎙️' },
  { id: 'announcement', label: 'Ansage', desc: 'Thông báo / Quảng cáo', emoji: '📢' },
  { id: 'interview', label: 'Interview', desc: 'Phỏng vấn', emoji: '🎤' },
  { id: 'radio', label: 'Radio', desc: 'Bản tin radio', emoji: '📻' },
];

export default function NewListeningPage() {
  const router = useRouter();
  const generateMut = useGenerateListening();
  const [level, setLevel] = useState('A2');
  const [scriptType, setScriptType] = useState('dialogue');
  const [error, setError] = useState('');
  const loading = generateMut.isPending;

  const handleGenerate = async () => {
    setError('');
    try {
      const session = await generateMut.mutateAsync({ cefrLevel: level, scriptType });
      router.push(`/practice-test/listening/${session.id}`);
    } catch {
      setError('Không thể tạo bài nghe. Vui lòng thử lại.');
    }
  };

  return (
    <QuotaPaywall feature="listening">
    <div className="py-6 max-w-lg mx-auto">
      <QuotaBanner feature="listening" label="Lượt Listening AI" featureContext="listening-new" />

      <PageHeader
        backHref="/practice-test/listening"
        title="Tạo Bài Nghe Mới"
        subtitle="AI tạo audio script + câu hỏi"
        accent="listening"
      />

      <div className="rounded-2xl border p-5 mb-4" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <p className="text-body font-bold mb-3 uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>Trình độ</p>
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map(l => {
            const sel = level === l.id;
            return (
              <button key={l.id} onClick={() => setLevel(l.id)}
                className="p-3 rounded-xl border-2 text-left transition-all"
                style={sel
                  ? { borderColor: ACCENT.listening, backgroundColor: `${ACCENT.listening}14` }
                  : { borderColor: 'var(--theme-border)', backgroundColor: 'transparent' }}>
                <p className="text-[15px] font-extrabold mb-0.5" style={{ color: sel ? ACCENT.listening : 'var(--theme-text-primary)' }}>{l.id}</p>
                <p className="text-caption leading-tight" style={{ color: 'var(--theme-text-muted)' }}>{l.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border p-5 mb-5" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <p className="text-body font-bold mb-3 uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>Loại bài nghe</p>
        <div className="space-y-2">
          {SCRIPT_TYPES.map(st => {
            const sel = scriptType === st.id;
            return (
              <button key={st.id} onClick={() => setScriptType(st.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all"
                style={sel
                  ? { borderColor: ACCENT.listening, backgroundColor: `${ACCENT.listening}14` }
                  : { borderColor: 'var(--theme-border)', backgroundColor: 'transparent' }}>
                <span className="text-title">{st.emoji}</span>
                <div>
                  <p className="text-body font-bold" style={{ color: sel ? ACCENT.listening : 'var(--theme-text-primary)' }}>{st.label}</p>
                  <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{st.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-body mb-3 text-center" style={{ color: STATUS.danger }}>{error}</p>}

      <button onClick={handleGenerate} disabled={loading}
        className="w-full py-3.5 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:scale-100"
        style={{ background: GRADIENT.listening }}>
        {loading ? <><IconLoader size={18} /> Đang tạo bài nghe...</> : '🎧 Tạo Bài Nghe'}
      </button>
    </div>
    </QuotaPaywall>
  );
}
