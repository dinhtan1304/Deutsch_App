'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { SpeakingMessage } from '@/lib/api/speakingRooms';
import { ACCENT } from '@/lib/tokens';

interface Props {
  messages: SpeakingMessage[];
  currentUserId: string;
  participantById: Map<string, { name: string | null; avatar: string | null }>;
  typingUserIds: Set<string>;
}

export function ChatPanel({ messages, currentUserId, participantById, typingUserIds }: Props) {
  const t = useTranslations('speakingRooms.components');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const typingNames = Array.from(typingUserIds)
    .filter((id) => id !== currentUserId)
    .map((id) => participantById.get(id)?.name ?? t('opponent'));

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-3 space-y-2 rounded-2xl border"
      style={{
        backgroundColor: 'var(--theme-bg-card)',
        borderColor: 'var(--theme-border)',
        minHeight: 320,
      }}
    >
      {messages.length === 0 && (
        <p className="text-center text-sm py-8" style={{ color: 'var(--theme-text-muted)' }}>
          {t('firstMessage')}
        </p>
      )}
      {messages.map((m) => {
        const isMine = m.senderId === currentUserId;
        const isSystem = m.kind === 'SYSTEM' || !m.senderId;
        if (isSystem) {
          return (
            <div key={m.id} className="text-center my-2">
              <span
                className="text-caption px-2 py-1 rounded-full inline-block"
                style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}
              >
                {m.text}
              </span>
            </div>
          );
        }
        const sender = participantById.get(m.senderId ?? '');
        return (
          <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[75%]">
              {!isMine && (
                <p className="text-caption mb-0.5 px-2" style={{ color: 'var(--theme-text-muted)' }}>
                  {sender?.name ?? t('opponent')}
                </p>
              )}
              <div
                className="px-3 py-2 rounded-2xl"
                style={
                  isMine
                    ? { backgroundColor: ACCENT.speaking, color: '#fff' }
                    : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)' }
                }
              >
                <p className="text-sm whitespace-pre-wrap">{m.text}</p>
              </div>
            </div>
          </div>
        );
      })}
      {typingNames.length > 0 && (
        <p className="text-caption italic" style={{ color: 'var(--theme-text-muted)' }}>
          {t('typing', { names: typingNames.join(', ') })}
        </p>
      )}
    </div>
  );
}
