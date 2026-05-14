'use client';

import { useState } from 'react';
import type { SpeakingSuggestion } from '@/lib/api/speakingRooms';
import { ACCENT } from '@/lib/tokens';

interface Props {
  suggestions?: SpeakingSuggestion;
  loading?: boolean;
  onFetch: () => void;
  onPick: (text: string) => void;
}

type Tab = 'subTopics' | 'starters' | 'followUps';

export function SuggestionsPanel({ suggestions, loading, onFetch, onPick }: Props) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<Tab>('starters');

  const list = suggestions
    ? tab === 'subTopics'
      ? suggestions.subTopics
      : tab === 'starters'
        ? suggestions.starterSentences
        : suggestions.followUpQuestions
    : [];

  return (
    <div
      className="rounded-2xl border"
      style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}
    >
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between p-3"
      >
        <span className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>
          Gợi ý chủ đề & câu mẫu
        </span>
        <svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          style={{
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 200ms',
            color: 'var(--theme-text-muted)',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="p-3 pt-0">
          {!suggestions && !loading && (
            <button
              onClick={onFetch}
              className="w-full py-2 rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: ACCENT.speaking }}
            >
              Nhận gợi ý từ AI
            </button>
          )}
          {loading && <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Đang lấy gợi ý...</p>}
          {suggestions && (
            <>
              <div className="flex gap-1 mb-3">
                {(
                  [
                    { key: 'subTopics', label: 'Hướng đi' },
                    { key: 'starters', label: 'Câu mở' },
                    { key: 'followUps', label: 'Hỏi lại' },
                  ] as { key: Tab; label: string }[]
                ).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold"
                    style={
                      tab === t.key
                        ? { backgroundColor: ACCENT.speaking, color: '#fff' }
                        : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)' }
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {list.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => onPick(item.de)}
                    className="w-full p-2 rounded-lg text-left border hover:scale-[1.01] transition-transform"
                    style={{
                      borderColor: 'var(--theme-border)',
                      backgroundColor: 'var(--theme-bg-secondary)',
                    }}
                  >
                    <p className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>
                      {item.de}
                    </p>
                    <p className="text-caption mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                      {item.vi}
                    </p>
                  </button>
                ))}
              </div>
              <button
                onClick={onFetch}
                disabled={loading}
                className="w-full mt-2 py-1.5 rounded-lg text-xs font-bold border"
                style={{ borderColor: ACCENT.speaking, color: ACCENT.speaking }}
              >
                Làm mới gợi ý
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
