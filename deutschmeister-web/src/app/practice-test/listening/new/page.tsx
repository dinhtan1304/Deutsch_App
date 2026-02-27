'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGenerateListening } from '@/hooks/useListening';

function IconHeadphones({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>;
}
function IconLoader({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconChevronLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="15 18 9 12 15 6" /></svg>;
}

const ACCENT = '#EC4899';
const GRADIENT = 'linear-gradient(135deg, #EC4899, #8B5CF6)';

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
    <div className="py-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/practice-test/listening" className="p-2 rounded-xl transition-all hover:scale-110"
          style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
          <IconChevronLeft size={18} />
        </Link>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: GRADIENT }}>
          <IconHeadphones size={18} style={{ color: 'white' }} />
        </div>
        <div>
          <h1 className="text-[17px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>Tạo Bài Nghe Mới</h1>
          <p className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>AI tạo audio script + câu hỏi</p>
        </div>
      </div>

      {/* Level */}
      <div className="rounded-2xl border p-5 mb-4" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <p className="text-[13px] font-bold mb-3 uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>Trình độ</p>
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map(l => {
            const sel = level === l.id;
            return (
              <button key={l.id} onClick={() => setLevel(l.id)}
                className="p-3 rounded-xl border-2 text-left transition-all"
                style={sel
                  ? { borderColor: ACCENT, backgroundColor: 'rgba(236,72,153,.08)' }
                  : { borderColor: 'var(--theme-border)', backgroundColor: 'transparent' }}>
                <p className="text-[15px] font-extrabold mb-0.5" style={{ color: sel ? ACCENT : 'var(--theme-text-primary)' }}>{l.id}</p>
                <p className="text-[10px] leading-tight" style={{ color: 'var(--theme-text-muted)' }}>{l.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Script Type */}
      <div className="rounded-2xl border p-5 mb-5" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
        <p className="text-[13px] font-bold mb-3 uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>Loại bài nghe</p>
        <div className="space-y-2">
          {SCRIPT_TYPES.map(st => {
            const sel = scriptType === st.id;
            return (
              <button key={st.id} onClick={() => setScriptType(st.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all"
                style={sel
                  ? { borderColor: ACCENT, backgroundColor: 'rgba(236,72,153,.08)' }
                  : { borderColor: 'var(--theme-border)', backgroundColor: 'transparent' }}>
                <span className="text-[18px]">{st.emoji}</span>
                <div>
                  <p className="text-[13px] font-bold" style={{ color: sel ? ACCENT : 'var(--theme-text-primary)' }}>{st.label}</p>
                  <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{st.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-[13px] mb-3 text-center" style={{ color: '#EF4444' }}>{error}</p>}

      <button onClick={handleGenerate} disabled={loading}
        className="w-full py-3.5 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:scale-100"
        style={{ background: GRADIENT }}>
        {loading ? <><IconLoader size={18} /> Đang tạo bài nghe...</> : '🎧 Tạo Bài Nghe'}
      </button>
    </div>
  );
}
