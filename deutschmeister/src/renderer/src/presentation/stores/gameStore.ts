/**
 * Game Store
 * Zustand store for managing game sessions and high scores
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
  GameSession,
  GameSessionProps,
  GameType,
  GameDifficulty,
  GameResultSummary,
  QuestionResult,
  DIFFICULTY_CONFIG
} from '../../domain/entities/GameSession';
import { Word } from '../../domain/entities/Word';
import { Gender } from '../../domain/valueObjects/Gender';
import { CEFRLevel } from '../../domain/valueObjects/CEFRLevel';
import { WordCategory } from '../../domain/valueObjects/WordCategory';
import { useWordStore } from './wordStore';
import { useHistoryStore } from './historyStore';
import { WordRepository } from '../../infrastructure/repositories/WordRepository';

/**
 * High score entry
 */
export interface HighScore {
  id: string;
  gameType: GameType;
  difficulty: GameDifficulty;
  score: number;
  accuracy: number;
  bestStreak: number;
  date: Date;
}

/**
 * Daily challenge info
 */
export interface DailyChallenge {
  date: string;  // ISO date string (YYYY-MM-DD)
  gameType: GameType;
  difficulty: GameDifficulty;
  targetScore: number;
  completed: boolean;
  bestScore: number;
}

/**
 * Game state interface
 */
interface GameState {
  // Current session
  currentSession: GameSession | null;
  currentWords: Word[];
  currentWordIndex: number;
  
  // Timer
  timeRemaining: number;
  isTimerRunning: boolean;
  
  // High scores (per game type and difficulty)
  highScores: Record<string, HighScore[]>;  // key: `${gameType}-${difficulty}`
  
  // Daily challenges
  dailyChallenges: DailyChallenge[];
  
  // Statistics
  totalGamesPlayed: number;
  totalCorrectAnswers: number;
  totalIncorrectAnswers: number;
  
  // Loading state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  startGame: (gameType: GameType, difficulty: GameDifficulty, questionCount?: number, category?: WordCategory | null) => Promise<void>;
  submitAnswer: (selectedGender: Gender) => QuestionResult | null;
  handleTimeout: () => QuestionResult | null;
  nextQuestion: () => Word | null;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => GameResultSummary | null;
  
  // Timer actions
  setTimeRemaining: (time: number) => void;
  decrementTimer: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  
  // High scores
  getHighScores: (gameType: GameType, difficulty: GameDifficulty) => HighScore[];
  isNewHighScore: (score: number, gameType: GameType, difficulty: GameDifficulty) => boolean;
  
  // Daily challenge
  getTodayChallenge: () => DailyChallenge | null;
  initDailyChallenge: () => DailyChallenge;
  completeDailyChallenge: (score: number) => void;
  
  // Reset
  resetSession: () => void;
}

/**
 * Get today's date as ISO string
 */
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Generate daily challenge based on date
 */
function generateDailyChallenge(dateString: string): DailyChallenge {
  // Use date hash to determine game type and difficulty
  const dateHash = dateString.split('-').reduce((acc, part) => acc + parseInt(part), 0);
  
  const difficulties: GameDifficulty[] = ['beginner', 'intermediate', 'advanced'];
  const difficulty = difficulties[dateHash % 3];
  
  // Target scores based on difficulty
  const targetScores: Record<GameDifficulty, number> = {
    beginner: 150,
    intermediate: 200,
    advanced: 250
  };
  
  return {
    date: dateString,
    gameType: 'quick-quiz',
    difficulty,
    targetScore: targetScores[difficulty],
    completed: false,
    bestScore: 0
  };
}

/**
 * Game Zustand Store
 */
export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSession: null,
      currentWords: [],
      currentWordIndex: 0,
      
      timeRemaining: 0,
      isTimerRunning: false,
      
      highScores: {},
      dailyChallenges: [],
      
      totalGamesPlayed: 0,
      totalCorrectAnswers: 0,
      totalIncorrectAnswers: 0,
      
      isLoading: false,
      error: null,

      /**
       * Start a new game
       */
      startGame: async (gameType: GameType, difficulty: GameDifficulty, questionCount: number = 20, category: WordCategory | null = null) => {
        set({ isLoading: true, error: null });
        
        try {
          const config = DIFFICULTY_CONFIG[difficulty];
          const repo = new WordRepository();
          
          // Get words with optional category filter
          // First try to get words matching both category and difficulty levels
          let words = await repo.getRandom(questionCount * 2, {
            category: category || undefined
          });
          
          // Filter by appropriate CEFR levels
          const filteredWords = words.filter(w => 
            config.levels.includes(w.level as CEFRLevel)
          );
          
          // If not enough words after filtering, use all from category
          let gameWords = filteredWords.length >= questionCount 
            ? filteredWords.slice(0, questionCount)
            : words.slice(0, questionCount);
          
          // If still not enough words with category filter, get random without category
          if (gameWords.length < 5 && category) {
            console.warn(`Not enough words in category ${category}, using random words`);
            words = await repo.getRandom(questionCount * 2, {});
            const allFiltered = words.filter(w => config.levels.includes(w.level as CEFRLevel));
            gameWords = allFiltered.length >= questionCount
              ? allFiltered.slice(0, questionCount)
              : words.slice(0, questionCount);
          }
          
          if (gameWords.length === 0) {
            throw new Error('No words available for this difficulty');
          }
          
          // Create session
          const session = GameSession.create(
            uuidv4(),
            gameType,
            difficulty,
            gameWords.length
          );
          
          session.start();
          
          set({
            currentSession: session,
            currentWords: gameWords,
            currentWordIndex: 0,
            timeRemaining: config.timePerQuestion,
            isTimerRunning: true,
            isLoading: false
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to start game',
            isLoading: false
          });
        }
      },

      /**
       * Submit an answer
       */
      submitAnswer: (selectedGender: Gender): QuestionResult | null => {
        const { currentSession, currentWords, currentWordIndex, timeRemaining } = get();
        
        if (!currentSession || currentSession.isGameOver) return null;
        
        const currentWord = currentWords[currentWordIndex];
        if (!currentWord) return null;
        
        const config = currentSession.config;
        const responseTime = (config.timePerQuestion - timeRemaining) * 1000;
        
        // Record answer
        const result = currentSession.recordAnswer(
          currentWord.id,
          currentWord.word,
          currentWord.gender,
          selectedGender,
          responseTime
        );
        
        // Track in history
        const historyStore = useHistoryStore.getState();
        historyStore.addToHistory(currentWord.id);
        
        // Update statistics
        if (result.isCorrect) {
          set(state => ({ totalCorrectAnswers: state.totalCorrectAnswers + 1 }));
        } else {
          set(state => ({ totalIncorrectAnswers: state.totalIncorrectAnswers + 1 }));
        }
        
        // Stop timer
        set({ isTimerRunning: false });
        
        // Update session in state
        set({ currentSession: currentSession });
        
        return result;
      },

      /**
       * Handle timeout
       */
      handleTimeout: (): QuestionResult | null => {
        const { currentSession, currentWords, currentWordIndex } = get();
        
        if (!currentSession || currentSession.isGameOver) return null;
        
        const currentWord = currentWords[currentWordIndex];
        if (!currentWord) return null;
        
        // Record timeout
        const result = currentSession.recordTimeout(
          currentWord.id,
          currentWord.word,
          currentWord.gender
        );
        
        // Track in history
        const historyStore = useHistoryStore.getState();
        historyStore.addToHistory(currentWord.id);
        
        // Update statistics
        set(state => ({ totalIncorrectAnswers: state.totalIncorrectAnswers + 1 }));
        
        // Stop timer
        set({ isTimerRunning: false });
        
        // Update session in state
        set({ currentSession: currentSession });
        
        return result;
      },

      /**
       * Move to next question
       */
      nextQuestion: (): Word | null => {
        const { currentSession, currentWords, currentWordIndex } = get();
        
        if (!currentSession || currentSession.isGameOver) return null;
        
        const nextIndex = currentWordIndex + 1;
        
        if (nextIndex >= currentWords.length) {
          // No more questions
          return null;
        }
        
        const config = currentSession.config;
        
        set({
          currentWordIndex: nextIndex,
          timeRemaining: config.timePerQuestion,
          isTimerRunning: true
        });
        
        return currentWords[nextIndex];
      },

      /**
       * Pause game
       */
      pauseGame: () => {
        const { currentSession } = get();
        if (currentSession) {
          currentSession.pause();
          set({ currentSession, isTimerRunning: false });
        }
      },

      /**
       * Resume game
       */
      resumeGame: () => {
        const { currentSession } = get();
        if (currentSession) {
          currentSession.resume();
          set({ currentSession, isTimerRunning: true });
        }
      },

      /**
       * End game and get results
       */
      endGame: (): GameResultSummary | null => {
        const { currentSession, highScores } = get();
        
        if (!currentSession) return null;
        
        currentSession.finish();
        
        // Update total games played
        set(state => ({ 
          totalGamesPlayed: state.totalGamesPlayed + 1,
          isTimerRunning: false
        }));
        
        // Check for high score
        const key = `${currentSession.gameType}-${currentSession.difficulty}`;
        const existingScores = highScores[key] || [];
        const isNewHighScore = existingScores.length < 10 || 
          currentSession.score > Math.min(...existingScores.map(s => s.score));
        
        // Save high score if qualified
        if (isNewHighScore) {
          const newScore: HighScore = {
            id: uuidv4(),
            gameType: currentSession.gameType,
            difficulty: currentSession.difficulty,
            score: currentSession.score,
            accuracy: currentSession.accuracy,
            bestStreak: currentSession.bestStreak,
            date: new Date()
          };
          
          const updatedScores = [...existingScores, newScore]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
          
          set({
            highScores: {
              ...highScores,
              [key]: updatedScores
            }
          });
        }
        
        // Check daily challenge
        const todayChallenge = get().getTodayChallenge();
        if (todayChallenge && 
            todayChallenge.gameType === currentSession.gameType &&
            todayChallenge.difficulty === currentSession.difficulty) {
          get().completeDailyChallenge(currentSession.score);
        }
        
        // Create result summary
        const summary: GameResultSummary = {
          score: currentSession.score,
          correctCount: currentSession.correctCount,
          incorrectCount: currentSession.incorrectCount,
          accuracy: currentSession.accuracy,
          bestStreak: currentSession.bestStreak,
          averageResponseTime: currentSession.averageResponseTime,
          totalTime: currentSession.totalTime,
          difficulty: currentSession.difficulty,
          wrongAnswers: currentSession.getWrongAnswers(),
          isNewHighScore
        };
        
        return summary;
      },

      /**
       * Timer actions
       */
      setTimeRemaining: (time: number) => {
        set({ timeRemaining: time });
      },

      decrementTimer: () => {
        const { timeRemaining, isTimerRunning } = get();
        if (isTimerRunning && timeRemaining > 0) {
          set({ timeRemaining: timeRemaining - 0.1 });
        }
      },

      startTimer: () => {
        set({ isTimerRunning: true });
      },

      stopTimer: () => {
        set({ isTimerRunning: false });
      },

      /**
       * Get high scores for a game type and difficulty
       */
      getHighScores: (gameType: GameType, difficulty: GameDifficulty): HighScore[] => {
        const { highScores } = get();
        const key = `${gameType}-${difficulty}`;
        return highScores[key] || [];
      },

      /**
       * Check if score qualifies as new high score
       */
      isNewHighScore: (score: number, gameType: GameType, difficulty: GameDifficulty): boolean => {
        const scores = get().getHighScores(gameType, difficulty);
        if (scores.length < 10) return true;
        return score > Math.min(...scores.map(s => s.score));
      },

      /**
       * Get today's daily challenge (pure getter - no side effects)
       */
      getTodayChallenge: (): DailyChallenge | null => {
        const { dailyChallenges } = get();
        const today = getTodayDateString();
        return dailyChallenges.find(c => c.date === today) || null;
      },

      /**
       * Initialize daily challenge if not exists
       */
      initDailyChallenge: (): DailyChallenge => {
        const { dailyChallenges } = get();
        const today = getTodayDateString();
        
        let challenge = dailyChallenges.find(c => c.date === today);
        
        if (!challenge) {
          // Generate new challenge
          challenge = generateDailyChallenge(today);
          set({
            dailyChallenges: [...dailyChallenges.slice(-30), challenge]
          });
        }
        
        return challenge;
      },

      /**
       * Complete daily challenge
       */
      completeDailyChallenge: (score: number) => {
        const { dailyChallenges } = get();
        const today = getTodayDateString();
        
        const updatedChallenges = dailyChallenges.map(c => {
          if (c.date === today) {
            return {
              ...c,
              completed: score >= c.targetScore || c.completed,
              bestScore: Math.max(score, c.bestScore)
            };
          }
          return c;
        });
        
        set({ dailyChallenges: updatedChallenges });
      },

      /**
       * Reset current session
       */
      resetSession: () => {
        set({
          currentSession: null,
          currentWords: [],
          currentWordIndex: 0,
          timeRemaining: 0,
          isTimerRunning: false,
          error: null
        });
      }
    }),
    {
      name: 'deutschmeister-game',
      partialize: (state) => ({
        highScores: state.highScores,
        dailyChallenges: state.dailyChallenges,
        totalGamesPlayed: state.totalGamesPlayed,
        totalCorrectAnswers: state.totalCorrectAnswers,
        totalIncorrectAnswers: state.totalIncorrectAnswers
      }),
      // Custom storage to handle Date serialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          
          // Convert date strings back to Date objects in highScores
          if (parsed.state?.highScores) {
            Object.keys(parsed.state.highScores).forEach(key => {
              parsed.state.highScores[key] = parsed.state.highScores[key].map((score: any) => ({
                ...score,
                date: new Date(score.date)
              }));
            });
          }
          
          return parsed;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        }
      }
    }
  )
);

// Selector hooks
export const useCurrentSession = () => useGameStore(state => state.currentSession);
export const useCurrentWord = () => {
  const words = useGameStore(state => state.currentWords);
  const index = useGameStore(state => state.currentWordIndex);
  return words[index] || null;
};
export const useTimeRemaining = () => useGameStore(state => state.timeRemaining);
export const useIsTimerRunning = () => useGameStore(state => state.isTimerRunning);

// Use individual selectors to avoid creating new objects
export const useTotalGamesPlayed = () => useGameStore(state => state.totalGamesPlayed);
export const useTotalCorrectAnswers = () => useGameStore(state => state.totalCorrectAnswers);
export const useTotalIncorrectAnswers = () => useGameStore(state => state.totalIncorrectAnswers);

// Helper function (not a hook) to calculate accuracy
export const calculateAccuracy = (correct: number, incorrect: number): number => {
  const total = correct + incorrect;
  return total > 0 ? Math.round((correct / total) * 100) : 0;
};

// Combined stats hook for GameMenuPage
export const useGameStats = () => {
  const totalGamesPlayed = useGameStore(state => state.totalGamesPlayed);
  const totalCorrectAnswers = useGameStore(state => state.totalCorrectAnswers);
  const totalIncorrectAnswers = useGameStore(state => state.totalIncorrectAnswers);
  
  const total = totalCorrectAnswers + totalIncorrectAnswers;
  const accuracy = total > 0 ? Math.round((totalCorrectAnswers / total) * 100) : 0;
  
  return {
    totalGamesPlayed,
    totalCorrectAnswers,
    totalIncorrectAnswers,
    accuracy
  };
};