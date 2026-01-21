/**
 * Word Entity
 * Represents a German word with its grammatical gender (article)
 */

import { Gender, GenderInfo, isValidGender } from '../valueObjects/Gender';
import { WordCategory, isValidCategory } from '../valueObjects/WordCategory';
import { CEFRLevel, isValidCEFRLevel } from '../valueObjects/CEFRLevel';

/**
 * Word properties interface
 */
export interface WordProps {
  id: string;
  word: string;                    // German word (noun)
  gender: Gender;                  // der/die/das
  plural: string | null;          // Plural form
  translations: {
    en: string;                    // English translation
    vi?: string;                   // Vietnamese translation (optional)
  };
  pronunciation?: string;          // IPA pronunciation
  audioUrl?: string;               // URL to audio file
  examples: string[];              // Example sentences
  tips?: string[];                 // Learning tips/mnemonics
  category: WordCategory;
  level: CEFRLevel;
  frequency: number;               // 1-5 (1 = most common)
  relatedWords?: string[];         // Related word IDs
  tags?: string[];                 // Additional tags for search
  imageUrl?: string;               // Optional image
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Word validation rules
 */
export const WordValidation = {
  word: { minLength: 1, maxLength: 100 },
  translation: { minLength: 1, maxLength: 200 },
  frequency: { min: 1, max: 5 },
  maxExamples: 10,
  maxTips: 5,
  maxTags: 10
} as const;

/**
 * Word Entity Class
 */
export class Word {
  private readonly props: WordProps;

  private constructor(props: WordProps) {
    this.props = props;
  }

  /**
   * Create a new Word
   */
  static create(props: Omit<WordProps, 'createdAt' | 'updatedAt'>): Word {
    // Validate
    Word.validateWord(props.word);
    Word.validateGender(props.gender);
    Word.validateTranslations(props.translations);
    Word.validateCategory(props.category);
    Word.validateLevel(props.level);
    Word.validateFrequency(props.frequency);

    const now = new Date();
    return new Word({
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(props: WordProps): Word {
    return new Word({
      ...props,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt)
    });
  }

  // Getters
  get id(): string { return this.props.id; }
  get word(): string { return this.props.word; }
  get gender(): Gender { return this.props.gender; }
  get plural(): string | null { return this.props.plural; }
  get translations(): WordProps['translations'] { return this.props.translations; }
  get pronunciation(): string | undefined { return this.props.pronunciation; }
  get audioUrl(): string | undefined { return this.props.audioUrl; }
  get examples(): string[] { return [...this.props.examples]; }
  get tips(): string[] | undefined { return this.props.tips ? [...this.props.tips] : undefined; }
  get category(): WordCategory { return this.props.category; }
  get level(): CEFRLevel { return this.props.level; }
  get frequency(): number { return this.props.frequency; }
  get relatedWords(): string[] | undefined { return this.props.relatedWords ? [...this.props.relatedWords] : undefined; }
  get tags(): string[] | undefined { return this.props.tags ? [...this.props.tags] : undefined; }
  get imageUrl(): string | undefined { return this.props.imageUrl; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  /**
   * Get the article for this word
   */
  get article(): string {
    return GenderInfo[this.props.gender].article;
  }

  /**
   * Get the full word with article
   */
  get fullWord(): string {
    return `${this.article} ${this.props.word}`;
  }

  /**
   * Get the indefinite article form
   */
  get indefiniteArticle(): string {
    return GenderInfo[this.props.gender].articleIndefinite;
  }

  /**
   * Get color class for this word's gender
   */
  get colorClass(): string {
    return GenderInfo[this.props.gender].colorClass;
  }

  /**
   * Get background class for this word's gender
   */
  get bgClass(): string {
    return GenderInfo[this.props.gender].bgClass;
  }

  /**
   * Convert to plain object
   */
  toObject(): WordProps {
    return { ...this.props };
  }

  /**
   * Validation methods
   */
  private static validateWord(word: string): void {
    const { minLength, maxLength } = WordValidation.word;
    if (!word || word.trim().length < minLength) {
      throw new Error(`Word must be at least ${minLength} character`);
    }
    if (word.length > maxLength) {
      throw new Error(`Word must be at most ${maxLength} characters`);
    }
  }

  private static validateGender(gender: Gender): void {
    if (!isValidGender(gender)) {
      throw new Error(`Invalid gender: ${gender}`);
    }
  }

  private static validateTranslations(translations: WordProps['translations']): void {
    const { minLength, maxLength } = WordValidation.translation;
    if (!translations.en || translations.en.trim().length < minLength) {
      throw new Error('English translation is required');
    }
    if (translations.en.length > maxLength) {
      throw new Error(`Translation must be at most ${maxLength} characters`);
    }
  }

  private static validateCategory(category: WordCategory): void {
    if (!isValidCategory(category)) {
      throw new Error(`Invalid category: ${category}`);
    }
  }

  private static validateLevel(level: CEFRLevel): void {
    if (!isValidCEFRLevel(level)) {
      throw new Error(`Invalid CEFR level: ${level}`);
    }
  }

  private static validateFrequency(frequency: number): void {
    const { min, max } = WordValidation.frequency;
    if (frequency < min || frequency > max) {
      throw new Error(`Frequency must be between ${min} and ${max}`);
    }
  }
}

/**
 * Type for creating a new word (without system fields)
 */
export type CreateWordInput = Omit<WordProps, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Type for word search/filter criteria
 */
export interface WordSearchCriteria {
  query?: string;           // Search in word, translations, tags
  gender?: Gender;          // Filter by gender
  category?: WordCategory;  // Filter by category
  level?: CEFRLevel;        // Filter by CEFR level
  frequency?: number;       // Filter by frequency
  limit?: number;           // Pagination limit
  offset?: number;          // Pagination offset
}

/**
 * Type for word statistics
 */
export interface WordStats {
  total: number;
  byGender: Record<Gender, number>;
  byCategory: Record<WordCategory, number>;
  byLevel: Record<CEFRLevel, number>;
}