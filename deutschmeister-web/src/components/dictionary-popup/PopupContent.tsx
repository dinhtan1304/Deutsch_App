'use client';

import { useState, useCallback } from 'react';
import { useDictionaryLookup, useCheckWordBank } from '@/hooks/useDictionaryLookup';
import { dictionaryLookupApi } from '@/lib/api/dictionary-lookup';
import { useQueryClient } from '@tanstack/react-query';

interface PopupContentProps {
  word: string;
}

// BUG FIX 4: Level badge was always blue regardless of level.
// Now each CEFR level gets its own color matching the HighlightedText system.
const LEVEL_COLORS: Record<string, { bg: string; color: string }> = {
  A1: { bg: 'rgba(34, 197, 94, 0.15)',   color: '#22C55E' },
  A2: { bg: 'rgba(59, 130, 246, 0.15)',  color: '#3B82F6' },
  B1: { bg: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' },
  B2: { bg: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' },
  C1: { bg: 'rgba(239, 68, 68, 0.15)',  color: '#EF4444' },
};

const ARTICLE_STYLES: Record<string, { bg: string; label: string }> = {
  der: { bg: '#3B82F6', label: 'der' },
  die: { bg: '#EF4444', label: 'die' },
  das: { bg: '#22C55E', label: 'das' },
};

export function PopupContent({ word }: PopupContentProps) {
  const { data: result, isLoading, isError } = useDictionaryLookup(word);
  const { data: isInWordBank } = useCheckWordBank(result?.word || null);
  const [addingToBank, setAddingToBank] = useState(false);
  const [addedToBank, setAddedToBank] = useState(false);
  const queryClient = useQueryClient();

  const handleSpeak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const handleAddToWordBank = useCallback(async () => {
    if (!result || addingToBank) return;
    setAddingToBank(true);
    try {
      await dictionaryLookupApi.quickAdd({
        word: result.word,
        translationVi: result.translationVi,
        translationEn: result.translationEn,
        wordType: result.wordType,
        gender: result.gender,
        plural: result.plural,
        example: result.example,
        level: result.level,
      });
      setAddedToBank(true);
      queryClient.invalidateQueries({ queryKey: ['word-bank-check', result.word] });
    } catch {
      setAddedToBank(true);
    } finally {
      setAddingToBank(false);
    }
  }, [result, addingToBank, queryClient]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="dict-popup-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 0' }}>
          <div className="dict-spinner" />
          <span className="dict-text-muted">Đang tra cứu...</span>
        </div>
        <Style />
      </div>
    );
  }

  // ── Not found ──
  if (!result || isError) {
    return (
      <div className="dict-popup-body">
        <div style={{ padding: '4px 0 8px' }}>
          <p className="dict-text-muted" style={{ marginBottom: '10px' }}>
            Không tìm thấy <strong className="dict-text-primary">&quot;{word}&quot;</strong> trong từ điển
          </p>
          <button onClick={() => handleSpeak(word)} className="dict-speak-btn">
            🔊 Nghe phát âm
          </button>
        </div>
        <Style />
      </div>
    );
  }

  const articleStyle = result.article ? ARTICLE_STYLES[result.article] : null;
  const alreadyInBank = isInWordBank || addedToBank;

  return (
    <div className="dict-popup-body">

      {/* ═══ HEADER: Article + Word + Audio ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', paddingRight: '28px' }}>
        {articleStyle && (
          <span
            style={{
              background: articleStyle.bg,
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              letterSpacing: '0.3px',
            }}
          >
            {articleStyle.label}
          </span>
        )}
        <span className="dict-text-primary" style={{ fontSize: '18px', fontWeight: 700 }}>
          {result.word}
        </span>
        {result.plural && (
          <span className="dict-text-muted" style={{ fontSize: '13px' }}>
            (Pl. {result.plural})
          </span>
        )}
        <button
          onClick={() => handleSpeak(result.word)}
          title="Nghe phát âm"
          className="dict-icon-btn"
          style={{ marginLeft: 'auto' }}
        >
          🔊
        </button>
      </div>

      {/* ═══ BADGES: Level ═══ */}
      {result.level && (() => {
        const lc = LEVEL_COLORS[result.level!] ?? { bg: 'rgba(59,130,246,0.15)', color: '#60A5FA' };
        return (
          <div style={{ marginBottom: '10px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              background: lc.bg,
              color: lc.color,
            }}>{result.level}</span>
          </div>
        );
      })()}

      {/* ═══ NGHĨA CHÍNH: Tiếng Việt (nổi bật nhất) ═══ */}
      {result.translationVi && (
        <div className="dict-translation-vi">
          <span style={{ marginRight: '6px' }}>🇻🇳</span>
          {result.translationVi}
        </div>
      )}

      {/* ═══ NGHĨA PHỤ: Tiếng Anh ═══ */}
      {result.translationEn && (
        <div className="dict-translation-en">
          <span style={{ marginRight: '6px' }}>🇬🇧</span>
          {result.translationEn}
        </div>
      )}

      {/* ═══ VÍ DỤ ═══ */}
      {result.example && (
        <div className="dict-example">
          <div className="dict-example-text">
            &quot;{result.example}&quot;
          </div>
        </div>
      )}

      {/* ═══ NÚT THÊM VÀO WORD BANK ═══ */}
      <button
        onClick={alreadyInBank ? undefined : handleAddToWordBank}
        disabled={alreadyInBank || addingToBank}
        className={alreadyInBank ? 'dict-btn-added' : 'dict-btn-add'}
      >
        {addingToBank
          ? '⏳ Đang thêm...'
          : alreadyInBank
            ? '✅ Đã có trong Word Bank'
            : '➕ Thêm vào Word Bank'}
      </button>

      <Style />
    </div>
  );
}

/** Scoped styles — dark mode default, light mode override */
function Style() {
  return (
    <style jsx global>{`
      .dict-popup-body {
        padding: 16px 18px;
      }

      /* ── Text colors (dark mode default) ── */
      .dict-text-primary {
        color: #F1F5F9;
      }
      .dict-text-muted {
        color: #94A3B8;
        font-size: 13px;
      }

      html:not(.dark) .dict-text-primary,
      html[data-theme="light"] .dict-text-primary {
        color: #1E293B;
      }
      html:not(.dark) .dict-text-muted,
      html[data-theme="light"] .dict-text-muted {
        color: #64748B;
      }

      /* ── Spinner ── */
      .dict-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(59, 130, 246, 0.3);
        border-top-color: #3B82F6;
        border-radius: 50%;
        animation: dictSpin 0.6s linear infinite;
      }
      @keyframes dictSpin {
        to { transform: rotate(360deg); }
      }

      /* ── Speak button (inline) ── */
      .dict-speak-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #60A5FA;
        font-size: 13px;
        padding: 0;
      }
      .dict-speak-btn:hover {
        color: #93BBFD;
      }

      /* ── Icon button (🔊) ── */
      .dict-icon-btn {
        background: rgba(148, 163, 184, 0.1);
        border: none;
        cursor: pointer;
        font-size: 15px;
        padding: 4px 6px;
        border-radius: 6px;
        line-height: 1;
        transition: background 0.15s;
      }
      .dict-icon-btn:hover {
        background: rgba(148, 163, 184, 0.2);
      }

      /* Level badge — replaced by dynamic inline style in JSX (LEVEL_COLORS) */

      /* ── NGHĨA TIẾNG VIỆT (nổi bật) ── */
      .dict-translation-vi {
        font-size: 16px;
        font-weight: 600;
        color: #F1F5F9;
        padding: 8px 12px;
        margin-bottom: 6px;
        border-radius: 8px;
        background: rgba(99, 102, 241, 0.1);
        border-left: 3px solid #818CF8;
        display: flex;
        align-items: center;
      }
      html:not(.dark) .dict-translation-vi,
      html[data-theme="light"] .dict-translation-vi {
        color: #1E293B;
        background: #EEF2FF;
        border-left-color: #6366F1;
      }

      /* ── NGHĨA TIẾNG ANH (phụ) ── */
      .dict-translation-en {
        font-size: 13px;
        color: #94A3B8;
        padding: 0 12px;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
      }
      html:not(.dark) .dict-translation-en,
      html[data-theme="light"] .dict-translation-en {
        color: #64748B;
      }

      /* ── Ví dụ ── */
      .dict-example {
        padding: 8px 12px;
        border-radius: 8px;
        background: rgba(148, 163, 184, 0.08);
        margin-bottom: 12px;
      }
      .dict-example-text {
        font-size: 13px;
        font-style: italic;
        color: #CBD5E1;
      }
      html:not(.dark) .dict-example,
      html[data-theme="light"] .dict-example {
        background: #F8FAFC;
      }
      html:not(.dark) .dict-example-text,
      html[data-theme="light"] .dict-example-text {
        color: #475569;
      }

      /* ── Nút thêm Word Bank ── */
      .dict-btn-add {
        width: 100%;
        padding: 8px 0;
        font-size: 13px;
        font-weight: 600;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        background: linear-gradient(135deg, #6366F1, #4F46E5);
        color: #fff;
        transition: all 0.15s;
      }
      .dict-btn-add:hover {
        background: linear-gradient(135deg, #818CF8, #6366F1);
        transform: translateY(-1px);
      }
      .dict-btn-add:disabled {
        opacity: 0.6;
        cursor: default;
        transform: none;
      }

      .dict-btn-added {
        width: 100%;
        padding: 8px 0;
        font-size: 13px;
        font-weight: 600;
        border-radius: 8px;
        border: none;
        cursor: default;
        background: rgba(148, 163, 184, 0.1);
        color: #94A3B8;
      }
      html:not(.dark) .dict-btn-added,
      html[data-theme="light"] .dict-btn-added {
        background: #F1F5F9;
        color: #64748B;
      }
    `}</style>
  );
}