'use client';

import { useEffect, useCallback, useRef, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useDictionaryPopupStore } from '@/stores/dictionaryPopupStore';
import { DictionaryPopup } from '@/components/dictionary-popup/DictionaryPopup';

// ── Danh sách path KHÔNG hiện popup ──
const EXCLUDED_PATHS = ['/dictionary', '/word-bank'];

// ── Kiểm tra text có phải tiếng Đức không ──
const GERMAN_WORD_REGEX = /^[a-zA-ZäöüÄÖÜß]+$/;

// ── Danh sách tag HTML không nên trigger popup ──
const EXCLUDED_TAGS = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'];

// ── Class nên exclude ──
const EXCLUDED_CLASSES = ['dictionary-popup', 'no-dictionary'];

function isExcludedElement(element: HTMLElement | null): boolean {
  if (!element) return false;

  // Check tag
  if (EXCLUDED_TAGS.includes(element.tagName)) return true;

  // Check editable
  if (element.isContentEditable) return true;
  if (element.getAttribute('role') === 'textbox') return true;

  // Check classes (element + parents up to 4 levels)
  let current: HTMLElement | null = element;
  let depth = 0;
  while (current && depth < 5) {
    for (const cls of EXCLUDED_CLASSES) {
      if (current.classList?.contains(cls)) return true;
    }
    current = current.parentElement;
    depth++;
  }

  return false;
}

function cleanWord(text: string): string {
  return text
    .trim()
    .replace(/^[.,;:!?"""''()\[\]{}–—\/]+/, '')
    .replace(/[.,;:!?"""''()\[\]{}–—\/]+$/, '')
    .trim();
}

/**
 * Lấy từ tại vị trí click bằng caretRangeFromPoint.
 * Browser tự tìm vị trí caret gần nhất trong text node,
 * sau đó expand sang trái/phải để lấy nguyên từ.
 */
function getWordAtPoint(x: number, y: number): string | null {
  // caretRangeFromPoint: Chrome, Safari, Edge
  // caretPositionFromPoint: Firefox
  let range: Range | null = null;

  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y);
  } else if ((document as any).caretPositionFromPoint) {
    const pos = (document as any).caretPositionFromPoint(x, y);
    if (pos && pos.offsetNode) {
      range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.setEnd(pos.offsetNode, pos.offset);
    }
  }

  if (!range) return null;

  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) return null;

  const textContent = node.textContent || '';
  const offset = range.startOffset;

  // Tìm boundary của từ (word boundary = khoảng trắng hoặc dấu câu)
  const wordChars = /[a-zA-ZäöüÄÖÜßàáâãèéêìíîòóôùúûýđ]/;

  let start = offset;
  let end = offset;

  // Expand trái
  while (start > 0 && wordChars.test(textContent[start - 1])) {
    start--;
  }

  // Expand phải
  while (end < textContent.length && wordChars.test(textContent[end])) {
    end++;
  }

  if (start === end) return null;

  const word = textContent.slice(start, end);
  return word.length >= 2 ? word : null;
}

interface DictionaryProviderProps {
  children: ReactNode;
}

export function DictionaryProvider({ children }: DictionaryProviderProps) {
  const pathname = usePathname();
  const { openPopup, closePopup, isOpen } = useDictionaryPopupStore();
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ BẬT/TẮT debug mode — xem console log trong DevTools (F12)
  const DEBUG = process.env.NODE_ENV === 'development';

  // ── Check path có bị exclude không ──
  const isExcludedPath = EXCLUDED_PATHS.some((p) => pathname.startsWith(p));

  // ── Đóng popup khi chuyển trang ──
  useEffect(() => {
    closePopup();
  }, [pathname, closePopup]);

  // ══════════════════════════════════════════
  // SINGLE CLICK — detect từ tại vị trí click
  // ══════════════════════════════════════════
  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (isExcludedPath) return;

      const target = e.target as HTMLElement;

      // Không trigger nếu click vào popup
      if (target.closest('.dictionary-popup')) return;

      // Không trigger trên element bị exclude
      if (isExcludedElement(target)) {
        if (DEBUG) console.log('[DictPopup] Click excluded — element:', target.tagName, target.className);
        return;
      }

      // Dùng delay nhỏ để phân biệt single-click vs double-click
      // Nếu double-click xảy ra, clearTimeout để tránh trigger cả 2
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }

      clickTimerRef.current = setTimeout(() => {
        // Nếu user đang select text (drag), bỏ qua — để handleMouseUp xử lý
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) return;

        // Detect từ tại vị trí click
        const word = getWordAtPoint(e.clientX, e.clientY);
        if (DEBUG) console.log('[DictPopup] Click detected → word at point:', word);
        if (!word) return;

        const cleaned = cleanWord(word);
        if (!cleaned || cleaned.length < 2 || cleaned.length > 40) {
          if (DEBUG) console.log('[DictPopup] Rejected — cleaned:', cleaned);
          return;
        }

        // Validate tiếng Đức
        if (!GERMAN_WORD_REGEX.test(cleaned)) {
          if (DEBUG) console.log('[DictPopup] Rejected — not German:', cleaned);
          return;
        }

        if (DEBUG) console.log('[DictPopup] ✅ Opening popup for:', cleaned);
        openPopup(cleaned, { x: e.clientX, y: e.clientY });
      }, 200); // 200ms delay — nếu double-click xảy ra trong 200ms thì cancel
    },
    [isExcludedPath, openPopup]
  );

  // ══════════════════════════════════════════
  // DOUBLE CLICK — select nguyên từ nhanh
  // ══════════════════════════════════════════
  const handleDoubleClick = useCallback(
    (e: MouseEvent) => {
      if (isExcludedPath) return;

      // Cancel single-click timer
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }

      const target = e.target as HTMLElement;
      if (target.closest('.dictionary-popup')) return;
      if (isExcludedElement(target)) return;

      // Double-click tự động select 1 từ
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const word = cleanWord(selection.toString());
      if (!word || word.length < 2 || word.length > 40) return;
      if (!GERMAN_WORD_REGEX.test(word)) return;

      openPopup(word, { x: e.clientX, y: e.clientY });
    },
    [isExcludedPath, openPopup]
  );

  // ══════════════════════════════════════════
  // MOUSE UP — sau khi select (kéo) text
  // ══════════════════════════════════════════
  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (isExcludedPath) return;

      const target = e.target as HTMLElement;
      if (target.closest('.dictionary-popup')) return;
      if (isExcludedElement(target)) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const rawText = selection.toString().trim();
      if (!rawText) return;

      // Chỉ lấy 1-3 từ
      const words = rawText.split(/\s+/);
      if (words.length > 3) return;

      const word = cleanWord(rawText);
      if (!word || word.length < 2 || word.length > 40) return;

      const isGermanLike = word.split(/\s+/).every((w) => GERMAN_WORD_REGEX.test(w));
      if (!isGermanLike) return;

      openPopup(word, { x: e.clientX, y: e.clientY });
    },
    [isExcludedPath, openPopup]
  );

  // ── Register global event listeners ──
  useEffect(() => {
    if (isExcludedPath) return;

    document.addEventListener('click', handleClick);
    document.addEventListener('dblclick', handleDoubleClick);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('dblclick', handleDoubleClick);
      document.removeEventListener('mouseup', handleMouseUp);
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, [handleClick, handleDoubleClick, handleMouseUp, isExcludedPath]);

  return (
    <>
      {children}
      {!isExcludedPath && <DictionaryPopup />}
    </>
  );
}