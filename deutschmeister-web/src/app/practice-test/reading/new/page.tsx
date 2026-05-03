'use client';

import { useState } from 'react';
import { ACCENT, STATUS } from '@/lib/tokens';
import { useRouter } from 'next/navigation';
import { useReadingTopics, useGenerateReading } from '@/hooks/useReading';
import { QuotaPaywall } from '@/components/subscription/QuotaPaywall';
import { IconLoader, IconRobot } from '../icons';
import { PageHeader } from '@/components/ui';

const LEVEL_COLORS: Record<string, string> = {
  A1: STATUS.success, A2: ACCENT.srs, B1: ACCENT.vocab, B2: ACCENT.games,
};

const QUESTION_COUNT_OPTIONS = [3, 4, 5, 6, 7, 8];

export default function NewReadingPage() {
  const router = useRouter();
  const [level, setLevel] = useState('A1');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [textType, setTextType] = useState('');
  const [questionCount, setQuestionCount] = useState(5);

  const { data: suggestions, isLoading } = useReadingTopics(level);
  const generateMutation = useGenerateReading();

  const effectiveTextType = textType || suggestions?.textTypes[0]?.value || '';

  const finalTopic = customTopic.trim() || selectedTopic;
  const canGenerate = !!finalTopic && !!effectiveTextType;
  const activeColor = LEVEL_COLORS[level] || STATUS.success;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    try {
      const session = await generateMutation.mutateAsync({
        cefrLevel: level,
        topic: finalTopic,
        textType: effectiveTextType,
        questionCount,
      });
      router.push(`/practice-test/reading/${session.id}`);
    } catch { /* handled */ }
  };

  return (
    <QuotaPaywall feature="reading">
    <div className="py-6">

      <PageHeader
        backHref="/practice-test/reading"
        title="Tạo bài đọc mới"
        subtitle="AI tạo bài đọc hiểu tiếng Đức theo cấu hình của bạn"
        accent="reading"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ─── Left: Level + Topic ─── */}
        <div className="space-y-6">

          {/* Step 1: Level */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: 'var(--theme-text-muted)' }}>1. Trình độ CEFR</h2>
            <div className="flex gap-2">
              {['A1', 'A2', 'B1', 'B2'].map(l => {
                const isActive = level === l;
                const c = LEVEL_COLORS[l];
                return (
                  <button key={l} onClick={() => { setLevel(l); setSelectedTopic(''); setCustomTopic(''); setTextType(''); }}
                    className="px-5 py-2.5 rounded-xl text-body font-bold border-2 transition-all duration-200 hover:-translate-y-0.5"
                    style={isActive
                      ? { background: `linear-gradient(135deg, ${c}, ${c}cc)`, color: 'white', borderColor: c, boxShadow: `0 4px 12px ${c}30` }
                      : { borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)', backgroundColor: 'transparent' }
                    }>
                    {l}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 2: Topic */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: 'var(--theme-text-muted)' }}>2. Chủ đề</h2>
            {isLoading ? (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl animate-pulse"
                    style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                  {suggestions?.topics.map(t => {
                    const isActive = selectedTopic === t.topic && !customTopic;
                    return (
                      <button key={t.topic} onClick={() => { setSelectedTopic(t.topic); setCustomTopic(''); }}
                        className="p-3 rounded-xl text-left border-2 transition-all duration-200 hover:-translate-y-0.5"
                        style={{
                          borderColor: isActive ? activeColor : 'var(--theme-border)',
                          backgroundColor: isActive ? `${activeColor}08` : 'var(--theme-bg-card)',
                          boxShadow: isActive ? `0 4px 12px ${activeColor}15` : 'none',
                        }}>
                        <span className="text-base">{t.icon}</span>
                        <div className="text-xs font-semibold mt-1 truncate" style={{ color: 'var(--theme-text-primary)' }}>{t.labelDe}</div>
                        <div className="text-caption truncate" style={{ color: 'var(--theme-text-muted)' }}>{t.labelVi}</div>
                      </button>
                    );
                  })}
                </div>
                <div className="relative">
                  <input type="text" value={customTopic}
                    onChange={e => { setCustomTopic(e.target.value); if (e.target.value) setSelectedTopic(''); }}
                    placeholder="Hoặc nhập chủ đề tùy chỉnh..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-dashed text-sm focus:outline-none transition-colors"
                    style={{
                      borderColor: customTopic ? activeColor : 'var(--theme-border)',
                      backgroundColor: 'var(--theme-bg-secondary)',
                      color: 'var(--theme-text-primary)',
                    }} />
                  {customTopic && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: activeColor }}>
                      Tùy chỉnh ✓
                    </span>
                  )}
                </div>
              </>
            )}
          </section>
        </div>

        {/* ─── Right: Text Type + Question Count + Summary + Generate ─── */}
        <div className="space-y-6">

          {/* Step 3: Text Type */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: 'var(--theme-text-muted)' }}>3. Loại văn bản</h2>
            <div className="grid grid-cols-2 gap-2">
              {suggestions?.textTypes.map(t => {
                const isActive = effectiveTextType === t.value;
                return (
                  <button key={t.value} onClick={() => setTextType(t.value)}
                    className="p-3 rounded-xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      borderColor: isActive ? activeColor : 'var(--theme-border)',
                      backgroundColor: isActive ? `${activeColor}08` : 'var(--theme-bg-card)',
                      boxShadow: isActive ? `0 4px 12px ${activeColor}15` : 'none',
                    }}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{t.icon}</span>
                      <div>
                        <div className="text-xs font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{t.labelDe}</div>
                        <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t.labelVi}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 4: Question Count */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: 'var(--theme-text-muted)' }}>4. Số câu hỏi</h2>
            <div className="flex gap-2 flex-wrap">
              {QUESTION_COUNT_OPTIONS.map(n => {
                const isActive = questionCount === n;
                return (
                  <button key={n} onClick={() => setQuestionCount(n)}
                    className="w-12 h-12 rounded-xl text-[15px] font-bold border-2 transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      borderColor: isActive ? activeColor : 'var(--theme-border)',
                      backgroundColor: isActive ? `${activeColor}08` : 'transparent',
                      color: isActive ? activeColor : 'var(--theme-text-secondary)',
                      boxShadow: isActive ? `0 4px 12px ${activeColor}20` : 'none',
                    }}>
                    {n}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Summary */}
          <div className="rounded-2xl border p-5"
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
            <h3 className="text-body font-bold mb-3" style={{ color: 'var(--theme-text-secondary)' }}>
              Tóm tắt cấu hình
            </h3>
            <div className="grid grid-cols-2 gap-y-2 text-body">
              <span style={{ color: 'var(--theme-text-muted)' }}>Trình độ:</span>
              <span className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{level}</span>
              <span style={{ color: 'var(--theme-text-muted)' }}>Chủ đề:</span>
              <span className="font-semibold" style={{ color: finalTopic ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)' }}>
                {finalTopic || 'Chưa chọn'}
              </span>
              <span style={{ color: 'var(--theme-text-muted)' }}>Loại văn bản:</span>
              <span className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                {suggestions?.textTypes.find(t => t.value === effectiveTextType)?.labelVi || 'Chưa chọn'}
              </span>
              <span style={{ color: 'var(--theme-text-muted)' }}>Số câu hỏi:</span>
              <span className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{questionCount} câu</span>
            </div>
          </div>

          {/* Generate Button */}
          <button onClick={handleGenerate} disabled={!canGenerate || generateMutation.isPending}
            className="w-full py-3.5 rounded-xl font-bold text-base text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${activeColor}, ${activeColor}cc)`,
              boxShadow: `0 4px 12px ${activeColor}30`,
            }}>
            {generateMutation.isPending
              ? <><IconLoader size={18} /> AI đang tạo bài đọc...</>
              : <><IconRobot size={18} /> Tạo bài đọc</>
            }
          </button>

          {generateMutation.isError && (
            <p className="text-body text-center" style={{ color: STATUS.danger }}>
              Không thể tạo bài đọc. Vui lòng thử lại.
            </p>
          )}
        </div>

      </div>
    </div>
    </QuotaPaywall>
  );
}
