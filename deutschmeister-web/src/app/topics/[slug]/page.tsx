'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { useTopic, useUpdateTopicProgress } from '@/hooks/useTopics';
import { useAuthStore } from '@/stores/authStore';
import type { TopicWord } from '@/types/topic';
import { IconSearch, IconChevronLeft, IconChevronRight } from '@/components/ui/Icons';

// ─── Inline SVG icons ───
function IconVolume({ size = 16, ...props }: { size?: number, [key: string]: any }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} {...props}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}
function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconCheckAll({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M18 6 7 17l-5-5" /><path d="m22 10-9.5 9.5L10 17" />
    </svg>
  );
}
function IconRotateCcw({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
    </svg>
  );
}
function IconGamepad({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <line x1="6" x2="10" y1="12" y2="12" /><line x1="8" x2="8" y1="10" y2="14" />
      <line x1="15" x2="15.01" y1="13" y2="13" /><line x1="18" x2="18.01" y1="11" y2="11" />
      <rect width="20" height="12" x="2" y="6" rx="2" />
    </svg>
  );
}
function IconFilter({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
function IconLightbulb({ size = 16, ...props }: { size?: number, [key: string]: any }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} {...props}>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" /><path d="M10 22h4" />
    </svg>
  );
}
function IconStar({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

// ─── Article Colors ───
const ArticleColor: Record<string, { color: string; gradient: string; bg: string }> = {
  der: { color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', bg: 'rgba(59,130,246,.08)' },
  die: { color: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899, #BE185D)', bg: 'rgba(236,72,153,.08)' },
  das: { color: '#22C55E', gradient: 'linear-gradient(135deg, #22C55E, #15803D)', bg: 'rgba(34,197,94,.08)' },
};

// ============================================
// Word Card Component
// ============================================
interface WordCardProps {
  word: TopicWord;
  index: number;
  isLearned: boolean;
  onToggleLearned: (wordId: string) => void;
}

function WordCard({ word, index, isLearned, onToggleLearned }: WordCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const ac = ArticleColor[word.article] || { color: '#6B7280', gradient: 'linear-gradient(135deg, #6B7280, #4B5563)', bg: 'rgba(107,114,128,.08)' };

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = word.article ? `${word.article} ${word.word}` : word.word;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300
      ${isLearned ? 'opacity-50' : ''}
      ${showDetails ? 'shadow-md' : 'hover:-translate-y-0.5 hover:shadow-sm'}`}
      style={{
        borderColor: showDetails ? ac.color : 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
        borderLeftWidth: '3px',
        borderLeftColor: ac.color,
      }}>

      {/* Main content */}
      <div className="p-4 cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
        <div className="flex items-start justify-between gap-3">
          {/* Left: Word info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono" style={{ color: 'var(--theme-text-muted)' }}>
                {index}.
              </span>
              {word.article && (
                <span className="text-[14px] font-semibold" style={{ color: ac.color }}>
                  {word.article}
                </span>
              )}
              <span className="text-[17px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                {word.word}
              </span>
              {word.isCore && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                  style={{ background: ac.gradient, color: 'white' }}>
                  <IconStar size={9} /> Core
                </span>
              )}
            </div>

            {word.plural && (
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                Pl. {word.plural}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <span className="text-[13px] flex items-center gap-1"
                style={{ color: 'var(--theme-text-secondary)' }}>
                <span className="text-[10px] px-1 py-0.5 rounded font-bold"
                  style={{ background: 'rgba(59,130,246,.08)', color: '#3B82F6' }}>EN</span>
                {word.translationEn}
              </span>
              {word.translationVi && (
                <span className="text-[13px] flex items-center gap-1"
                  style={{ color: 'var(--theme-text-muted)' }}>
                  <span className="text-[10px] px-1 py-0.5 rounded font-bold"
                    style={{ background: 'rgba(239,68,68,.08)', color: '#EF4444' }}>VN</span>
                  {word.translationVi}
                </span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <button onClick={handlePlayAudio}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
                opacity-50 hover:opacity-100 hover:scale-110"
              style={{ backgroundColor: ac.bg, color: ac.color }}
              title="Nghe phát âm">
              <IconVolume size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleLearned(word.id); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all duration-200"
              style={isLearned
                ? { background: 'linear-gradient(135deg, #22C55E, #16A34A)', borderColor: 'transparent', color: 'white' }
                : { borderColor: 'var(--theme-border)', color: 'transparent' }
              }
              title={isLearned ? 'Đã học' : 'Đánh dấu đã học'}>
              <IconCheck size={14} />
            </button>
          </div>
        </div>

        {/* Expand hint */}
        {!showDetails && (word.examples?.length || word.tips?.length) ? (
          <p className="mt-2 text-[11px]" style={{ color: ac.color }}>
            Nhấn để xem chi tiết →
          </p>
        ) : null}
      </div>

      {/* Expanded details */}
      {showDetails && (
        <div className="px-4 pb-4 pt-2 space-y-3" style={{ borderTop: '1px solid var(--theme-border)' }}>
          {word.examples && word.examples.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold mb-1.5 flex items-center gap-1.5"
                style={{ color: 'var(--theme-text-muted)' }}>
                <span className="w-5 h-5 rounded-md flex items-center justify-center"
                  style={{ background: ac.bg }}>
                  <IconVolume size={11} style={{ color: ac.color }} />
                </span>
                Ví dụ
              </p>
              <ul className="space-y-1.5">
                {word.examples.map((ex, i) => (
                  <li key={i} className="text-[13px] italic pl-3 border-l-2"
                    style={{ borderColor: ac.color, color: 'var(--theme-text-secondary)' }}>
                    „{ex}"
                  </li>
                ))}
              </ul>
            </div>
          )}

          {word.tips && word.tips.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold mb-1.5 flex items-center gap-1.5"
                style={{ color: 'var(--theme-text-muted)' }}>
                <span className="w-5 h-5 rounded-md flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,.1)' }}>
                  <IconLightbulb size={11} style={{ color: '#F59E0B' }} />
                </span>
                Mẹo nhớ
              </p>
              <ul className="space-y-1">
                {word.tips.map((tip, i) => (
                  <li key={i} className="text-[13px] pl-3"
                    style={{ color: 'var(--theme-text-secondary)' }}>
                    • {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {word.imageUrl && (
            <div className="mt-2">
              <img src={word.imageUrl} alt={word.word}
                className="w-full max-w-50 h-auto rounded-xl border"
                style={{ borderColor: 'var(--theme-border)' }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Filter Types
// ============================================
type FilterMode = 'all' | 'core' | 'learned' | 'unlearned';

// ============================================
// Main Page Component
// ============================================
export default function TopicDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { isAuthenticated } = useAuthStore();
  const { data: topic, isLoading, error } = useTopic(slug);
  const updateProgressMutation = useUpdateTopicProgress();

  const [learnedWords, setLearnedWords] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (topic) {
      const stored = localStorage.getItem(`topic-learned-${topic.id}`);
      if (stored) {
        try { setLearnedWords(new Set(JSON.parse(stored))); }
        catch (e) { console.error('Error loading learned words:', e); }
      }
    }
  }, [topic]);

  const syncProgressToServer = (newLearnedCount: number) => {
    if (isAuthenticated && topic) {
      updateProgressMutation.mutate({ topicId: topic.id, wordsLearned: newLearnedCount });
    }
  };

  const saveLearned = (newSet: Set<string>) => {
    if (topic) {
      localStorage.setItem(`topic-learned-${topic.id}`, JSON.stringify([...newSet]));
      syncProgressToServer(newSet.size);
    }
  };

  const toggleLearned = (wordId: string) => {
    const newSet = new Set(learnedWords);
    if (newSet.has(wordId)) newSet.delete(wordId); else newSet.add(wordId);
    setLearnedWords(newSet);
    saveLearned(newSet);
  };

  const markAllLearned = () => {
    if (topic?.words) {
      const allIds = new Set(topic.words.map(w => w.id));
      setLearnedWords(allIds);
      saveLearned(allIds);
    }
  };

  const resetProgress = () => {
    const newSet = new Set<string>();
    setLearnedWords(newSet);
    saveLearned(newSet);
  };

  const filteredWords = useMemo(() => {
    if (!topic?.words) return [];
    let words = [...topic.words];
    switch (filterMode) {
      case 'core': words = words.filter(w => w.isCore); break;
      case 'learned': words = words.filter(w => learnedWords.has(w.id)); break;
      case 'unlearned': words = words.filter(w => !learnedWords.has(w.id)); break;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      words = words.filter(w =>
        w.word.toLowerCase().includes(q) ||
        w.translationEn.toLowerCase().includes(q) ||
        w.translationVi?.toLowerCase().includes(q)
      );
    }
    return words;
  }, [topic?.words, filterMode, searchQuery, learnedWords]);

  const progress = topic?.words ? Math.round((learnedWords.size / topic.words.length) * 100) : 0;
  const topicColor = topic?.color || '#3B82F6';

  // Loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 rounded-lg w-1/3" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
            <div className="h-4 rounded-lg w-1/2" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
            <div className="h-40 rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (error || !topic) {
    return (
      <MainLayout>
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(239,68,68,.12), rgba(239,68,68,.06))' }}>
            <IconSearch size={28} style={{ color: '#EF4444' }} />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
            Không tìm thấy chủ đề
          </h1>
          <p className="text-[13px] mb-4" style={{ color: 'var(--theme-text-muted)' }}>
            Chủ đề "{slug}" không tồn tại hoặc đã bị xóa
          </p>
          <Link href="/topics"
            className="flex items-center gap-1.5 mx-auto w-fit text-[13px] font-medium transition-opacity hover:opacity-70"
            style={{ color: '#3B82F6' }}>
            <IconChevronLeft size={16} /> Quay lại danh sách
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[13px] mb-5">
          <Link href="/topics" className="font-medium transition-opacity hover:opacity-70"
            style={{ color: '#3B82F6' }}>
            Chủ đề
          </Link>
          <IconChevronRight size={14} style={{ color: 'var(--theme-text-muted)' }} />
          <span className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
            {topic.nameDe}
          </span>
        </div>

        {/* Header card */}
        <div className="relative overflow-hidden p-6 rounded-2xl mb-6"
          style={{
            background: `linear-gradient(135deg, ${topicColor}15, ${topicColor}05)`,
            border: `1px solid ${topicColor}25`,
          }}>
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full"
            style={{ backgroundColor: topicColor, opacity: 0.04 }} />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full"
            style={{ backgroundColor: topicColor, opacity: 0.03 }} />

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                style={{ background: `linear-gradient(135deg, ${topicColor}25, ${topicColor}15)` }}>
                {topic.icon || '📚'}
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                  {topic.nameDe}
                </h1>
                <p className="text-[14px]" style={{ color: 'var(--theme-text-muted)' }}>{topic.nameVi}</p>
                {topic.descriptionVi && (
                  <p className="text-[12px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                    {topic.descriptionVi}
                  </p>
                )}
              </div>
            </div>

            <span className="text-[12px] font-bold px-2.5 py-1 rounded-lg"
              style={{ background: `${topicColor}18`, color: topicColor }}>
              {topic.level}
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative mt-5">
            <div className="flex items-center justify-between text-[13px] mb-2">
              <span style={{ color: 'var(--theme-text-secondary)' }}>
                Đã học: {learnedWords.size}/{topic.words?.length || 0} từ
              </span>
              <span className="font-bold" style={{ color: topicColor }}>{progress}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: progress >= 100
                    ? 'linear-gradient(90deg, #22C55E, #16A34A)'
                    : `linear-gradient(90deg, ${topicColor}, ${topicColor}cc)`,
                }} />
            </div>
          </div>

          {/* Quick actions */}
          <div className="relative flex flex-wrap gap-2 mt-4">
            <button onClick={markAllLearned}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: 'rgba(34,197,94,.1)', color: '#22C55E' }}>
              <IconCheckAll size={14} /> Đánh dấu tất cả
            </button>
            <button onClick={resetProgress}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              <IconRotateCcw size={14} /> Học lại từ đầu
            </button>
            <Link href={`/games/quick-quiz?topic=${topic.slug}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: 'rgba(59,130,246,.1)', color: '#3B82F6' }}>
              <IconGamepad size={14} /> Chơi Quiz
            </Link>
          </div>

          {updateProgressMutation.isPending && (
            <div className="relative mt-2 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
              Đang lưu...
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="p-4 rounded-2xl border mb-6"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex-1 min-w-50 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--theme-text-muted)' }}>
                <IconSearch size={16} />
              </div>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm từ..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border text-[13px] transition-all
                  focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--theme-border)',
                  backgroundColor: 'var(--theme-bg-secondary)',
                  color: 'var(--theme-text-primary)',
                  '--tw-ring-color': topicColor,
                } as React.CSSProperties} />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1">
              {[
                { key: 'all', label: 'Tất cả', icon: null },
                { key: 'core', label: 'Core', icon: IconStar },
                { key: 'unlearned', label: 'Chưa học', icon: null },
                { key: 'learned', label: 'Đã học', icon: IconCheck },
              ].map(item => {
                const isActive = filterMode === item.key;
                const Ic = item.icon;
                return (
                  <button key={item.key}
                    onClick={() => setFilterMode(item.key as FilterMode)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200"
                    style={isActive
                      ? { background: `linear-gradient(135deg, ${topicColor}, ${topicColor}cc)`, color: 'white' }
                      : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                    }>
                    {Ic && <Ic size={12} />}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-2.5 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
            Hiển thị {filteredWords.length} / {topic.words?.length || 0} từ
          </div>
        </div>

        {/* Word list */}
        <div className="space-y-3">
          {filteredWords.map((word, index) => (
            <WordCard
              key={word.id}
              word={word}
              index={index + 1}
              isLearned={learnedWords.has(word.id)}
              onToggleLearned={toggleLearned}
            />
          ))}
        </div>

        {/* Empty state */}
        {filteredWords.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3"
              style={{ background: 'linear-gradient(135deg, rgba(107,114,128,.12), rgba(107,114,128,.06))' }}>
              <IconSearch size={24} style={{ color: 'var(--theme-text-muted)' }} />
            </div>
            <p className="text-[14px]" style={{ color: 'var(--theme-text-muted)' }}>
              {searchQuery
                ? `Không tìm thấy từ nào khớp với "${searchQuery}"`
                : filterMode === 'learned'
                ? 'Bạn chưa học từ nào trong chủ đề này'
                : filterMode === 'unlearned'
                ? 'Bạn đã học hết tất cả từ trong chủ đề này! 🎉'
                : 'Chủ đề này chưa có từ vựng'}
            </p>
          </div>
        )}

        {/* Bottom navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Link href="/topics"
            className="flex items-center gap-1.5 text-[13px] font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--theme-text-muted)' }}>
            <IconChevronLeft size={16} /> Quay lại
          </Link>

          {progress === 100 && (
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-semibold" style={{ color: '#22C55E' }}>
                🎉 Hoàn thành!
              </span>
              <Link href="/topics"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold text-white
                  transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)' }}>
                Chủ đề tiếp theo <IconChevronRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}