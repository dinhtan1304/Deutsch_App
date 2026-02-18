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
      selectedWord: word.trim().toLowerCase(),
      position,
    }),

  closePopup: () =>
    set({
      isOpen: false,
      selectedWord: null,
      position: null,
    }),
}));
