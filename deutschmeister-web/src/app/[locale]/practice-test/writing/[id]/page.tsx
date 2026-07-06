'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useFormatter } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useWritingSession, useSaveDraft, useSubmitWriting } from '@/hooks/useWriting';
import { IconBookOpen, IconChevronLeft, IconEye, IconEyeOff, IconLoader, IconPenLine, IconSave, IconSend } from '../icons';
import { PageHeader, FixedActionBar, MobileSplitTabs } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { useUmlautTrigger, UMLAUT_TRIGGER_HINT } from '@/hooks/useUmlautTrigger';
import { RedemittelPanel } from '../../_components/TeilStrategyPanel';

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
  const t = useTranslations('practice.writing.answering');
  const formatter = useFormatter();

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
      alert(t('alertMinWords', { min: session.wordCountMin, current: wc }));
      return;
    }
    if (!confirm(t('confirmSubmit'))) return;
    try {
      await submitMutation.mutateAsync({ id, userText: text });
      router.push(`/practice-test/writing/${id}/result`);
    } catch {
      // Mutation error already shown via global handleGlobalError toast
    }
  }, [id, text, session, submitMutation, router, t]);

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
          <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>{t('notFound')}</p>
          <Link href="/practice-test/writing"
            className="text-body font-medium" style={{ color: STATUS.info }}>
            <IconChevronLeft size={14} /> {t('backToList')}
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
      <div className="max-w-360 mx-auto px-4 pb-24">
        <PageHeader
          backHref="/practice-test/writing"
          title={t('title')}
          accent="writing"
          right={
            <div className="hidden text-xs font-bold sm:block" style={{ color: 'var(--theme-text-muted)' }}>
              {saveDraftMutation.isPending
                ? <span className="flex items-center gap-1.5"><IconLoader size={12} /> {t('saving')}</span>
                : lastSaved
                  ? <span className="flex items-center gap-1.5"><IconCheck size={12} style={{ color: STATUS.success }} /> {t('savedAt', { time: formatter.dateTime(lastSaved, { hour: '2-digit', minute: '2-digit' }) })}</span>
                  : <span className="opacity-40">{t('ctrlSHint')}</span>}
            </div>
          }
        />

        {/* Exercise title + meta */}
        <div className="mb-6 min-w-0">
          <h1 className="text-h2 font-black tracking-tight mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            {session.topic}
          </h1>
          <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--theme-text-muted)' }}>
            <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-widest"
              style={{ backgroundColor: `${ACCENT.writing}1A`, color: ACCENT.writing }}>{session.cefrLevel}</span>
            <span className="opacity-40">·</span>
            <span>{WRITING_TYPE_LABELS[session.writingType] || session.writingType}</span>
          </div>
        </div>

        {/* Mobile-only tab switcher between prompt and editor */}
        <MobileSplitTabs
          view={mobileView}
          onChange={setMobileView}
          accent="writing"
          taskLabel={t('tabTask')}
          editorLabel={t('tabEditor')}
          editorBadge={
            <span className="text-[10px] font-mono opacity-80">
              {t('wordsShort', { count: countWords(text) })}
            </span>
          }
        />

        <div className="flex flex-col lg:flex-row gap-6 mt-3 lg:mt-0">

          {/* Left Side: Prompt + Hints */}
          <div className={`${mobileView === 'task' ? 'block' : 'hidden'} lg:block lg:w-1/2 shrink-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-1 space-y-4`}>
            {/* Prompt */}
            <div className="rounded-md border-2 p-4"
              style={{ borderColor: `${STATUS.info}4D`, backgroundColor: `${STATUS.info}0A` }}>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: STATUS.info }}>
                <IconBookOpen size={13} /> {t('promptHeader')}
              </h3>
              <p className="text-body leading-relaxed whitespace-pre-line" style={{ color: 'var(--theme-text-primary)' }}>
                {session.prompt}
              </p>
            </div>

            {/* Redemittel lookup — curated for B1 exam writing */}
            {session.cefrLevel === 'B1' && <RedemittelPanel skill="writing" />}

            {/* Toggle hints */}
            <button onClick={() => setShowHints(!showHints)}
              className="w-full text-xs font-medium flex items-center justify-center gap-1 py-2 rounded-lg transition-all"
              style={{ color: 'var(--theme-text-muted)', backgroundColor: 'var(--theme-bg-secondary)' }}>
              {showHints ? <><IconEyeOff size={13} /> {t('hideHints')}</> : <><IconEye size={13} /> {t('showHints')}</>}
            </button>

            {showHints && (
              <>
                {session.vocabHints && (session.vocabHints as string[]).length > 0 && (
                  <div className="rounded-md border p-4"
                    style={{ borderColor: `${STATUS.success}33`, backgroundColor: `${STATUS.success}08` }}>
                    <h4 className="text-caption font-bold uppercase tracking-wider mb-2" style={{ color: STATUS.success }}>
                      {t('vocabHints')}
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
                  <div className="rounded-md border p-4"
                    style={{ borderColor: `${STATUS.warning}33`, backgroundColor: `${STATUS.warning}08` }}>
                    <h4 className="text-caption font-bold uppercase tracking-wider mb-2" style={{ color: STATUS.warning }}>
                      {t('grammarHints')}
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
                  <IconPenLine size={14} /> {t('editorLabel')}
                </span>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg"
                  style={{
                    backgroundColor: isInRange ? `${STATUS.success}1A` : isUnderMin ? 'var(--theme-bg-secondary)' : `${ACCENT.games}1A`,
                    color: isInRange ? STATUS.success : isUnderMin ? 'var(--theme-text-muted)' : ACCENT.games,
                  }}>
                  {t('wordCountLabel', { count: wordCount, min: session.wordCountMin, max: session.wordCountMax })}
                </span>
              </div>

              {/* Special Characters Toolbar */}
              <div className="flex items-center gap-1.5 px-4 py-2 border-b overflow-x-auto no-scrollbar"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 mr-1" style={{ color: 'var(--theme-text-primary)' }}>{t('specialCharsLabel')}</span>
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
                  {t('orType')} <span className="font-mono font-bold">{UMLAUT_TRIGGER_HINT}</span>
                </span>
              </div>

              {/* Textarea */}
              <textarea ref={textareaRef} value={text} onChange={e => setLocalText(e.target.value)} onKeyDown={onUmlautKey} autoFocus
                placeholder={t('textareaPlaceholder', { min: session.wordCountMin, max: session.wordCountMax })}
                className="w-full min-h-112 p-5 bg-transparent resize-y focus:outline-none text-[15px] leading-relaxed"
                style={{ color: 'var(--theme-text-primary)' }}
                title={t('umlautTip', { hint: UMLAUT_TRIGGER_HINT })} />

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
                <IconSave size={16} /> {t('saveDraft')}
              </button>
              <button onClick={handleSubmit} disabled={!text.trim() || submitMutation.isPending || isUnderMin}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: GRADIENT.writing, boxShadow: !isUnderMin ? `0 8px 24px ${ACCENT.writing}33` : 'none' }}>
                {submitMutation.isPending
                  ? <><IconLoader size={16} /> {t('submitting')}</>
                  : <><IconSend size={16} /> {t('submit')}</>
                }
              </button>
            </FixedActionBar>

            {submitMutation.isError && (
              <p className="text-body text-center mt-3" style={{ color: STATUS.danger }}>{t('submitError')}</p>
            )}
            {isUnderMin && text.trim() && (
              <p className="text-xs text-center mt-2" style={{ color: 'var(--theme-text-muted)' }}>
                {t('needMoreWords', { count: session.wordCountMin - wordCount })}
              </p>
            )}
          </div>
        </div>

      </div>
  );
}
