'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWritingTopics, useGeneratePrompt } from '@/hooks/useWriting';
import { IconChevronLeft, IconDice, IconLoader, IconRobot } from '../icons';

// ─── Level colors ───
const LEVEL_COLORS: Record<string, string> = { A1: '#22C55E', A2: '#3B82F6', B1: '#8B5CF6', B2: '#F97316' };

export default function NewWritingPage() {
  const router = useRouter();
  const [level, setLevel] = useState('A1');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [writingType, setWritingType] = useState('');
  const [wordCountIdx, setWordCountIdx] = useState(0);

  const { data: suggestions, isLoading } = useWritingTopics(level);
  const generateMutation = useGeneratePrompt();

  useEffect(() => { setSelectedTopic(''); setCustomTopic(''); setWritingType(''); setWordCountIdx(0); }, [level]);
  useEffect(() => { if (suggestions?.writingTypes.length && !writingType) setWritingType(suggestions.writingTypes[0].value); }, [suggestions, writingType]);

  const finalTopic = customTopic.trim() || selectedTopic;
  const wordCount = suggestions?.wordCountSuggestions[wordCountIdx];
  const canGenerate = finalTopic && writingType && wordCount;

  const handleGenerate = async () => {
    if (!canGenerate || !wordCount) return;
    try {
      const session = await generateMutation.mutateAsync({
        topic: finalTopic, cefrLevel: level, writingType,
        wordCountMin: wordCount.min, wordCountMax: wordCount.max,
      });
      router.push(`/practice-test/writing/${session.id}`);
    } catch { /* handled */ }
  };

  const activeColor = LEVEL_COLORS[level] || '#3B82F6';

  return (
      <div className="py-6">

        {/* Header */}
        <div className="mb-6">
          <Link href="/practice-test/writing"
            className="flex items-center gap-1 text-[13px] font-medium mb-2 transition-opacity hover:opacity-70"
            style={{ color: 'var(--theme-text-muted)' }}>
            <IconChevronLeft size={14} /> Quay lại
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              <IconDice size={22} style={{ color: 'white' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>Tạo đề bài mới</h1>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                Chọn cấu hình để AI tạo đề bài viết tiếng Đức
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ─── Left Column: Level + Topic ─── */}
          <div className="space-y-6">
            {/* Step 1: Level */}
            <section>
              <h2 className="text-[12px] font-bold uppercase tracking-wider mb-3"
                style={{ color: 'var(--theme-text-muted)' }}>1. Trình độ CEFR</h2>
              <div className="flex gap-2">
                {['A1', 'A2', 'B1', 'B2'].map(l => {
                  const isActive = level === l;
                  const c = LEVEL_COLORS[l];
                  return (
                    <button key={l} onClick={() => setLevel(l)}
                      className="px-5 py-2.5 rounded-xl text-[13px] font-bold border-2 transition-all duration-200 hover:-translate-y-0.5"
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
              <h2 className="text-[12px] font-bold uppercase tracking-wider mb-3"
                style={{ color: 'var(--theme-text-muted)' }}>2. Chủ đề</h2>
              {isLoading ? (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
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
                          <span className="text-[16px]">{t.icon}</span>
                          <div className="text-[12px] font-semibold mt-1 truncate" style={{ color: 'var(--theme-text-primary)' }}>{t.labelDe}</div>
                          <div className="text-[11px] truncate" style={{ color: 'var(--theme-text-muted)' }}>{t.labelVi}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="relative">
                    <input type="text" value={customTopic}
                      onChange={e => { setCustomTopic(e.target.value); if (e.target.value) setSelectedTopic(''); }}
                      placeholder="Hoặc nhập chủ đề tùy chỉnh..."
                      className="w-full px-4 py-3 rounded-xl border-2 border-dashed text-[14px] focus:outline-none transition-colors"
                      style={{
                        borderColor: customTopic ? activeColor : 'var(--theme-border)',
                        backgroundColor: 'var(--theme-bg-secondary)',
                        color: 'var(--theme-text-primary)',
                      }} />
                    {customTopic && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold" style={{ color: activeColor }}>
                        Tùy chỉnh ✓
                      </span>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>

          {/* ─── Right Column: Type + WordCount + Summary + Generate ─── */}
          <div className="space-y-6">
            {/* Step 3: Writing Type */}
            <section>
              <h2 className="text-[12px] font-bold uppercase tracking-wider mb-3"
                style={{ color: 'var(--theme-text-muted)' }}>3. Dạng bài</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {suggestions?.writingTypes.map(t => {
                  const isActive = writingType === t.value;
                  return (
                    <button key={t.value} onClick={() => setWritingType(t.value)}
                      className="p-3 rounded-xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        borderColor: isActive ? activeColor : 'var(--theme-border)',
                        backgroundColor: isActive ? `${activeColor}08` : 'var(--theme-bg-card)',
                        boxShadow: isActive ? `0 4px 12px ${activeColor}15` : 'none',
                      }}>
                      <div className="flex items-center gap-2">
                        <span className="text-[16px]">{t.icon}</span>
                        <div>
                          <div className="text-[13px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{t.labelDe}</div>
                          <div className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{t.labelVi}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Step 4: Word Count */}
            <section>
              <h2 className="text-[12px] font-bold uppercase tracking-wider mb-3"
                style={{ color: 'var(--theme-text-muted)' }}>4. Độ dài bài viết</h2>
              <div className="flex gap-2">
                {suggestions?.wordCountSuggestions.map((wc, idx) => {
                  const isActive = wordCountIdx === idx;
                  return (
                    <button key={idx} onClick={() => setWordCountIdx(idx)}
                      className="px-4 py-2.5 rounded-xl text-[13px] font-semibold border-2 transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        borderColor: isActive ? activeColor : 'var(--theme-border)',
                        backgroundColor: isActive ? `${activeColor}08` : 'transparent',
                        color: isActive ? activeColor : 'var(--theme-text-secondary)',
                      }}>
                      {wc.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Summary */}
            <div className="rounded-2xl border p-5"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
              <h3 className="text-[13px] font-bold mb-3" style={{ color: 'var(--theme-text-secondary)' }}>
                Tóm tắt cấu hình
              </h3>
              <div className="grid grid-cols-2 gap-y-2 text-[13px]">
                <span style={{ color: 'var(--theme-text-muted)' }}>Trình độ:</span>
                <span className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{level}</span>
                <span style={{ color: 'var(--theme-text-muted)' }}>Chủ đề:</span>
                <span className="font-semibold" style={{ color: finalTopic ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)' }}>
                  {finalTopic || 'Chưa chọn'}
                </span>
                <span style={{ color: 'var(--theme-text-muted)' }}>Dạng bài:</span>
                <span className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                  {suggestions?.writingTypes.find(t => t.value === writingType)?.labelVi || 'Chưa chọn'}
                </span>
                <span style={{ color: 'var(--theme-text-muted)' }}>Độ dài:</span>
                <span className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{wordCount?.label || '—'}</span>
              </div>
            </div>

            {/* Generate Button */}
            <button onClick={handleGenerate} disabled={!canGenerate || generateMutation.isPending}
              className="w-full py-3.5 rounded-xl font-bold text-[16px] text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${activeColor}, ${activeColor}cc)`, boxShadow: `0 4px 12px ${activeColor}30` }}>
              {generateMutation.isPending
                ? <><IconLoader size={18} /> AI đang tạo đề bài...</>
                : <><IconRobot size={18} /> Tạo đề bài</>
              }
            </button>

            {generateMutation.isError && (
              <p className="text-[13px] text-center mt-3" style={{ color: '#EF4444' }}>
                Không thể tạo đề bài. Vui lòng thử lại.
              </p>
            )}
          </div>

        </div>
      </div>
  );
}