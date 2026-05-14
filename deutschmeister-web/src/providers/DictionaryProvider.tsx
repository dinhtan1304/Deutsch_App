'use client';

import { useEffect, useCallback, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useDictionaryPopupStore } from '@/stores/dictionaryPopupStore';

const DictionaryPopup = dynamic(
  () => import('@/components/dictionary-popup/DictionaryPopup').then((mod) => mod.DictionaryPopup),
  { ssr: false },
);

const EXCLUDED_PATHS = ['/dictionary', '/word-bank'];

export function DictionaryProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { closePopup } = useDictionaryPopupStore();
  const isExcludedPath = EXCLUDED_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => { closePopup(); }, [pathname, closePopup]);

  /**
   * Opt-in scope: popup chỉ mở khi user click vào một phần tử `.wh-word`
   * (do HighlightedText tạo ra cho từ có trong levelIndex).
   *
   * Click ngoài .wh-word → đóng popup nếu đang mở.
   * Click vào chính popup → bỏ qua để popup's internal handlers xử lý.
   */
  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (isExcludedPath) return;

      const target = e.target as HTMLElement;
      const { isOpen, selectedWord, openPopup, closePopup: close } =
        useDictionaryPopupStore.getState();

      // Click bên trong popup → để popup tự xử lý (close btn, add-to-word-bank, etc.)
      if (target.closest('.dictionary-popup')) return;

      const wordEl = target.closest('.wh-word') as HTMLElement | null;

      // Click ngoài từ đã highlight → đóng popup nếu đang mở
      if (!wordEl) {
        if (isOpen) close();
        return;
      }

      const word = wordEl.textContent?.trim();
      if (!word) return;

      // Toggle: click cùng từ đang mở → đóng
      if (isOpen && selectedWord?.toLowerCase() === word.toLowerCase()) {
        close();
        return;
      }

      openPopup(word, { x: e.clientX, y: e.clientY });
    },
    [isExcludedPath],
  );

  useEffect(() => {
    if (isExcludedPath) return;

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [handleClick, isExcludedPath]);

  return (
    <>
      {children}
      {!isExcludedPath && <DictionaryPopup />}
    </>
  );
}
