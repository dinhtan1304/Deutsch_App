'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTopic, useUpdateTopicProgress } from '@/hooks/useTopics';
import { useAuthStore } from '@/stores/authStore';
import type { TopicWord } from '@/types/topic';
import {
  IconSearch, IconChevronLeft, IconChevronRight,
  IconVolume, IconCheck, IconCheckAll, IconRotateCcw,
  IconLightbulb, IconStar, IconBookOpen, IconCards, IconPenLine, IconLink,
} from '@/components/ui/Icons';
import { TopicFlashcard } from '@/components/topics/TopicFlashcard';
import { TopicQuiz } from '@/components/topics/TopicQuiz';
import { TopicMatching } from '@/components/topics/TopicMatching';

// ─── Level-based Learning Tips ───
const LEVEL_TIPS: Record<string, { title: string; tips: string[] }> = {
  A1: {
    title: 'M\u1eb9o h\u1ecdc A1',
    tips: [
      'T\u1ea5t c\u1ea3 danh t\u1eeb ti\u1ebfng \u0110\u1ee9c \u0111\u1ec1u vi\u1ebft hoa v\u00e0 c\u00f3 gi\u1ed1ng: der (nam), die (n\u1eef), das (trung). H\u00e3y h\u1ecdc gi\u1ed1ng c\u00f9ng v\u1edbi t\u1eeb!',
      'C\u1ea5u tr\u00fac c\u00e2u c\u01a1 b\u1ea3n: Subjekt + Verb + Objekt. V\u00ed d\u1ee5: Ich trinke Wasser.',
      'S\u1ed1 nhi\u1ec1u th\u01b0\u1eddng thay \u0111\u1ed5i: -e, -en, -er, -s ho\u1eb7c \u00dcmlaut (\u00e4/\u00f6/\u00fc). V\u00ed d\u1ee5: das Haus \u2192 die H\u00e4user.',
    ],
  },
  A2: {
    title: 'M\u1eb9o h\u1ecdc A2',
    tips: [
      'T\u1eeb gh\u00e9p (Komposita) r\u1ea5t ph\u1ed5 bi\u1ebfn: K\u00fchl + Schrank = K\u00fchlschrank. Gi\u1ed1ng c\u1ee7a t\u1eeb gh\u00e9p theo t\u1eeb cu\u1ed1i.',
      'Tr\u1ea1ng t\u1eeb ch\u1ec9 th\u1eddi gian: gestern (h\u00f4m qua), heute (h\u00f4m nay), morgen (ng\u00e0y mai) \u0111\u1eb7t \u1edf \u0111\u1ea7u ho\u1eb7c sau \u0111\u1ed9ng t\u1eeb.',
      'Ch\u00fa \u00fd Dativ sau c\u00e1c gi\u1edbi t\u1eeb: mit, nach, bei, seit, von, zu, aus \u2192 lu\u00f4n \u0111i v\u1edbi Dativ.',
    ],
  },
  B1: {
    title: 'M\u1eb9o h\u1ecdc B1',
    tips: [
      'Ti\u1ec1n t\u1ed1 \u0111\u1ed9ng t\u1eeb thay \u0111\u1ed5i ngh\u0129a: ver- (bi\u1ebfn \u0111\u1ed5i), be- (t\u00e1c \u0111\u1ed9ng), ent- (t\u00e1ch r\u1eddi), er- (\u0111\u1ea1t \u0111\u01b0\u1ee3c).',
      'Nebens\u00e4tze (m\u1ec7nh \u0111\u1ec1 ph\u1ee5): \u0111\u1ed9ng t\u1eeb lu\u00f4n \u1edf cu\u1ed1i c\u00e2u. V\u00ed d\u1ee5: Ich wei\u00df, dass er krank ist.',
      'H\u1ecdc th\u00eam Redewendungen (th\u00e0nh ng\u1eef) \u0111\u1ec3 ngh\u1ec7 t\u1ef1 nhi\u00ean h\u01a1n: "Hals- und Beinbruch!" = Ch\u00fac may m\u1eafn!',
    ],
  },
  B2: {
    title: 'M\u1eb9o h\u1ecdc B2',
    tips: [
      'Genitiv ng\u00e0y c\u00e0ng quan tr\u1ecdng: w\u00e4hrend des Sommers, trotz des Regens, wegen des Wetters.',
      '\u0110\u1ecdc b\u00e1o ti\u1ebfng \u0110\u1ee9c (Spiegel, Zeit) \u0111\u1ec3 m\u1edf r\u1ed9ng v\u1ed1n t\u1eeb chuy\u00ean ng\u00e0nh.',
      'Konjunktiv II cho l\u1ecbch s\u1ef1: K\u00f6nnten Sie mir bitte helfen? thay v\u00ec K\u00f6nnen Sie mir helfen?',
    ],
  },
};

// ─── Article Colors ───
const ArticleColor: Record<string, { color: string; gradient: string; bg: string }> = {
  der: { color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', bg: 'rgba(59,130,246,.08)' },
  die: { color: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899, #BE185D)', bg: 'rgba(236,72,153,.08)' },
  das: { color: '#22C55E', gradient: 'linear-gradient(135deg, #22C55E, #15803D)', bg: 'rgba(34,197,94,.08)' },
};

// ─── Tab type ───
type TabKey = 'words' | 'flashcard' | 'quiz' | 'matching';

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { key: 'words',     label: 'Từ vựng',  icon: IconBookOpen },
  { key: 'flashcard', label: 'Flashcard', icon: IconCards    },
  { key: 'quiz',      label: 'Quiz',      icon: IconPenLine  },
  { key: 'matching',  label: 'Nối từ',   icon: IconLink     },
];

// ============================================
// Word Card Component (giữ nguyên)
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
        backgroundColor: 'var(--theme-bg-card)',
        borderTopColor: showDetails ? ac.color : 'var(--theme-border)',
        borderRightColor: showDetails ? ac.color : 'var(--theme-border)',
        borderBottomColor: showDetails ? ac.color : 'var(--theme-border)',
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

  const { isAuthenticated, user } = useAuthStore();
  const { data: topic, isLoading, error } = useTopic(slug);
  const updateProgressMutation = useUpdateTopicProgress();

  const [learnedWords, setLearnedWords] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('words');
  const [showTips, setShowTips] = useState(false);

  // localStorage key scoped per user so different accounts on the same browser
  // don't share or overwrite each other's progress.
  const lsKey = (topicId: string) =>
    user?.id ? `topic-learned-${user.id}-${topicId}` : null;

  // Debounce backend progress sync so rapid word toggles (e.g. marking 10 words
  // at once) don't fire a PUT request on every single click — batches them into one.
  const syncDebounceRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => () => {
    if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
  }, []);

  useEffect(() => {
    if (topic && user?.id) {
      const key = lsKey(topic.id);
      const stored = key ? localStorage.getItem(key) : null;
      if (stored) {
        try { setLearnedWords(new Set(JSON.parse(stored))); }
        catch { /* corrupted localStorage entry – ignore */ }
      } else {
        // Clear stale state when switching users or no key available
        setLearnedWords(new Set());
      }
    }
  }, [topic, user?.id]);

  const syncProgressToServer = (newLearnedCount: number) => {
    if (!isAuthenticated || !topic) return;
    if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
    syncDebounceRef.current = setTimeout(() => {
      syncDebounceRef.current = null;
      updateProgressMutation.mutate({ topicId: topic.id, wordsLearned: newLearnedCount });
    }, 600);
  };

  const saveLearned = (newSet: Set<string>) => {
    if (topic) {
      const key = lsKey(topic.id);
      if (key) localStorage.setItem(key, JSON.stringify([...newSet]));
      syncProgressToServer(newSet.size);
    }
  };

  const toggleLearned = (wordId: string) => {
    const newSet = new Set(learnedWords);
    if (newSet.has(wordId)) newSet.delete(wordId); else newSet.add(wordId);
    setLearnedWords(newSet);
    saveLearned(newSet);
  };

  const markLearned = (wordId: string) => {
    if (learnedWords.has(wordId)) return;
    const newSet = new Set(learnedWords).add(wordId);
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
    );
  }

  // Error state
  if (error || !topic) {
    return (
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(239,68,68,.12), rgba(239,68,68,.06))' }}>
            <IconSearch size={28} style={{ color: '#EF4444' }} />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
            Không tìm thấy chủ đề
          </h1>
          <p className="text-[13px] mb-4" style={{ color: 'var(--theme-text-muted)' }}>
            Chủ đề &quot;{slug}&quot; không tồn tại hoặc đã bị xóa
          </p>
          <Link href="/topics"
            className="flex items-center gap-1.5 mx-auto w-fit text-[13px] font-medium transition-opacity hover:opacity-70"
            style={{ color: '#3B82F6' }}>
            <IconChevronLeft size={16} /> Quay lại danh sách
          </Link>
        </div>
    );
  }

  return (
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
          </div>

          {updateProgressMutation.isPending && (
            <div className="relative mt-2 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
              Đang lưu...
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* MINI LESSON TIPS                             */}
        {/* ═══════════════════════════════════════════ */}
        {LEVEL_TIPS[topic.level] && (
          <div className="mb-6 rounded-2xl border overflow-hidden"
            style={{ borderColor: `${topicColor}20`, backgroundColor: 'var(--theme-bg-card)' }}>
            <button
              onClick={() => setShowTips(!showTips)}
              className="w-full flex items-center justify-between px-5 py-3.5 transition-colors"
              style={{ backgroundColor: `${topicColor}08` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${topicColor}15` }}>
                  <IconLightbulb size={16} style={{ color: topicColor }} />
                </div>
                <span className="text-[14px] font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                  {LEVEL_TIPS[topic.level].title}
                </span>
              </div>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="var(--theme-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: showTips ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showTips && (
              <div className="px-5 py-4 space-y-3">
                {LEVEL_TIPS[topic.level].tips.map((tip, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold"
                      style={{ background: `${topicColor}15`, color: topicColor }}>
                      {i + 1}
                    </div>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* TAB NAVIGATION                              */}
        {/* ═══════════════════════════════════════════ */}
        <div className="flex items-center gap-1 p-1 rounded-xl mb-6"
          style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const TabIcon = tab.icon;
            return (
              <button key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-[13px] font-semibold transition-all duration-200"
                style={isActive
                  ? {
                    backgroundColor: 'var(--theme-bg-card)',
                    color: topicColor,
                    boxShadow: '0 1px 3px rgba(0,0,0,.1)',
                  }
                  : { color: 'var(--theme-text-muted)' }
                }>
                <TabIcon size={15} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* TAB CONTENT                                 */}
        {/* ═══════════════════════════════════════════ */}

        {/* Tab: Từ vựng */}
        {activeTab === 'words' && (
          <>
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
          </>
        )}

        {/* Tab: Flashcard */}
        {activeTab === 'flashcard' && topic.words && (
          <TopicFlashcard
            words={topic.words}
            topicColor={topicColor}
            onMarkLearned={markLearned}
          />
        )}

        {/* Tab: Quiz */}
        {activeTab === 'quiz' && topic.words && (
          <TopicQuiz
            words={topic.words}
            topicColor={topicColor}
            onMarkLearned={markLearned}
          />
        )}

        {/* Tab: Matching */}
        {activeTab === 'matching' && topic.words && (
          <TopicMatching
            words={topic.words}
            topicColor={topicColor}
            onMarkLearned={markLearned}
          />
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
  );
}
