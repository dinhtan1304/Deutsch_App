'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { ApiError } from '@/lib/api/client';
import { useYouTubeUrlPreview } from '@/hooks/useDictation';
import { canonicalYouTubeUrl, parseYouTubeId, youTubeThumbnail } from '@/lib/youtube';

/**
 * Paste-a-YouTube-link starter shared by Dictation and Shadowing.
 *
 * Parses the id on the client (same rules as the API), shows a thumbnail
 * instantly and a debounced preview card (title, channel, "already in the
 * library", known failures), sends a canonical URL, guards double submits,
 * shows staged progress while the import runs, and translates API error codes.
 *
 * The page owns what happens on success (navigate / queued notice): `onStart`
 * resolves when done and throws the API error on failure.
 */
interface YouTubeUrlStarterProps {
  variant: 'dictation' | 'shadowing';
  subtitle: string;
  onStart: (canonicalUrl: string) => Promise<void>;
  /** Rendered under the input (e.g. dictation's "queued for admin" notice). */
  notice?: React.ReactNode;
  /** Called whenever the user edits the link — lets the page clear `notice`. */
  onEdit?: () => void;
}

const PREVIEW_DEBOUNCE_MS = 350;
/** Caption failures the shadowing import recovers from via AI transcription. */
const AI_FALLBACK_CODES = new Set(['NO_GERMAN_CC', 'AUTO_GENERATED_ONLY']);

/** API error codes with a translation under `urlInput.errors`. */
const ERROR_CODES = [
  'INVALID_URL', 'NO_GERMAN_CC', 'AUTO_GENERATED_ONLY', 'VIDEO_NOT_GERMAN', 'PRIVATE_OR_REMOVED',
  'AGE_RESTRICTED', 'LIVE_STREAM', 'IP_BLOCKED', 'TIMEOUT', 'UNKNOWN', 'VIDEO_TOO_SHORT',
  'VIDEO_TOO_LONG', 'VIDEO_TOO_LONG_FOR_AI', 'AUDIO_EXTRACT_FAILED', 'AUDIO_PROBE_FAILED',
  'TRANSCRIPT_TOO_SHORT', 'GEMINI_FAILED', 'AI_SUBTITLE_QUOTA', 'THROTTLED',
] as const;
type ErrorCode = (typeof ERROR_CODES)[number];
const isErrorCode = (c: unknown): c is ErrorCode => typeof c === 'string' && (ERROR_CODES as readonly string[]).includes(c);

const noopSubscribe = () => () => {};
const clipboardReadable = () => typeof navigator !== 'undefined' && !!navigator.clipboard?.readText;

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function IconClipboard({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>;
}
function IconX({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
function IconWarn({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
}
function IconSpinner({ size = 14 }: { size?: number }) {
  return <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.2-8.56" /></svg>;
}

export function YouTubeUrlStarter({ variant, subtitle, onStart, notice, onEdit }: YouTubeUrlStarterProps) {
  const t = useTranslations('practice.dictation.urlInput');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const canPaste = useSyncExternalStore(noopSubscribe, clipboardReadable, () => false);
  const submittingRef = useRef(false);

  const youtubeId = parseYouTubeId(value);
  const showInvalid = value.trim().length > 0 && !youtubeId;

  // Debounce the id we preview so typing doesn't fire a request per keystroke.
  // A paste lands as one change, so it previews after one short delay. A stale
  // previewId is harmless: results only show while it matches the input.
  const [previewId, setPreviewId] = useState<string | null>(null);
  useEffect(() => {
    if (!youtubeId) return;
    const h = setTimeout(() => setPreviewId(youtubeId), PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(h);
  }, [youtubeId]);
  const preview = useYouTubeUrlPreview(previewId);
  const previewCurrent = !!youtubeId && previewId === youtubeId;
  const data = previewCurrent ? preview.data : undefined;
  const checking = !!youtubeId && (!previewCurrent || preview.isFetching);

  useEffect(() => {
    if (!pending) return;
    const h = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(h);
  }, [pending]);
  const elapsed = pending ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;

  const errorText = (err: unknown): string => {
    if (err instanceof ApiError) {
      if (err.status === 429) return t('errors.THROTTLED');
      const code = (err.data as { code?: unknown } | undefined)?.code;
      if (isErrorCode(code)) return t(`errors.${code}`);
    }
    return err instanceof Error && err.message ? err.message : t('generic');
  };

  // Shadowing retries missing/auto-only captions through AI transcription, so
  // those cached caption failures don't block it.
  const knownFailure = data?.knownFailure && !(variant === 'shadowing' && AI_FALLBACK_CODES.has(data.knownFailure))
    ? data.knownFailure
    : null;
  const blockedReason = data?.unavailable
    ? t('unavailable')
    : knownFailure
      ? (isErrorCode(knownFailure) ? t(`errors.${knownFailure}`) : t('generic'))
      : null;

  const edit = (next: string) => {
    setValue(next);
    setError('');
    onEdit?.();
  };

  const submit = async () => {
    if (submittingRef.current) return;
    if (!value.trim()) { setError(t('missing')); return; }
    if (!youtubeId) { setError(t('invalid')); return; }
    if (blockedReason) { setError(blockedReason); return; }
    submittingRef.current = true;
    const t0 = Date.now();
    setStartedAt(t0);
    setNow(t0);
    setPending(true);
    setError('');
    try {
      await onStart(canonicalYouTubeUrl(youtubeId));
      setValue('');
    } catch (err) {
      setError(errorText(err));
    } finally {
      submittingRef.current = false;
      setPending(false);
    }
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) edit(text.trim());
    } catch { /* permission denied — user can still paste manually */ }
  };

  const inLibrary = !!data?.inLibrary;
  const stage = elapsed >= 20 && variant === 'shadowing' && !inLibrary
    ? t('stageAi')
    : elapsed >= 8 ? t('stageBuild') : t('stageFetch');
  const canSubmit = !!youtubeId && !pending && !blockedReason;

  return (
    <>
      <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{subtitle}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex min-w-0 flex-1 items-center">
          <input
            type="url" inputMode="url" autoComplete="off" spellCheck={false}
            aria-label={t('label')} aria-invalid={!!error || showInvalid}
            value={value} disabled={pending}
            onChange={(e) => edit(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void submit(); } }}
            placeholder={t('placeholder')}
            className="h-10 w-full min-w-0 rounded-[9px] pl-3.5 pr-20 text-caption outline-none disabled:opacity-60"
            style={{ background: 'var(--theme-bg-secondary)', border: `1px solid ${error || showInvalid ? 'var(--danger)' : 'var(--theme-border)'}`, color: 'var(--theme-text-primary)' }}
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            {value && !pending && (
              <button type="button" onClick={() => edit('')} aria-label={t('clear')} title={t('clear')}
                className="flex h-7 w-7 items-center justify-center rounded-md transition-opacity hover:opacity-70" style={{ color: 'var(--theme-text-muted)' }}>
                <IconX />
              </button>
            )}
            {!value && canPaste && (
              <button type="button" onClick={paste}
                className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-semibold transition-opacity hover:opacity-80"
                style={{ background: 'var(--theme-bg-tertiary)', color: 'var(--theme-text-secondary)' }}>
                <IconClipboard size={12} /> {t('paste')}
              </button>
            )}
          </div>
        </div>
        <button type="button" onClick={submit} disabled={!canSubmit}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[9px] px-5 text-caption font-bold disabled:opacity-50"
          style={canSubmit || pending ? { background: 'var(--accent)', color: 'var(--accent-on)' } : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
          {pending ? <><IconSpinner /> <span className="mono">{elapsed}s</span></> : <>{t('start')} →</>}
        </button>
      </div>

      {showInvalid && !error && <p className="text-[11px]" style={{ color: 'var(--danger)' }}>{t('invalid')}</p>}

      {youtubeId && (
        <div className="flex items-center gap-3 rounded-[10px] p-2" style={{ background: 'var(--theme-bg-card)', border: `1px solid ${blockedReason ? 'color-mix(in srgb, var(--danger) 40%, transparent)' : 'var(--theme-border)'}` }}>
          <div className="relative w-28 shrink-0 overflow-hidden rounded-[7px] sm:w-32"
            style={{ aspectRatio: '16 / 9', backgroundColor: 'var(--theme-bg-tertiary)', backgroundImage: `url(${youTubeThumbnail(youtubeId)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {data?.video?.durationSec ? (
              <span className="mono absolute bottom-1 right-1 rounded-xs px-1 text-[10px] font-bold text-white" style={{ background: 'rgba(0,0,0,.7)' }}>{formatDuration(data.video.durationSec)}</span>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {data?.title ? (
              <p className="line-clamp-2 text-caption font-semibold leading-snug" style={{ color: 'var(--theme-text-primary)' }}>{data.title}</p>
            ) : checking ? (
              <span className="h-3.5 w-3/4 animate-pulse rounded" style={{ background: 'var(--theme-bg-tertiary)' }} />
            ) : null}
            {data?.channelName && <p className="truncate text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{data.channelName}</p>}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {checking && !data ? (
                <span style={{ color: 'var(--theme-text-muted)' }}>{t('checking')}</span>
              ) : blockedReason ? (
                <span className="inline-flex items-start gap-1" style={{ color: 'var(--danger)' }}><IconWarn />{blockedReason}</span>
              ) : inLibrary ? (
                <>
                  <span className="inline-flex items-center gap-1 rounded-[5px] px-1.5 py-0.5 font-bold" style={{ background: 'color-mix(in srgb, var(--success) 16%, transparent)', color: 'var(--success)' }}>✓ {t('inLibrary')}</span>
                  {data?.video?.cefrLevel && <span className="mono rounded-[5px] px-1.5 py-0.5 font-bold" style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>{data.video.cefrLevel}</span>}
                  {data?.video?.transcriptSource === 'ai' && <span style={{ color: 'var(--violet)' }}>{t('aiSource')}</span>}
                </>
              ) : preview.isError && previewId === youtubeId ? (
                <span style={{ color: 'var(--theme-text-muted)' }}>{t('previewError')}</span>
              ) : data ? (
                <span style={{ color: 'var(--theme-text-muted)' }}>{variant === 'shadowing' ? t('aiHint') : t('willFetch')}</span>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {pending && !inLibrary && (
        <p className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--accent)' }} aria-live="polite">
          <IconSpinner size={12} /> {stage}
        </p>
      )}
      {error && <p className="text-[11px]" style={{ color: 'var(--danger)' }} role="alert">{error}</p>}
      {notice}
    </>
  );
}
