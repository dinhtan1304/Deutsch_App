'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
    } catch (err: any) {
      alert(err?.message || 'Gửi thất bại');
      setOptimistic((prev) => prev.slice(0, -1));
    } finally {
      setTyping(false);
    }
  };

  const handleEnd = async () => {
    if (!confirm('Kết thúc cuộc hội thoại và xem đánh giá?')) return;
    try {
      await endMut.mutateAsync();
      setShowFeedback(true);
    } catch (err: any) {
      alert(err?.message || 'Không thể kết thúc');
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
          Đang tải…
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
            Không tìm thấy cuộc hội thoại
          </p>
          <Link
            href="/practice-test/roleplay"
            className="text-sm underline"
            style={{ color: '#6366F1' }}
          >
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const info = session.scenarioInfo;
  const isActive = session.status === 'active';

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--theme-bg-primary)' }}
    >
      {/* Header */}
      <header
        className="border-b px-4 py-3 sticky top-0 z-10 backdrop-blur"
        style={{
          borderColor: 'var(--theme-border)',
          backgroundColor: 'var(--theme-bg-primary)',
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/practice-test/roleplay')}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              color: 'var(--theme-text-primary)',
            }}
            aria-label="Quay lại"
          >
            ←
          </button>
          <div className="text-2xl">{info?.icon ?? '💬'}</div>
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
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                color: '#A855F7',
                border: '1px solid rgba(168, 85, 247, 0.3)',
              }}
            >
              {endMut.isPending ? 'Đang chấm…' : 'Kết thúc'}
            </button>
          )}
        </div>
      </header>

      {/* Tips bar (only when no user messages yet) */}
      {isActive &&
        info?.tips &&
        info.tips.length > 0 &&
        !messages.some((m) => m.role === 'user') && (
          <div
            className="border-b px-4 py-3"
            style={{
              borderColor: 'var(--theme-border)',
              backgroundColor: 'rgba(99, 102, 241, 0.05)',
            }}
          >
            <div className="max-w-3xl mx-auto">
              <div
                className="text-caption font-bold mb-1"
                style={{ color: '#6366F1' }}
              >
                💡 GỢI Ý
              </div>
              <ul className="space-y-0.5">
                {info.tips.map((t, i) => (
                  <li
                    key={i}
                    className="text-xs"
                    style={{ color: 'var(--theme-text-secondary)' }}
                  >
                    • {t}
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
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0"
                style={{ background: 'rgba(99, 102, 241, 0.15)' }}
              >
                🤖
              </div>
              <div
                className="rounded-2xl rounded-tl-md px-4 py-3 border"
                style={{
                  borderColor: 'var(--theme-border)',
                  backgroundColor: 'var(--theme-bg-card)',
                }}
              >
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: '0.15s' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: '0.3s' }}
                  />
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
                  className="flex-1 py-3 rounded-xl text-center text-sm font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    color: 'white',
                  }}
                >
                  Luyện scenario khác
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      {isActive && (
        <div
          className="border-t px-4 py-3 sticky bottom-0"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: 'var(--theme-bg-primary)',
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
              Nhấn Enter để gửi • Shift+Enter để xuống dòng
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
