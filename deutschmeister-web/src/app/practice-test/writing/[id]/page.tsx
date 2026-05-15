'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWritingSession, useSaveDraft, useSubmitWriting } from '@/hooks/useWriting';
import { IconBookOpen, IconChevronLeft, IconEye, IconEyeOff, IconLoader, IconPenLine, IconSave, IconSend } from '../icons';
import { FixedActionBar, MobileSplitTabs } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { useUmlautTrigger, UMLAUT_TRIGGER_HINT } from '@/hooks/useUmlautTrigger';

function IconCheck({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="20 6 9 17 4 12" /></svg>;
}

// ─── Helpers ───
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

const WRITING_TYPE_LABELS: Record<string, string> = {
  email: 'E-Mail', brief: 'Formeller Brief', beschreibung: 'Beschreibung',
  tagebuch: 'Tagebuch', dialog: 'Dialog', aufsatz: 'Aufsatz',
  einladung: 'Einladung', bhwerde: 'Beschwerde', bewerbung: 'Bewerbung', formular: 'Formular',
};

const SPECIAL_CHARS = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'];

export default function WritingEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: session, isLoading, isError } = useWritingSession(id);
  const saveDraftMutation = useSaveDraft();
  const submitMutation = useSubmitWriting();
  // Ref mirrors saveDraftMutation.mutate — lets the auto-save timer call the latest
  // version without adding saveDraftMutation to useCallback deps (would recreate on
  // every save cycle, resetting the 30 s debounce).
  const saveDraftMutateRef = useRef(saveDraftMutation.mutate);
  useEffect(() => { saveDraftMutateRef.current = saveDraftMutation.mutate; });

  const [localText, setLocalText] = useState<string | null>(null);
  const text = localText ?? session?.userText ?? '';
  const onUmlautKey = useUmlautTrigger(setLocalText);
  const [showHints, setShowHints] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mobileView, setMobileView] = useState<'task' | 'editor'>('task');
  useEffect(() => { if (session?.status === 'GRADED') router.replace(`/practice-test/writing/${id}/result`); }, [session?.status, id, router]);

  useEffect(() => {
    if (!text.trim() || !id) return;
    const timer = setTimeout(() => {
      saveDraftMutateRef.current({ id, userText: text }, { onSuccess: () => setLastSaved(new Date()) });
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
    } catch {
      // Mutation error already shown via global handleGlobalError toast
    }
  }, [id, text, session, submitMutation, router]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSaveDraft(); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSaveDraft]);

  const insertSpecial = useCallback((char: string) => {
    if (!textareaRef.current) return;
    const { selectionStart, selectionEnd } = textareaRef.current;
    const newText = text.substring(0, selectionStart) + char + text.substring(selectionEnd);
    setLocalText(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(selectionStart + 1, selectionStart + 1);
      }
    }, 0);
  }, [text]);

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
            style={{ background: `linear-gradient(135deg, ${STATUS.danger}, ${STATUS.danger}cc)` }}>
            <IconPenLine size={28} style={{ color: 'white' }} />
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>Không tìm thấy bài viết</p>
          <Link href="/practice-test/writing"
            className="text-body font-medium" style={{ color: STATUS.info }}>
            <IconChevronLeft size={14} /> Quay lại danh sách
          </Link>
        </div>
    );
  }

  const wordCount = countWords(text);
  const isInRange = wordCount >= session.wordCountMin && wordCount <= session.wordCountMax;
  const isUnderMin = wordCount < session.wordCountMin;

  const progressPct = Math.min(100, (wordCount / session.wordCountMax) * 100);
  const progressColor = wordCount > session.wordCountMax ? ACCENT.games : isInRange ? STATUS.success : STATUS.info;

  return (
      <div className="max-w-5xl mx-auto px-4 pb-24">
        {/* Immersive Header */}
        <div className="relative -mx-4 px-4 pt-8 pb-12 mb-6 overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ background: GRADIENT.writing, maskImage: 'radial-gradient(circle at top right, white, transparent)' }} />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                style={{ background: GRADIENT.writing }}>
                <IconPenLine size={28} style={{ color: 'white' }} />
              </div>
              <div>
                <Link href="/practice-test/writing" className="text-xs font-bold uppercase tracking-widest mb-1 block opacity-60 hover:opacity-100 transition-opacity" style={{ color: 'var(--theme-text-primary)' }}>
                  ← Luyện Viết
                </Link>
                <h1 className="text-h2 font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
                  {session.topic}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest"
                    style={{ backgroundColor: `${ACCENT.writing}14`, color: ACCENT.writing, border: `1px solid ${ACCENT.writing}33` }}>
                    {session.cefrLevel}
                  </span>
                  <span className="text-xs font-medium opacity-60">
                    {WRITING_TYPE_LABELS[session.writingType] || session.writingType}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end text-right">
              <div className="text-xs font-bold mb-1" style={{ color: 'var(--theme-text-muted)' }}>
                {saveDraftMutation.isPending
                  ? <span className="flex items-center gap-1.5"><IconLoader size={12} /> Đang lưu...</span>
                  : lastSaved
                    ? <span className="flex items-center gap-1.5"><IconCheck size={12} style={{ color: STATUS.success }} /> Đã lưu {lastSaved.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    : <span className="opacity-40">Ctrl+S để lưu</span>
                }
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-only tab switcher between prompt and editor */}
        <MobileSplitTabs
          view={mobileView}
          onChange={setMobileView}
          accent="writing"
          taskLabel="Aufgabe / Đề bài"
          editorLabel="Schreiben / Viết"
          editorBadge={
            <span className="text-[10px] font-mono opacity-80">
              {countWords(text)} W
            </span>
          }
        />

        <div className="flex flex-col lg:flex-row gap-6 mt-3 lg:mt-0">

          {/* Left Side: Prompt + Hints */}
          <div className={`${mobileView === 'task' ? 'block' : 'hidden'} lg:block lg:w-1/2 shrink-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-1 space-y-4`}>
            {/* Prompt */}
            <div className="rounded-xl border-2 p-4"
              style={{ borderColor: `${STATUS.info}4D`, backgroundColor: `${STATUS.info}0A` }}>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: STATUS.info }}>
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
                  <div className="rounded-xl border p-4"
                    style={{ borderColor: `${STATUS.success}33`, backgroundColor: `${STATUS.success}08` }}>
                    <h4 className="text-caption font-bold uppercase tracking-wider mb-2" style={{ color: STATUS.success }}>
                      Vokabelhilfe / Từ vựng
                    </h4>
                    <ul className="space-y-1">
                      {(session.vocabHints as string[]).map((h, i) => (
                        <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
                          <span style={{ color: STATUS.success }}>•</span>{h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {session.grammarHints && (session.grammarHints as string[]).length > 0 && (
                  <div className="rounded-xl border p-4"
                    style={{ borderColor: `${STATUS.warning}33`, backgroundColor: `${STATUS.warning}08` }}>
                    <h4 className="text-caption font-bold uppercase tracking-wider mb-2" style={{ color: STATUS.warning }}>
                      Grammatik / Ngữ pháp
                    </h4>
                    <ul className="space-y-1">
                      {(session.grammarHints as string[]).map((h, i) => (
                        <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
                          <span style={{ color: STATUS.warning }}>•</span>{h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Side: Text Editor */}
          <div className={`${mobileView === 'editor' ? 'block' : 'hidden'} lg:block lg:w-1/2 min-w-0`}>
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
                    backgroundColor: isInRange ? `${STATUS.success}1A` : isUnderMin ? 'var(--theme-bg-secondary)' : `${ACCENT.games}1A`,
                    color: isInRange ? STATUS.success : isUnderMin ? 'var(--theme-text-muted)' : ACCENT.games,
                  }}>
                  {wordCount} / {session.wordCountMin}–{session.wordCountMax} từ
                </span>
              </div>

              {/* Special Characters Toolbar */}
              <div className="flex items-center gap-1.5 px-4 py-2 border-b overflow-x-auto no-scrollbar"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 mr-1" style={{ color: 'var(--theme-text-primary)' }}>Ký tự:</span>
                {SPECIAL_CHARS.map(char => (
                  <button key={char} onClick={() => insertSpecial(char)}
                    className="w-8 h-8 rounded-lg text-sm font-bold transition-all hover:scale-110 active:scale-90 flex items-center justify-center border"
                    style={{
                      borderColor: 'var(--theme-border)',
                      backgroundColor: 'var(--theme-bg-secondary)',
                      color: 'var(--theme-text-primary)'
                    }}>
                    {char}
                  </button>
                ))}
                <span className="text-[10px] font-medium ml-2 hidden sm:inline" style={{ color: 'var(--theme-text-muted)' }}>
                  hoặc gõ <span className="font-mono font-bold">{UMLAUT_TRIGGER_HINT}</span>
                </span>
              </div>

              {/* Textarea */}
              <textarea ref={textareaRef} value={text} onChange={e => setLocalText(e.target.value)} onKeyDown={onUmlautKey} autoFocus
                placeholder={`Schreiben Sie hier Ihren Text...\n\nViết bài của bạn ở đây... (${session.wordCountMin}–${session.wordCountMax} từ)`}
                className="w-full min-h-112 p-5 bg-transparent resize-y focus:outline-none text-[15px] leading-relaxed"
                style={{ color: 'var(--theme-text-primary)' }}
                title={`Mẹo: ${UMLAUT_TRIGGER_HINT}`} />

              {/* Progress bar */}
              <div className="px-4 pb-3">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%`, backgroundColor: progressColor }} />
                </div>
              </div>
            </div>

            {/* Fixed Action Bar */}
            <FixedActionBar columns={2}>
              <button onClick={handleSaveDraft} disabled={!text.trim() || saveDraftMutation.isPending}
                className="py-3 px-6 rounded-xl border-2 font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)', backgroundColor: 'var(--theme-bg-card)' }}>
                <IconSave size={16} /> Lưu nháp
              </button>
              <button onClick={handleSubmit} disabled={!text.trim() || submitMutation.isPending || isUnderMin}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: GRADIENT.writing, boxShadow: !isUnderMin ? `0 8px 24px ${ACCENT.writing}33` : 'none' }}>
                {submitMutation.isPending
                  ? <><IconLoader size={16} /> AI đang chấm bài...</>
                  : <><IconSend size={16} /> Nộp bài & Chấm điểm</>
                }
              </button>
            </FixedActionBar>

            {submitMutation.isError && (
              <p className="text-body text-center mt-3" style={{ color: STATUS.danger }}>Không thể chấm bài. Vui lòng thử lại.</p>
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
