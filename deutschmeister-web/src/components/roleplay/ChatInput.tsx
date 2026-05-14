import { useState, KeyboardEvent, useRef, useCallback, useEffect } from 'react';
/* eslint-disable no-restricted-syntax */

interface Props {
  onSend: (text: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

const SPECIAL_CHARS = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'];

export function ChatInput({ onSend, onTypingChange, disabled, placeholder = 'Viết câu trả lời bằng tiếng Đức...' }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTypingSoon = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTypingChange?.(false);
      typingTimeoutRef.current = null;
    }, 1500);
  }, [onTypingChange]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      onTypingChange?.(false);
    };
  }, [onTypingChange]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = null;
    onTypingChange?.(false);
    setText('');
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertSpecial = useCallback((char: string) => {
    if (disabled) return;
    if (!textareaRef.current) {
      setText(prev => prev + char);
      onTypingChange?.(true);
      stopTypingSoon();
      return;
    }
    const { selectionStart, selectionEnd } = textareaRef.current;
    const newText = text.substring(0, selectionStart) + char + text.substring(selectionEnd);
    setText(newText);
    onTypingChange?.(true);
    stopTypingSoon();
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(selectionStart + 1, selectionStart + 1);
      }
    }, 0);
  }, [disabled, onTypingChange, stopTypingSoon, text]);

  const handleChange = (next: string) => {
    setText(next);
    if (disabled) return;
    if (next.trim()) {
      onTypingChange?.(true);
      stopTypingSoon();
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
      onTypingChange?.(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Special Chars Toolbar */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar pb-0.5">
        {SPECIAL_CHARS.map(char => (
          <button key={char} onClick={() => insertSpecial(char)} disabled={disabled}
            className="w-7 h-7 shrink-0 rounded-lg text-xs font-bold transition-all hover:scale-110 active:scale-90 flex items-center justify-center border disabled:opacity-30"
            style={{ 
              borderColor: 'var(--theme-border)', 
              backgroundColor: 'var(--theme-bg-card)',
              color: 'var(--theme-text-primary)'
            }}>
            {char}
          </button>
        ))}
      </div>

      <div
        className="flex gap-2 items-end rounded-2xl border p-2"
        style={{
          borderColor: 'var(--theme-border)',
          backgroundColor: 'var(--theme-bg-card)',
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={1000}
          className="flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-50"
          style={{
            color: 'var(--theme-text-primary)',
            maxHeight: '120px',
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            color: 'white',
          }}
          aria-label="Gửi"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
