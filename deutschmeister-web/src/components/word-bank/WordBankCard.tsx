'use client';

import { PersonalWord, WordTypeInfo, GenderInfo, Gender } from '@/types/personalWord';

interface WordBankCardProps {
  word: PersonalWord;
  onToggleFavorite: (id: string) => void;
  onSpeak?: (text: string) => void;
}

// ─── Inline SVG Icons ───
function IconVolume({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}
function IconStar({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconStarFilled({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function WordBankCard({ word, onToggleFavorite, onSpeak }: WordBankCardProps) {
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
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={handleSpeak}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all opacity-50 hover:opacity-100"
            style={{ color: 'var(--theme-text-muted)' }}
            title="Phát âm">
            <IconVolume size={16} />
          </button>
          <button onClick={() => onToggleFavorite(word.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            title="Yêu thích">
            {word.isFavorite ? <IconStarFilled size={16} /> : <IconStar size={16} style={{ color: 'var(--theme-text-muted)', opacity: 0.5 }} />}
          </button>
        </div>
      </div>

      <div className="flex gap-4 text-[12px] mt-2">
        <span style={{ color: 'var(--theme-text-muted)' }}>🇬🇧 {word.translationEn}</span>
        <span style={{ color: 'var(--theme-text-muted)' }}>🇻🇳 {word.translationVi}</span>
      </div>

      {word.examples?.length > 0 && (
        <div className="mt-2 text-[11px] italic truncate" style={{ color: 'var(--theme-text-muted)' }}>
          💬 {word.examples[0]}
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
        <div className="mt-2 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>📝 {word.notes}</div>
      )}
    </div>
  );
}