'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { IconSearch } from '@/components/ui/Icons';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { type TranslateLang } from '@/lib/api/translation';
import { NAV_FLAT, type NavItem } from '@/config/navigation';
import { ACCENT } from '@/lib/tokens';
import { speakGerman } from '@/lib/utils';

/**
 * Global command palette — Cmd/Ctrl+K triggered. Three modes based on input:
 *  1. Translate: when input is a phrase (2+ words), show VI↔DE translation
 *  2. Navigation: fuzzy-match NAV_FLAT items
 *  3. Search: default action — search dictionary (/words?search=...)
 *
 * Mounted once in MainLayout. Kept hidden by default; visible when open=true.
 */

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

function navMatches(
  nav: NavItem[],
  query: string,
  resolveLabel: (item: NavItem) => string,
): NavItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return nav
    .filter(item => resolveLabel(item).toLowerCase().includes(q) || item.href.toLowerCase().includes(q))
    .slice(0, 6);
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const tNav = useTranslations('nav');
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [langOverride, setLangOverride] = useState<TranslateLang | undefined>(undefined);
  const [activeIndex, setActiveIndex] = useState(0);

  const {
    data: translated,
    isLoading: isTranslating,
    isPhrase,
    from: tlFrom,
    to: tlTo,
  } = useAutoTranslate(query, langOverride);

  const handleClose = useCallback(() => {
    setQuery('');
    setLangOverride(undefined);
    setActiveIndex(0);
    onClose();
  }, [onClose]);

  const navResults = useMemo(
    () => navMatches(NAV_FLAT, query, (item) => tNav(item.labelKey)),
    [query, tNav],
  );

  // Flat actions list for keyboard navigation
  const actions = useMemo(() => {
    const list: Array<{ key: string; run: () => void }> = [];
    if (query.trim()) {
      list.push({
        key: 'search',
        run: () => {
          router.push(`/words?search=${encodeURIComponent(query.trim())}`);
          handleClose();
        },
      });
    }
    navResults.forEach(item => {
      list.push({
        key: `nav:${item.key}`,
        run: () => {
          router.push(item.href);
          handleClose();
        },
      });
    });
    return list;
  }, [query, navResults, router, handleClose]);

  // Focus input on open. Reset handled below via explicit reset on close (avoids setState-in-effect).
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  // Reset query/lang whenever palette closes — triggered via the explicit close path.
  // We derive bounded index from state + actions.length instead of clamping via effect.
  const boundedIndex = Math.min(activeIndex, Math.max(0, actions.length - 1));

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
      return;
    }
    if (!actions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % actions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i - 1 + actions.length) % actions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      actions[boundedIndex]?.run();
    }
  }, [actions, boundedIndex, handleClose]);

  const copyTranslation = useCallback(() => {
    if (translated) navigator.clipboard.writeText(translated);
  }, [translated]);

  const speakTranslation = useCallback(() => {
    if (!translated) return;
    if (tlTo === 'de') {
      speakGerman(translated);
      return;
    }
    // Vietnamese stays on Web Speech API — backend TTS only handles German.
    const utter = new SpeechSynthesisUtterance(translated);
    utter.lang = 'vi-VN';
    speechSynthesis.speak(utter);
  }, [translated, tlTo]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center pt-[15vh]"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      />

      {/* Panel */}
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl mx-4 rounded-lg border shadow-lifted overflow-hidden"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--theme-border)' }}>
          <IconSearch size={18} style={{ color: 'var(--theme-text-muted)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setLangOverride(undefined); setActiveIndex(0); }}
            placeholder="Tìm trang, từ vựng, hoặc dịch câu..."
            className="flex-1 bg-transparent text-lead focus:outline-none"
            style={{ color: 'var(--theme-text-primary)' }}
            autoComplete="off"
          />
          <kbd
            className="shrink-0 rounded-sm px-1.5 py-0.5 text-caption font-semibold"
            style={{
              background: 'var(--theme-bg-secondary)',
              color: 'var(--theme-text-muted)',
              border: '1px solid var(--theme-border)',
            }}
          >
            Esc
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {/* Translate panel — shows when phrase detected */}
          {isPhrase && (
            <div className="p-4 border-b" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-secondary)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-caption font-semibold flex items-center gap-1.5" style={{ color: 'var(--theme-text-muted)' }}>
                  {tlFrom === 'vi' ? '🇻🇳 VI' : '🇩🇪 DE'}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  {tlTo === 'de' ? '🇩🇪 DE' : '🇻🇳 VI'}
                </span>
                <button
                  onClick={() => setLangOverride(prev => (prev ?? tlFrom) === 'vi' ? 'de' : 'vi')}
                  className="text-caption font-bold rounded-sm px-2 py-0.5"
                  style={{ background: `${ACCENT.brand}1A`, color: ACCENT.brand }}
                >
                  ⇄ Đổi chiều
                </button>
              </div>

              {isTranslating ? (
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ACCENT.brand} strokeWidth="2" strokeLinecap="round" className="animate-spin" aria-hidden>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  <span className="text-body" style={{ color: 'var(--theme-text-muted)' }}>Đang dịch...</span>
                </div>
              ) : translated ? (
                <div>
                  <p className="text-lead font-semibold leading-snug mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                    {translated}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={copyTranslation}
                      className="flex items-center gap-1 px-2 py-1 rounded-sm text-caption font-semibold border"
                      style={{
                        borderColor: 'var(--theme-border)',
                        background: 'var(--theme-bg-card)',
                        color: 'var(--theme-text-secondary)',
                      }}
                    >
                      Copy
                    </button>
                    <button
                      onClick={speakTranslation}
                      className="flex items-center gap-1 px-2 py-1 rounded-sm text-caption font-semibold border"
                      style={{
                        borderColor: 'var(--theme-border)',
                        background: 'var(--theme-bg-card)',
                        color: 'var(--theme-text-secondary)',
                      }}
                    >
                      Phát âm
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-caption" style={{ color: 'var(--color-status-danger, #EF4444)' }}>
                  Không dịch được. Thử lại sau.
                </p>
              )}
            </div>
          )}

          {/* Navigation results */}
          {navResults.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1 text-caption font-semibold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>
                Điều hướng
              </div>
              {navResults.map((item, idx) => {
                const actionIdx = query.trim() ? idx + 1 : idx;
                const active = boundedIndex === actionIdx;
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onMouseEnter={() => setActiveIndex(actionIdx)}
                    onClick={() => { router.push(item.href); handleClose(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
                    style={{
                      backgroundColor: active ? 'var(--theme-bg-secondary)' : 'transparent',
                      color: 'var(--theme-text-primary)',
                    }}
                  >
                    <Icon size={18} />
                    <span className="flex-1 text-body font-medium">{tNav(item.labelKey)}</span>
                    <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{item.href}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Default: search in dictionary action (always first when query present) */}
          {query.trim() && (
            <button
              onMouseEnter={() => setActiveIndex(0)}
              onClick={() => { router.push(`/words?search=${encodeURIComponent(query.trim())}`); handleClose(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left border-t"
              style={{
                backgroundColor: boundedIndex === 0 ? 'var(--theme-bg-secondary)' : 'transparent',
                color: 'var(--theme-text-primary)',
                borderColor: 'var(--theme-border)',
              }}
            >
              <IconSearch size={18} />
              <span className="flex-1 text-body font-medium">
                Tìm &ldquo;{query.trim()}&rdquo; trong từ điển
              </span>
              <kbd
                className="rounded-sm px-1.5 py-0.5 text-caption font-semibold"
                style={{
                  background: 'var(--theme-bg-secondary)',
                  color: 'var(--theme-text-muted)',
                  border: '1px solid var(--theme-border)',
                }}
              >
                ↵
              </kbd>
            </button>
          )}

          {/* Empty hint */}
          {!query.trim() && (
            <div className="px-4 py-8 text-center">
              <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
                Gõ để tìm trang, từ vựng, hoặc nhập câu để dịch VI↔DE
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                <kbd className="rounded-sm px-1.5 py-0.5 font-semibold" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>↑↓</kbd>
                <span>di chuyển</span>
                <kbd className="rounded-sm px-1.5 py-0.5 font-semibold ml-2" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>↵</kbd>
                <span>chọn</span>
                <kbd className="rounded-sm px-1.5 py-0.5 font-semibold ml-2" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>Esc</kbd>
                <span>đóng</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook that wires Cmd/Ctrl+K to open the palette. Returns [open, setOpen].
 * MainLayout uses this to mount a single global palette instance.
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { open, setOpen };
}
