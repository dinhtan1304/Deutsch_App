'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { TopicCard } from '@/components/topics/TopicCard';
import { useTopics, useUserTopicsProgress, useTopicsStats } from '@/hooks/useTopics';
import { useAuthStore } from '@/stores/authStore';
import { FilterChip } from '@/components/ui/FilterChip';
import { IconLayers, IconBook, IconTarget, IconSearch, IconFlame } from '@/components/ui/Icons';

const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;
type StatusKey = 'all' | 'active' | 'done' | 'new';
const STATUS_KEYS: StatusKey[] = ['all', 'active', 'done', 'new'];
const STATUS_DOT: Record<Exclude<StatusKey, 'all'>, string> = {
  active: 'var(--m-learning)',
  done: 'var(--m-learned)',
  new: 'var(--m-new)',
};

// localStorage fallback for word-level progress (mirrors previous behavior).
function getLocalProgress(topicId: string, userId: string | undefined, totalWords: number) {
  try {
    const key = userId ? `topic-learned-${userId}-${topicId}` : `topic-learned-${topicId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const ids = JSON.parse(stored);
      const n = Array.isArray(ids) ? ids.length : 0;
      return { wordsLearned: n, percent: totalWords > 0 ? Math.round((n / totalWords) * 100) : 0 };
    }
  } catch { /* ignore */ }
  return { wordsLearned: 0, percent: 0 };
}

const topicStatus = (pct: number): Exclude<StatusKey, 'all'> => pct >= 100 ? 'done' : pct > 0 ? 'active' : 'new';

export default function TopicsPage() {
  const t = useTranslations('vocabulary.topics');
  const { isAuthenticated, user } = useAuthStore();
  const [level, setLevel] = useState<string>('all');
  const [status, setStatus] = useState<StatusKey>('all');
  const [query, setQuery] = useState('');

  const { data: topicsData, isLoading } = useTopics({ level: level === 'all' ? undefined : level, isActive: true });
  const { data: serverProgressData } = useUserTopicsProgress(isAuthenticated);
  const { data: stats } = useTopicsStats();

  const topicsWithProgress = useMemo(() => {
    if (!topicsData?.data) return undefined;
    const serverMap = new Map((serverProgressData || []).map(p => [p.id, p]));
    return topicsData.data.map(topic => {
      const sp = serverMap.get(topic.id);
      const lp = getLocalProgress(topic.id, user?.id, topic.wordCount);
      const hasServer = sp && sp.wordsLearned > 0;
      return {
        ...topic,
        wordsLearned: hasServer ? sp.wordsLearned : lp.wordsLearned,
        masteryPercent: hasServer ? sp.masteryPercent : lp.percent,
        lastStudiedAt: sp?.lastStudiedAt || null,
        completedAt: sp?.completedAt || null,
      };
    });
  }, [topicsData, serverProgressData, user?.id]);

  const totalWords = topicsWithProgress?.reduce((s, tp) => s + tp.wordCount, 0) ?? 0;
  const learnedWords = topicsWithProgress?.reduce((s, tp) => s + tp.wordsLearned, 0) ?? 0;
  const completedCount = topicsWithProgress?.filter(tp => tp.masteryPercent >= 100).length ?? 0;

  const inProgress = useMemo(
    () => (topicsWithProgress ?? []).filter(tp => topicStatus(tp.masteryPercent) === 'active'),
    [topicsWithProgress],
  );

  const filtered = useMemo(() => {
    if (!topicsWithProgress) return undefined;
    return topicsWithProgress
      .filter(tp => {
        if (status !== 'all' && topicStatus(tp.masteryPercent) !== status) return false;
        if (query) {
          const q = query.toLowerCase();
          if (!tp.nameDe.toLowerCase().includes(q) && !tp.nameVi.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const order = { active: 0, new: 1, done: 2 } as const;
        return order[topicStatus(a.masteryPercent)] - order[topicStatus(b.masteryPercent)];
      });
  }, [topicsWithProgress, status, query]);

  const showInProgressStrip = level === 'all' && status === 'all' && !query && inProgress.length > 0;

  const statItems = [
    { label: t('statTopics'), value: stats?.totalTopics ?? topicsData?.total ?? 0, color: 'var(--accent)', icon: <IconLayers size={14} /> },
    { label: t('statWords'), value: (stats?.totalWords ?? totalWords).toLocaleString('de-DE'), color: 'var(--v2-violet, #A78BFA)', icon: <IconBook size={14} /> },
    { label: t('statLearned'), value: learnedWords, color: 'var(--m-learned)', icon: <IconTarget size={14} /> },
  ];

  const clearFilters = () => { setLevel('all'); setStatus('all'); setQuery(''); };

  return (
    <div className="flex flex-col gap-5 max-w-360 mx-auto">

      {/* ─── Header ─── */}
      <header className="flex items-end justify-between gap-5 flex-wrap">
        <div>
          <div className="text-caption font-medium uppercase mb-1.5" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.08em' }}>
            {t('eyebrow')}
          </div>
          <h1 className="font-bold" style={{ fontSize: 30, letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>
            {t('pageTitle')}
          </h1>
          <p className="mt-1.5 text-body" style={{ color: 'var(--theme-text-secondary)' }}>
            {t('pageSubtitle', { completed: completedCount })}
          </p>
        </div>

        <div className="flex gap-2">
          {statItems.map((s, i) => (
            <div key={i} className="rounded-[10px] px-3.5 py-2.5 flex flex-col gap-0.5" style={{ minWidth: 104, background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
              <div className="flex items-center gap-1.5">
                <span style={{ color: s.color }}>{s.icon}</span>
                <span className="text-caption uppercase font-medium" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.04em' }}>{s.label}</span>
              </div>
              <span className="mono font-bold" style={{ fontSize: 20, letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{s.value}</span>
            </div>
          ))}
        </div>
      </header>

      {/* ─── In-progress strip ─── */}
      {showInProgressStrip && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <IconFlame size={14} style={{ color: 'var(--m-learning)' }} />
            <h2 className="text-caption font-semibold uppercase" style={{ color: 'var(--theme-text-secondary)', letterSpacing: '.06em' }}>
              {t('inProgressTitle', { count: inProgress.length })}
            </h2>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {inProgress.slice(0, 3).map(tp => <TopicCard key={tp.id} topic={tp} showProgress large />)}
          </div>
        </section>
      )}

      {/* ─── Filter bar ─── */}
      <div className="rounded-[14px] border p-3 flex flex-wrap items-center gap-x-3 gap-y-2.5"
        style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
        <div className="flex items-center gap-2 h-8.5 px-3 rounded-lg flex-1 min-w-50" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
          <span style={{ color: 'var(--theme-text-muted)' }}><IconSearch size={14} /></span>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('searchPlaceholder')}
            className="flex-1 h-full bg-transparent text-sm outline-none" style={{ color: 'var(--theme-text-primary)' }} />
        </div>

        <div className="flex items-center gap-1.5">
          <FilterChip active={level === 'all'} size="sm" onClick={() => setLevel('all')}>{t('levelAll')}</FilterChip>
          {LEVELS.map(l => (
            <FilterChip key={l} active={level === l} size="sm" onClick={() => setLevel(l)}>
              <span className="mono">{l}</span>
            </FilterChip>
          ))}
        </div>

        <span className="w-px h-5 hidden sm:block" style={{ background: 'var(--theme-border)' }} />

        <div className="flex items-center gap-1.5">
          {STATUS_KEYS.map(k => (
            <FilterChip key={k} active={status === k} size="sm" onClick={() => setStatus(k)}>
              {k !== 'all' && <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_DOT[k as Exclude<StatusKey, 'all'>] }} />}
              {t(`status${k.charAt(0).toUpperCase()}${k.slice(1)}` as 'statusAll')}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* ─── Results / grid ─── */}
      {isLoading ? (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 rounded-[14px] animate-pulse" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <>
          <div className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>
            {t('showingCount', { shown: filtered.length, total: topicsWithProgress?.length ?? 0 })}
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {filtered.map(tp => <TopicCard key={tp.id} topic={tp} showProgress />)}
          </div>
        </>
      ) : (
        <div className="text-center py-14 rounded-[14px]" style={{ background: 'var(--theme-bg-card)', border: '1px dashed var(--theme-border)' }}>
          <div className="text-3xl mb-2">📚</div>
          <h3 className="font-semibold mb-1" style={{ fontSize: 15, color: 'var(--theme-text-primary)' }}>{t('emptyFilterTitle')}</h3>
          <p className="text-body mb-4" style={{ color: 'var(--theme-text-muted)' }}>{t('emptyFilterBody')}</p>
          <button onClick={clearFilters} className="px-4 py-2 rounded-lg text-body font-semibold text-white" style={{ background: 'var(--accent)' }}>
            {t('clearFilters')}
          </button>
        </div>
      )}
    </div>
  );
}
