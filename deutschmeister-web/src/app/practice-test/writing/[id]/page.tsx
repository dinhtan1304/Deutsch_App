'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWritingSession, useSaveDraft, useSubmitWriting } from '@/hooks/useWriting';

// ─── Inline SVG Icons ───
function IconPenLine({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
function IconChevronLeft({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function IconSave({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
function IconSend({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
function IconLoader({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
function IconBookOpen({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
function IconEye({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconEyeOff({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ─── Helpers ───
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

const WRITING_TYPE_LABELS: Record<string, string> = {
  email: 'E-Mail', brief: 'Formeller Brief', beschreibung: 'Beschreibung',
  tagebuch: 'Tagebuch', dialog: 'Dialog', aufsatz: 'Aufsatz',
  einladung: 'Einladung', beschwerde: 'Beschwerde', bewerbung: 'Bewerbung', formular: 'Formular',
};

export default function WritingEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: session, isLoading, isError } = useWritingSession(id);
  const saveDraftMutation = useSaveDraft();
  const submitMutation = useSubmitWriting();

  const [text, setText] = useState('');
  const [showHints, setShowHints] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (session?.userText) setText(session.userText); }, [session?.userText]);
  useEffect(() => { if (session?.status === 'GRADED') router.replace(`/practice-test/writing/${id}/result`); }, [session?.status, id, router]);

  // Auto-save every 30s
  useEffect(() => {
    if (!text.trim() || !id) return;
    const timer = setTimeout(() => {
      saveDraftMutation.mutate({ id, userText: text }, { onSuccess: () => setLastSaved(new Date()) });
    }, 30000);
    return () => clearTimeout(timer);
  }, [text, id]);

  const handleSaveDraft = useCallback(() => {
    if (!text.trim()) return;
    saveDraftMutation.mutate({ id, userText: text }, { onSuccess: () => setLastSaved(new Date()) });
  }, [id, text, saveDraftMutation]);

  const handleSubmit = useCallback(async () => {
    if (!text.trim()) return;
    const wc = countWords(text);
    if (session && wc < session.wordCountMin) {
      alert(`Bài viết cần ít nhất ${session.wordCountMin} từ. Hiện tại: ${wc} từ.`);
      return;
    }
    if (!confirm('Bạn có chắc muốn nộp bài? AI sẽ chấm và sửa lỗi cho bạn.')) return;
    try {
      await submitMutation.mutateAsync({ id, userText: text });
      router.push(`/practice-test/writing/${id}/result`);
    } catch { /* handled */ }
  }, [id, text, session, submitMutation, router]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSaveDraft(); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSaveDraft]);

  // Loading / Error
  if (isLoading) {
    return (
        <div className="py-6">
          <div className="space-y-4">
            <div className="h-8 w-48 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
            <div className="h-40 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
            <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
          </div>
        </div>
    );
  }

  if (isError || !session) {
    return (
        <div className="py-20 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #EF4444, #EF4444cc)' }}>
            <IconPenLine size={28} style={{ color: 'white' }} />
          </div>
          <p className="text-[14px] mb-4" style={{ color: 'var(--theme-text-muted)' }}>Không tìm thấy bài viết</p>
          <Link href="/practice-test/writing"
            className="text-[13px] font-medium" style={{ color: '#3B82F6' }}>
            <IconChevronLeft size={14} /> Quay lại danh sách
          </Link>
        </div>
    );
  }

  const wordCount = countWords(text);
  const isInRange = wordCount >= session.wordCountMin && wordCount <= session.wordCountMax;
  const isUnderMin = wordCount < session.wordCountMin;

  const progressPct = Math.min(100, (wordCount / session.wordCountMax) * 100);
  const progressColor = wordCount > session.wordCountMax ? '#F97316' : isInRange ? '#22C55E' : '#3B82F6';

  return (
      <div className="py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <Link href="/practice-test/writing"
              className="flex items-center gap-1 text-[13px] font-medium mb-1 transition-opacity hover:opacity-70"
              style={{ color: 'var(--theme-text-muted)' }}>
              <IconChevronLeft size={14} /> Quay lại
            </Link>
            <h1 className="text-[18px] font-bold flex items-center gap-2 flex-wrap" style={{ color: 'var(--theme-text-primary)' }}>
              {session.topic}
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                style={{ backgroundColor: 'rgba(59,130,246,.1)', color: '#3B82F6' }}>
                {session.cefrLevel}
              </span>
              <span className="text-[12px] font-normal" style={{ color: 'var(--theme-text-muted)' }}>
                {WRITING_TYPE_LABELS[session.writingType] || session.writingType}
              </span>
            </h1>
          </div>
          <div className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
            {saveDraftMutation.isPending
              ? <span className="flex items-center gap-1"><IconLoader size={12} /> Đang lưu...</span>
              : lastSaved
                ? <span className="flex items-center gap-1"><IconSave size={12} /> {lastSaved.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                : <span>Ctrl+S để lưu</span>
            }
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Left: Prompt + Hints */}
          <div className="lg:col-span-2 space-y-3 lg:sticky lg:top-20 lg:self-start">
            {/* Prompt */}
            <div className="rounded-xl border-2 p-4" style={{ borderColor: 'rgba(59,130,246,.3)', backgroundColor: 'rgba(59,130,246,.04)' }}>
              <h3 className="text-[12px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#3B82F6' }}>
                <IconBookOpen size={13} /> Aufgabe / Đề bài
              </h3>
              <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: 'var(--theme-text-primary)' }}>
                {session.prompt}
              </p>
            </div>

            {/* Toggle hints */}
            <button onClick={() => setShowHints(!showHints)}
              className="w-full text-[12px] font-medium flex items-center justify-center gap-1 py-2 rounded-lg transition-all"
              style={{ color: 'var(--theme-text-muted)', backgroundColor: 'var(--theme-bg-secondary)' }}>
              {showHints ? <><IconEyeOff size={13} /> Ẩn gợi ý</> : <><IconEye size={13} /> Hiện gợi ý</>}
            </button>

            {showHints && (
              <>
                {session.vocabHints && (session.vocabHints as string[]).length > 0 && (
                  <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(34,197,94,.2)', backgroundColor: 'rgba(34,197,94,.04)' }}>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#22C55E' }}>
                      Vokabelhilfe / Từ vựng
                    </h4>
                    <ul className="space-y-1">
                      {(session.vocabHints as string[]).map((h, i) => (
                        <li key={i} className="text-[12px] flex items-start gap-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
                          <span style={{ color: '#22C55E' }}>•</span>{h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {session.grammarHints && (session.grammarHints as string[]).length > 0 && (
                  <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(245,158,11,.2)', backgroundColor: 'rgba(245,158,11,.04)' }}>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#F59E0B' }}>
                      Grammatik / Ngữ pháp
                    </h4>
                    <ul className="space-y-1">
                      {(session.grammarHints as string[]).map((h, i) => (
                        <li key={i} className="text-[12px] flex items-start gap-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
                          <span style={{ color: '#F59E0B' }}>•</span>{h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: Text Editor */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border overflow-hidden"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
              {/* Editor header */}
              <div className="px-4 py-3 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-secondary)' }}>
                <span className="text-[13px] font-semibold flex items-center gap-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
                  <IconPenLine size={14} /> Bài viết của bạn
                </span>
                <span className="text-[12px] font-mono font-semibold px-2.5 py-1 rounded-lg"
                  style={{
                    backgroundColor: isInRange ? 'rgba(34,197,94,.1)' : isUnderMin ? 'var(--theme-bg-secondary)' : 'rgba(249,115,22,.1)',
                    color: isInRange ? '#22C55E' : isUnderMin ? 'var(--theme-text-muted)' : '#F97316',
                  }}>
                  {wordCount} / {session.wordCountMin}–{session.wordCountMax} từ
                </span>
              </div>

              {/* Textarea */}
              <textarea ref={textareaRef} value={text} onChange={e => setText(e.target.value)} autoFocus
                placeholder={`Schreiben Sie hier Ihren Text...\n\nViết bài của bạn ở đây... (${session.wordCountMin}–${session.wordCountMax} từ)`}
                className="w-full min-h-112 p-5 bg-transparent resize-y focus:outline-none text-[15px] leading-relaxed"
                style={{ color: 'var(--theme-text-primary)' }} />

              {/* Progress bar */}
              <div className="px-4 pb-3">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%`, backgroundColor: progressColor }} />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-4">
              <button onClick={handleSaveDraft} disabled={!text.trim() || saveDraftMutation.isPending}
                className="py-3 px-6 rounded-xl border-2 font-semibold text-[14px] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                <IconSave size={16} /> Lưu nháp
              </button>
              <button onClick={handleSubmit} disabled={!text.trim() || submitMutation.isPending || isUnderMin}
                className="flex-1 py-3 rounded-xl font-bold text-[14px] text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 4px 12px rgba(99,102,241,.3)' }}>
                {submitMutation.isPending
                  ? <><IconLoader size={16} /> AI đang chấm bài...</>
                  : <><IconSend size={16} /> Nộp bài & Chấm điểm</>
                }
              </button>
            </div>

            {submitMutation.isError && (
              <p className="text-[13px] text-center mt-3" style={{ color: '#EF4444' }}>Không thể chấm bài. Vui lòng thử lại.</p>
            )}
            {isUnderMin && text.trim() && (
              <p className="text-[12px] text-center mt-2" style={{ color: 'var(--theme-text-muted)' }}>
                Cần thêm {session.wordCountMin - wordCount} từ nữa để nộp bài
              </p>
            )}
          </div>
        </div>

      </div>
  );
}