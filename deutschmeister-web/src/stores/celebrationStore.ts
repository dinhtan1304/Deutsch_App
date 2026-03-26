import { create } from 'zustand';

interface CelebrationItem {
  key: string;
  name: string;
  nameVi: string;
  icon: string;
}

interface CelebrationStore {
  queue: CelebrationItem[];
  addAll: (items: CelebrationItem[]) => void;
  dismiss: () => void;
}

export const useCelebrationStore = create<CelebrationStore>((set) => ({
  queue: [],
  addAll: (items) => set((state) => ({ queue: [...state.queue, ...items] })),
  dismiss: () => set((state) => ({ queue: state.queue.slice(1) })),
}));
