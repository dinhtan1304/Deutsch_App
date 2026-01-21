/**
 * Word Category Value Object
 * Categories for organizing vocabulary
 */

export const WORD_CATEGORIES = [
  'general',
  'food',
  'animals',
  'nature',
  'body',
  'family',
  'home',
  'work',
  'travel',
  'education',
  'technology',
  'clothing',
  'sports',
  'music',
  'health',
  'weather',
  'time',
  'numbers',
  'colors',
  'emotions'
] as const;

export type WordCategory = (typeof WORD_CATEGORIES)[number];

export const WordCategoryInfo: Record<WordCategory, {
  name: string;
  nameDE: string;
  icon: string;
  description: string;
}> = {
  general: {
    name: 'General',
    nameDE: 'Allgemein',
    icon: '📚',
    description: 'Common everyday words'
  },
  food: {
    name: 'Food & Drinks',
    nameDE: 'Essen & Trinken',
    icon: '🍽️',
    description: 'Food, beverages, and cooking'
  },
  animals: {
    name: 'Animals',
    nameDE: 'Tiere',
    icon: '🐾',
    description: 'Animals and pets'
  },
  nature: {
    name: 'Nature',
    nameDE: 'Natur',
    icon: '🌿',
    description: 'Plants, landscapes, and environment'
  },
  body: {
    name: 'Body',
    nameDE: 'Körper',
    icon: '🫀',
    description: 'Body parts and health'
  },
  family: {
    name: 'Family',
    nameDE: 'Familie',
    icon: '👨‍👩‍👧‍👦',
    description: 'Family members and relationships'
  },
  home: {
    name: 'Home',
    nameDE: 'Zuhause',
    icon: '🏠',
    description: 'Household items and rooms'
  },
  work: {
    name: 'Work',
    nameDE: 'Arbeit',
    icon: '💼',
    description: 'Professions and workplace'
  },
  travel: {
    name: 'Travel',
    nameDE: 'Reisen',
    icon: '✈️',
    description: 'Transportation and travel'
  },
  education: {
    name: 'Education',
    nameDE: 'Bildung',
    icon: '🎓',
    description: 'School and learning'
  },
  technology: {
    name: 'Technology',
    nameDE: 'Technologie',
    icon: '💻',
    description: 'Computers and electronics'
  },
  clothing: {
    name: 'Clothing',
    nameDE: 'Kleidung',
    icon: '👕',
    description: 'Clothes and accessories'
  },
  sports: {
    name: 'Sports',
    nameDE: 'Sport',
    icon: '⚽',
    description: 'Sports and activities'
  },
  music: {
    name: 'Music',
    nameDE: 'Musik',
    icon: '🎵',
    description: 'Music and instruments'
  },
  health: {
    name: 'Health',
    nameDE: 'Gesundheit',
    icon: '🏥',
    description: 'Medical and wellness'
  },
  weather: {
    name: 'Weather',
    nameDE: 'Wetter',
    icon: '🌤️',
    description: 'Weather and seasons'
  },
  time: {
    name: 'Time',
    nameDE: 'Zeit',
    icon: '⏰',
    description: 'Days, months, and time'
  },
  numbers: {
    name: 'Numbers',
    nameDE: 'Zahlen',
    icon: '🔢',
    description: 'Numbers and counting'
  },
  colors: {
    name: 'Colors',
    nameDE: 'Farben',
    icon: '🎨',
    description: 'Colors and shades'
  },
  emotions: {
    name: 'Emotions',
    nameDE: 'Gefühle',
    icon: '😊',
    description: 'Feelings and emotions'
  }
};

/**
 * Check if a category value is valid
 */
export function isValidCategory(category: string): category is WordCategory {
  return WORD_CATEGORIES.includes(category as WordCategory);
}

/**
 * Get category options for UI
 */
export function getCategoryOptions(): Array<{ value: WordCategory; label: string; icon: string }> {
  return WORD_CATEGORIES.map(category => ({
    value: category,
    label: WordCategoryInfo[category].name,
    icon: WordCategoryInfo[category].icon
  }));
}