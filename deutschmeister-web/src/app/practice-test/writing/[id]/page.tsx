'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWritingSession, useSaveDraft, useSubmitWriting } from '@/hooks/useWriting';
import { IconBookOpen, IconChevronDown, IconChevronLeft, IconEye, IconEyeOff, IconLoader, IconPenLine, IconSave, IconSend } from '../icons';

function IconChevronUp({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="18 15 12 9 6 15" /></svg>;
}
function IconPin({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1 1 1 0 0 1 1 1z"/></svg>;
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
  // Ref để tránh saveDraftMutation object (unstable) vào deps của auto-save timer.
  // saveDraftMutation.mutate function là stable, nhưng object thay reference mỗi khi
  // state thay đổi (idle→pending→success→idle) → timer bị reset sau mỗi lần save.
  const saveDraftMutateRef = useRef(saveDraftMutation.mutate);
  saveDraftMutateRef.current = saveDraftMutation.mutate;

  const [text, setText] = useState('');
  const [showHints, setShowHints] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [stickyPromptOpen, setStickyPromptOpen] = useState(false);
  const [showStickyPrompt, setShowStickyPrompt] = useState(false);
  const promptRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (session?.userText) setText(session.userText); }, [session?.userText]);
  useEffect(() => { if (session?.status === 'GRADED') router.replace(`/practice-test/writing/${id}/result`); }, [session?.status, id, router]);

  // Show sticky prompt bar on mobile when prompt scrolls out of view
  useEffect(() => {
    const el = promptRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyPrompt(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [session]);

  // Auto-save every 30s sau lần cuối user gõ phím
  useEffect(() => {
    if (!text.trim() || !id) return;
    const timer = setTimeout(() => {
      saveDraftMutateRef.current({ id, userText: text }, { onSuccess: () => setLastSaved(new Date()) });
    }, 30000);
    return () => clearTimeout(timer);
  }, [text, id]); // saveDraftMutation sẽ không vào deps để tránh reset timer

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
          <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>Không tìm thấy bài viết</p>
          <Link href="/practice-test/writing"
            className="text-body font-medium" style={{ color: '#3B82F6' }}>
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
              className="flex items-center gap-1 text-body font-medium mb-1 transition-opacity hover:opacity-70"
              style={{ color: 'var(--theme-text-muted)' }}>
              <IconChevronLeft size={14} /> Quay lại
            </Link>
            <h1 className="text-title font-bold flex items-center gap-2 flex-wrap" style={{ color: 'var(--theme-text-primary)' }}>
              {session.topic}
              <span className="px-2 py-0.5 rounded-md text-caption font-bold"
                style={{ backgroundColor: 'rgba(59,130,246,.1)', color: '#3B82F6' }}>
                {session.cefrLevel}
              </span>
              <span className="text-xs font-normal" style={{ color: 'var(--theme-text-muted)' }}>
                {WRITING_TYPE_LABELS[session.writingType] || session.writingType}
              </span>
            </h1>
          </div>
          <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            {saveDraftMutation.isPending
              ? <span className="flex items-center gap-1"><IconLoader size={12} /> Đang lưu...</span>
              : lastSaved
                ? <span className="flex items-center gap-1"><IconSave size={12} /> {lastSaved.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                : <span>Ctrl+S để lưu</span>
            }
          </div>
        </div>

        {/* ── Sticky prompt bar on mobile (appears when prompt scrolls away) ── */}
        {showStickyPrompt && (
          <div className="sticky z-20 -mx-6 lg:hidden px-6 pb-3" style={{ top: '64px', paddingTop: '8px' }}>
            <div className="rounded-2xl border overflow-hidden transition-all"
              style={{
                borderColor: 'rgba(59,130,246,.35)',
                backgroundColor: 'var(--theme-bg-card)',
                boxShadow: '0 4px 20px rgba(0,0,0,.1)',
              }}>
              <button
                onClick={() => setStickyPromptOpen(o => !o)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all"
              >
                <IconPin size={12} />
                <IconBookOpen size={12} />
                <span className="text-xs font-bold truncate flex-1" style={{ color: 'var(--theme-text-primary)' }}>
                  Aufgabe / Đề bài
                </span>
                {stickyPromptOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
              </button>
              {stickyPromptOpen && (
                <div className="border-t px-3 pb-3 pt-2" style={{ borderColor: 'var(--theme-border)', maxHeight: '40vh', overflowY: 'auto' }}>
                  <p className="text-xs leading-relaxed whitespace-pre-line"
                    style={{ color: 'var(--theme-text-primary)' }}>
                    {session.prompt}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Left: Prompt + Hints */}
          <div className="lg:col-span-2 space-y-3 lg:sticky lg:top-20 lg:self-start">
            {/* Prompt */}
            <div ref={promptRef} className="rounded-xl border-2 p-4" style={{ borderColor: 'rgba(59,130,246,.3)', backgroundColor: 'rgba(59,130,246,.04)' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#3B82F6' }}>
                <IconBookOpen size={13} /> Aufgabe / Đề bài
              </h3>
              <p className="text-body leading-relaxed whitespace-pre-line" style={{ color: 'var(--theme-text-primary)' }}>
                {session.prompt}
              </p>
            </div>

            {/* Toggle hints */}
            <button onClick={() => setShowHints(!showHints)}
              className="w-full text-xs font-medium flex items-center justify-center gap-1 py-2 rounded-lg transition-all"
              style={{ color: 'var(--theme-text-muted)', backgroundColor: 'var(--theme-bg-secondary)' }}>
              {showHints ? <><IconEyeOff size={13} /> Ẩn gợi ý</> : <><IconEye size={13} /> Hiện gợi ý</>}
            </button>

            {showHints && (
              <>
                {session.vocabHints && (session.vocabHints as string[]).length > 0 && (
                  <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(34,197,94,.2)', backgroundColor: 'rgba(34,197,94,.04)' }}>
                    <h4 className="text-caption font-bold uppercase tracking-wider mb-2" style={{ color: '#22C55E' }}>
                      Vokabelhilfe / Từ vựng
                    </h4>
                    <ul className="space-y-1">
                      {(session.vocabHints as string[]).map((h, i) => (
                        <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
                          <span style={{ color: '#22C55E' }}>•</span>{h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {session.grammarHints && (session.grammarHints as string[]).length > 0 && (
                  <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(245,158,11,.2)', backgroundColor: 'rgba(245,158,11,.04)' }}>
                    <h4 className="text-caption font-bold uppercase tracking-wider mb-2" style={{ color: '#F59E0B' }}>
                      Grammatik / Ngữ pháp
                    </h4>
                    <ul className="space-y-1">
                      {(session.grammarHints as string[]).map((h, i) => (
                        <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
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
                <span className="text-body font-semibold flex items-center gap-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
                  <IconPenLine size={14} /> Bài viết của bạn
                </span>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg"
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
                className="py-3 px-6 rounded-xl border-2 font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                <IconSave size={16} /> Lưu nháp
              </button>
              <button onClick={handleSubmit} disabled={!text.trim() || submitMutation.isPending || isUnderMin}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 4px 12px rgba(99,102,241,.3)' }}>
                {submitMutation.isPending
                  ? <><IconLoader size={16} /> AI đang chấm bài...</>
                  : <><IconSend size={16} /> Nộp bài & Chấm điểm</>
                }
              </button>
            </div>

            {submitMutation.isError && (
              <p className="text-body text-center mt-3" style={{ color: '#EF4444' }}>Không thể chấm bài. Vui lòng thử lại.</p>
            )}
            {isUnderMin && text.trim() && (
              <p className="text-xs text-center mt-2" style={{ color: 'var(--theme-text-muted)' }}>
                Cần thêm {session.wordCountMin - wordCount} từ nữa để nộp bài
              </p>
            )}
          </div>
        </div>

      </div>
  );
}