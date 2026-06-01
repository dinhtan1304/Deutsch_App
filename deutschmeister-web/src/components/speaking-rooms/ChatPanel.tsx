'use client';

import { useEffect, useRef } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
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
  const fmt = useFormatter();
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
        const time = fmt.dateTime(new Date(m.createdAt), { hour: '2-digit', minute: '2-digit' });
        return (
          <div key={m.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
            {!isMine && (
              <div className="v2-avatar-grad mb-5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white">
                {(sender?.name ?? '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="max-w-[75%]">
              <div
                className="rounded-2xl px-3 py-2"
                style={
                  isMine
                    ? { backgroundColor: ACCENT.speaking, color: 'white' }
                    : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)' }
                }
              >
                <p className="text-sm whitespace-pre-wrap">{m.text}</p>
              </div>
              <p className="mono mt-1 px-1 text-[10.5px]" style={{ color: 'var(--theme-text-muted)', textAlign: isMine ? 'right' : 'left' }}>{time}</p>
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
