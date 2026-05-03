'use client';
/* eslint-disable no-restricted-syntax */

import { useEffect, useRef } from 'react';
import { ACCENT, STATUS } from '@/lib/tokens';
import { useGrammarAnalyzerStore } from '@/stores/grammarAnalyzerStore';

/** Màu cho từng vai trò ngữ pháp */
const ROLE_COLORS = {
  subject: ACCENT.srs,
  verb: STATUS.danger,
  object: STATUS.success,
  adverb: ACCENT.xp,
  preposition: ACCENT.vocab,
  conjunction: ACCENT.listening,
  article: ACCENT.cyan,
  adjective: ACCENT.games,
  pronoun: ACCENT.teal,
  particle: '#6B7280',
  // default
  other: '#94A3B8',
};

function getRoleColor(role: string): string {
  const lower = role.toLowerCase();
  for (const [key, color] of Object.entries(ROLE_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return ROLE_COLORS.other;
}

export function GrammarAnalysisPopup() {
  const { showPopup, isAnalyzing, result, error, popupPosition, closePopup } =
    useGrammarAnalyzerStore();
  const popupRef = useRef<HTMLDivElement>(null);

  // Đóng khi click ngoài
  useEffect(() => {
    if (!showPopup) return;
    const handle = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        closePopup();
      }
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handle), 150);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handle); };
  }, [showPopup, closePopup]);

  // Đóng khi Escape
  useEffect(() => {
    if (!showPopup) return;
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') closePopup(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [showPopup, closePopup]);

  if (!showPopup) return null;

  // Tính vị trí
  const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
  let x = popupPosition?.x ?? 100;
  const y = (popupPosition?.y ?? 100) + scrollY + 8;
  if (typeof window !== 'undefined') {
    if (x + 400 > window.innerWidth) x = window.innerWidth - 416;
    if (x < 16) x = 16;
  }

  return (
    <>
      <div
        ref={popupRef}
        className="grammar-popup"
        style={{ position: 'absolute', top: y, left: x, zIndex: 9999 }}
      >
        {/* Close */}
        <button onClick={closePopup} className="grammar-popup-close">✕</button>

        {/* Loading */}
        {isAnalyzing && (
          <div className="gp-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div className="gp-spinner" />
            <p className="gp-muted" style={{ marginTop: '12px' }}>AI đang phân tích ngữ pháp...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="gp-body">
            <p style={{ color: STATUS.danger, fontSize: '14px' }}>{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="gp-body">

            {/* Header: Câu gốc */}
            <div className="gp-section">
              <div className="gp-primary" style={{ fontSize: '15px', fontWeight: 700, fontStyle: 'italic' }}>
                &quot;{result.sentence}&quot;
              </div>
              {result.hasErrors && result.correctedSentence !== result.sentence && (
                <div style={{ marginTop: '6px', fontSize: '13px' }}>
                  <span style={{ color: STATUS.success }}>✓</span>{' '}
                  <span className="gp-muted">Sửa: </span>
                  <span className="gp-primary" style={{ fontStyle: 'italic' }}>{result.correctedSentence}</span>
                </div>
              )}
            </div>

            {/* Tags: Thì + Loại câu */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <span className="gp-tag gp-tag-blue">{result.tense} — {result.tenseVi}</span>
              <span className="gp-tag gp-tag-purple">{result.sentenceType} — {result.sentenceTypeVi}</span>
            </div>

            {/* Components: Phân tích thành phần */}
            <div className="gp-section">
              <div className="gp-label">Cấu trúc câu</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {result.components.map((comp, i) => (
                  <span
                    key={i}
                    className="gp-comp-chip"
                    style={{ borderColor: getRoleColor(comp.role) }}
                    title={comp.noteVi}
                  >
                    <span style={{ color: getRoleColor(comp.role), fontWeight: 700 }}>
                      {comp.text}
                    </span>
                    <span className="gp-comp-role" style={{ backgroundColor: getRoleColor(comp.role) }}>
                      {comp.roleVi}
                      {comp.caseVi && ` · ${comp.caseVi}`}
                    </span>
                  </span>
                ))}
              </div>

              {/* Component notes */}
              <div className="gp-comp-notes">
                {result.components.filter(c => c.noteVi).map((comp, i) => (
                  <div key={i} className="gp-comp-note">
                    <span style={{ color: getRoleColor(comp.role), fontWeight: 600 }}>{comp.text}</span>
                    <span className="gp-muted"> — {comp.noteVi}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Giải thích tổng quan */}
            <div className="gp-section gp-explain-box">
              <div className="gp-label">🇻🇳 Giải thích</div>
              <p className="gp-primary" style={{ fontSize: '14px', lineHeight: 1.6 }}>
                {result.explanationVi}
              </p>
            </div>

            {/* Quy tắc ngữ pháp */}
            {result.grammarRules.length > 0 && (
              <div className="gp-section">
                <div className="gp-label">📐 Quy tắc</div>
                {result.grammarRules.map((rule, i) => (
                  <div key={i} className="gp-rule">
                    <span className="gp-primary" style={{ fontWeight: 600, fontSize: '13px' }}>
                      {rule.rule}
                    </span>
                    <span className="gp-muted" style={{ fontSize: '12px' }}> — {rule.ruleVi}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Mẹo */}
            {result.tipVi && (
              <div className="gp-tip">
                <span style={{ fontSize: '14px' }}>💡</span>
                <span className="gp-primary" style={{ fontSize: '13px' }}>{result.tipVi}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        .grammar-popup {
          width: 400px;
          max-height: 80vh;
          overflow-y: auto;
          border-radius: 16px;
          background: #1E293B;
          border: 1px solid rgba(148, 163, 184, 0.15);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(148, 163, 184, 0.05);
          animation: grammarPopupIn 0.2s ease-out;
        }
        html:not(.dark) .grammar-popup,
        html[data-theme="light"] .grammar-popup {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.12);
        }

        .grammar-popup-close {
          position: absolute; top: 10px; right: 10px; z-index: 1;
          width: 26px; height: 26px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(148, 163, 184, 0.1); border: none;
          border-radius: 8px; cursor: pointer;
          color: #94A3B8; font-size: 12px; transition: all 0.15s;
        }
        .grammar-popup-close:hover { background: rgba(148,163,184,0.2); color: #CBD5E1; }

        .gp-body { padding: 18px 20px; }
        .gp-section { margin-bottom: 14px; }

        .gp-primary { color: #F1F5F9; }
        .gp-muted { color: #94A3B8; font-size: 13px; }
        html:not(.dark) .gp-primary, html[data-theme="light"] .gp-primary { color: #1E293B; }
        html:not(.dark) .gp-muted, html[data-theme="light"] .gp-muted { color: #64748B; }

        .gp-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.5px; color: #64748B; margin-bottom: 8px;
        }

        .gp-tag {
          font-size: 11px; font-weight: 600; padding: 3px 10px;
          border-radius: 6px; white-space: nowrap;
        }
        .gp-tag-blue { background: rgba(59,130,246,0.15); color: #60A5FA; }
        .gp-tag-purple { background: rgba(139,92,246,0.15); color: #A78BFA; }
        html:not(.dark) .gp-tag-blue, html[data-theme="light"] .gp-tag-blue { background: #DBEAFE; color: #1D4ED8; }
        html:not(.dark) .gp-tag-purple, html[data-theme="light"] .gp-tag-purple { background: #EDE9FE; color: #6D28D9; }

        /* Component chips */
        .gp-comp-chip {
          display: inline-flex; flex-direction: column; align-items: center;
          padding: 6px 10px 4px; border-radius: 10px;
          border: 1.5px solid; font-size: 14px;
          background: rgba(148,163,184,0.05);
        }
        .gp-comp-role {
          font-size: 10px; font-weight: 700; color: #fff;
          padding: 1px 6px; border-radius: 4px; margin-top: 4px;
          white-space: nowrap;
        }

        /* Component notes */
        .gp-comp-notes { margin-top: 6px; }
        .gp-comp-note {
          font-size: 12px; padding: 3px 0;
          border-bottom: 1px solid rgba(148,163,184,0.08);
        }
        .gp-comp-note:last-child { border-bottom: none; }

        /* Explain box */
        .gp-explain-box {
          padding: 12px 14px; border-radius: 10px;
          background: rgba(99, 102, 241, 0.08);
          border-left: 3px solid #818CF8;
        }
        html:not(.dark) .gp-explain-box, html[data-theme="light"] .gp-explain-box {
          background: #EEF2FF; border-left-color: #6366F1;
        }

        /* Rules */
        .gp-rule { padding: 4px 0; }

        /* Tip */
        .gp-tip {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 10px 14px; border-radius: 10px;
          background: rgba(245,158,11,0.08);
          border-left: 3px solid #F59E0B;
        }
        html:not(.dark) .gp-tip, html[data-theme="light"] .gp-tip {
          background: #FFFBEB; border-left-color: #D97706;
        }

        .gp-spinner {
          width: 28px; height: 28px; margin: 0 auto;
          border: 3px solid rgba(99,102,241,0.2);
          border-top-color: #6366F1;
          border-radius: 50%;
          animation: dictSpin 0.6s linear infinite;
        }

        @keyframes grammarPopupIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
