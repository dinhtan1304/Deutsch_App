/**
 * Word Repository Interface
 * Defines the contract for Word persistence operations
 */

import { Word, WordSearchCriteria, WordStats } from '../entities/Word';

export interface IWordRepository {
  /**
   * Get a word by ID
   */
  findById(id: string): Promise<Word | null>;

  /**
   * Search words with criteria
   */
  search(criteria: WordSearchCriteria): Promise<Word[]>;

  /**
   * Get random words for practice
   */
  getRandom(count: number, criteria?: Partial<WordSearchCriteria>): Promise<Word[]>;

  /**
   * Get total count matching criteria
   */
  count(criteria?: WordSearchCriteria): Promise<number>;

  /**
   * Get word statistics
   */
  getStats(): Promise<WordStats>;

  /**
   * Get all words (for offline caching)
   */
  getAll(): Promise<Word[]>;

  /**
   * Get words by IDs
   */
  findByIds(ids: string[]): Promise<Word[]>;

  /**
   * Get similar/related words
   */
  getRelated(wordId: string, limit?: number): Promise<Word[]>;
}