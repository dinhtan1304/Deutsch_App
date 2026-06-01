'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const tr = useTranslations('speakingRooms.components');
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
          {tr('suggestionsTitle')}
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
              className="v2-match-grad flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              <svg width={15} height={15} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="m6 4 1.2 2.8L10 8l-2.8 1.2L6 12 4.8 9.2 2 8l2.8-1.2L6 4Zm9 7 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" /></svg>
              {tr('getAiSuggestions')}
            </button>
          )}
          {loading && <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>{tr('loadingSuggestions')}</p>}
          {suggestions && (
            <>
              <div className="flex gap-1 mb-3">
                {(
                  [
                    { key: 'subTopics', label: tr('tabSubTopics') },
                    { key: 'starters', label: tr('tabStarters') },
                    { key: 'followUps', label: tr('tabFollowUps') },
                  ] as { key: Tab; label: string }[]
                ).map((tabItem) => (
                  <button
                    key={tabItem.key}
                    onClick={() => setTab(tabItem.key)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold"
                    style={
                      tab === tabItem.key
                        ? { backgroundColor: ACCENT.speaking, color: 'white' }
                        : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)' }
                    }
                  >
                    {tabItem.label}
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
                {tr('refreshSuggestions')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
