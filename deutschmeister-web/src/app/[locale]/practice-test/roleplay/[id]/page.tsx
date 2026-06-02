'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  useRoleplaySession,
  useSendRoleplayMessage,
  useEndRoleplay,
} from '@/hooks/useRoleplay';
import { ChatBubble } from '@/components/roleplay/ChatBubble';
import { ChatInput } from '@/components/roleplay/ChatInput';
import { FeedbackSummary } from '@/components/roleplay/FeedbackSummary';
import type { ChatMessage } from '@/lib/api/roleplay';

export default function RoleplayChatPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('practice.roleplay.session');
  const sessionId = params.id;

  const { data: session, isLoading, error } = useRoleplaySession(sessionId);
  const sendMut = useSendRoleplayMessage(sessionId);
  const endMut = useEndRoleplay(sessionId);

  // Local optimistic messages to show user text instantly while AI is replying
  const [optimistic, setOptimistic] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages: ChatMessage[] = [
    ...(session?.messages ?? []),
    ...optimistic,
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, typing, showFeedback]);

  useEffect(() => {
    // Auto-open feedback panel if session already completed
    if (session?.status === 'completed' && session.aiFeedback) {
      setShowFeedback(true);
    }
  }, [session?.status, session?.aiFeedback]);

  const handleSend = async (text: string) => {
    setOptimistic((prev) => [
      ...prev,
      { role: 'user', text, timestamp: new Date().toISOString() },
    ]);
    setTyping(true);
    try {
      await sendMut.mutateAsync({ text });
      // Once server-side state refreshes, clear optimistic buffer
      setOptimistic([]);
    } catch (err) {
      alert((err as Error | undefined)?.message || t('sendError'));
      setOptimistic((prev) => prev.slice(0, -1));
    } finally {
      setTyping(false);
    }
  };

  const handleEnd = async () => {
    if (!confirm(t('endConfirm'))) return;
    try {
      await endMut.mutateAsync();
      setShowFeedback(true);
    } catch (err) {
      alert((err as Error | undefined)?.message || t('endError'));
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--theme-bg-primary)' }}
      >
        <div
          className="text-sm"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {t('loading')}
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--theme-bg-primary)' }}
      >
        <div className="text-center">
          <p className="mb-3" style={{ color: 'var(--theme-text-primary)' }}>
            {t('notFound')}
          </p>
          <Link
            href="/practice-test/roleplay"
            className="text-sm underline"
            style={{ color: 'var(--accent)' }}
          >
            {t('backToList')}
          </Link>
        </div>
      </div>
    );
  }

  const info = session.scenarioInfo;
  const isActive = session.status === 'active';

  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-360 flex-col"
      style={{ backgroundColor: 'var(--theme-bg-primary)' }}
    >
      {/* Header */}
      <header
        className="border-b px-4 py-3 sticky top-0 z-10 backdrop-blur"
        style={{
          borderColor: 'var(--theme-border)',
          backgroundColor: 'color-mix(in srgb, var(--theme-bg-primary) 85%, transparent)',
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/practice-test/roleplay')}
            className="w-9 h-9 rounded-[9px] flex items-center justify-center shrink-0 transition-opacity hover:opacity-80"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              color: 'var(--theme-text-secondary)',
              border: '1px solid var(--theme-border)',
            }}
            aria-label={t('backAria')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] text-xl"
            style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 28%, transparent)' }}>
            {info?.icon ?? '💬'}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-sm font-bold truncate"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              {info?.titleDe ?? session.scenario}
            </div>
            <div
              className="text-caption truncate"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              {session.level} • {info?.titleVi}
            </div>
          </div>
          {isActive && (
            <button
              type="button"
              onClick={handleEnd}
              disabled={endMut.isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                color: 'var(--accent)',
                border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
              }}
            >
              {endMut.isPending ? t('ending') : t('endButton')}
            </button>
          )}
        </div>
      </header>

      {/* Tips bar (only when no user messages yet) */}
      {isActive &&
        info?.tips &&
        info.tips.length > 0 &&
        !messages.some((m) => m.role === 'user') && (
          <div className="px-4 pt-4">
            <div
              className="max-w-3xl mx-auto rounded-xl border p-3"
              style={{
                borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)',
                backgroundColor: 'color-mix(in srgb, var(--accent) 6%, transparent)',
              }}
            >
              <div
                className="text-caption font-bold mb-1"
                style={{ color: 'var(--accent)' }}
              >
                {t('tipsHeader')}
              </div>
              <ul className="space-y-0.5">
                {info.tips.map((tip, i) => (
                  <li
                    key={i}
                    className="text-xs"
                    style={{ color: 'var(--theme-text-secondary)' }}
                  >
                    • {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        <div className="max-w-3xl mx-auto space-y-3">
          {messages.map((m, i) => (
            <ChatBubble key={i} message={m} />
          ))}
          {typing && (
            <div className="flex gap-2">
              <div
                className="w-8 h-8 rounded-[10px] flex items-center justify-center text-lg shrink-0"
                style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 28%, transparent)' }}
              >
                🤖
              </div>
              <div
                className="rounded-[13px] rounded-tl-md px-4 py-3 border"
                style={{
                  borderColor: 'var(--theme-border)',
                  backgroundColor: 'var(--theme-bg-card)',
                }}
              >
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--theme-text-muted)' }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--theme-text-muted)', animationDelay: '0.15s' }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--theme-text-muted)', animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}

          {/* Feedback panel */}
          {showFeedback && session.aiFeedback && (
            <div className="pt-4 mt-4 border-t" style={{ borderColor: 'var(--theme-border)' }}>
              <FeedbackSummary feedback={session.aiFeedback} />
              <div className="mt-4 flex gap-2">
                <Link
                  href="/practice-test/roleplay"
                  className="flex-1 py-3 rounded-md text-center text-sm font-semibold"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--accent-on)',
                  }}
                >
                  {t('newScenario')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      {isActive && (
        <div
          className="border-t px-4 py-3 sticky bottom-0 backdrop-blur"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: 'color-mix(in srgb, var(--theme-bg-primary) 85%, transparent)',
          }}
        >
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSend={handleSend}
              disabled={sendMut.isPending || typing}
            />
            <p
              className="text-caption mt-1.5 text-center"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              {t('inputHint')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
