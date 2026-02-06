'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWritingTopics, useGeneratePrompt } from '@/hooks/useWriting';

// ── Level colors ──
const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
  A2: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
  B1: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',
  B2: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700',
};

const LEVEL_ACTIVE: Record<string, string> = {
  A1: 'bg-green-600 text-white border-green-600',
  A2: 'bg-blue-600 text-white border-blue-600',
  B1: 'bg-purple-600 text-white border-purple-600',
  B2: 'bg-orange-600 text-white border-orange-600',
};

export default function NewWritingPage() {
  const router = useRouter();

  // ── State ──
  const [level, setLevel] = useState('A1');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [writingType, setWritingType] = useState('');
  const [wordCountIdx, setWordCountIdx] = useState(0);

  // ── Data ──
  const { data: suggestions, isLoading } = useWritingTopics(level);
  const generateMutation = useGeneratePrompt();

  // Reset selections khi đổi level
  useEffect(() => {
    setSelectedTopic('');
    setCustomTopic('');
    setWritingType('');
    setWordCountIdx(0);
  }, [level]);

  // Auto-select first writing type
  useEffect(() => {
    if (suggestions?.writingTypes.length && !writingType) {
      setWritingType(suggestions.writingTypes[0].value);
    }
  }, [suggestions, writingType]);

  const finalTopic = customTopic.trim() || selectedTopic;
  const wordCount = suggestions?.wordCountSuggestions[wordCountIdx];
  const canGenerate = finalTopic && writingType && wordCount;

  const handleGenerate = async () => {
    if (!canGenerate || !wordCount) return;

    try {
      const session = await generateMutation.mutateAsync({
        topic: finalTopic,
        cefrLevel: level,
        writingType,
        wordCountMin: wordCount.min,
        wordCountMax: wordCount.max,
      });
      router.push(`/practice-test/writing/${session.id}`);
    } catch (err) {
      // Error handled by React Query
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/practice-test/writing"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-2 inline-flex items-center gap-1"
        >
          ← Quay lại
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
          🎲 Tạo đề bài mới
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Chọn cấu hình để AI tạo đề bài viết tiếng Đức cho bạn
        </p>
      </div>

      {/* ── STEP 1: Level ── */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          1. Trình độ CEFR
        </h2>
        <div className="flex gap-3">
          {['A1', 'A2', 'B1', 'B2'].map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                level === l
                  ? LEVEL_ACTIVE[l]
                  : `${LEVEL_COLORS[l]} hover:opacity-80`
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </section>

      {/* ── STEP 2: Topic ── */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          2. Chủ đề
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-3">
              {suggestions?.topics.map((t) => (
                <button
                  key={t.topic}
                  onClick={() => {
                    setSelectedTopic(t.topic);
                    setCustomTopic('');
                  }}
                  className={`p-3 rounded-xl text-left border-2 transition-all ${
                    selectedTopic === t.topic && !customTopic
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-lg">{t.icon}</span>
                  <div className="text-xs font-medium text-gray-900 dark:text-white mt-1 truncate">
                    {t.labelDe}
                  </div>
                  <div className="text-xs text-gray-400 truncate">{t.labelVi}</div>
                </button>
              ))}
            </div>

            {/* Custom topic */}
            <div className="relative">
              <input
                type="text"
                value={customTopic}
                onChange={(e) => {
                  setCustomTopic(e.target.value);
                  if (e.target.value) setSelectedTopic('');
                }}
                placeholder="Hoặc nhập chủ đề tùy chỉnh..."
                className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
              />
              {customTopic && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-500 font-medium">
                  Tùy chỉnh ✓
                </span>
              )}
            </div>
          </>
        )}
      </section>

      {/* ── STEP 3: Writing Type ── */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          3. Dạng bài
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {suggestions?.writingTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setWritingType(t.value)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                writingType === t.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{t.icon}</span>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {t.labelDe}
                  </div>
                  <div className="text-xs text-gray-400">{t.labelVi}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── STEP 4: Word Count ── */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          4. Độ dài bài viết
        </h2>
        <div className="flex gap-3">
          {suggestions?.wordCountSuggestions.map((wc, idx) => (
            <button
              key={idx}
              onClick={() => setWordCountIdx(idx)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                wordCountIdx === idx
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'
              }`}
            >
              {wc.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Summary + Generate Button ── */}
      <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          📋 Tóm tắt cấu hình
        </h3>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Trình độ:</span>
          <span className="font-medium text-gray-900 dark:text-white">{level}</span>

          <span className="text-gray-500 dark:text-gray-400">Chủ đề:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {finalTopic || <span className="text-gray-400 italic">Chưa chọn</span>}
          </span>

          <span className="text-gray-500 dark:text-gray-400">Dạng bài:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {suggestions?.writingTypes.find((t) => t.value === writingType)?.labelVi || (
              <span className="text-gray-400 italic">Chưa chọn</span>
            )}
          </span>

          <span className="text-gray-500 dark:text-gray-400">Độ dài:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {wordCount?.label || '—'}
          </span>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!canGenerate || generateMutation.isPending}
        className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {generateMutation.isPending ? (
          <>
            <span className="animate-spin">⏳</span>
            AI đang tạo đề bài...
          </>
        ) : (
          <>
            <span>🤖</span>
            Tạo đề bài
          </>
        )}
      </button>

      {generateMutation.isError && (
        <p className="text-red-500 text-sm text-center mt-3">
          ❌ Không thể tạo đề bài. Vui lòng thử lại.
        </p>
      )}
    </div>
  );
}
