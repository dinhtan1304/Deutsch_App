'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGenerateFreeSpeaking } from '@/hooks/useFreeSpeaking';
import { QuotaPaywall } from '@/components/subscription/QuotaPaywall';
import { PageHeader } from '@/components/ui';

function IconLoader({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconChevronLeft({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="15 18 9 12 15 6" /></svg>;
}

const ACCENT = '#F59E0B';
const GRADIENT = 'linear-gradient(135deg, #F59E0B, #EF4444)';
const LEVELS = ['A1', 'A2', 'B1'];

const TOPICS = [
  { key: 'sich_vorstellen', de: 'Sich vorstellen', vi: 'Giới thiệu bản thân' },
  { key: 'alltag',          de: 'Alltag & Freizeit', vi: 'Cuộc sống & Giải trí' },
  { key: 'wohnen',          de: 'Wohnen',            vi: 'Nhà ở' },
  { key: 'arbeit',          de: 'Arbeit & Beruf',    vi: 'Công việc & Nghề nghiệp' },
  { key: 'familie',         de: 'Familie & Freunde', vi: 'Gia đình & Bạn bè' },
  { key: 'reisen',          de: 'Reisen',            vi: 'Đi lại & Du lịch' },
  { key: 'einkaufen',       de: 'Einkaufen',         vi: 'Mua sắm' },
  { key: 'gesundheit',      de: 'Gesundheit & Sport',vi: 'Sức khỏe & Thể thao' },
  { key: 'meinung',         de: 'Meinungen äußern',  vi: 'Bày tỏ quan điểm' },
];

export default function FreeSpeakingNewPage() {
  const router = useRouter();
  const [cefrLevel, setCefrLevel] = useState('B1');
  const [topicType, setTopicType] = useState('sich_vorstellen');
  const [errorMsg, setErrorMsg] = useState('');

  const generateMut = useGenerateFreeSpeaking();

  const handleGenerate = async () => {
    setErrorMsg('');
    try {
      const session = await generateMut.mutateAsync({ cefrLevel, topicType });
      router.push(`/practice-test/speaking/${session.id}`);
    } catch {
      setErrorMsg('Không thể tạo bài nói. Vui lòng thử lại.');
    }
  };

  return (
    <QuotaPaywall feature="freeSpeaking">
    <div className="py-6">
      <PageHeader
        backHref="/practice-test/speaking"
        title="Tạo bài Luyện Nói"
        subtitle="AI tạo prompt tiếng Đức → bạn ghi âm → AI chấm điểm chi tiết"
        accent="xp"
      />

      {/* Step 1: Level */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          Bước 1 — Trình độ (CEFR)
        </p>
        <div className="flex gap-2">
          {LEVELS.map(lvl => (
            <button key={lvl} onClick={() => setCefrLevel(lvl)}
              className="flex-1 py-3 rounded-2xl border-2 font-bold text-[15px] transition-all"
              style={cefrLevel === lvl
                ? { borderColor: ACCENT, backgroundColor: 'rgba(245,158,11,.1)', color: ACCENT }
                : { borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)', backgroundColor: 'transparent' }}>
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Topic */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          Bước 2 — Chủ đề
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TOPICS.map(t => (
            <button key={t.key} onClick={() => setTopicType(t.key)}
              className="p-3 rounded-xl border-2 text-left transition-all"
              style={topicType === t.key
                ? { borderColor: ACCENT, backgroundColor: 'rgba(245,158,11,.08)' }
                : { borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
              <p className="text-body font-bold" style={{ color: topicType === t.key ? ACCENT : 'var(--theme-text-primary)' }}>
                {t.de}
              </p>
              <p className="text-caption mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{t.vi}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Info note */}
      <div className="rounded-xl p-3 mb-5 text-xs"
        style={{ backgroundColor: 'rgba(245,158,11,.06)', borderLeft: '3px solid rgba(245,158,11,.4)', color: 'var(--theme-text-muted)' }}>
        Yêu cầu: microphone + Chrome/Edge. AI sẽ tạo ngẫu nhiên một câu hỏi/prompt, bạn ghi âm trả lời, Gemini chấm điểm từ audio + transcript.
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl text-body mb-4" style={{ backgroundColor: 'rgba(239,68,68,.08)', color: '#EF4444' }}>
          {errorMsg}
        </div>
      )}

      <button onClick={handleGenerate}
        disabled={generateMut.isPending}
        className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        style={{ background: GRADIENT, boxShadow: '0 4px 12px rgba(245,158,11,.3)' }}>
        {generateMut.isPending ? (
          <><IconLoader size={18} /> Đang tạo prompt...</>
        ) : (
          'Tạo bài nói'
        )}
      </button>
    </div>
    </QuotaPaywall>
  );
}
