/**
 * Language Value Object
 * Supported interface languages: English, Vietnamese, German
 */

export const SUPPORTED_LANGUAGES = ['en', 'vi', 'de'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LanguageInfo: Record<Language, { 
  name: string; 
  nativeName: string; 
  flag: string;
}> = {
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧'
  },
  vi: {
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳'
  },
  de: {
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪'
  }
};

/**
 * Check if a language code is valid
 */
export function isValidLanguage(lang: string): lang is Language {
  return SUPPORTED_LANGUAGES.includes(lang as Language);
}

/**
 * Get language display name
 */
export function getLanguageName(lang: Language, inNative: boolean = false): string {
  const info = LanguageInfo[lang];
  return inNative ? info.nativeName : info.name;
}

/**
 * Get default language based on system locale
 */
export function getDefaultLanguage(): Language {
  const systemLang = navigator.language.split('-')[0].toLowerCase();
  
  if (isValidLanguage(systemLang)) {
    return systemLang;
  }
  
  return 'en'; // Default to English
}