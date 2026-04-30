/**
 * German Gender Rules & Detection
 * Quy tắc và mẹo nhớ der/die/das
 */

import { Gender } from '@/types';

export interface GenderRule {
  id: string;
  gender: Gender;
  type: 'ending' | 'prefix' | 'category' | 'special';
  pattern: string;        // Regex hoặc text pattern
  description: string;    // Mô tả tiếng Việt
  examples: string[];     // Ví dụ
  exceptions?: string[];  // Ngoại lệ
  reliability: number;    // % độ tin cậy (0-100)
}

// ============================================
// DER (Maskulinum) Rules
// ============================================
export const derRules: GenderRule[] = [
  // Endings
  {
    id: 'der-er',
    gender: 'masculine',
    type: 'ending',
    pattern: '-er$',
    description: 'Từ kết thúc bằng -er (thường chỉ người/nghề nghiệp)',
    examples: ['der Lehrer', 'der Computer', 'der Finger'],
    exceptions: ['die Mutter', 'die Schwester', 'das Fenster'],
    reliability: 65,
  },
  {
    id: 'der-ling',
    gender: 'masculine',
    type: 'ending',
    pattern: '-ling$',
    description: 'Từ kết thúc bằng -ling',
    examples: ['der Schmetterling', 'der Frühling', 'der Lehrling'],
    reliability: 100,
  },
  {
    id: 'der-ismus',
    gender: 'masculine',
    type: 'ending',
    pattern: '-ismus$',
    description: 'Từ kết thúc bằng -ismus (chủ nghĩa)',
    examples: ['der Tourismus', 'der Optimismus', 'der Kapitalismus'],
    reliability: 100,
  },
  {
    id: 'der-or',
    gender: 'masculine',
    type: 'ending',
    pattern: '-or$',
    description: 'Từ kết thúc bằng -or',
    examples: ['der Motor', 'der Autor', 'der Doktor'],
    reliability: 90,
  },
  {
    id: 'der-us',
    gender: 'masculine',
    type: 'ending',
    pattern: '-us$',
    description: 'Từ kết thúc bằng -us',
    examples: ['der Rhythmus', 'der Zirkus', 'der Bonus'],
    reliability: 85,
  },
  {
    id: 'der-ich-ig',
    gender: 'masculine',
    type: 'ending',
    pattern: '-(ich|ig)$',
    description: 'Từ kết thúc bằng -ich hoặc -ig',
    examples: ['der Teppich', 'der König', 'der Honig'],
    reliability: 80,
  },
  // Categories
  {
    id: 'der-days',
    gender: 'masculine',
    type: 'category',
    pattern: 'days',
    description: 'Các ngày trong tuần',
    examples: ['der Montag', 'der Dienstag', 'der Mittwoch'],
    reliability: 100,
  },
  {
    id: 'der-months',
    gender: 'masculine',
    type: 'category',
    pattern: 'months',
    description: 'Các tháng trong năm',
    examples: ['der Januar', 'der Februar', 'der März'],
    reliability: 100,
  },
  {
    id: 'der-seasons',
    gender: 'masculine',
    type: 'category',
    pattern: 'seasons',
    description: 'Các mùa trong năm',
    examples: ['der Frühling', 'der Sommer', 'der Herbst', 'der Winter'],
    reliability: 100,
  },
  {
    id: 'der-directions',
    gender: 'masculine',
    type: 'category',
    pattern: 'directions',
    description: 'Các hướng',
    examples: ['der Norden', 'der Süden', 'der Osten', 'der Westen'],
    reliability: 100,
  },
  {
    id: 'der-weather',
    gender: 'masculine',
    type: 'category',
    pattern: 'weather',
    description: 'Thời tiết (đa số)',
    examples: ['der Regen', 'der Schnee', 'der Wind', 'der Nebel'],
    reliability: 85,
  },
  {
    id: 'der-cars',
    gender: 'masculine',
    type: 'category',
    pattern: 'cars',
    description: 'Thương hiệu xe hơi',
    examples: ['der BMW', 'der Mercedes', 'der Audi', 'der VW'],
    reliability: 100,
  },
];

// ============================================
// DIE (Femininum) Rules
// ============================================
export const dieRules: GenderRule[] = [
  // Endings - Most reliable!
  {
    id: 'die-ung',
    gender: 'feminine',
    type: 'ending',
    pattern: '-ung$',
    description: 'Từ kết thúc bằng -ung',
    examples: ['die Zeitung', 'die Übung', 'die Wohnung'],
    reliability: 100,
  },
  {
    id: 'die-heit',
    gender: 'feminine',
    type: 'ending',
    pattern: '-heit$',
    description: 'Từ kết thúc bằng -heit',
    examples: ['die Freiheit', 'die Gesundheit', 'die Schönheit'],
    reliability: 100,
  },
  {
    id: 'die-keit',
    gender: 'feminine',
    type: 'ending',
    pattern: '-keit$',
    description: 'Từ kết thúc bằng -keit',
    examples: ['die Möglichkeit', 'die Schwierigkeit', 'die Freundlichkeit'],
    reliability: 100,
  },
  {
    id: 'die-schaft',
    gender: 'feminine',
    type: 'ending',
    pattern: '-schaft$',
    description: 'Từ kết thúc bằng -schaft',
    examples: ['die Freundschaft', 'die Wirtschaft', 'die Mannschaft'],
    reliability: 100,
  },
  {
    id: 'die-tion',
    gender: 'feminine',
    type: 'ending',
    pattern: '-tion$',
    description: 'Từ kết thúc bằng -tion',
    examples: ['die Information', 'die Station', 'die Situation'],
    reliability: 100,
  },
  {
    id: 'die-sion',
    gender: 'feminine',
    type: 'ending',
    pattern: '-sion$',
    description: 'Từ kết thúc bằng -sion',
    examples: ['die Diskussion', 'die Version', 'die Explosion'],
    reliability: 100,
  },
  {
    id: 'die-taet',
    gender: 'feminine',
    type: 'ending',
    pattern: '-tät$',
    description: 'Từ kết thúc bằng -tät',
    examples: ['die Universität', 'die Qualität', 'die Aktivität'],
    reliability: 100,
  },
  {
    id: 'die-ie',
    gender: 'feminine',
    type: 'ending',
    pattern: '-ie$',
    description: 'Từ kết thúc bằng -ie',
    examples: ['die Energie', 'die Demokratie', 'die Familie'],
    reliability: 95,
  },
  {
    id: 'die-ik',
    gender: 'feminine',
    type: 'ending',
    pattern: '-ik$',
    description: 'Từ kết thúc bằng -ik',
    examples: ['die Musik', 'die Politik', 'die Grammatik'],
    reliability: 95,
  },
  {
    id: 'die-ur',
    gender: 'feminine',
    type: 'ending',
    pattern: '-ur$',
    description: 'Từ kết thúc bằng -ur',
    examples: ['die Natur', 'die Kultur', 'die Temperatur'],
    reliability: 90,
  },
  {
    id: 'die-e',
    gender: 'feminine',
    type: 'ending',
    pattern: '-e$',
    description: 'Từ kết thúc bằng -e (đa số)',
    examples: ['die Lampe', 'die Straße', 'die Schule'],
    exceptions: ['der Name', 'der Käse', 'das Ende'],
    reliability: 90,
  },
  {
    id: 'die-in',
    gender: 'feminine',
    type: 'ending',
    pattern: '-in$',
    description: 'Từ kết thúc bằng -in (nữ giới)',
    examples: ['die Lehrerin', 'die Ärztin', 'die Freundin'],
    reliability: 100,
  },
  // Categories
  {
    id: 'die-numbers',
    gender: 'feminine',
    type: 'category',
    pattern: 'numbers',
    description: 'Các số (khi dùng như danh từ)',
    examples: ['die Eins', 'die Zwei', 'die Drei'],
    reliability: 100,
  },
];

// ============================================
// DAS (Neutrum) Rules
// ============================================
export const dasRules: GenderRule[] = [
  // Endings
  {
    id: 'das-chen',
    gender: 'neuter',
    type: 'ending',
    pattern: '-chen$',
    description: 'Từ kết thúc bằng -chen (thu nhỏ)',
    examples: ['das Mädchen', 'das Brötchen', 'das Häuschen'],
    reliability: 100,
  },
  {
    id: 'das-lein',
    gender: 'neuter',
    type: 'ending',
    pattern: '-lein$',
    description: 'Từ kết thúc bằng -lein (thu nhỏ)',
    examples: ['das Fräulein', 'das Büchlein', 'das Männlein'],
    reliability: 100,
  },
  {
    id: 'das-ment',
    gender: 'neuter',
    type: 'ending',
    pattern: '-ment$',
    description: 'Từ kết thúc bằng -ment',
    examples: ['das Instrument', 'das Argument', 'das Dokument'],
    reliability: 95,
  },
  {
    id: 'das-um',
    gender: 'neuter',
    type: 'ending',
    pattern: '-um$',
    description: 'Từ kết thúc bằng -um',
    examples: ['das Museum', 'das Zentrum', 'das Studium'],
    reliability: 95,
  },
  {
    id: 'das-nis',
    gender: 'neuter',
    type: 'ending',
    pattern: '-nis$',
    description: 'Từ kết thúc bằng -nis',
    examples: ['das Ergebnis', 'das Geheimnis', 'das Ereignis'],
    exceptions: ['die Erlaubnis', 'die Kenntnis'],
    reliability: 80,
  },
  {
    id: 'das-tum',
    gender: 'neuter',
    type: 'ending',
    pattern: '-tum$',
    description: 'Từ kết thúc bằng -tum',
    examples: ['das Eigentum', 'das Christentum', 'das Wachstum'],
    exceptions: ['der Reichtum', 'der Irrtum'],
    reliability: 85,
  },
  // Prefix
  {
    id: 'das-ge',
    gender: 'neuter',
    type: 'prefix',
    pattern: '^Ge',
    description: 'Từ bắt đầu bằng Ge- (tập hợp)',
    examples: ['das Gespräch', 'das Geschäft', 'das Gebäude', 'das Gemüse'],
    exceptions: ['der Gedanke', 'die Geschichte'],
    reliability: 80,
  },
  // Categories
  {
    id: 'das-metals',
    gender: 'neuter',
    type: 'category',
    pattern: 'metals',
    description: 'Kim loại',
    examples: ['das Gold', 'das Silber', 'das Eisen', 'das Kupfer'],
    reliability: 95,
  },
  {
    id: 'das-colors',
    gender: 'neuter',
    type: 'category',
    pattern: 'colors',
    description: 'Màu sắc (khi dùng như danh từ)',
    examples: ['das Blau', 'das Rot', 'das Grün'],
    reliability: 100,
  },
  {
    id: 'das-languages',
    gender: 'neuter',
    type: 'category',
    pattern: 'languages',
    description: 'Ngôn ngữ',
    examples: ['das Deutsch', 'das Englisch', 'das Französisch'],
    reliability: 100,
  },
  {
    id: 'das-letters',
    gender: 'neuter',
    type: 'category',
    pattern: 'letters',
    description: 'Chữ cái',
    examples: ['das A', 'das B', 'das C'],
    reliability: 100,
  },
  {
    id: 'das-infinitive',
    gender: 'neuter',
    type: 'special',
    pattern: 'infinitive',
    description: 'Động từ nguyên thể dùng như danh từ',
    examples: ['das Essen', 'das Trinken', 'das Lesen', 'das Schlafen'],
    reliability: 100,
  },
];

// ============================================
// All rules combined
// ============================================
export const allRules: GenderRule[] = [...derRules, ...dieRules, ...dasRules];

// ============================================
// Detection Functions
// ============================================

/**
 * Detect which rules apply to a word
 */
export function detectRules(word: string, gender: Gender): GenderRule[] {
  const rules = gender === 'masculine' ? derRules 
    : gender === 'feminine' ? dieRules 
    : dasRules;
  
  const matchedRules: GenderRule[] = [];
  const wordLower = word.toLowerCase();
  
  for (const rule of rules) {
    if (rule.type === 'ending') {
      const regex = new RegExp(rule.pattern, 'i');
      if (regex.test(word)) {
        matchedRules.push(rule);
      }
    } else if (rule.type === 'prefix') {
      const regex = new RegExp(rule.pattern, 'i');
      if (regex.test(word)) {
        matchedRules.push(rule);
      }
    }
    // Category rules need manual mapping (would need word metadata)
  }
  
  // Sort by reliability
  return matchedRules.sort((a, b) => b.reliability - a.reliability);
}

/**
 * Get the best matching rule for a word
 */
export function getBestRule(word: string, gender: Gender): GenderRule | null {
  const rules = detectRules(word, gender);
  return rules.length > 0 ? (rules[0] ?? null) : null;
}

/**
 * Get tip text for a word
 */
export function getTipForWord(word: string, gender: Gender): string | null {
  const rule = getBestRule(word, gender);
  if (!rule) return null;
  
  const article = gender === 'masculine' ? 'der' : gender === 'feminine' ? 'die' : 'das';
  
  if (rule.type === 'ending') {
    const ending = rule.pattern.replace('$', '').replace('-', '');
    return `💡 Từ kết thúc bằng "${ending}" thường là ${article} (${rule.reliability}%)`;
  }
  
  if (rule.type === 'prefix') {
    const prefix = rule.pattern.replace('^', '');
    return `💡 Từ bắt đầu bằng "${prefix}" thường là ${article} (${rule.reliability}%)`;
  }
  
  return `💡 ${rule.description}`;
}

/**
 * Rhymes / Memory tricks
 */
export const memoryTricks = [
  {
    title: 'Quy tắc -ung, -heit, -keit, -schaft',
    rhyme: '-ung, -heit, -keit, -schaft → DIE ist, was ihr schafft!',
    translation: 'Các đuôi này luôn là DIE (100%)',
    gender: 'feminine' as Gender,
  },
  {
    title: 'Quy tắc -chen, -lein',
    rhyme: '-chen và -lein, klein und fein → immer DAS!',
    translation: 'Đuôi thu nhỏ luôn là DAS (100%)',
    gender: 'neuter' as Gender,
  },
  {
    title: 'Quy tắc Ge-',
    rhyme: 'Ge- am Anfang, DAS ist dran!',
    translation: 'Từ bắt đầu bằng Ge- thường là DAS (80%)',
    gender: 'neuter' as Gender,
  },
  {
    title: 'Quy tắc -tion, -sion',
    rhyme: '-tion und -sion, DIE hat Tradition!',
    translation: 'Các đuôi Latin này luôn là DIE (100%)',
    gender: 'feminine' as Gender,
  },
  {
    title: 'Quy tắc -ismus',
    rhyme: 'Jeder -ismus ist DER Optimismus!',
    translation: 'Các chủ nghĩa (-ismus) luôn là DER (100%)',
    gender: 'masculine' as Gender,
  },
];

/**
 * Quick reference for most common endings
 */
export const quickReference = {
  der: ['-er', '-ling', '-ismus', '-or', '-us'],
  die: ['-ung', '-heit', '-keit', '-schaft', '-tion', '-tät', '-ie', '-ik', '-e'],
  das: ['-chen', '-lein', '-ment', '-um', '-nis', 'Ge-'],
};