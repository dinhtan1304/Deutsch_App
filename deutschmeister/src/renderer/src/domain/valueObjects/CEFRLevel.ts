/**
 * CEFR Level Value Object
 * Common European Framework of Reference for Languages
 * Levels: A1, A2 (Basic) | B1, B2 (Independent) | C1, C2 (Proficient)
 */

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export type CEFRLevel = (typeof CEFR_LEVELS)[number];

export const CEFRLevelInfo: Record<CEFRLevel, { name: string; description: string }> = {
  A1: {
    name: 'Beginner',
    description: 'Can understand and use familiar everyday expressions'
  },
  A2: {
    name: 'Elementary',
    description: 'Can communicate in simple and routine tasks'
  },
  B1: {
    name: 'Intermediate',
    description: 'Can deal with most situations while travelling'
  },
  B2: {
    name: 'Upper Intermediate',
    description: 'Can interact with a degree of fluency and spontaneity'
  },
  C1: {
    name: 'Advanced',
    description: 'Can express ideas fluently and spontaneously'
  },
  C2: {
    name: 'Mastery',
    description: 'Can understand virtually everything heard or read'
  }
};

/**
 * Check if a level is valid CEFR level
 */
export function isValidCEFRLevel(level: string): level is CEFRLevel {
  return CEFR_LEVELS.includes(level as CEFRLevel);
}

/**
 * Compare two CEFR levels
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareCEFRLevels(a: CEFRLevel, b: CEFRLevel): number {
  const indexA = CEFR_LEVELS.indexOf(a);
  const indexB = CEFR_LEVELS.indexOf(b);
  
  if (indexA < indexB) return -1;
  if (indexA > indexB) return 1;
  return 0;
}

/**
 * Check if target level is reachable from current level
 * Target must be >= Current
 */
export function isValidTargetLevel(current: CEFRLevel, target: CEFRLevel): boolean {
  return compareCEFRLevels(current, target) <= 0;
}

/**
 * Get all levels from current to target (inclusive)
 */
export function getLevelRange(current: CEFRLevel, target: CEFRLevel): CEFRLevel[] {
  const startIndex = CEFR_LEVELS.indexOf(current);
  const endIndex = CEFR_LEVELS.indexOf(target);
  
  if (startIndex > endIndex) return [];
  
  return CEFR_LEVELS.slice(startIndex, endIndex + 1) as CEFRLevel[];
}