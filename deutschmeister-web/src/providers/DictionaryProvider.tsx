'use client';

import { useEffect, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useDictionaryPopupStore } from '@/stores/dictionaryPopupStore';
import { DictionaryPopup } from '@/components/dictionary-popup/DictionaryPopup';

const EXCLUDED_PATHS = ['/dictionary', '/word-bank'];

// German-only: allow Umlauts and ß, nothing else
const GERMAN_WORD_REGEX = /^[a-zA-ZäöüÄÖÜß]+$/;

const EXCLUDED_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A', 'HEADER', 'ASIDE', 'NAV']);
const EXCLUDED_CLASSES = ['dictionary-popup', 'no-dictionary'];

function isExcludedElement(element: HTMLElement | null): boolean {
  if (!element) return false;

  // Walk up DOM tree — check both tags AND classes at every ancestor level
  let current: HTMLElement | null = element;
  for (let depth = 0; current && depth < 8; depth++, current = current.parentElement) {
    if (EXCLUDED_TAGS.has(current.tagName)) return true;
    if (current.isContentEditable) return true;
    if (current.getAttribute('role') === 'textbox') return true;
    for (const cls of EXCLUDED_CLASSES) {
      if (current.classList?.contains(cls)) return true;
    }
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
 * Lấy từ tại vị trí click bằng caretRangeFromPoint / caretPositionFromPoint.
 * Hỗ trợ Chrome/Safari/Edge (caretRangeFromPoint) và Firefox (caretPositionFromPoint).
 */
function getWordAtPoint(x: number, y: number): string | null {
  let range: Range | null = null;

  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y);
  } else if ((document as any).caretPositionFromPoint) {
    const pos = (document as any).caretPositionFromPoint(x, y);
    if (pos?.offsetNode?.nodeType === Node.TEXT_NODE) {
      // BUG FIX (Firefox): offsetNode có thể là Element (không phải Text).
      // Chỉ tạo range nếu là text node.
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
  const wordChars = /[a-zA-ZäöüÄÖÜß]/;

  let start = offset;
  let end = offset;
  while (start > 0 && wordChars.test(textContent[start - 1])) start--;
  while (end < textContent.length && wordChars.test(textContent[end])) end++;

  if (start === end) return null;
  const word = textContent.slice(start, end);
  return word.length >= 2 ? word : null;
}

export function DictionaryProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { closePopup } = useDictionaryPopupStore();
  const isExcludedPath = EXCLUDED_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => { closePopup(); }, [pathname, closePopup]);

  /**
   * Xử lý TOÀN BỘ click logic ở đây — bao gồm cả đóng popup khi click ngoài.
   *
   * BUG #4 FIX: Race condition mousedown vs click.
   * Trước đây, DictionaryPopup.handleClickOutside dùng mousedown để đóng popup.
   * DictionaryProvider.handleClick dùng click để mở/toggle popup.
   * Khi user click cùng một từ trong lúc popup đang mở:
   *   1. mousedown → handleClickOutside → closePopup() → isOpen=false
   *   2. click → handleClick → toggle check: isOpen=false → skip toggle → openPopup() lại
   *   Kết quả: popup bị mở lại thay vì đóng lại (nhấp nháy).
   *
   * Fix: Dời tất cả logic đóng vào handler này. DictionaryPopup chỉ còn xử lý Escape.
   * Một event (click), một nơi xử lý → không còn race condition.
   */
  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (isExcludedPath) return;

      const target = e.target as HTMLElement;
      const { isOpen, selectedWord, openPopup, closePopup: close } =
        useDictionaryPopupStore.getState();

      // Click bên trong popup → để popup's own handler xử lý (close btn, word bank btn, etc.)
      if (target.closest('.dictionary-popup')) return;

      // Click vào input, button, link → không trigger
      if (isExcludedElement(target)) {
        if (isOpen) close();
        return;
      }

      // Đang có text được select (user đang copy) → bỏ qua
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) return;

      // Detect từ tại vị trí click
      const rawWord = getWordAtPoint(e.clientX, e.clientY);

      // Click vào khoảng trắng / không có từ → đóng popup nếu đang mở
      if (!rawWord) {
        if (isOpen) close();
        return;
      }

      const cleaned = cleanWord(rawWord);
      if (!cleaned || cleaned.length < 2 || cleaned.length > 40 || !GERMAN_WORD_REGEX.test(cleaned)) {
        if (isOpen) close();
        return;
      }

      // Toggle: click cùng từ → đóng popup
      if (isOpen && selectedWord?.toLowerCase() === cleaned.toLowerCase()) {
        close();
        return;
      }

      // Click từ mới (popup đang mở hoặc đóng) → mở popup cho từ mới
      openPopup(cleaned, { x: e.clientX, y: e.clientY });
    },
    [isExcludedPath] // stable ref — không re-register khi popup state thay đổi
  );

  /**
   * MouseUp: xử lý cả drag-select lẫn double-click.
   * - Drag select (kéo chuột bôi đen): mousedown → mousemove → mouseup (không có click)
   * - Double-click: mouseup lần 2 → browser đã tự select từ → detection từ selection
   * - Single click: mouseup nhưng selection collapsed → bỏ qua (handleClick lo)
   */
  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (isExcludedPath) return;

      const target = e.target as HTMLElement;
      if (target.closest('.dictionary-popup')) return;
      if (isExcludedElement(target)) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const word = cleanWord(selection.toString());
      if (!word || word.length < 2 || word.length > 40 || !GERMAN_WORD_REGEX.test(word)) return;

      useDictionaryPopupStore.getState().openPopup(word, { x: e.clientX, y: e.clientY });
    },
    [isExcludedPath]
  );

  useEffect(() => {
    if (isExcludedPath) return;

    document.addEventListener('click', handleClick);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleClick, handleMouseUp, isExcludedPath]);

  return (
    <>
      {children}
      {!isExcludedPath && <DictionaryPopup />}
    </>
  );
}