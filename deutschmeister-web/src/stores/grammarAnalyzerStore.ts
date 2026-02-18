import { create } from 'zustand';
import { GrammarAnalysisResult } from '@/lib/api/grammar-analyze';

interface GrammarAnalyzerState {
  // Floating button state
  showButton: boolean;
  selectedSentence: string;
  buttonPosition: { x: number; y: number } | null;

  // Analysis popup state
  showPopup: boolean;
  isAnalyzing: boolean;
  result: GrammarAnalysisResult | null;
  error: string | null;
  popupPosition: { x: number; y: number } | null;

  // Actions
  showAnalyzeButton: (sentence: string, position: { x: number; y: number }) => void;
  hideButton: () => void;
  startAnalysis: () => void;
  setResult: (result: GrammarAnalysisResult) => void;
  setError: (error: string) => void;
  closePopup: () => void;
  reset: () => void;
}

export const useGrammarAnalyzerStore = create<GrammarAnalyzerState>((set, get) => ({
  showButton: false,
  selectedSentence: '',
  buttonPosition: null,
  showPopup: false,
  isAnalyzing: false,
  result: null,
  error: null,
  popupPosition: null,

  showAnalyzeButton: (sentence, position) => {
    set({
      showButton: true,
      selectedSentence: sentence,
      buttonPosition: position,
      // Reset popup khi chọn câu mới
      showPopup: false,
      result: null,
      error: null,
    });
  },

  hideButton: () => {
    set({ showButton: false, buttonPosition: null });
  },

  startAnalysis: () => {
    const { buttonPosition } = get();
    set({
      showButton: false,
      showPopup: true,
      isAnalyzing: true,
      result: null,
      error: null,
      popupPosition: buttonPosition,
    });
  },

  setResult: (result) => {
    set({ isAnalyzing: false, result });
  },

  setError: (error) => {
    set({ isAnalyzing: false, error });
  },

  closePopup: () => {
    set({
      showPopup: false,
      result: null,
      error: null,
      isAnalyzing: false,
      popupPosition: null,
    });
  },

  reset: () => {
    set({
      showButton: false,
      selectedSentence: '',
      buttonPosition: null,
      showPopup: false,
      isAnalyzing: false,
      result: null,
      error: null,
      popupPosition: null,
    });
  },
}));
