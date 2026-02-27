'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGenerateExamListening } from '@/hooks/useExamListening';
import { EXAM_LISTENING_DISPLAY } from '@/lib/examConfig';

function IconLoader({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconChevronLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="15 18 9 12 15 6" /></svg>;
}

const ACCENT = '#EC4899';
const GRADIENT = 'linear-gradient(135deg, #EC4899, #8B5CF6)';

const EXAM_TYPES = [
  { id: 'GOETHE', label: 'Goethe-Zertifikat', color: '#3B82F6', desc: 'Chứng chỉ Goethe-Institut' },
  { id: 'TELC', label: 'TELC Deutsch', color: '#8B5CF6', desc: 'The European Language Certificates' },
];

const LEVELS = ['A1', 'A2', 'B1'];

export default function ExamListeningNewPage() {
  const router = useRouter();
  const [examType, setExamType] = useState<string>('GOETHE');
  const [cefrLevel, setCefrLevel] = useState<string>('B1');
  const [errorMsg, setErrorMsg] = useState('');

  const generateMut = useGenerateExamListening();

  const isTelcA1 = examType === 'TELC' && cefrLevel === 'A1';
  const examInfo = EXAM_LISTENING_DISPLAY[examType]?.[cefrLevel];

  const handleGenerate = async () => {
    if (isTelcA1) return;
    setErrorMsg('');
    try {
      const session = await generateMut.mutateAsync({ examType, cefrLevel });
      router.push(`/practice-test/listening/exam/${session.id}`);
    } catch {
      setErrorMsg('Không thể tạo đề nghe. Vui lòng thử lại.');
    }
  };

  return (
    <div className="py-6">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/practice-test/listening/exam" className="flex items-center gap-1 text-[13px] font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--theme-text-muted)' }}>
          <IconChevronLeft size={14} /> Danh sách
        </Link>
      </div>

      <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
        Tạo đề Luyện Nghe
      </h1>
      <p className="text-[13px] mb-6" style={{ color: 'var(--theme-text-muted)' }}>
        Chọn loại đề và trình độ để AI tạo bài nghe đầy đủ các Teil
      </p>

      {/* Step 1: Exam type */}
      <div className="mb-6">
        <p className="text-[12px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          Bước 1 — Loại đề thi
        </p>
        <div className="grid grid-cols-2 gap-3">
          {EXAM_TYPES.map(et => (
            <button key={et.id} onClick={() => setExamType(et.id)}
              className="p-4 rounded-2xl border-2 text-left transition-all"
              style={examType === et.id
                ? { borderColor: et.color, backgroundColor: `${et.color}10` }
                : { borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
              <div className="text-[15px] font-bold" style={{ color: examType === et.id ? et.color : 'var(--theme-text-primary)' }}>
                {et.label}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{et.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Level */}
      <div className="mb-6">
        <p className="text-[12px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          Bước 2 — Trình độ (CEFR)
        </p>
        <div className="flex gap-2">
          {LEVELS.map(lvl => {
            const unsupported = examType === 'TELC' && lvl === 'A1';
            return (
              <button key={lvl} onClick={() => !unsupported && setCefrLevel(lvl)}
                disabled={unsupported}
                className="flex-1 py-3 rounded-2xl border-2 font-bold text-[15px] transition-all"
                style={cefrLevel === lvl && !unsupported
                  ? { borderColor: ACCENT, backgroundColor: 'rgba(236,72,153,.1)', color: ACCENT }
                  : unsupported
                    ? { borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)', opacity: 0.4, cursor: 'not-allowed', backgroundColor: 'transparent' }
                    : { borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)', backgroundColor: 'transparent' }}>
                {lvl}
                {unsupported && <div className="text-[9px] font-normal">N/A</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary card */}
      {examInfo && !isTelcA1 && (
        <div className="rounded-2xl border p-4 mb-6"
          style={{ borderColor: 'rgba(236,72,153,.3)', backgroundColor: 'rgba(236,72,153,.04)' }}>
          <p className="text-[13px] font-bold mb-2" style={{ color: ACCENT }}>
            {examType} {cefrLevel} — Hören
          </p>
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div>
              <div className="text-[18px] font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>{examInfo.teile}</div>
              <div className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>Teile</div>
            </div>
            <div>
              <div className="text-[18px] font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>{examInfo.questions}</div>
              <div className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>Câu hỏi</div>
            </div>
            <div>
              <div className="text-[18px] font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>{examInfo.timeMin} ph</div>
              <div className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>Thời gian</div>
            </div>
          </div>
          <div className="space-y-1">
            {examInfo.structure.map((s: string, i: number) => (
              <div key={i} className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--theme-text-secondary)' }}>
                <span className="w-14 font-bold" style={{ color: 'var(--theme-text-muted)' }}>Teil {i + 1}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl text-[13px] mb-4" style={{ backgroundColor: 'rgba(239,68,68,.08)', color: '#EF4444' }}>
          {errorMsg}
        </div>
      )}

      <button onClick={handleGenerate}
        disabled={generateMut.isPending || isTelcA1}
        className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        style={{ background: GRADIENT, boxShadow: '0 4px 12px rgba(236,72,153,.3)' }}>
        {generateMut.isPending ? (
          <><IconLoader size={18} /> Đang tạo đề (có thể mất 20-40 giây)...</>
        ) : (
          'Tạo đề thi'
        )}
      </button>

      {generateMut.isPending && (
        <p className="text-center text-[12px] mt-3" style={{ color: 'var(--theme-text-muted)' }}>
          AI đang tạo song song tất cả các Teil Hören...
        </p>
      )}
    </div>
  );
}
