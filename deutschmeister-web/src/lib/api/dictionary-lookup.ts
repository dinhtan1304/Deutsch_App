import { apiGet, apiPost } from './client';

// ── Actual response from /words API ──
interface WordApiItem {
  id: string;
  word: string;           // "Schule"
  article?: string;       // "die"
  gender?: string;        // "feminine"
  plural?: string;        // "Schulen"
  translationEn?: string; // "school"
  translationVi?: string; // "trường học"
  category?: string;      // "education"
  level?: string;         // "A1"
  examples?: string[];    // ["Die Schule beginnt um 8 Uhr."]
  tips?: string[];
  wordType?: string;
  imageUrl?: string;
}

interface WordSearchResponse {
  data: WordApiItem[];
  total: number;
}

// ── Chuẩn hóa cho popup hiển thị ──
export interface DictionaryLookupResult {
  id: string;
  word: string;
  article?: string;        // "der" | "die" | "das"
  gender?: string;         // "masculine" | "feminine" | "neuter"
  plural?: string;
  translationVi: string;
  translationEn?: string;
  wordType?: string;
  level?: string;
  example?: string;
  exampleVi?: string;
  category?: string;
}

// ── Map từ API response → popup format ──
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

// ── API calls ──
export const dictionaryLookupApi = {
  /**
   * Tìm kiếm từ trong database 800+ words
   */
  lookup: async (searchWord: string): Promise<DictionaryLookupResult | null> => {
    try {
      const result = await apiGet<WordSearchResponse>(
        `/words?search=${encodeURIComponent(searchWord)}&limit=5`
      );

      if (process.env.NODE_ENV === 'development') {
        console.log('[DictPopup] API response for "' + searchWord + '":', result);
      }

      if (!result.data || result.data.length === 0) return null;

      const lower = searchWord.toLowerCase();

      // Ưu tiên exact match trên field `word`
      const exactMatch = result.data.find(
        (w) =>
          w.word.toLowerCase() === lower ||
          // Nếu user search "Schule" → match "Schule" (không cần article)
          w.word.toLowerCase() === lower.replace(/^(der|die|das)\s+/i, '')
      );

      return mapWordToResult(exactMatch ?? result.data[0]!);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[DictPopup] Lookup error:', err);
      }
      return null;
    }
  },

  /**
   * Kiểm tra từ đã có trong Personal Word Bank chưa
   */
  checkInWordBank: async (word: string): Promise<{ exists: boolean; personalWordId: string | null }> => {
    try {
      return await apiGet<{ exists: boolean; personalWordId: string | null }>(
        `/personal-words/check-word?word=${encodeURIComponent(word)}`
      );
    } catch {
      return { exists: false, personalWordId: null };
    }
  },

  /**
   * Thêm nhanh từ vào Word Bank từ Dictionary Popup
   */
  quickAdd: async (data: {
    word: string;
    translationVi?: string | null;
    translationEn?: string | null;
    wordType?: string | null;
    gender?: string | null;
    plural?: string | null;
    example?: string | null;
    level?: string | null;
  }): Promise<{ id: string }> => {
    return apiPost<{ id: string }>('/personal-words/quick-add', data);
  },
};