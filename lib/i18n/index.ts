import { zh } from './zh';
import { en } from './en';

export type Language = 'zh' | 'en';
export type Translation = typeof zh;

export const translations = {
  zh,
  en
} as const;

export const defaultLanguage: Language = 'zh';

export function getTranslation(lang: Language): Translation {
  return translations[lang] || translations[defaultLanguage];
} 