'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ACCENT, STATUS } from '@/lib/tokens';
import { PersonalWord, WordTypeInfo, WordCollection } from '@/types/personalWord';
import { IconVolume, IconStar, IconCheck } from '@/components/ui/Icons';
import { useWordCollections, useAddToCollection, useRemoveFromCollection } from '@/hooks/usePersonalWords';

// ── Collection Popover ────────────────────────────────────────────────────────

interface CollectionPopoverProps {
  wordId: string;
  collections: WordCollection[];
  onClose: () => void;
}

function CollectionPopover({ wordId, collections, onClose }: CollectionPopoverProps) {
  const t = useTranslations('vocabulary.wordBank.card');
  const ref = useRef<HTMLDivElement>(null);
  const { data: wordCollections = [] } = useWordCollections(wordId);
  const addMutation = useAddToCollection();
  const removeMutation = useRemoveFromCollection();

  const wordCollectionIds = new Set(wordCollections.map(c => c.id));

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const toggle = (col: WordCollection) => {
    if (wordCollectionIds.has(col.id)) {
      removeMutation.mutate({ collectionId: col.id, personalWordId: wordId });
    } else {
      addMutation.mutate({ collectionId: col.id, personalWordId: wordId });
    }
  };

  return (
    <div ref={ref}
      className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border shadow-lg overflow-hidden"
      style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
      <p className="px-3 py-2 text-caption font-semibold uppercase tracking-wide"
        style={{ color: 'var(--theme-text-muted)', borderBottom: '1px solid var(--theme-border)' }}>
        {t('addToFolder')}
      </p>
      {collections.length === 0 ? (
        <p className="px-3 py-3 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
          {t('noFolders')}
        </p>
      ) : (
        collections.map(col => {
          const checked = wordCollectionIds.has(col.id);
          const isPending = addMutation.isPending || removeMutation.isPending;
          return (
            <button key={col.id}
              onClick={() => !isPending && toggle(col)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-body transition-all text-left hover:opacity-80"
              style={{ color: 'var(--theme-text-primary)' }}>
              <div className="w-4 h-4 rounded flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: checked ? col.color : 'transparent',
                  borderColor: checked ? col.color : 'var(--theme-border)',
                }}>
                {checked && <IconCheck size={10} className="text-white" />}
              </div>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={col.color || 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
              <span className="flex-1 truncate">{col.name}</span>
              <span className="text-caption shrink-0" style={{ color: 'var(--theme-text-muted)' }}>
                {col.wordCount}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}

// ── WordBankCard ──────────────────────────────────────────────────────────────

interface WordBankCardProps {
  word: PersonalWord;
  onToggleFavorite: (id: string) => void;
  onSpeak?: (text: string) => void;
  collections?: WordCollection[];
  onClick?: () => void;
  /** Bulk-select (v2): shows a checkbox on hover / when any card is selected. */
  selected?: boolean;
  onToggleSelect?: () => void;
  anySelected?: boolean;
}

export function WordBankCard({ word, onToggleFavorite, onSpeak, collections = [], onClick, selected = false, onToggleSelect, anySelected = false }: WordBankCardProps) {
  const t = useTranslations('vocabulary.wordBank.card');
  const [showCollPopover, setShowCollPopover] = useState(false);
  const typeInfo = WordTypeInfo[word.wordType] ?? WordTypeInfo['andere'];

  // v2 article color-code (nouns) / type color (others). The accent drives the
  // POS chip, hover border (--card-accent), and speaker button tint.
  const isNoun = word.wordType === 'nomen' && !!word.nomenData;
  const GENDER_VAR: Record<string, string> = { masculine: 'var(--der)', feminine: 'var(--die)', neuter: 'var(--das)' };
  const accentColor = isNoun ? (GENDER_VAR[word.nomenData!.gender] ?? 'var(--das)') : typeInfo.color;
  const chipLabel = isNoun ? word.nomenData!.article : typeInfo.labelDe;

  const chipStyle = (bg: string, fg: string): React.CSSProperties => ({
    backgroundColor: bg, color: fg,
  });

  const renderDetails = () => {
    switch (word.wordType) {
      case 'nomen':
        return word.nomenData?.plural
          ? <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>Pl: die {word.nomenData.plural}</span>
          : null;
      case 'verb':
        return (
          <div className="flex flex-wrap gap-1">
            {word.verbData?.partizipII && <span className="px-1.5 py-0.5 rounded text-caption" style={chipStyle('rgba(239,68,68,.1)', STATUS.danger)}>{word.verbData.partizipII}</span>}
            {word.verbData?.hilfsverb && <span className="px-1.5 py-0.5 rounded text-caption" style={chipStyle('var(--theme-bg-secondary)', 'var(--theme-text-muted)')}>+{word.verbData.hilfsverb}</span>}
            {word.verbData?.trennbar && <span className="px-1.5 py-0.5 rounded text-caption" style={chipStyle('rgba(139,92,246,.1)', ACCENT.vocab)}>trennbar</span>}
          </div>
        );
      case 'adjektiv':
        return (word.adjektivData?.komparativ || word.adjektivData?.superlativ) ? (
          <div className="flex flex-wrap gap-1">
            {word.adjektivData.komparativ && <span className="px-1.5 py-0.5 rounded text-caption" style={chipStyle(`${ACCENT.xp}1a`, ACCENT.xpDark)}>{word.adjektivData.komparativ}</span>}
            {word.adjektivData.superlativ && <span className="px-1.5 py-0.5 rounded text-caption" style={chipStyle(`${ACCENT.xp}1a`, ACCENT.xpDark)}>{word.adjektivData.superlativ}</span>}
          </div>
        ) : null;
      case 'praposition':
        return word.prapositionData?.kasus ? (
          <div className="flex flex-wrap gap-1">
            {word.prapositionData.kasus.map(k => <span key={k} className="px-1.5 py-0.5 rounded text-caption" style={chipStyle('rgba(236,72,153,.1)', ACCENT.listening)}>+{k}</span>)}
          </div>
        ) : null;
      default:
        return null;
    }
  };

  const handleSpeak = () => {
    if (!onSpeak) return;
    onSpeak(word.wordType === 'nomen' && word.nomenData ? `${word.nomenData.article} ${word.word}` : word.word);
  };

  return (
    <div
      onClick={onClick}
      className="word-card-v2 group relative flex flex-col gap-2.5 rounded-[14px] p-4 cursor-pointer"
      style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', ['--card-accent' as string]: accentColor } as React.CSSProperties}
    >
      {/* Header: [select] POS/article chip + speaker */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {onToggleSelect && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
              aria-pressed={selected}
              className={`${anySelected ? 'flex' : 'hidden group-hover:flex'} w-4.5 h-4.5 rounded-[5px] items-center justify-center shrink-0 transition-colors`}
              style={{
                border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--theme-text-muted)'}`,
                background: selected ? 'var(--accent)' : 'transparent',
                color: 'var(--accent-on)',
              }}
            >
              {selected && <IconCheck size={11} />}
            </button>
          )}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-bold"
            style={{ background: `color-mix(in srgb, ${accentColor} 14%, transparent)`, color: accentColor }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
            {chipLabel}
          </span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); handleSpeak(); }}
          className="w-7.5 h-7.5 rounded-lg flex items-center justify-center shrink-0 transition-transform hover:scale-110"
          style={{ background: 'var(--theme-bg-secondary)', color: accentColor }}
          title={t('speak')}>
          <IconVolume size={14} />
        </button>
      </div>

      {/* Hero word + IPA */}
      <div>
        <h3 className="font-bold" style={{ fontSize: 26, letterSpacing: '-.02em', lineHeight: 1.1, color: 'var(--theme-text-primary)' }}>
          {word.word}
        </h3>
        {word.pronunciation && (
          <span className="mono inline-block mt-1 text-caption" style={{ color: 'var(--theme-text-muted)' }}>[{word.pronunciation}]</span>
        )}
      </div>

      {/* Meaning */}
      <div>
        {word.translationVi && (
          <div className="font-medium line-clamp-2" style={{ fontSize: 14.5, lineHeight: 1.3, color: 'var(--theme-text-primary)' }}>{word.translationVi}</div>
        )}
        {word.translationEn && (
          <div className="text-caption italic line-clamp-1 mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{word.translationEn}</div>
        )}
      </div>

      {/* Plural (noun) — v2 mono box */}
      {isNoun && word.nomenData!.plural && (
        <div className="rounded-[7px] px-2.5 py-1.5 mono text-[11.5px]" style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>
          <span style={{ color: 'var(--theme-text-muted)' }} className="mr-1.5">Plural</span>die {word.nomenData!.plural}
        </div>
      )}

      {/* User note (v2) */}
      {word.notes && (
        <div className="rounded-[7px] px-2.5 py-1.5 text-[11.5px] italic"
          style={{ background: 'color-mix(in srgb, var(--m-learning) 8%, transparent)', borderLeft: '2px solid var(--m-learning)', color: 'var(--theme-text-secondary)' }}>
          💭 {word.notes}
        </div>
      )}

      {/* Non-noun grammar details / tags */}
      {!isNoun && <div className="empty:hidden">{renderDetails()}</div>}
      {word.tags && word.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {word.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>#{tag}</span>
          ))}
        </div>
      )}

      <div className="flex-1" />

      {/* Footer: level + actions */}
      <div className="flex items-center justify-between gap-2">
        <span className="mono text-[10.5px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}>
          {word.level}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(word.id); }}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-transform hover:scale-110"
            style={{ color: word.isFavorite ? ACCENT.xp : 'var(--theme-text-muted)' }}
            title={t('favorite')}>
            <IconStar size={14} style={word.isFavorite ? { fill: ACCENT.xp } : undefined} />
          </button>
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setShowCollPopover(v => !v); }}
              className="w-7 h-7 flex items-center justify-center rounded-md transition-transform hover:scale-110"
              style={{ color: 'var(--theme-text-muted)' }}
              title={t('addToFolder')}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
            </button>
            {showCollPopover && (
              <CollectionPopover wordId={word.id} collections={collections} onClose={() => setShowCollPopover(false)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
