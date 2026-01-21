/**
 * Word Repository Implementation
 * Implements IWordRepository using seed data and localStorage
 */

import { Word, WordProps, WordSearchCriteria, WordStats } from '../../domain/entities/Word';
import { IWordRepository } from '../../domain/repositories/IWordRepository';
import { SEED_WORDS } from '../data/seedWords';
import { Gender, GENDERS } from '../../domain/valueObjects/Gender';
import { WordCategory, WORD_CATEGORIES } from '../../domain/valueObjects/WordCategory';
import { CEFRLevel, CEFR_LEVELS } from '../../domain/valueObjects/CEFRLevel';

/**
 * Word Repository using in-memory seed data
 * In the future, this can be extended to use SQLite or IndexedDB
 */
export class WordRepository implements IWordRepository {
  private words: Map<string, WordProps>;

  constructor() {
    // Initialize with seed data
    this.words = new Map();
    const now = new Date();
    
    SEED_WORDS.forEach(word => {
      this.words.set(word.id, {
        ...word,
        createdAt: now,
        updatedAt: now
      });
    });
  }

  /**
   * Get a word by ID
   */
  async findById(id: string): Promise<Word | null> {
    const wordData = this.words.get(id);
    if (!wordData) return null;
    return Word.fromPersistence(wordData);
  }

  /**
   * Search words with criteria
   */
  async search(criteria: WordSearchCriteria): Promise<Word[]> {
    let results = Array.from(this.words.values());

    // Filter by query (search in word, translations, tags)
    if (criteria.query) {
      const query = criteria.query.toLowerCase().trim();
      results = results.filter(word => {
        const wordMatch = word.word.toLowerCase().includes(query);
        const enMatch = word.translations.en.toLowerCase().includes(query);
        const viMatch = word.translations.vi?.toLowerCase().includes(query);
        const tagsMatch = word.tags?.some(tag => tag.toLowerCase().includes(query));
        return wordMatch || enMatch || viMatch || tagsMatch;
      });
    }

    // Filter by gender
    if (criteria.gender) {
      results = results.filter(word => word.gender === criteria.gender);
    }

    // Filter by category
    if (criteria.category) {
      results = results.filter(word => word.category === criteria.category);
    }

    // Filter by level
    if (criteria.level) {
      results = results.filter(word => word.level === criteria.level);
    }

    // Filter by frequency
    if (criteria.frequency) {
      results = results.filter(word => word.frequency === criteria.frequency);
    }

    // Sort by frequency (most common first), then alphabetically
    results.sort((a, b) => {
      if (a.frequency !== b.frequency) {
        return a.frequency - b.frequency;
      }
      return a.word.localeCompare(b.word, 'de');
    });

    // Apply pagination
    const offset = criteria.offset ?? 0;
    const limit = criteria.limit ?? 50;
    results = results.slice(offset, offset + limit);

    return results.map(wordData => Word.fromPersistence(wordData));
  }

  /**
   * Get random words for practice
   */
  async getRandom(count: number, criteria?: Partial<WordSearchCriteria>): Promise<Word[]> {
    let results = Array.from(this.words.values());

    // Apply filters if provided
    if (criteria?.gender) {
      results = results.filter(word => word.gender === criteria.gender);
    }
    if (criteria?.category) {
      results = results.filter(word => word.category === criteria.category);
    }
    if (criteria?.level) {
      results = results.filter(word => word.level === criteria.level);
    }

    // Shuffle using Fisher-Yates algorithm
    for (let i = results.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [results[i], results[j]] = [results[j], results[i]];
    }

    // Take requested count
    results = results.slice(0, count);

    return results.map(wordData => Word.fromPersistence(wordData));
  }

  /**
   * Get total count matching criteria
   */
  async count(criteria?: WordSearchCriteria): Promise<number> {
    if (!criteria) {
      return this.words.size;
    }

    let count = 0;
    for (const word of this.words.values()) {
      let matches = true;

      if (criteria.query) {
        const query = criteria.query.toLowerCase().trim();
        const wordMatch = word.word.toLowerCase().includes(query);
        const enMatch = word.translations.en.toLowerCase().includes(query);
        const viMatch = word.translations.vi?.toLowerCase().includes(query) ?? false;
        matches = wordMatch || enMatch || viMatch;
      }

      if (matches && criteria.gender) {
        matches = word.gender === criteria.gender;
      }
      if (matches && criteria.category) {
        matches = word.category === criteria.category;
      }
      if (matches && criteria.level) {
        matches = word.level === criteria.level;
      }

      if (matches) count++;
    }

    return count;
  }

  /**
   * Get word statistics
   */
  async getStats(): Promise<WordStats> {
    const stats: WordStats = {
      total: this.words.size,
      byGender: {} as Record<Gender, number>,
      byCategory: {} as Record<WordCategory, number>,
      byLevel: {} as Record<CEFRLevel, number>
    };

    // Initialize counters
    GENDERS.forEach(g => { stats.byGender[g] = 0; });
    WORD_CATEGORIES.forEach(c => { stats.byCategory[c] = 0; });
    CEFR_LEVELS.forEach(l => { stats.byLevel[l] = 0; });

    // Count
    for (const word of this.words.values()) {
      stats.byGender[word.gender]++;
      stats.byCategory[word.category]++;
      stats.byLevel[word.level]++;
    }

    return stats;
  }

  /**
   * Get all words
   */
  async getAll(): Promise<Word[]> {
    return Array.from(this.words.values())
      .map(wordData => Word.fromPersistence(wordData));
  }

  /**
   * Get words by IDs
   */
  async findByIds(ids: string[]): Promise<Word[]> {
    const results: Word[] = [];
    for (const id of ids) {
      const wordData = this.words.get(id);
      if (wordData) {
        results.push(Word.fromPersistence(wordData));
      }
    }
    return results;
  }

  /**
   * Get related words (same category or tags)
   */
  async getRelated(wordId: string, limit: number = 5): Promise<Word[]> {
    const word = this.words.get(wordId);
    if (!word) return [];

    const related: WordProps[] = [];
    
    for (const other of this.words.values()) {
      if (other.id === wordId) continue;

      // Score based on similarity
      let score = 0;
      
      // Same category
      if (other.category === word.category) score += 2;
      
      // Same level
      if (other.level === word.level) score += 1;
      
      // Shared tags
      if (word.tags && other.tags) {
        const sharedTags = word.tags.filter(t => other.tags!.includes(t));
        score += sharedTags.length;
      }

      if (score > 0) {
        related.push({ ...other, frequency: score }); // Use frequency to store score temporarily
      }
    }

    // Sort by score (higher = more related)
    related.sort((a, b) => b.frequency - a.frequency);

    // Take top results and restore original frequency
    return related.slice(0, limit).map(r => {
      const original = this.words.get(r.id)!;
      return Word.fromPersistence(original);
    });
  }
}