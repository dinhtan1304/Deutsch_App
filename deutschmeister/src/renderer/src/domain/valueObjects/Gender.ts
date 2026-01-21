/**
 * Gender Value Object
 * Represents German grammatical gender (der/die/das)
 */

export const GENDERS = ['masculine', 'feminine', 'neuter'] as const;

export type Gender = (typeof GENDERS)[number];

export const GenderInfo: Record<Gender, {
  article: string;
  articleDefinite: string;
  articleIndefinite: string;
  color: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  name: string;
  nameDE: string;
  symbol: string;
}> = {
  masculine: {
    article: 'der',
    articleDefinite: 'der',
    articleIndefinite: 'ein',
    color: '#3b82f6', // blue-500
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-100',
    borderClass: 'border-blue-500',
    name: 'Masculine',
    nameDE: 'Maskulinum',
    symbol: '♂'
  },
  feminine: {
    article: 'die',
    articleDefinite: 'die',
    articleIndefinite: 'eine',
    color: '#ec4899', // pink-500
    colorClass: 'text-pink-600',
    bgClass: 'bg-pink-100',
    borderClass: 'border-pink-500',
    name: 'Feminine',
    nameDE: 'Femininum',
    symbol: '♀'
  },
  neuter: {
    article: 'das',
    articleDefinite: 'das',
    articleIndefinite: 'ein',
    color: '#22c55e', // green-500
    colorClass: 'text-green-600',
    bgClass: 'bg-green-100',
    borderClass: 'border-green-500',
    name: 'Neuter',
    nameDE: 'Neutrum',
    symbol: '⚬'
  }
};

/**
 * Check if a gender value is valid
 */
export function isValidGender(gender: string): gender is Gender {
  return GENDERS.includes(gender as Gender);
}

/**
 * Get gender from article
 */
export function getGenderFromArticle(article: string): Gender | null {
  const lowerArticle = article.toLowerCase().trim();
  
  switch (lowerArticle) {
    case 'der':
    case 'ein': // Could be masculine or neuter, default to masculine
      return 'masculine';
    case 'die':
    case 'eine':
      return 'feminine';
    case 'das':
      return 'neuter';
    default:
      return null;
  }
}

/**
 * Get article for a gender
 */
export function getArticle(gender: Gender): string {
  return GenderInfo[gender].article;
}

/**
 * Get color for a gender
 */
export function getGenderColor(gender: Gender): string {
  return GenderInfo[gender].color;
}

/**
 * Get all gender options for UI
 */
export function getGenderOptions(): Array<{ value: Gender; label: string; article: string }> {
  return GENDERS.map(gender => ({
    value: gender,
    label: GenderInfo[gender].name,
    article: GenderInfo[gender].article
  }));
}