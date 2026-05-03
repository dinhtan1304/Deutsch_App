'use client';

import { useState, useEffect, useRef } from 'react';
import { ACCENT, STATUS } from '@/lib/tokens';
import { PersonalWord, WordTypeInfo, GenderInfo, Gender, WordCollection } from '@/types/personalWord';
import { IconVolume, IconStar, IconCheck } from '@/components/ui/Icons';
import { useWordCollections, useAddToCollection, useRemoveFromCollection } from '@/hooks/usePersonalWords';

// ── Collection Popover ────────────────────────────────────────────────────────

interface CollectionPopoverProps {
  wordId: string;
  collections: WordCollection[];
  onClose: () => void;
}

function CollectionPopover({ wordId, collections, onClose }: CollectionPopoverProps) {
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
        Thêm vào thư mục
      </p>
      {collections.length === 0 ? (
        <p className="px-3 py-3 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
          Chưa có thư mục nào
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
}

export function WordBankCard({ word, onToggleFavorite, onSpeak, collections = [], onClick }: WordBankCardProps) {
  const [showCollPopover, setShowCollPopover] = useState(false);
  const typeInfo = WordTypeInfo[word.wordType] ?? WordTypeInfo['andere'];

  const displayWord = () => {
    if (word.wordType === 'nomen' && word.nomenData) {
      const gc = GenderInfo[word.nomenData.gender as Gender] ?? GenderInfo['neuter'];
      return (
        <span>
          <span style={{ color: gc.color }} className="font-bold">{word.nomenData.article}</span>{' '}
          <span className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>{word.word}</span>
        </span>
      );
    }
    return <span className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>{word.word}</span>;
  };

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
      className="group flex flex-col bg-[(--theme-bg-card)] rounded-3xl p-5 relative cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden shadow-sm"
      style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)' }}
    >
      {/* Decorative Top Border Glow based on word type */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: typeInfo.color }} />

      {/* Header: Actions (Star, Folder) & Tags */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap"
            style={{ backgroundColor: typeInfo.color + '15', color: typeInfo.color }}>
            {typeInfo.icon} {typeInfo.labelDe}
          </span>
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
            {word.level}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(word.id); }}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-110 hover:bg-black/5"
            title="Yêu thích">
            <IconStar size={16} style={word.isFavorite
              ? { fill: ACCENT.xp, color: ACCENT.xp }
              : { color: 'var(--theme-text-muted)', opacity: 0.5 }} />
          </button>
          
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowCollPopover(v => !v); }}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-all text-base hover:bg-black/5"
              title="Thêm vào thư mục"
              style={{ opacity: showCollPopover ? 1 : 0.6, color: 'var(--theme-text-secondary)' }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
            </button>
            {showCollPopover && (
              <div className="absolute right-0 top-full mt-1 z-50">
                <CollectionPopover
                  wordId={word.id}
                  collections={collections}
                  onClose={() => setShowCollPopover(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Word + Pronunciation */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl font-black truncate pr-2" style={{ color: 'var(--theme-text-primary)' }}>
          {displayWord()}
        </span>
        <button onClick={(e) => { e.stopPropagation(); handleSpeak(); }}
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-110 shadow-sm"
          style={{ backgroundColor: `${typeInfo.color}15`, color: typeInfo.color }}
          title="Phát âm">
          <IconVolume size={18} />
        </button>
      </div>

      {/* Meaning & Secondary translation */}
      <div className="flex flex-col gap-1 mb-4">
        {word.translationVi && (
          <span className="font-medium text-sm line-clamp-2" style={{ color: 'var(--theme-text-primary)' }}>
            {word.translationVi}
          </span>
        )}
        {word.translationEn && (
          <span className="text-xs line-clamp-1 italic opacity-70" style={{ color: 'var(--theme-text-secondary)' }}>
            {word.translationEn}
          </span>
        )}
      </div>

      {/* Details & Tags (Verbs info, noun plural, etc.) */}
      <div className="mt-auto pt-3 flex flex-col gap-2 border-t border-[(--theme-border)]">
        <div className="min-h-6">
           {renderDetails()}
        </div>
        
        {word.tags && word.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {word.tags.map((t, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide"
                style={{ backgroundColor: 'var(--theme-bg-body)', color: 'var(--theme-text-muted)' }}>
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
