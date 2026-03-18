import { apiGet, apiPost } from './client';

// -- Actual response from /words API --
interface WordApiItem {
  id: string;
  word: string;
  article?: string;
  gender?: string;
  plural?: string;
  translationEn?: string;
  translationVi?: string;
  category?: string;
  level?: string;
  examples?: string[];
  tips?: string[];
  wordType?: string;
  imageUrl?: string;
}

interface WordSearchResponse {
  data: WordApiItem[];
  total: number;
}

// -- Chuan hoa cho popup hien thi --
export interface DictionaryLookupResult {
  id: string;
  word: string;
  article?: string;
  gender?: string;
  plural?: string;
  translationVi: string;
  translationEn?: string;
  wordType?: string;
  level?: string;
  example?: string;
  exampleVi?: string;
  category?: string;
}

// -- Map tu API response -> popup format --
function mapWordToResult(w: WordApiItem): DictionaryLookupResult {
  return {
    id: w.id,
    word: w.word,
    article: w.article,
    gender: w.gender,
    plural: w.plural,
    translationVi: w.translationVi || '',
    translationEn: w.translationEn,
    wordType: w.wordType,
    level: w.level,
    example: w.examples?.[0],
    category: w.category,
  };
}

// -- API calls --
export const dictionaryLookupApi = {
  lookup: async (searchWord: string): Promise<DictionaryLookupResult | null> => {
    try {
      const result = await apiGet<WordSearchResponse>(
        `/words?search=${encodeURIComponent(searchWord)}&limit=5`
      );

      if (__DEV__) {
        console.log('[DictPopup] API response for "' + searchWord + '":', result);
      }

      if (!result.data || result.data.length === 0) return null;

      const lower = searchWord.toLowerCase();

      const exactMatch = result.data.find(
        (w) =>
          w.word.toLowerCase() === lower ||
          w.word.toLowerCase() === lower.replace(/^(der|die|das)\s+/i, '')
      );

      return mapWordToResult(exactMatch || result.data[0]);
    } catch (err) {
      if (__DEV__) {
        console.error('[DictPopup] Lookup error:', err);
      }
      return null;
    }
  },

  checkInWordBank: async (word: string): Promise<boolean> => {
    try {
      const result = await apiGet<{ exists: boolean; personalWordId: string | null }>(
        `/personal-words/check-word?word=${encodeURIComponent(word)}`
      );
      return result.exists;
    } catch {
      return false;
    }
  },

  quickAdd: async (data: {
    word: string;
    translationVi?: string | null;
    translationEn?: string | null;
    wordType?: string | null;
    gender?: string | null;
    plural?: string | null;
    example?: string | null;
    level?: string | null;
  }): Promise<void> => {
    await apiPost('/personal-words/quick-add', data);
  },
};
