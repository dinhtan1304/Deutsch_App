'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWritingSession, useSaveDraft, useSubmitWriting } from '@/hooks/useWriting';

// ── Helpers ──

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

const WRITING_TYPE_LABELS: Record<string, string> = {
  email: 'E-Mail',
  brief: 'Formeller Brief',
  beschreibung: 'Beschreibung',
  tagebuch: 'Tagebuch',
  dialog: 'Dialog',
  aufsatz: 'Aufsatz',
  einladung: 'Einladung',
  beschwerde: 'Beschwerde',
  bewerbung: 'Bewerbung',
  formular: 'Formular',
};

export default function WritingEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // ── Data ──
  const { data: session, isLoading, isError } = useWritingSession(id);
  const saveDraftMutation = useSaveDraft();
  const submitMutation = useSubmitWriting();

  // ── State ──
  const [text, setText] = useState('');
  const [showHints, setShowHints] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load existing text
  useEffect(() => {
    if (session?.userText) {
      setText(session.userText);
    }
  }, [session?.userText]);

  // Redirect nếu đã chấm
  useEffect(() => {
    if (session?.status === 'GRADED') {
      router.replace(`/practice-test/writing/${id}/result`);
    }
  }, [session?.status, id, router]);

  // Auto-save draft mỗi 30 giây
  useEffect(() => {
    if (!text.trim() || !id) return;

    const timer = setTimeout(() => {
      saveDraftMutation.mutate(
        { id, userText: text },
        { onSuccess: () => setLastSaved(new Date()) },
      );
    }, 30000);

    return () => clearTimeout(timer);
  }, [text, id]);

  // ── Handlers ──

  const handleSaveDraft = useCallback(() => {
    if (!text.trim()) return;
    saveDraftMutation.mutate(
      { id, userText: text },
      { onSuccess: () => setLastSaved(new Date()) },
    );
  }, [id, text, saveDraftMutation]);

  const handleSubmit = useCallback(async () => {
    if (!text.trim()) return;

    const wordCount = countWords(text);
    if (session && wordCount < session.wordCountMin) {
      alert(`Bài viết cần ít nhất ${session.wordCountMin} từ. Hiện tại: ${wordCount} từ.`);
      return;
    }

    if (!confirm('Bạn có chắc muốn nộp bài? AI sẽ chấm và sửa lỗi cho bạn.')) return;

    try {
      await submitMutation.mutateAsync({ id, userText: text });
      router.push(`/practice-test/writing/${id}/result`);
    } catch {
      // Handled by React Query
    }
  }, [id, text, session, submitMutation, router]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSaveDraft]);

  // ── Loading / Error ──

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center py-20">
        <span className="text-5xl mb-4 block">😢</span>
        <p className="text-gray-500 dark:text-gray-400 mb-4">Không tìm thấy bài viết</p>
        <Link
          href="/practice-test/writing"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  const wordCount = countWords(text);
  const isInRange = wordCount >= session.wordCountMin && wordCount <= session.wordCountMax;
  const isUnderMin = wordCount < session.wordCountMin;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/practice-test/writing"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-1"
          >
            ← Quay lại
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-1 flex items-center gap-2">
            <span>✍️</span>
            {session.topic}
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold">
              {session.cefrLevel}
            </span>
            <span className="text-xs text-gray-400 font-normal">
              {WRITING_TYPE_LABELS[session.writingType] || session.writingType}
            </span>
          </h1>
        </div>

        {/* Save status */}
        <div className="text-xs text-gray-400">
          {saveDraftMutation.isPending ? (
            <span className="flex items-center gap-1">
              <span className="animate-spin">⏳</span> Đang lưu...
            </span>
          ) : lastSaved ? (
            <span>
              💾 Đã lưu lúc {lastSaved.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : (
            <span className="text-gray-300 dark:text-gray-600">Ctrl+S để lưu nháp</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Prompt + Hints ── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Prompt */}
          <div className="p-5 rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
            <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-1.5">
              📜 Aufgabe / Đề bài
            </h3>
            <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-line">
              {session.prompt}
            </p>
          </div>

          {/* Toggle hints */}
          <button
            onClick={() => setShowHints(!showHints)}
            className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-1 py-2"
          >
            {showHints ? '🙈 Ẩn gợi ý' : '💡 Hiện gợi ý'}
          </button>

          {showHints && (
            <>
              {/* Vocab Hints */}
              {session.vocabHints && (session.vocabHints as string[]).length > 0 && (
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
                  <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">
                    📚 Vokabelhilfe / Từ vựng gợi ý
                  </h4>
                  <ul className="space-y-1.5">
                    {(session.vocabHints as string[]).map((hint, i) => (
                      <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        {hint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Grammar Hints */}
              {session.grammarHints && (session.grammarHints as string[]).length > 0 && (
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                  <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">
                    📏 Grammatik / Ngữ pháp gợi ý
                  </h4>
                  <ul className="space-y-1.5">
                    {(session.grammarHints as string[]).map((hint, i) => (
                      <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                        <span className="text-amber-400 mt-0.5">•</span>
                        {hint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Right: Text Editor ── */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            {/* Editor header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                ✏️ Bài viết của bạn
              </span>
              <div className="flex items-center gap-3">
                {/* Word count */}
                <span
                  className={`text-sm font-mono font-medium px-2.5 py-1 rounded-lg ${
                    isInRange
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : isUnderMin
                      ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}
                >
                  {wordCount} / {session.wordCountMin}-{session.wordCountMax} từ
                </span>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Schreiben Sie hier Ihren Text...\n\nViết bài của bạn ở đây... (${session.wordCountMin}-${session.wordCountMax} từ)`}
              className="w-full min-h-100 p-5 text-gray-900 dark:text-white bg-transparent placeholder-gray-400 dark:placeholder-gray-500 resize-y focus:outline-none text-base leading-relaxed"
              autoFocus
            />

            {/* Progress bar */}
            <div className="px-4 pb-3">
              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    wordCount > session.wordCountMax
                      ? 'bg-orange-500'
                      : isInRange
                      ? 'bg-green-500'
                      : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (wordCount / session.wordCountMax) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleSaveDraft}
              disabled={!text.trim() || saveDraftMutation.isPending}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              <span>💾</span>
              Lưu nháp
            </button>

            <button
              onClick={handleSubmit}
              disabled={!text.trim() || submitMutation.isPending || isUnderMin}
              className="flex-2 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitMutation.isPending ? (
                <>
                  <span className="animate-spin">⏳</span>
                  AI đang chấm bài...
                </>
              ) : (
                <>
                  <span>📤</span>
                  Nộp bài & Chấm điểm
                </>
              )}
            </button>
          </div>

          {submitMutation.isError && (
            <p className="text-red-500 text-sm text-center mt-3">
              ❌ Không thể chấm bài. Vui lòng thử lại.
            </p>
          )}

          {isUnderMin && text.trim() && (
            <p className="text-sm text-gray-400 text-center mt-2">
              Cần thêm {session.wordCountMin - wordCount} từ nữa để nộp bài
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
