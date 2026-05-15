/**
 * Word Bank UI Store
 *
 * Chỉ quản lý UI state: filters, sort, selection
 * Data fetching → React Query hooks (usePersonalWords)
 */

import { create } from 'zustand';
import { WordBankFilters } from '@/types/personalWord';

// ============================================
// Store
// ============================================
interface WordBankUIState {
  filters: WordBankFilters;
  page: number;
  limit: number;

  // Filter actions
  setFilters: (filters: Partial<WordBankFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;

  // Computed → API params
  getApiParams: () => Record<string, unknown>;
}

const defaultFilters: WordBankFilters = {
  search: '',
  wordType: 'all',
  level: 'all',
  gender: 'all',
  category: '',
  favoritesOnly: false,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const useWordBankUI = create<WordBankUIState>((set, get) => ({
  filters: { ...defaultFilters },
  page: 1,
  limit: 50,

  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters },
      page: 1, // Reset về trang 1 khi đổi filter
    }));
  },

  resetFilters: () => {
    set({ filters: { ...defaultFilters }, page: 1 });
  },

  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: 1 }),

  // Chuyển filters → API params
  getApiParams: () => {
    const { filters, page, limit } = get();
    const params: Record<string, unknown> = { page, limit };

    if (filters.search) params.search = filters.search;
    if (filters.wordType !== 'all') params.wordType = filters.wordType;
    if (filters.level !== 'all') params.level = filters.level;
    if (filters.gender !== 'all') params.gender = filters.gender;
    if (filters.category) params.category = filters.category;
    if (filters.favoritesOnly) params.favoritesOnly = true;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    return params;
  },
}));

// ─── Granular selectors — prefer these over destructuring the whole store ───
export const useWordBankFilters = () => useWordBankUI((s) => s.filters);
export const useWordBankPage = () => useWordBankUI((s) => s.page);
export const useWordBankLimit = () => useWordBankUI((s) => s.limit);