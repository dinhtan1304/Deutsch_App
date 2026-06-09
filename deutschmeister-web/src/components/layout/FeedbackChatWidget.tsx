'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ACCENT, STATUS, GRADIENT } from '@/lib/tokens';
import { compressImage } from '@/lib/compressImage';
import {
  useMyFeedbackList,
  useMyFeedbackUnread,
  useMyFeedbackThread,
  useSendMyFeedbackMessage,
} from '@/hooks/useFeedbackChat';
import type { FeedbackType, FeedbackStatus, MyFeedbackListItem } from '@/lib/api/feedback';
import {
  IconX,
  IconChevronLeft,
  IconMessageCircle,
  IconBug,
  IconLightbulb,
  IconLoader,
} from '@/components/ui/Icons';

const FeedbackModal = dynamic(() => import('./FeedbackModal').then((m) => m.FeedbackModal), { ssr: false });

const MAX_IMAGES = 3;
const MAX_SIZE_MB = 2;

const TYPE_META: Record<FeedbackType, { icon: React.ComponentType<{ size?: number }>; color: string }> = {
  bug: { icon: IconBug, color: STATUS.danger },
  suggestion: { icon: IconLightbulb, color: ACCENT.xp },
  other: { icon: IconMessageCircle, color: ACCENT.writing },
};

const STATUS_COLOR: Record<FeedbackStatus, string> = {
  new: STATUS.info,
  reviewed: STATUS.warning,
  resolved: STATUS.success,
};

function IconSend({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconCamera({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

interface FeedbackChatWidgetProps {
  /** Whether the current user is signed in (only signed-in users have threads). */
  enabled: boolean;
}

export function FeedbackChatWidget({ enabled }: FeedbackChatWidgetProps) {
  const t = useTranslations('support');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewFeedback, setShowNewFeedback] = useState(false);

  const { data: unread } = useMyFeedbackUnread(enabled);
  const unreadCount = unread?.count ?? 0;

  // Deep-link from the bell notification: /dashboard?support=<id> opens the
  // widget straight to that thread, then strips the param so it doesn't stick.
  const supportParam = searchParams.get('support');
  useEffect(() => {
    if (!enabled || !supportParam) return;
    setOpen(true);
    setSelectedId(supportParam);
    const next = new URLSearchParams(searchParams.toString());
    next.delete('support');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supportParam, enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Launcher bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={t('launcherAria')}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-transform hover:-translate-y-0.5"
          style={{ background: GRADIENT.writing }}
        >
          <IconMessageCircle size={24} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: STATUS.danger, minWidth: 20, height: 20, padding: '0 5px', boxShadow: `0 2px 6px ${STATUS.danger}66` }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label={t('title')}
          className="fixed bottom-6 right-6 z-40 w-90 max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl border overflow-hidden flex flex-col"
          style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', height: 'min(560px, calc(100vh - 96px))' }}
        >
          {selectedId ? (
            <ThreadView
              id={selectedId}
              onBack={() => setSelectedId(null)}
              onClose={() => setOpen(false)}
              locale={locale}
            />
          ) : (
            <ListView
              onClose={() => setOpen(false)}
              onSelect={setSelectedId}
              onNew={() => { setOpen(false); setShowNewFeedback(true); }}
              locale={locale}
            />
          )}
        </div>
      )}

      {showNewFeedback && <FeedbackModal onClose={() => setShowNewFeedback(false)} />}
    </>
  );
}

// ─── Conversation list ────────────────────────────────────────────────────────

function ListView({
  onClose, onSelect, onNew, locale,
}: {
  onClose: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  locale: string;
}) {
  const t = useTranslations('support');
  const { data, isLoading, isError } = useMyFeedbackList();
  const items = data?.items ?? [];

  return (
    <>
      <PanelHeader title={t('title')} subtitle={t('subtitle')} onClose={onClose} />

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="text-center py-10 text-body" style={{ color: 'var(--theme-text-muted)' }}>{t('loading')}</p>
        ) : isError ? (
          <p className="text-center py-10 text-body" style={{ color: STATUS.danger }}>{t('loadError')}</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-6 py-12">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: `color-mix(in srgb, ${ACCENT.writing} 12%, transparent)`, color: ACCENT.writing }}>
              <IconMessageCircle size={22} />
            </div>
            <p className="font-semibold text-body" style={{ color: 'var(--theme-text-primary)' }}>{t('empty')}</p>
            <p className="text-caption mt-1" style={{ color: 'var(--theme-text-muted)' }}>{t('emptyHint')}</p>
          </div>
        ) : (
          <ul>
            {items.map((item) => (
              <ConversationRow key={item.id} item={item} locale={locale} onClick={() => onSelect(item.id)} />
            ))}
          </ul>
        )}
      </div>

      <div className="p-3 border-t shrink-0" style={{ borderColor: 'var(--theme-border)' }}>
        <button
          onClick={onNew}
          className="w-full py-2.5 rounded-xl text-body font-bold text-white transition-all"
          style={{ background: GRADIENT.writing }}
        >
          {t('newReport')}
        </button>
      </div>
    </>
  );
}

function ConversationRow({ item, locale, onClick }: { item: MyFeedbackListItem; locale: string; onClick: () => void }) {
  const t = useTranslations('support');
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;
  return (
    <li>
      <button onClick={onClick} className="w-full flex items-start gap-3 px-4 py-3 text-left border-b transition-colors hover:bg-(--theme-bg-secondary)" style={{ borderColor: 'var(--theme-border)' }}>
        <span className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5" style={{ background: `color-mix(in srgb, ${meta.color} 12%, transparent)`, color: meta.color }}>
          <Icon size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-caption font-semibold" style={{ color: meta.color }}>{t(`typeLabel.${item.type}`)}</span>
            <span className="text-caption px-1.5 py-0.5 rounded-md font-semibold" style={{ color: STATUS_COLOR[item.status], background: `color-mix(in srgb, ${STATUS_COLOR[item.status]} 14%, transparent)` }}>
              {t(`statusLabel.${item.status}`)}
            </span>
          </span>
          <span className="block text-body mt-0.5 truncate" style={{ color: 'var(--theme-text-primary)' }}>{item.content}</span>
          <span className="block text-caption mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{formatTime(item.lastMessageAt ?? item.createdAt, locale)}</span>
        </span>
        {item.userUnread > 0 && (
          <span className="shrink-0 mt-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: STATUS.danger, minWidth: 18, height: 18, padding: '0 5px' }}>
            {item.userUnread}
          </span>
        )}
      </button>
    </li>
  );
}

// ─── Thread ─────────────────────────────────────────────────────────────────

function ThreadView({ id, onBack, onClose, locale }: { id: string; onBack: () => void; onClose: () => void; locale: string }) {
  const t = useTranslations('support');
  const { data: thread, isLoading } = useMyFeedbackThread(id, true);
  const send = useSendMyFeedbackMessage(id);

  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imgError, setImgError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // The original report is message #0; follow-ups come from the messages array.
  const bubbles = useMemo(() => {
    if (!thread) return [];
    const head = {
      id: `head-${thread.id}`,
      senderRole: 'user' as const,
      content: thread.content,
      imageUrls: thread.imageUrls,
      createdAt: thread.createdAt,
    };
    return [head, ...thread.messages];
  }, [thread]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [bubbles.length]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    setImgError('');
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) { setImgError(t('errors.tooManyImages', { max: MAX_IMAGES })); return; }
    for (const file of Array.from(files).slice(0, remaining)) {
      if (!file.type.startsWith('image/')) { setImgError(t('errors.notImage')); continue; }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) { setImgError(t('errors.tooLarge', { max: MAX_SIZE_MB })); continue; }
      try {
        setImages((prev) => [...prev, '']); // placeholder slot keeps order stable
        const uri = await compressImage(file);
        setImages((prev) => { const copy = [...prev]; const slot = copy.indexOf(''); if (slot !== -1) copy[slot] = uri; return copy; });
      } catch {
        setImages((prev) => { const copy = [...prev]; const slot = copy.indexOf(''); if (slot !== -1) copy.splice(slot, 1); return copy; });
        setImgError(t('errors.processFailed'));
      }
    }
  }, [images.length, t]);

  const canSend = (text.trim().length > 0 || images.some(Boolean)) && !send.isPending;

  const submit = () => {
    if (!canSend) return;
    send.mutate(
      { content: text.trim(), imageUrls: images.filter(Boolean) },
      { onSuccess: () => { setText(''); setImages([]); setImgError(''); } },
    );
  };

  const typeMeta = thread ? TYPE_META[thread.type] : TYPE_META.other;

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-3 border-b shrink-0" style={{ borderColor: 'var(--theme-border)' }}>
        <button onClick={onBack} aria-label={t('back')} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-(--theme-bg-secondary)" style={{ color: 'var(--theme-text-muted)' }}>
          <IconChevronLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-body truncate" style={{ color: typeMeta.color }}>{thread ? t(`typeLabel.${thread.type}`) : t('title')}</p>
          {thread && <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t(`statusLabel.${thread.status}`)}</p>}
        </div>
        <button onClick={onClose} aria-label={t('close')} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-(--theme-bg-secondary)" style={{ color: 'var(--theme-text-muted)' }}>
          <IconX size={16} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
        {isLoading && !thread ? (
          <p className="text-center py-10 text-body" style={{ color: 'var(--theme-text-muted)' }}>{t('loading')}</p>
        ) : (
          bubbles.map((m) => <MessageBubble key={m.id} mine={m.senderRole === 'user'} content={m.content} imageUrls={m.imageUrls} createdAt={m.createdAt} locale={locale} label={m.senderRole === 'user' ? t('you') : t('team')} />)
        )}
      </div>

      {/* Composer */}
      <div className="p-3 border-t shrink-0" style={{ borderColor: 'var(--theme-border)' }}>
        {images.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {images.map((src, i) => (
              <div key={i} className="relative" style={{ width: 52, height: 52 }}>
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" className="w-full h-full object-cover rounded-lg border" style={{ borderColor: 'var(--theme-border)' }} />
                ) : (
                  <div className="w-full h-full rounded-lg border flex items-center justify-center" style={{ borderColor: 'var(--theme-border)' }}><IconLoader size={14} className="animate-spin" /></div>
                )}
                <button onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ background: STATUS.danger }}>
                  <IconX size={9} />
                </button>
              </div>
            ))}
          </div>
        )}
        {imgError && <p className="text-caption mb-1" style={{ color: STATUS.danger }}>{imgError}</p>}
        <div className="flex items-end gap-2">
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
          <button onClick={() => fileRef.current?.click()} aria-label={t('addImage')} className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-(--theme-bg-secondary)" style={{ color: 'var(--theme-text-muted)' }}>
            <IconCamera size={17} />
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
            rows={1}
            placeholder={t('placeholder')}
            className="flex-1 rounded-xl border px-3 py-2 text-body resize-none focus:outline-none focus:ring-2"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)', maxHeight: 96, '--tw-ring-color': ACCENT.writing } as React.CSSProperties}
          />
          <button
            onClick={submit}
            disabled={!canSend}
            aria-label={t('send')}
            className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-white transition-all"
            style={{ background: canSend ? GRADIENT.writing : 'var(--theme-bg-secondary)', color: canSend ? 'white' : 'var(--theme-text-muted)', cursor: canSend ? 'pointer' : 'not-allowed' }}
          >
            {send.isPending ? <IconLoader size={16} className="animate-spin" /> : <IconSend size={16} />}
          </button>
        </div>
      </div>
    </>
  );
}

function MessageBubble({ mine, content, imageUrls, createdAt, locale, label }: { mine: boolean; content: string; imageUrls: string[]; createdAt: string; locale: string; label: string }) {
  return (
    <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      <span className="text-caption mb-0.5 px-1" style={{ color: 'var(--theme-text-muted)' }}>{label} · {formatTime(createdAt, locale)}</span>
      <div
        className="max-w-[80%] rounded-2xl px-3.5 py-2 text-body whitespace-pre-wrap wrap-break-word"
        style={mine
          ? { background: GRADIENT.writing, color: 'white', borderBottomRightRadius: 6 }
          : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)', borderBottomLeftRadius: 6 }}
      >
        {content && <p className="m-0">{content}</p>}
        {imageUrls.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-1.5">
            {imageUrls.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="rounded-lg" style={{ width: 96, height: 72, objectFit: 'cover' }} />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function PanelHeader({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b shrink-0" style={{ borderColor: 'var(--theme-border)', background: GRADIENT.writing }}>
      <div className="min-w-0">
        <p className="font-bold text-body text-white truncate">{title}</p>
        <p className="text-caption text-white/80 truncate">{subtitle}</p>
      </div>
      <button onClick={onClose} aria-label="close" className="w-7 h-7 rounded-lg flex items-center justify-center text-white/90 transition-colors hover:bg-white/15">
        <IconX size={15} />
      </button>
    </div>
  );
}

function formatTime(iso: string, locale: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return 'now';
  const sameDay = new Date().toDateString() === d.toDateString();
  return sameDay
    ? d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}
