'use client';

import { useEffect, useCallback, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useGrammarAnalyzerStore } from '@/stores/grammarAnalyzerStore';

const FloatingAnalyzeButton = dynamic(
  () => import('@/components/grammar-analyzer/FloatingAnalyzeButton').then((mod) => mod.FloatingAnalyzeButton),
  { ssr: false },
);
const GrammarAnalysisPopup = dynamic(
  () => import('@/components/grammar-analyzer/GrammarAnalysisPopup').then((mod) => mod.GrammarAnalysisPopup),
  { ssr: false },
);

/**
 * Minimum số từ để hiện nút phân tích ngữ pháp.
 * 1-2 từ → Dictionary Popup (đã có)
 * 3+ từ → Grammar Analyzer
 */
const MIN_WORDS_FOR_GRAMMAR = 3;

/** Pages không cần Grammar Analyzer */
const EXCLUDED_PATHS = ['/auth/', '/settings'];

function isExcluded(): boolean {
  if (typeof window === 'undefined') return false;
  return EXCLUDED_PATHS.some((p) => window.location.pathname.startsWith(p));
}

/** Đếm số từ (đơn giản, tách bằng khoảng trắng) */
function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Kiểm tra text có chứa ký tự tiếng Đức (Latin + umlaut) */
function looksLikeGerman(text: string): boolean {
  return /[a-zA-ZäöüÄÖÜß]{2,}/.test(text);
}

export function GrammarAnalyzerProvider({ children }: { children: ReactNode }) {
  const { showAnalyzeButton, hideButton, closePopup } =
    useGrammarAnalyzerStore();

  const handleSelectionChange = useCallback(() => {
    if (isExcluded()) return;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      // Không ẩn button ngay — cho user thời gian click
      return;
    }

    const text = sel.toString().trim();

    // Chỉ hiện cho 3+ từ, trông giống tiếng Đức
    if (wordCount(text) < MIN_WORDS_FOR_GRAMMAR || !looksLikeGerman(text)) {
      return;
    }

    // Kiểm tra: không phải đang chọn trong input/textarea
    const anchorNode = sel.anchorNode;
    if (anchorNode) {
      const el = anchorNode.nodeType === Node.ELEMENT_NODE
        ? (anchorNode as Element)
        : anchorNode.parentElement;
      if (el && (el.closest('input') || el.closest('textarea') || el.closest('[contenteditable]'))) {
        return;
      }
    }

    // Lấy vị trí selection
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    showAnalyzeButton(text, {
      x: rect.left + rect.width / 2 - 90, // Center button
      y: rect.bottom,
    });
  }, [showAnalyzeButton]);

  // Ẩn button khi click vào nơi khác (nhưng không ẩn nếu click button chính)
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Không ẩn nếu click vào button phân tích hoặc popup
      if (
        target.closest('.grammar-float-btn') ||
        target.closest('.grammar-popup')
      ) {
        return;
      }

      // Ẩn button nếu đang hiện
      const { showButton } = useGrammarAnalyzerStore.getState();
      if (showButton) {
        hideButton();
      }
    },
    [hideButton]
  );

  useEffect(() => {
    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [handleSelectionChange, handleMouseDown]);

  // Đóng popup khi chuyển trang
  useEffect(() => {
    return () => {
      closePopup();
    };
  }, [closePopup]);

  return (
    <>
      {children}
      <FloatingAnalyzeButton />
      <GrammarAnalysisPopup />
    </>
  );
}
