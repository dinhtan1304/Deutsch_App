import { create } from 'zustand';
import { LevelIndex, wordHighlightApi } from '@/lib/api/word-highlight';

const STORAGE_KEY = 'deutschmeister-word-highlight';

interface WordHighlightState {
  // State
  enabled: boolean;
  levelIndex: LevelIndex | null;
  isLoading: boolean;
  hasFetched: boolean;

  // Actions
  toggle: () => void;
  setEnabled: (enabled: boolean) => void;
  fetchLevelIndex: () => Promise<void>;
  getLevel: (word: string) => string | null;
  reset: () => void;
}

function loadEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== null ? saved === 'true' : true; // Mặc định BẬT
  } catch {
    return true;
  }
}

export const useWordHighlightStore = create<WordHighlightState>((set, get) => ({
  enabled: loadEnabled(),
  levelIndex: null,
  isLoading: false,
  hasFetched: false,

  toggle: () => {
    const newVal = !get().enabled;
    set({ enabled: newVal });
    try {
      localStorage.setItem(STORAGE_KEY, String(newVal));
    } catch { /* ignore */ }
  },

  setEnabled: (enabled) => {
    set({ enabled });
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch { /* ignore */ }
  },

  fetchLevelIndex: async () => {
    // Không fetch lại nếu đã có data
    if (get().hasFetched || get().isLoading) return;

    set({ isLoading: true });
    try {
      const index = await wordHighlightApi.getLevelIndex();
      set({ levelIndex: index, hasFetched: true });
    } catch (err) {
      console.error('[WordHighlight] Failed to fetch level index:', err);
      set({ hasFetched: true }); // Đánh dấu đã fetch (dù fail) để không retry liên tục
    } finally {
      set({ isLoading: false });
    }
  },

  // Reset để cho phép retry (dùng khi user vừa login và fetch trước đó đã fail)
  reset: () => set({ levelIndex: null, hasFetched: false, isLoading: false }),

  /**
   * Lookup level cho 1 từ (lowercase, strip article)
   */
  getLevel: (word: string) => {
    const index = get().levelIndex;
    if (!index) return null;

    const cleaned = word.trim().toLowerCase().replace(/^(der|die|das)\s+/i, '');
    return index[cleaned] || null;
  },
}));
