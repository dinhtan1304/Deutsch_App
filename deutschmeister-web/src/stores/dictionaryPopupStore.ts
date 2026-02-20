import { create } from 'zustand';

interface PopupPosition {
  x: number;
  y: number;
}

interface DictionaryPopupState {
  // State
  isOpen: boolean;
  selectedWord: string | null;
  position: PopupPosition | null;

  // Actions
  openPopup: (word: string, position: PopupPosition) => void;
  closePopup: () => void;
}

export const useDictionaryPopupStore = create<DictionaryPopupState>((set) => ({
  isOpen: false,
  selectedWord: null,
  position: null,

  openPopup: (word, position) =>
    set({
      isOpen: true,
      // BUG FIX 6: Store original casing (trimmed only).
      // Previously toLowerCase() caused API search for "schule" when user clicked
      // "Schule" — backend fuzzy search handled it, but exact match logic in
      // dictionary-lookup.ts compared w.word.toLowerCase() === lower correctly.
      // Keeping original casing is cleaner and avoids edge cases with proper nouns.
      selectedWord: word.trim(),
      position,
    }),

  closePopup: () =>
    set({
      isOpen: false,
      selectedWord: null,
      position: null,
    }),
}));