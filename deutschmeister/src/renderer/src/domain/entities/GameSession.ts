/**
 * GameSession Entity
 * Represents an active game session with state tracking
 */

import { CEFRLevel } from '../valueObjects/CEFRLevel';
import { Gender } from '../valueObjects/Gender';

/**
 * Game difficulty levels
 */
export const GAME_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
export type GameDifficulty = (typeof GAME_DIFFICULTIES)[number];

/**
 * Game types
 */
export const GAME_TYPES = ['quick-quiz', 'flashcard', 'fill-blank', 'timed-challenge'] as const;
export type GameType = (typeof GAME_TYPES)[number];

/**
 * Difficulty configuration
 */
export interface DifficultyConfig {
  name: string;
  description: string;
  timePerQuestion: number;  // seconds
  lives: number;
  levels: CEFRLevel[];      // CEFR levels to include
  scoreMultiplier: number;
  speedBonusThreshold: number; // seconds - if answered faster, get bonus
}

export const DIFFICULTY_CONFIG: Record<GameDifficulty, DifficultyConfig> = {
  beginner: {
    name: 'Beginner',
    description: 'Common words (A1-A2), 5 seconds per question',
    timePerQuestion: 5,
    lives: 5,
    levels: ['A1', 'A2'],
    scoreMultiplier: 1,
    speedBonusThreshold: 2
  },
  intermediate: {
    name: 'Intermediate',
    description: 'Mixed levels (A1-B2), 3 seconds per question',
    timePerQuestion: 3,
    lives: 4,
    levels: ['A1', 'A2', 'B1', 'B2'],
    scoreMultiplier: 1.5,
    speedBonusThreshold: 1.5
  },
  advanced: {
    name: 'Advanced',
    description: 'All levels (A1-C2), 2 seconds per question',
    timePerQuestion: 2,
    lives: 3,
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    scoreMultiplier: 2,
    speedBonusThreshold: 1
  }
};

/**
 * Score configuration
 */
export const SCORE_CONFIG = {
  correctAnswer: 10,
  speedBonus: 5,
  streakBonusPerCorrect: 2,
  maxStreakBonus: 20
} as const;

/**
 * Question result
 */
export interface QuestionResult {
  wordId: string;
  word: string;
  correctGender: Gender;
  selectedGender: Gender | null;
  isCorrect: boolean;
  responseTime: number;  // milliseconds
  scoreEarned: number;
  timestamp: Date;
}

/**
 * Game session state
 */
export type GameSessionState = 'idle' | 'playing' | 'paused' | 'finished';

/**
 * GameSession properties
 */
export interface GameSessionProps {
  id: string;
  gameType: GameType;
  difficulty: GameDifficulty;
  state: GameSessionState;
  
  // Progress
  currentQuestionIndex: number;
  totalQuestions: number;
  
  // Score
  score: number;
  correctCount: number;
  incorrectCount: number;
  currentStreak: number;
  bestStreak: number;
  
  // Lives
  livesRemaining: number;
  maxLives: number;
  
  // Time tracking
  totalTime: number;        // milliseconds
  averageResponseTime: number;
  
  // Results
  results: QuestionResult[];
  
  // Timestamps
  startedAt: Date;
  finishedAt: Date | null;
}

/**
 * GameSession Entity Class
 */
export class GameSession {
  private props: GameSessionProps;

  private constructor(props: GameSessionProps) {
    this.props = props;
  }

  /**
   * Create a new game session
   */
  static create(
    id: string,
    gameType: GameType,
    difficulty: GameDifficulty,
    totalQuestions: number = 20
  ): GameSession {
    const config = DIFFICULTY_CONFIG[difficulty];
    
    return new GameSession({
      id,
      gameType,
      difficulty,
      state: 'idle',
      currentQuestionIndex: 0,
      totalQuestions,
      score: 0,
      correctCount: 0,
      incorrectCount: 0,
      currentStreak: 0,
      bestStreak: 0,
      livesRemaining: config.lives,
      maxLives: config.lives,
      totalTime: 0,
      averageResponseTime: 0,
      results: [],
      startedAt: new Date(),
      finishedAt: null
    });
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(props: GameSessionProps): GameSession {
    return new GameSession({
      ...props,
      startedAt: new Date(props.startedAt),
      finishedAt: props.finishedAt ? new Date(props.finishedAt) : null,
      results: props.results.map(r => ({
        ...r,
        timestamp: new Date(r.timestamp)
      }))
    });
  }

  // Getters
  get id(): string { return this.props.id; }
  get gameType(): GameType { return this.props.gameType; }
  get difficulty(): GameDifficulty { return this.props.difficulty; }
  get state(): GameSessionState { return this.props.state; }
  get currentQuestionIndex(): number { return this.props.currentQuestionIndex; }
  get totalQuestions(): number { return this.props.totalQuestions; }
  get score(): number { return this.props.score; }
  get correctCount(): number { return this.props.correctCount; }
  get incorrectCount(): number { return this.props.incorrectCount; }
  get currentStreak(): number { return this.props.currentStreak; }
  get bestStreak(): number { return this.props.bestStreak; }
  get livesRemaining(): number { return this.props.livesRemaining; }
  get maxLives(): number { return this.props.maxLives; }
  get totalTime(): number { return this.props.totalTime; }
  get averageResponseTime(): number { return this.props.averageResponseTime; }
  get results(): QuestionResult[] { return [...this.props.results]; }
  get startedAt(): Date { return this.props.startedAt; }
  get finishedAt(): Date | null { return this.props.finishedAt; }

  /**
   * Get difficulty configuration
   */
  get config(): DifficultyConfig {
    return DIFFICULTY_CONFIG[this.props.difficulty];
  }

  /**
   * Check if game is over
   */
  get isGameOver(): boolean {
    return this.props.state === 'finished' ||
           this.props.livesRemaining <= 0 ||
           this.props.currentQuestionIndex >= this.props.totalQuestions;
  }

  /**
   * Get progress percentage
   */
  get progressPercent(): number {
    if (this.props.totalQuestions === 0) return 0;
    return Math.round((this.props.currentQuestionIndex / this.props.totalQuestions) * 100);
  }

  /**
   * Get accuracy percentage
   */
  get accuracy(): number {
    const total = this.props.correctCount + this.props.incorrectCount;
    if (total === 0) return 0;
    return Math.round((this.props.correctCount / total) * 100);
  }

  /**
   * Start the game
   */
  start(): void {
    this.props.state = 'playing';
    this.props.startedAt = new Date();
  }

  /**
   * Pause the game
   */
  pause(): void {
    if (this.props.state === 'playing') {
      this.props.state = 'paused';
    }
  }

  /**
   * Resume the game
   */
  resume(): void {
    if (this.props.state === 'paused') {
      this.props.state = 'playing';
    }
  }

  /**
   * Record an answer
   */
  recordAnswer(
    wordId: string,
    word: string,
    correctGender: Gender,
    selectedGender: Gender | null,
    responseTime: number
  ): QuestionResult {
    const isCorrect = selectedGender === correctGender;
    const config = this.config;
    
    // Calculate score
    let scoreEarned = 0;
    if (isCorrect) {
      // Base score
      scoreEarned = SCORE_CONFIG.correctAnswer * config.scoreMultiplier;
      
      // Speed bonus
      if (responseTime < config.speedBonusThreshold * 1000) {
        scoreEarned += SCORE_CONFIG.speedBonus * config.scoreMultiplier;
      }
      
      // Streak bonus
      const streakBonus = Math.min(
        this.props.currentStreak * SCORE_CONFIG.streakBonusPerCorrect,
        SCORE_CONFIG.maxStreakBonus
      );
      scoreEarned += streakBonus * config.scoreMultiplier;
      
      // Update streak
      this.props.currentStreak += 1;
      if (this.props.currentStreak > this.props.bestStreak) {
        this.props.bestStreak = this.props.currentStreak;
      }
      
      this.props.correctCount += 1;
    } else {
      // Wrong answer or timeout
      this.props.currentStreak = 0;
      this.props.livesRemaining -= 1;
      this.props.incorrectCount += 1;
    }
    
    // Round score
    scoreEarned = Math.round(scoreEarned);
    
    // Update totals
    this.props.score += scoreEarned;
    this.props.totalTime += responseTime;
    this.props.currentQuestionIndex += 1;
    
    // Update average response time
    const totalAnswers = this.props.results.length + 1;
    this.props.averageResponseTime = this.props.totalTime / totalAnswers;
    
    // Create result
    const result: QuestionResult = {
      wordId,
      word,
      correctGender,
      selectedGender,
      isCorrect,
      responseTime,
      scoreEarned,
      timestamp: new Date()
    };
    
    this.props.results.push(result);
    
    // Check game over
    if (this.isGameOver) {
      this.finish();
    }
    
    return result;
  }

  /**
   * Handle timeout (no answer given)
   */
  recordTimeout(wordId: string, word: string, correctGender: Gender): QuestionResult {
    return this.recordAnswer(wordId, word, correctGender, null, this.config.timePerQuestion * 1000);
  }

  /**
   * Finish the game
   */
  finish(): void {
    this.props.state = 'finished';
    this.props.finishedAt = new Date();
  }

  /**
   * Get wrong answers for review
   */
  getWrongAnswers(): QuestionResult[] {
    return this.props.results.filter(r => !r.isCorrect);
  }

  /**
   * Get words IDs from this session
   */
  getWordIds(): string[] {
    return this.props.results.map(r => r.wordId);
  }

  /**
   * Convert to plain object
   */
  toObject(): GameSessionProps {
    return { ...this.props };
  }
}

/**
 * Game result summary for display
 */
export interface GameResultSummary {
  score: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  bestStreak: number;
  averageResponseTime: number;
  totalTime: number;
  difficulty: GameDifficulty;
  wrongAnswers: QuestionResult[];
  isNewHighScore: boolean;
}