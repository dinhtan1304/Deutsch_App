'use client';

import { useState, useEffect, useRef } from 'react';
import { PersonalWord, WordTypeInfo, GenderInfo, Gender, WordCollection } from '@/types/personalWord';
import { IconVolume, IconStar, IconLightbulb, IconCheck } from '@/components/ui/Icons';
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
      <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: 'var(--theme-text-muted)', borderBottom: '1px solid var(--theme-border)' }}>
        Thêm vào thư mục
      </p>
      {collections.length === 0 ? (
        <p className="px-3 py-3 text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
          Chưa có thư mục nào
        </p>
      ) : (
        collections.map(col => {
          const checked = wordCollectionIds.has(col.id);
          const isPending = addMutation.isPending || removeMutation.isPending;
          return (
            <button key={col.id}
              onClick={() => !isPending && toggle(col)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-all text-left hover:opacity-80"
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
              <span className="text-[11px] shrink-0" style={{ color: 'var(--theme-text-muted)' }}>
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
}

export function WordBankCard({ word, onToggleFavorite, onSpeak, collections = [] }: WordBankCardProps) {
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
          ? <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>Pl: die {word.nomenData.plural}</span>
          : null;
      case 'verb':
        return (
          <div className="flex flex-wrap gap-1">
            {word.verbData?.partizipII && <span className="px-1.5 py-0.5 rounded text-[11px]" style={chipStyle('rgba(239,68,68,.1)', '#EF4444')}>{word.verbData.partizipII}</span>}
            {word.verbData?.hilfsverb && <span className="px-1.5 py-0.5 rounded text-[11px]" style={chipStyle('var(--theme-bg-secondary)', 'var(--theme-text-muted)')}>+{word.verbData.hilfsverb}</span>}
            {word.verbData?.trennbar && <span className="px-1.5 py-0.5 rounded text-[11px]" style={chipStyle('rgba(139,92,246,.1)', '#8B5CF6')}>trennbar</span>}
          </div>
        );
      case 'adjektiv':
        return (word.adjektivData?.komparativ || word.adjektivData?.superlativ) ? (
          <div className="flex flex-wrap gap-1">
            {word.adjektivData.komparativ && <span className="px-1.5 py-0.5 rounded text-[11px]" style={chipStyle('rgba(245,158,11,.1)', '#D97706')}>{word.adjektivData.komparativ}</span>}
            {word.adjektivData.superlativ && <span className="px-1.5 py-0.5 rounded text-[11px]" style={chipStyle('rgba(245,158,11,.1)', '#D97706')}>{word.adjektivData.superlativ}</span>}
          </div>
        ) : null;
      case 'praposition':
        return word.prapositionData?.kasus ? (
          <div className="flex flex-wrap gap-1">
            {word.prapositionData.kasus.map(k => <span key={k} className="px-1.5 py-0.5 rounded text-[11px]" style={chipStyle('rgba(236,72,153,.1)', '#EC4899')}>+{k}</span>)}
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
    <div className="group p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', borderLeft: `4px solid ${typeInfo.color}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: typeInfo.color }}>
              {typeInfo.icon} {typeInfo.labelDe}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[11px] font-medium"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              {word.level}
            </span>
            {word.category && (
              <span className="px-1.5 py-0.5 rounded text-[11px]"
                style={{ backgroundColor: 'rgba(59,130,246,.08)', color: '#3B82F6' }}>
                {word.category}
              </span>
            )}
          </div>
          <div className="text-xl">{displayWord()}</div>
          <div className="mt-1">{renderDetails()}</div>
        </div>
        <div className="relative flex items-center gap-0.5 shrink-0">
          <button onClick={handleSpeak}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all opacity-50 hover:opacity-100"
            style={{ color: 'var(--theme-text-muted)' }}
            title="Phát âm">
            <IconVolume size={16} />
          </button>
          <button onClick={() => onToggleFavorite(word.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            title="Yêu thích">
            <IconStar size={16} style={word.isFavorite
              ? { fill: '#F59E0B', color: '#F59E0B' }
              : { color: 'var(--theme-text-muted)', opacity: 0.5 }} />
          </button>
          {/* Add to collection */}
          <button
            onClick={() => setShowCollPopover(v => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all text-[16px]"
            title="Thêm vào thư mục"
            style={{ opacity: showCollPopover ? 1 : 0.45 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
          </button>
          {showCollPopover && (
            <CollectionPopover
              wordId={word.id}
              collections={collections}
              onClose={() => setShowCollPopover(false)}
            />
          )}
        </div>
      </div>

      <div className="flex gap-3 text-[12px] mt-2">
        <span className="flex items-center gap-1.5" style={{ color: 'var(--theme-text-muted)' }}>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: 'rgba(59,130,246,.1)', color: '#3B82F6' }}>EN</span>
          {word.translationEn}
        </span>
        <span className="flex items-center gap-1.5" style={{ color: 'var(--theme-text-muted)' }}>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: 'rgba(239,68,68,.08)', color: '#EF4444' }}>VN</span>
          {word.translationVi}
        </span>
      </div>

      {word.examples?.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2 text-[11px] italic truncate" style={{ color: 'var(--theme-text-muted)' }}>
          <IconVolume size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
          {word.examples[0]}
        </div>
      )}

      {word.tags && word.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {word.tags.map((t, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded text-[11px]"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              #{t}
            </span>
          ))}
        </div>
      )}

      {word.notes && (
        <div className="flex items-center gap-1.5 mt-2 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
          <IconLightbulb size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
          {word.notes}
        </div>
      )}
    </div>
  );
}
