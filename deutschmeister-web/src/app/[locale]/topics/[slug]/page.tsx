'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useTopic, useUpdateTopicProgress } from '@/hooks/useTopics';
import { useAuthStore } from '@/stores/authStore';
import type { TopicWord } from '@/types/topic';
import { ACCENT, STATUS, GRADIENT } from '@/lib/tokens';
import {
  IconSearch, IconChevronLeft, IconChevronRight,
  IconVolume, IconCheckAll, IconRotateCcw,
  IconLightbulb, IconCards, IconPenLine, IconLink,
  IconHeadphones, IconKeyboard, IconFlame,
} from '@/components/ui/Icons';
import { speakGerman } from '@/lib/utils';
import { TopicFlashcard } from '@/components/topics/TopicFlashcard';
import { TopicQuiz } from '@/components/topics/TopicQuiz';
import { TopicMatching } from '@/components/topics/TopicMatching';
import { TopicWordDetailModal } from '@/components/topics/TopicWordDetailModal';

// ─── Level-based Learning Tips ───
type TipKey = 'tipsA1Title' | 'tipsA1_1' | 'tipsA1_2' | 'tipsA1_3'
  | 'tipsA2Title' | 'tipsA2_1' | 'tipsA2_2' | 'tipsA2_3'
  | 'tipsB1Title' | 'tipsB1_1' | 'tipsB1_2' | 'tipsB1_3'
  | 'tipsB2Title' | 'tipsB2_1' | 'tipsB2_2' | 'tipsB2_3';

const LEVEL_TIP_KEYS: Record<string, { titleKey: TipKey; tipKeys: [TipKey, TipKey, TipKey] }> = {
  A1: { titleKey: 'tipsA1Title', tipKeys: ['tipsA1_1', 'tipsA1_2', 'tipsA1_3'] },
  A2: { titleKey: 'tipsA2Title', tipKeys: ['tipsA2_1', 'tipsA2_2', 'tipsA2_3'] },
  B1: { titleKey: 'tipsB1Title', tipKeys: ['tipsB1_1', 'tipsB1_2', 'tipsB1_3'] },
  B2: { titleKey: 'tipsB2Title', tipKeys: ['tipsB2_1', 'tipsB2_2', 'tipsB2_3'] },
};

// ─── Article Colors ───
const ArticleColor: Record<string, { color: string; gradient: string; bg: string }> = {
  der: { color: ACCENT.srs,       gradient: `linear-gradient(135deg, ${ACCENT.srs}, #1D4ED8)`,       bg: `${ACCENT.srs}14` },
  die: { color: ACCENT.listening, gradient: `linear-gradient(135deg, ${ACCENT.listening}, #BE185D)`, bg: `${ACCENT.listening}14` },
  das: { color: ACCENT.reading,   gradient: `linear-gradient(135deg, ${ACCENT.reading}, #15803D)`,   bg: `${ACCENT.reading}14` },
};

// ─── Tab type ───
type TabKey = 'words' | 'flashcard' | 'quiz' | 'matching';

// ─── Study Modes Data ───
const STUDY_MODES = [
  { key: 'flashcard', labelKey: 'modeFlashcard', descKey: 'modeFlashcardDesc', icon: IconCards,      color: ACCENT.vocab,     gradient: GRADIENT.vocab,    disabled: false },
  { key: 'quiz',      labelKey: 'modeQuiz',      descKey: 'modeQuizDesc',      icon: IconPenLine,    color: ACCENT.games,     gradient: GRADIENT.xp,       disabled: false },
  { key: 'listening', labelKey: 'modeListening', descKey: 'modeListeningDesc', icon: IconHeadphones, color: ACCENT.srs,       gradient: GRADIENT.action,   disabled: true },
  { key: 'typing',    labelKey: 'modeTyping',    descKey: 'modeTypingDesc',    icon: IconKeyboard,   color: ACCENT.reading,   gradient: GRADIENT.reading,  disabled: true },
  { key: 'matching',  labelKey: 'modeMatching',  descKey: 'modeMatchingDesc',  icon: IconLink,       color: ACCENT.srs,       gradient: GRADIENT.action,   disabled: false },
  { key: 'mixed',     labelKey: 'modeMixed',     descKey: 'modeMixedDesc',     icon: IconFlame,      color: ACCENT.listening, gradient: GRADIENT.listening, disabled: true },
] as const;

type FilterMode = 'all' | 'core' | 'learned' | 'unlearned';

// ============================================
// Main Page Component
// ============================================
export default function TopicDetailPage() {
  const t = useTranslations('vocabulary.topicDetail');
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
  const [selectedWord, setSelectedWord] = useState<TopicWord | null>(null);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- lsKey only depends on user?.id which is already listed
  }, [topic, user?.id]);

  const syncProgressToServer = (newLearnedCount: number, wordIds: string[]) => {
    if (!isAuthenticated || !topic) return;
    if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
    syncDebounceRef.current = setTimeout(() => {
      syncDebounceRef.current = null;
      updateProgressMutation.mutate({ topicId: topic.id, wordsLearned: newLearnedCount, wordIds });
    }, 600);
  };

  const saveLearned = (newSet: Set<string>) => {
    if (topic) {
      const key = lsKey(topic.id);
      if (key) localStorage.setItem(key, JSON.stringify([...newSet]));
      syncProgressToServer(newSet.size, Array.from(newSet));
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

  const topicWords = topic?.words;
  const filteredWords = useMemo(() => {
    if (!topicWords) return [];
    let words = [...topicWords];
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
  }, [topicWords, filterMode, searchQuery, learnedWords]);

  const progress = topic?.words ? Math.round((learnedWords.size / topic.words.length) * 100) : 0;
  const topicColor = topic?.color || ACCENT.srs;

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
            style={{ background: `linear-gradient(135deg, ${STATUS.danger}1F, ${STATUS.danger}0F)` }}>
            <IconSearch size={28} style={{ color: STATUS.danger }} />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
            {t('notFoundTitle')}
          </h1>
          <p className="text-body mb-4" style={{ color: 'var(--theme-text-muted)' }}>
            {t('notFoundBody', { slug })}
          </p>
          <Link href="/topics"
            className="flex items-center gap-1.5 mx-auto w-fit text-body font-medium transition-opacity hover:opacity-70"
            style={{ color: ACCENT.srs }}>
            <IconChevronLeft size={16} /> {t('backToList')}
          </Link>
        </div>
    );
  }

  return (
      <div className="py-6">
        {/* Header card */}
        <div className="relative overflow-hidden p-6 rounded-2xl mb-6 shadow-sm border border-black/5 dark:border-white/5"
          style={{ backgroundColor: 'var(--theme-bg-card)' }}>
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full"
            style={{ backgroundColor: topicColor, opacity: 0.04 }} />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full"
            style={{ backgroundColor: topicColor, opacity: 0.03 }} />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-15 h-15 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                style={{ background: `linear-gradient(135deg, ${topicColor}, #6F89FF)` }}>
                {topic.icon || '📚'}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                  {topic.nameDe}
                </h1>
                <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>{topic.nameVi}</p>
                {topic.descriptionVi && (
                  <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                    {topic.descriptionVi}
                  </p>
                )}
              </div>
            </div>

            <span className="mono px-3 py-1 rounded-lg text-body font-bold shrink-0"
              style={{ background: `color-mix(in srgb, ${topicColor} 14%, transparent)`, color: topicColor }}>
              {topic.level}
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative mt-5">
            <div className="flex items-center justify-between text-body mb-2">
              <span style={{ color: 'var(--theme-text-secondary)' }}>
                {t('learnedProgress', { learned: learnedWords.size, total: topic.words?.length || 0 })}
              </span>
              <span className="font-bold" style={{ color: topicColor }}>{progress}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: progress >= 100
                    ? `linear-gradient(90deg, ${ACCENT.reading}, #16A34A)`
                    : `linear-gradient(90deg, ${topicColor}, ${topicColor}cc)`,
                }} />
            </div>
          </div>

          {/* Quick actions */}
          <div className="relative flex flex-wrap gap-2 mt-4">
            <button onClick={markAllLearned}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105"
              style={{ background: `${ACCENT.reading}1A`, color: ACCENT.reading }}>
              <IconCheckAll size={14} /> {t('markAll')}
            </button>
            <button onClick={resetProgress}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              <IconRotateCcw size={14} /> {t('restart')}
            </button>
          </div>

          {updateProgressMutation.isPending && (
            <div className="relative mt-2 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
              {t('saving')}
            </div>
          )}
        </div>


        {/* ═══════════════════════════════════════════ */}
        {/* STUDY MODES GRID                            */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'words' && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--theme-text-primary)' }}>{t('chooseStudyMode')}</h2>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {STUDY_MODES.map(mode => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.key}
                    onClick={() => !mode.disabled && setActiveTab(mode.key as TabKey)}
                    disabled={mode.disabled}
                    className={`word-card-v2 relative p-4.5 rounded-[14px] text-left overflow-hidden
                      ${mode.disabled ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
                    style={{
                      background: 'var(--theme-bg-card)',
                      border: '1px solid var(--theme-border)',
                      minHeight: 116,
                      ['--card-accent' as string]: mode.disabled ? 'var(--theme-border)' : mode.color,
                    } as React.CSSProperties}
                  >
                    {/* decorative blob */}
                    <div className="absolute -top-7 -right-7 w-22 h-22 rounded-full pointer-events-none"
                      style={{ background: `${mode.color}12`, filter: 'blur(16px)' }} />

                    {mode.disabled && (
                      <span className="absolute top-3 right-3 px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider"
                        style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
                        {t('comingSoon')}
                      </span>
                    )}

                    <div className="relative z-10 w-10 h-10 rounded-xl mb-3 flex items-center justify-center"
                      style={{ background: `${mode.color}1A`, color: mode.color }}>
                      <Icon size={20} />
                    </div>
                    <h3 className="relative z-10 font-bold text-[15px] leading-tight" style={{ color: 'var(--theme-text-primary)' }}>{t(mode.labelKey)}</h3>
                    <p className="relative z-10 text-xs leading-snug mt-1" style={{ color: 'var(--theme-text-muted)' }}>{t(mode.descKey)}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* WORD LIST TABLE                             */}
        {/* ═══════════════════════════════════════════ */}

        {activeTab === 'words' && (
          <div className="mb-6 border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm"
            style={{ backgroundColor: 'var(--theme-bg-card)' }}>
            
            {/* Header / Toolbar */}
            <div className="p-4 border-b border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-4"
              style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                {t('wordList')}
              </h2>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Search */}
                <div className="flex-1 sm:w-64 relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--theme-text-muted)' }}>
                    <IconSearch size={14} />
                  </div>
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2"
                    style={{
                      borderColor: 'var(--theme-border)',
                      backgroundColor: 'var(--theme-bg-card)',
                      color: 'var(--theme-text-primary)',
                      '--tw-ring-color': topicColor,
                    } as React.CSSProperties} />
                </div>
                
                {/* Filter dropdown */}
                <select value={filterMode} onChange={e => setFilterMode(e.target.value as FilterMode)}
                  className="px-3 py-2 rounded-xl border text-sm font-medium focus:outline-none"
                  style={{
                    borderColor: 'var(--theme-border)',
                    backgroundColor: 'var(--theme-bg-card)',
                    color: 'var(--theme-text-primary)',
                  }}>
                  <option value="all">{t('filterAll', { count: topic.words?.length || 0 })}</option>
                  <option value="learned">{t('filterLearned', { count: learnedWords.size })}</option>
                  <option value="unlearned">{t('filterUnlearned')}</option>
                  <option value="core">{t('filterCore')}</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {filteredWords.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>{t('noWordsFound')}</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="border-b border-black/5 dark:border-white/5">
                    <tr>
                      <th className="px-5 py-3 font-semibold" style={{ color: 'var(--theme-text-muted)' }}>{t('thWord')}</th>
                      <th className="px-5 py-3 font-semibold" style={{ color: 'var(--theme-text-muted)' }}>{t('thMeaning')}</th>
                      <th className="px-5 py-3 font-semibold" style={{ color: 'var(--theme-text-muted)' }}>{t('thType')}</th>
                      <th className="px-5 py-3 font-semibold" style={{ color: 'var(--theme-text-muted)' }}>{t('thExample')}</th>
                      <th className="px-5 py-3 font-semibold text-center" style={{ color: 'var(--theme-text-muted)' }}>{t('thKnown')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {filteredWords.map((word) => {
                      const isLearned = learnedWords.has(word.id);
                      const ac = ArticleColor[word.article] || { color: 'var(--theme-text-muted)', bg: 'var(--theme-bg-secondary)' };
                      
                      const handlePlay = () => {
                        const text = word.article ? `${word.article} ${word.word}` : word.word;
                        speakGerman(text);
                      };

                      return (
                        <tr key={word.id} onClick={() => setSelectedWord(word)} className="transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                          {/* TỪ VỰNG */}
                          <td className="px-5 py-3.5 align-middle">
                            <div className="flex items-center gap-3">
                              <button onClick={(e) => { e.stopPropagation(); handlePlay(); }}
                                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 shrink-0"
                                style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>
                                <IconVolume size={14} />
                              </button>
                              <div className="flex flex-col">
                                <span className="text-base font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                                  {word.article && <span style={{ color: ac.color }} className="mr-1">{word.article}</span>}
                                  {word.word}
                                </span>
                                {word.plural && (
                                  <span className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                                    {t('pluralPrefix', { plural: word.plural })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          
                          {/* NGHĨA */}
                          <td className="px-5 py-3.5 align-middle">
                            <span className="font-medium whitespace-normal line-clamp-2" style={{ color: 'var(--theme-text-primary)' }}>
                              {word.translationVi || word.translationEn}
                            </span>
                          </td>
                          
                          {/* LOẠI TỪ */}
                          <td className="px-5 py-3.5 align-middle">
                            {word.article ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                style={{ backgroundColor: ac.bg, color: ac.color }}>
                                {t('typeNoun')}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
                                {t('typeOther')}
                              </span>
                            )}
                          </td>
                          
                          {/* VÍ DỤ */}
                          <td className="px-5 py-3.5 align-middle max-w-62.5">
                            <span className="text-xs italic whitespace-normal line-clamp-2" style={{ color: 'var(--theme-text-secondary)' }}>
                              {word.examples?.[0] || word.tips?.[0] || '—'}
                            </span>
                          </td>
                          
                          {/* THUỘC */}
                          <td className="px-5 py-3.5 align-middle text-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleLearned(word.id); }}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
                                ${isLearned ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                ${isLearned ? 'translate-x-6' : 'translate-x-1'}`} 
                              />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Toolbar for Study Modes */}
        {activeTab !== 'words' && (
          <div className="mb-6 flex items-center justify-between p-2 rounded-2xl"
            style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
            <button onClick={() => setActiveTab('words')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: 'var(--theme-text-primary)' }}>
              <IconChevronLeft size={18} /> {t('backToList')}
            </button>
            <h2 className="text-lg font-bold px-4" style={{ color: topicColor }}>
              {(() => { const m = STUDY_MODES.find(m => m.key === activeTab); return m ? t(m.labelKey) : ''; })()}
            </h2>
            <div className="w-37.5" /> {/* spacer to center title */}
          </div>
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

        {/* ═══════════════════════════════════════════ */}
        {/* MINI LESSON TIPS (Moved to bottom)           */}
        {/* ═══════════════════════════════════════════ */}
        {LEVEL_TIP_KEYS[topic.level] && (
          <div className="mt-8 mb-6 rounded-2xl border overflow-hidden"
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
                <span className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                  {t(LEVEL_TIP_KEYS[topic.level]!.titleKey)}
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
                {LEVEL_TIP_KEYS[topic.level]!.tipKeys.map((tipKey, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-caption font-bold"
                      style={{ background: `${topicColor}15`, color: topicColor }}>
                      {i + 1}
                    </div>
                    <p className="text-body leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                      {t(tipKey)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Link href="/topics"
            className="flex items-center gap-1.5 text-body font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--theme-text-muted)' }}>
            <IconChevronLeft size={16} /> {t('back')}
          </Link>

          {progress === 100 && (
            <div className="flex items-center gap-3">
              <span className="text-body font-semibold" style={{ color: ACCENT.reading }}>
                {t('complete')}
              </span>
              <Link href="/topics"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-body font-semibold text-white
                  transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ background: GRADIENT.reading }}>
                {t('nextTopic')} <IconChevronRight size={14} />
              </Link>
            </div>
          )}
        </div>

        {selectedWord && (
          <TopicWordDetailModal
            word={selectedWord}
            onClose={() => setSelectedWord(null)}
            onSpeak={(text) => speakGerman(text)}
          />
        )}
      </div>
  );
}
