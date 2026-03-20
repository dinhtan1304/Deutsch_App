import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storage';

// XP thresholds for each level (cumulative)
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000,
  5000, 6500, 8000, 10000, 12500, 15000, 18000, 22000, 27000, 33000,
];

function getLevelFromXP(totalXP: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

function getXPForNextLevel(level: number): number {
  if (level >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 5000;
  return LEVEL_THRESHOLDS[level]; // level is 1-indexed, threshold[level] = next level threshold
}

function getXPForCurrentLevel(level: number): number {
  if (level <= 1) return 0;
  return LEVEL_THRESHOLDS[level - 1];
}

/** Best scores per game type */
type BestScores = Record<string, number>;

interface XPState {
  totalXP: number;
  level: number;
  bestScores: BestScores;

  // Derived
  xpForNextLevel: number;
  xpInCurrentLevel: number;
  xpNeededForLevel: number;

  // Actions
  addXP: (amount: number) => { newTotal: number; leveledUp: boolean; newLevel: number };
  updateBestScore: (gameType: string, score: number) => boolean; // returns true if new best
  getBestScore: (gameType: string) => number;
  reset: () => void;
}

export const useXPStore = create<XPState>()(
  persist(
    (set, get) => ({
      totalXP: 0,
      level: 1,
      bestScores: {},

      xpForNextLevel: LEVEL_THRESHOLDS[1],
      xpInCurrentLevel: 0,
      xpNeededForLevel: LEVEL_THRESHOLDS[1],

      addXP: (amount: number) => {
        const state = get();
        const newTotal = state.totalXP + amount;
        const newLevel = getLevelFromXP(newTotal);
        const leveledUp = newLevel > state.level;
        const currentLevelXP = getXPForCurrentLevel(newLevel);
        const nextLevelXP = getXPForNextLevel(newLevel);

        set({
          totalXP: newTotal,
          level: newLevel,
          xpForNextLevel: nextLevelXP,
          xpInCurrentLevel: newTotal - currentLevelXP,
          xpNeededForLevel: nextLevelXP - currentLevelXP,
        });

        return { newTotal, leveledUp, newLevel };
      },

      updateBestScore: (gameType: string, score: number) => {
        const state = get();
        const current = state.bestScores[gameType] ?? 0;
        if (score > current) {
          set({ bestScores: { ...state.bestScores, [gameType]: score } });
          return true;
        }
        return false;
      },

      getBestScore: (gameType: string) => {
        return get().bestScores[gameType] ?? 0;
      },

      reset: () => set({
        totalXP: 0,
        level: 1,
        bestScores: {},
        xpForNextLevel: LEVEL_THRESHOLDS[1],
        xpInCurrentLevel: 0,
        xpNeededForLevel: LEVEL_THRESHOLDS[1],
      }),
    }),
    {
      name: 'xp-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        totalXP: state.totalXP,
        level: state.level,
        bestScores: state.bestScores,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Recalculate derived values
        const level = getLevelFromXP(state.totalXP);
        const currentLevelXP = getXPForCurrentLevel(level);
        const nextLevelXP = getXPForNextLevel(level);
        state.level = level;
        state.xpForNextLevel = nextLevelXP;
        state.xpInCurrentLevel = state.totalXP - currentLevelXP;
        state.xpNeededForLevel = nextLevelXP - currentLevelXP;
      },
    },
  ),
);

// Helper: calculate XP earned from a game session
export function calculateGameXP(
  correctCount: number,
  bestStreak: number,
  accuracy: number,
): number {
  const baseXP = correctCount * 10;
  const streakBonus = bestStreak >= 5 ? 25 : bestStreak >= 3 ? 10 : 0;
  const accuracyBonus = accuracy >= 90 ? 20 : accuracy >= 70 ? 10 : 0;
  return baseXP + streakBonus + accuracyBonus;
}
