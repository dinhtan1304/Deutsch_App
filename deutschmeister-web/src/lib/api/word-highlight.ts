import { apiGet } from './client';

/**
 * Map word (lowercase) → CEFR level
 * VD: { "schule": "A1", "wohnung": "A2", "beruf": "B1" }
 */
export type LevelIndex = Record<string, string>;

export const wordHighlightApi = {
  /**
   * Lấy vocabulary level index từ API
   * Trả về ~800 entries, ~16KB → cache dài
   */
  getLevelIndex: async (): Promise<LevelIndex> => {
    return apiGet<LevelIndex>('/words/level-index');
  },
};
