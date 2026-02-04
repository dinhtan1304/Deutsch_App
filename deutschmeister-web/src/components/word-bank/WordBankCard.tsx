'use client';

import { PersonalWord, WordTypeInfo, GenderInfo } from '@/types/personalWord';

interface WordBankCardProps {
  word: PersonalWord;
  onToggleFavorite: (id: string) => void;
  onSpeak?: (text: string) => void;
}

export function WordBankCard({ word, onToggleFavorite, onSpeak }: WordBankCardProps) {
  const typeInfo = WordTypeInfo[word.wordType];

  const displayWord = () => {
    if (word.wordType === 'nomen' && word.nomenData) {
      const gc = GenderInfo[word.nomenData.gender];
      return (<span><span style={{ color: gc.color }} className="font-bold">{word.nomenData.article}</span>{' '}<span className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>{word.word}</span></span>);
    }
    return <span className="font-bold" style={{ color: 'var(--theme-text-primary)' }}>{word.word}</span>;
  };

  const renderDetails = () => {
    switch (word.wordType) {
      case 'nomen': return word.nomenData?.plural ? <span className="text-xs text-gray-400">Pl: die {word.nomenData.plural}</span> : null;
      case 'verb': return (<div className="flex flex-wrap gap-1">
        {word.verbData?.partizipII && <span className="px-1.5 py-0.5 rounded text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">{word.verbData.partizipII}</span>}
        {word.verbData?.hilfsverb && <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-500">+{word.verbData.hilfsverb}</span>}
        {word.verbData?.trennbar && <span className="px-1.5 py-0.5 rounded text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600">trennbar</span>}
      </div>);
      case 'adjektiv': return (word.adjektivData?.komparativ || word.adjektivData?.superlativ) ? (<div className="flex flex-wrap gap-1">
        {word.adjektivData.komparativ && <span className="px-1.5 py-0.5 rounded text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600">{word.adjektivData.komparativ}</span>}
        {word.adjektivData.superlativ && <span className="px-1.5 py-0.5 rounded text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600">{word.adjektivData.superlativ}</span>}
      </div>) : null;
      case 'praposition': return word.prapositionData?.kasus ? (<div className="flex flex-wrap gap-1">
        {word.prapositionData.kasus.map(k => <span key={k} className="px-1.5 py-0.5 rounded text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-600">+{k}</span>)}
      </div>) : null;
      default: return null;
    }
  };

  const handleSpeak = () => {
    if (!onSpeak) return;
    onSpeak(word.wordType === 'nomen' && word.nomenData ? `${word.nomenData.article} ${word.word}` : word.word);
  };

  return (
    <div className="group p-4 rounded-xl border transition-all hover:shadow-md" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', borderLeft: `4px solid ${typeInfo.color}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: typeInfo.color }}>{typeInfo.icon} {typeInfo.labelDe}</span>
            <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500">{word.level}</span>
            {word.category && <span className="px-1.5 py-0.5 rounded text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-500">{word.category}</span>}
          </div>
          <div className="text-xl">{displayWord()}</div>
          <div className="mt-1">{renderDetails()}</div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={handleSpeak} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-base opacity-60 hover:opacity-100" title="Phát âm">🔊</button>
          <button onClick={() => onToggleFavorite(word.id)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-base" title="Yêu thích">{word.isFavorite ? '⭐' : '☆'}</button>
        </div>
      </div>
      <div className="flex gap-4 text-sm mt-2"><span className="text-gray-500">🇬🇧 {word.translationEn}</span><span className="text-gray-500">🇻🇳 {word.translationVi}</span></div>
      {word.examples?.length > 0 && <div className="mt-2 text-xs italic text-gray-400 truncate">💬 {word.examples[0]}</div>}
      {word.tags && word.tags.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{word.tags.map((t, i) => <span key={i} className="px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-400">#{t}</span>)}</div>}
      {word.notes && <div className="mt-2 text-xs text-gray-400">📝 {word.notes}</div>}
    </div>
  );
}