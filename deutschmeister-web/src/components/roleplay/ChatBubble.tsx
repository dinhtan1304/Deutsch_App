'use client';

import { useState } from 'react';
import { ChatMessage } from '@/lib/api/roleplay';

interface Props {
  message: ChatMessage;
  aiIcon?: string;
}

export function ChatBubble({ message, aiIcon = '🤖' }: Props) {
  const [showTranslation, setShowTranslation] = useState(false);
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div
          className="w-8 h-8 rounded-[10px] flex items-center justify-center text-lg shrink-0"
          style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 28%, transparent)' }}
        >
          {aiIcon}
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-[13px] px-4 py-2.5 ${isUser ? 'rounded-tr-md' : 'rounded-tl-md'}`}
        style={{
          background: isUser ? 'var(--accent)' : 'var(--theme-bg-card)',
          color: isUser ? 'var(--accent-on)' : 'var(--theme-text-primary)',
          border: isUser ? 'none' : '1px solid var(--theme-border)',
        }}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>

        {!isUser && message.translationVi && (
          <>
            <button
              type="button"
              onClick={() => setShowTranslation((s) => !s)}
              className="mt-1.5 text-caption underline opacity-70 hover:opacity-100"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              {showTranslation ? 'Ẩn dịch' : '🇻🇳 Xem dịch'}
            </button>
            {showTranslation && (
              <p
                className="text-xs mt-1 italic"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                {message.translationVi}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
