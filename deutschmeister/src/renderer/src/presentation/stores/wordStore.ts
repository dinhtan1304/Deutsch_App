/**
 * Word Store
 * Zustand store for managing vocabulary/words state
 */

import { create } from 'zustand';
import { Word, WordSearchCriteria, WordStats } from '../../domain/entities/Word';
import { WordRepository } from '../../infrastructure/repositories/WordRepository';
import { Gender } from '../../domain/valueObjects/Gender';
import { WordCategory } from '../../domain/valueObjects/WordCategory';
import { CEFRLevel } from '../../domain/valueObjects/CEFRLevel';

/**
 * Word state interface
 */
interface WordState {
  // Search state
  searchQuery: string;
  searchResults: Word[];
  isSearching: boolean;
  
  // Filters
  filterGender: Gender | null;
  filterCategory: WordCategory | null;
  filterLevel: CEFRLevel | null;
  
  // Selected word
  selectedWord: Word | null;
  
  // Statistics
  stats: WordStats | null;
  
  // Pagination
  currentPage: number;
  pageSize: number;
  totalCount: number;
  
  // Error
  error: string | null;
  
  // Actions
  search: (query: string) => Promise<void>;
  setFilterGender: (gender: Gender | null) => void;
  setFilterCategory: (category: WordCategory | null) => void;
  setFilterLevel: (level: CEFRLevel | null) => void;
  clearFilters: () => void;
  applyFilters: () => Promise<void>;
  
  selectWord: (word: Word | null) => void;
  getWordById: (id: string) => Promise<Word | null>;
  getRandomWords: (count: number) => Promise<Word[]>;
  getRelatedWords: (wordId: string) => Promise<Word[]>;
  
  loadStats: () => Promise<void>;
  loadNextPage: () => Promise<void>;
  
  initialize: () => Promise<void>;
}

// Repository instance (singleton)
let repository: WordRepository | null = null;

function getRepository(): WordRepository {
  if (!repository) {
    repository = new WordRepository();
  }
  return repository;
}

/**
 * Word Zustand Store
 */
export const useWordStore = create<WordState>((set, get) => ({
  // Initial state
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  
  filterGender: null,
  filterCategory: null,
  filterLevel: null,
  
  selectedWord: null,
  
  stats: null,
  
  currentPage: 0,
  pageSize: 20,
  totalCount: 0,
  
  error: null,

  /**
   * Initialize the store
   */
  initialize: async () => {
    const repo = getRepository();
    
    try {
      // Load stats
      const stats = await repo.getStats();
      
      // Load initial words (most common)
      const words = await repo.search({ limit: 20 });
      const totalCount = await repo.count();
      
      set({
        stats,
        searchResults: words,
        totalCount,
        error: null
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to initialize' });
    }
  },

  /**
   * Search words
   */
  search: async (query: string) => {
    const { filterGender, filterCategory, filterLevel, pageSize } = get();
    
    set({ searchQuery: query, isSearching: true, error: null, currentPage: 0 });
    
    try {
      const repo = getRepository();
      
      const criteria: WordSearchCriteria = {
        query: query || undefined,
        gender: filterGender || undefined,
        category: filterCategory || undefined,
        level: filterLevel || undefined,
        limit: pageSize,
        offset: 0
      };
      
      const results = await repo.search(criteria);
      const totalCount = await repo.count(criteria);
      
      set({
        searchResults: results,
        totalCount,
        isSearching: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Search failed',
        isSearching: false
      });
    }
  },

  /**
   * Set gender filter
   */
  setFilterGender: (gender: Gender | null) => {
    set({ filterGender: gender });
  },

  /**
   * Set category filter
   */
  setFilterCategory: (category: WordCategory | null) => {
    set({ filterCategory: category });
  },

  /**
   * Set level filter
   */
  setFilterLevel: (level: CEFRLevel | null) => {
    set({ filterLevel: level });
  },

  /**
   * Clear all filters
   */
  clearFilters: () => {
    set({
      filterGender: null,
      filterCategory: null,
      filterLevel: null
    });
  },

  /**
   * Apply current filters
   */
  applyFilters: async () => {
    const { searchQuery } = get();
    await get().search(searchQuery);
  },

  /**
   * Select a word
   */
  selectWord: (word: Word | null) => {
    set({ selectedWord: word });
  },

  /**
   * Get word by ID
   */
  getWordById: async (id: string): Promise<Word | null> => {
    try {
      const repo = getRepository();
      return await repo.findById(id);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to get word' });
      return null;
    }
  },

  /**
   * Get random words for practice
   */
  getRandomWords: async (count: number): Promise<Word[]> => {
    const { filterGender, filterCategory, filterLevel } = get();
    
    try {
      const repo = getRepository();
      return await repo.getRandom(count, {
        gender: filterGender || undefined,
        category: filterCategory || undefined,
        level: filterLevel || undefined
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to get random words' });
      return [];
    }
  },

  /**
   * Get related words
   */
  getRelatedWords: async (wordId: string): Promise<Word[]> => {
    try {
      const repo = getRepository();
      return await repo.getRelated(wordId, 5);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to get related words' });
      return [];
    }
  },

  /**
   * Load statistics
   */
  loadStats: async () => {
    try {
      const repo = getRepository();
      const stats = await repo.getStats();
      set({ stats });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load stats' });
    }
  },

  /**
   * Load next page of results
   */
  loadNextPage: async () => {
    const { searchQuery, filterGender, filterCategory, filterLevel, pageSize, currentPage, searchResults, totalCount } = get();
    
    const nextOffset = (currentPage + 1) * pageSize;
    if (nextOffset >= totalCount) return;
    
    set({ isSearching: true });
    
    try {
      const repo = getRepository();
      
      const criteria: WordSearchCriteria = {
        query: searchQuery || undefined,
        gender: filterGender || undefined,
        category: filterCategory || undefined,
        level: filterLevel || undefined,
        limit: pageSize,
        offset: nextOffset
      };
      
      const newResults = await repo.search(criteria);
      
      set({
        searchResults: [...searchResults, ...newResults],
        currentPage: currentPage + 1,
        isSearching: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load more',
        isSearching: false
      });
    }
  }
}));

// Selector hooks
export const useSearchResults = () => useWordStore(state => state.searchResults);
export const useSelectedWord = () => useWordStore(state => state.selectedWord);
export const useWordStats = () => useWordStore(state => state.stats);
export const useIsSearching = () => useWordStore(state => state.isSearching);
export const useSearchQuery = () => useWordStore(state => state.searchQuery);
export const useWordFilters = () => useWordStore(state => ({
  gender: state.filterGender,
  category: state.filterCategory,
  level: state.filterLevel
}));