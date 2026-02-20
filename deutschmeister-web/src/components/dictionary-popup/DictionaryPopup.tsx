'use client';

import { useEffect, useRef, useState } from 'react';
import { useDictionaryPopupStore } from '@/stores/dictionaryPopupStore';
import { PopupContent } from './PopupContent';

export function DictionaryPopup() {
  const { isOpen, selectedWord, position, closePopup } = useDictionaryPopupStore();
  const popupRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState<{ x: number; y: number } | null>(null);

  // ── Đóng khi Escape ──
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePopup();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closePopup]);

  // ── Tính toán vị trí (tránh tràn viewport) ──
  useEffect(() => {
    if (!isOpen || !position || !popupRef.current) {
      setAdjustedPos(null);
      return;
    }

    // BUG FIX 3: Use fixed positioning (viewport-relative).
    // Previous 'absolute' + scrollY calculation broke on pages where a parent
    // element had position:relative — popup appeared far from the click point.
    // With position:fixed, clientX/clientY from the click event map 1-to-1
    // and no scrollY offset is needed.
    const popup = popupRef.current;
    const rect = popup.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let x = position.x;
    let y = position.y + 12;

    if (x + rect.width > viewportW - 16) x = viewportW - rect.width - 16;
    if (x < 16) x = 16;
    if (y + rect.height > viewportH - 16) {
      y = position.y - rect.height - 12;
    }
    if (y < 16) y = 16;

    setAdjustedPos({ x, y });
  }, [isOpen, position]);

  if (!isOpen || !selectedWord || !position) return null;

  return (
    <>
      <div
        ref={popupRef}
        role="dialog"
        aria-label="Tra cứu từ điển"
        className="dictionary-popup"
        style={{
          position: 'fixed',
          top: adjustedPos?.y ?? position.y + 12,
          left: adjustedPos?.x ?? position.x,
          zIndex: 9999,
          width: '320px',
          borderRadius: '14px',
          overflow: 'hidden',
          animation: 'dictPopupIn 0.18s ease-out',
        }}
      >
        {/* Close button */}
        <button
          onClick={closePopup}
          aria-label="Đóng"
          className="dict-popup-close"
        >
          ✕
        </button>

        <PopupContent word={selectedWord} />
      </div>

      <style jsx global>{`
        .dictionary-popup {
          background: #1E293B;
          border: 1px solid rgba(148, 163, 184, 0.15);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(148, 163, 184, 0.05);
        }

        /* Light mode override */
        html:not(.dark) .dictionary-popup,
        html[data-theme="light"] .dictionary-popup {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04);
        }

        .dict-popup-close {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(148, 163, 184, 0.1);
          border: none;
          border-radius: 6px;
          cursor: pointer;
          color: #94A3B8;
          font-size: 12px;
          line-height: 1;
          z-index: 1;
          transition: all 0.15s;
        }

        .dict-popup-close:hover {
          background: rgba(148, 163, 184, 0.2);
          color: #CBD5E1;
        }

        @keyframes dictPopupIn {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}