'use client';

import { create } from 'zustand';
import { 
  SRSCard, 
  ReviewQuality, 
  createSRSCard, 
  calculateSM2, 
  isDueForReview,
  getCardStatus 
} from '@/lib/srs';

interface SRSState {
  cards: Record<string, SRSCard>;  // wordId -> SRSCard
  isLoaded: boolean;
  
  // Actions
  loadCards: () => void;
  saveCards: () => void;
  getCard: (wordId: string) => SRSCard;
  reviewCard: (wordId: string, quality: ReviewQuality) => void;
  addWord: (wordId: string) => void;
  removeWord: (wordId: string) => void;
  
  // Getters
  getDueCards: () => SRSCard[];
  getNewCards: () => SRSCard[];
  getLearningCards: () => SRSCard[];
  getMatureCards: () => SRSCard[];
  getStats: () => {
    total: number;
    due: number;
    new: number;
    learning: number;
    mature: number;
    reviewedToday: number;
  };
}

const STORAGE_KEY = 'deutschmeister-srs';

export const useSRSStore = create<SRSState>((set, get) => ({
  cards: {},
  isLoaded: false,

  loadCards: () => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const cards = JSON.parse(stored);
        set({ cards, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch (e) {
      console.error('Failed to load SRS cards:', e);
      set({ isLoaded: true });
    }
  },

  saveCards: () => {
    if (typeof window === 'undefined') return;
    
    try {
      const { cards } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch (e) {
      console.error('Failed to save SRS cards:', e);
    }
  },

  getCard: (wordId: string) => {
    const { cards } = get();
    return cards[wordId] || createSRSCard(wordId);
  },

  addWord: (wordId: string) => {
    const { cards, saveCards } = get();
    if (!cards[wordId]) {
      set({ cards: { ...cards, [wordId]: createSRSCard(wordId) } });
      saveCards();
    }
  },

  removeWord: (wordId: string) => {
    const { cards, saveCards } = get();
    const newCards = { ...cards };
    delete newCards[wordId];
    set({ cards: newCards });
    saveCards();
  },

  reviewCard: (wordId: string, quality: ReviewQuality) => {
    const { cards, saveCards } = get();
    const card = cards[wordId] || createSRSCard(wordId);
    const updatedCard = calculateSM2(card, quality);
    
    set({ cards: { ...cards, [wordId]: updatedCard } });
    saveCards();
  },

  getDueCards: () => {
    const { cards } = get();
    return Object.values(cards).filter(isDueForReview);
  },

  getNewCards: () => {
    const { cards } = get();
    return Object.values(cards).filter(c => getCardStatus(c) === 'new');
  },

  getLearningCards: () => {
    const { cards } = get();
    return Object.values(cards).filter(c => getCardStatus(c) === 'learning');
  },

  getMatureCards: () => {
    const { cards } = get();
    return Object.values(cards).filter(c => getCardStatus(c) === 'mature');
  },

  getStats: () => {
    const { cards } = get();
    const cardList = Object.values(cards);
    const today = new Date().toISOString().split('T')[0];
    
    return {
      total: cardList.length,
      due: cardList.filter(isDueForReview).length,
      new: cardList.filter(c => getCardStatus(c) === 'new').length,
      learning: cardList.filter(c => getCardStatus(c) === 'learning').length,
      mature: cardList.filter(c => getCardStatus(c) === 'mature').length,
      reviewedToday: cardList.filter(c => c.lastReviewDate === today).length,
    };
  },
}));