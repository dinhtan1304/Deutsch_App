'use client';

import { useGrammarAnalyzerStore } from '@/stores/grammarAnalyzerStore';
import { useGrammarAnalyze } from '@/hooks/useGrammarAnalyze';

/**
 * Nút nổi "🔍 Phân tích ngữ pháp" hiện khi user bôi đen câu tiếng Đức.
 * Tự động định vị ngay dưới vùng text được chọn.
 */
export function FloatingAnalyzeButton() {
  const { showButton, buttonPosition, selectedSentence } = useGrammarAnalyzerStore();
  const { analyze } = useGrammarAnalyze();

  if (!showButton || !buttonPosition) return null;

  // Tính vị trí (tránh tràn viewport)
  const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
  let x = buttonPosition.x;
  let y = buttonPosition.y + scrollY + 8;

  if (typeof window !== 'undefined') {
    if (x + 200 > window.innerWidth) x = window.innerWidth - 216;
    if (x < 16) x = 16;
  }

  return (
    <>
      <button
        onClick={analyze}
        className="grammar-float-btn"
        style={{
          position: 'absolute',
          top: y,
          left: x,
          zIndex: 9998,
        }}
        title={`Phân tích: "${selectedSentence.slice(0, 40)}${selectedSentence.length > 40 ? '...' : ''}"`}
      >
        <span style={{ fontSize: '14px' }}>🔍</span>
        <span>Phân tích ngữ pháp</span>
      </button>

      <style jsx global>{`
        .grammar-float-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          animation: grammarBtnIn 0.15s ease-out;
          background: linear-gradient(135deg, #6366F1, #4F46E5);
          color: #fff;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35), 0 0 0 1px rgba(255,255,255,0.1);
          transition: transform 0.1s, box-shadow 0.1s;
        }
        .grammar-float-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45), 0 0 0 1px rgba(255,255,255,0.15);
        }
        .grammar-float-btn:active {
          transform: scale(0.97);
        }
        @keyframes grammarBtnIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
