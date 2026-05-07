import { PersonalWord } from '@/types/personalWord';
import { Word, Gender, CEFRLevel } from '@/types';

export function personalWordToGameWord(pw: PersonalWord): Word {
  const nomen = pw.nomenData;
  return {
    id: pw.id,
    word: pw.word,
    article: nomen?.article ?? '',
    gender: (nomen?.gender ?? 'neuter') as Gender,
    plural: nomen?.plural ?? null,
    pronunciation: pw.pronunciation ?? null,
    imageUrl: null,
    translationEn: pw.translationEn,
    translationVi: pw.translationVi,
    category: pw.category ?? 'personal',
    level: pw.level as CEFRLevel,
    examples: pw.examples ?? [],
    tips: [],
  };
}

export function personalWordsToGameWords(pws: PersonalWord[]): Word[] {
  return pws.map(personalWordToGameWord);
}

export interface GameRequirement {
  requiresNoun: boolean;
  minWords: number;
}

export const GAME_REQUIREMENTS: Record<string, GameRequirement> = {
  'gender-quiz':    { requiresNoun: true,  minWords: 4 },
  'fill-blank':     { requiresNoun: true,  minWords: 4 },
  'quick-quiz':     { requiresNoun: true,  minWords: 4 },
  'time-challenge': { requiresNoun: true,  minWords: 10 },
  'flashcards':     { requiresNoun: false, minWords: 2 },
  'word-match':     { requiresNoun: false, minWords: 6 },
  'spelling':       { requiresNoun: false, minWords: 4 },
  'listening':      { requiresNoun: false, minWords: 4 },
};

export function canPlayGame(
  gameId: string,
  words: PersonalWord[],
): { canPlay: boolean; reason?: string } {
  const req = GAME_REQUIREMENTS[gameId];
  if (!req) return { canPlay: true };

  const eligible = req.requiresNoun
    ? words.filter(w => w.wordType === 'nomen' && w.nomenData?.article)
    : words;

  if (eligible.length < req.minWords) {
    return {
      canPlay: false,
      reason: req.requiresNoun
        ? `Cần ít nhất ${req.minWords} danh từ có mạo từ (có ${eligible.length})`
        : `Cần ít nhất ${req.minWords} từ (có ${eligible.length})`,
    };
  }
  return { canPlay: true };
}

export function getEligibleWordsForGame(gameId: string, words: PersonalWord[]): PersonalWord[] {
  const req = GAME_REQUIREMENTS[gameId];
  if (!req) return words;
  return req.requiresNoun
    ? words.filter(w => w.wordType === 'nomen' && w.nomenData?.article)
    : words;
}
