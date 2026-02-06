'use client';

import { PersonalWord, WordTypeInfo, GenderInfo } from '@/types/personalWord';
import { IconStar } from '@/components/ui/Icons';

interface WordBankCardProps {
  word: PersonalWord;
  onToggleFavorite: (id: string) => void;
  onSpeak?: (text: string) => void;
}

// ─── Inline SVG icons ───
function IconVolume({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M11 5 6 9H2v6h4l5 4zM15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

export function WordBankCard({ word, onToggleFavorite, onSpeak }: WordBankCardProps) {
  const typeInfo = WordTypeInfo[word.wordType];

  const displayWord = () => {
    if (word.wordType === 'nomen' && word.nomenData) {
      const gc = GenderInfo[word.nomenData.gender];
      return (
        <span className="flex items-baseline gap-1.5">
          <span style={{ color: gc.color }} className="font-bold text-[15px]">{word.nomenData.article}</span>
          <span className="font-bold text-[17px]" style={{ color: 'var(--theme-text-primary)' }}>{word.word}</span>
        </span>
      );
    }
    return (
      <span className="font-bold text-[17px]" style={{ color: 'var(--theme-text-primary)' }}>{word.word}</span>
    );
  };

  const renderDetails = () => {
    const pillStyle = (bg: string, color: string) => ({
      backgroundColor: bg,
      color,
    });

    switch (word.wordType) {
      case 'nomen':
        return word.nomenData?.plural
          ? <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>Pl: die {word.nomenData.plural}</span>
          : null;

      case 'verb':
        return (
          <div className="flex flex-wrap gap-1">
            {word.verbData?.partizipII && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                style={pillStyle('rgba(239,68,68,.1)', '#EF4444')}>
                {word.verbData.partizipII}
              </span>
            )}
            {word.verbData?.hilfsverb && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                style={pillStyle('var(--theme-bg-secondary)', 'var(--theme-text-muted)')}>
                +{word.verbData.hilfsverb}
              </span>
            )}
            {word.verbData?.trennbar && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                style={pillStyle('rgba(139,92,246,.1)', '#8B5CF6')}>
                trennbar
              </span>
            )}
          </div>
        );

      case 'adjektiv':
        return (word.adjektivData?.komparativ || word.adjektivData?.superlativ) ? (
          <div className="flex flex-wrap gap-1">
            {word.adjektivData.komparativ && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                style={pillStyle('rgba(245,158,11,.1)', '#F59E0B')}>
                {word.adjektivData.komparativ}
              </span>
            )}
            {word.adjektivData.superlativ && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                style={pillStyle('rgba(245,158,11,.1)', '#F59E0B')}>
                {word.adjektivData.superlativ}
              </span>
            )}
          </div>
        ) : null;

      case 'praposition':
        return word.prapositionData?.kasus ? (
          <div className="flex flex-wrap gap-1">
            {word.prapositionData.kasus.map(k => (
              <span key={k} className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                style={pillStyle('rgba(236,72,153,.1)', '#EC4899')}>
                +{k}
              </span>
            ))}
          </div>
        ) : null;

      default:
        return null;
    }
  };

  const handleSpeak = () => {
    if (!onSpeak) return;
    onSpeak(
      word.wordType === 'nomen' && word.nomenData
        ? `${word.nomenData.article} ${word.word}`
        : word.word,
    );
  };

  return (
    <div
      className="group p-4 rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{
        borderColor: 'var(--theme-border)',
        backgroundColor: 'var(--theme-bg-card)',
        borderLeftWidth: '3px',
        borderLeftColor: typeInfo.color,
      }}
    >
      {/* Top row: badges + actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Type + Level + Category badges */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${typeInfo.color}, ${typeInfo.color}dd)` }}>
              {typeInfo.labelDe}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              {word.level}
            </span>
            {word.category && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                style={{ backgroundColor: 'rgba(59,130,246,.08)', color: '#3B82F6' }}>
                {word.category}
              </span>
            )}
          </div>

          {/* Word display */}
          <div className="mb-1">{displayWord()}</div>

          {/* Grammatical details */}
          <div className="mt-1">{renderDetails()}</div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleSpeak}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
              hover:scale-110 opacity-50 hover:opacity-100"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}
            title="Phát âm"
          >
            <IconVolume size={15} />
          </button>
          <button
            onClick={() => onToggleFavorite(word.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
              hover:scale-110"
            style={{
              backgroundColor: word.isFavorite ? 'rgba(234,179,8,.12)' : 'var(--theme-bg-secondary)',
              color: word.isFavorite ? '#EAB308' : 'var(--theme-text-muted)',
            }}
            title="Yêu thích"
          >
            <IconStar size={15} style={word.isFavorite ? { fill: '#EAB308' } : {}} />
          </button>
        </div>
      </div>

      {/* Translations */}
      <div className="flex gap-4 mt-2.5">
        <span className="text-[13px]" style={{ color: 'var(--theme-text-secondary)' }}>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded mr-1"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>EN</span>
          {word.translationEn}
        </span>
        {word.translationVi && (
          <span className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded mr-1"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>VN</span>
            {word.translationVi}
          </span>
        )}
      </div>

      {/* Example */}
      {word.examples?.length > 0 && (
        <div className="mt-2 text-[12px] italic truncate" style={{ color: 'var(--theme-text-muted)' }}>
          💬 „{word.examples[0]}"
        </div>
      )}

      {/* Tags */}
      {word.tags && word.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {word.tags.map((t, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded-md text-[10px]"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Notes */}
      {word.notes && (
        <div className="mt-2 text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
          📝 {word.notes}
        </div>
      )}
    </div>
  );
}