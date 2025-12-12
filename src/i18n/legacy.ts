/**
 * Legacy translation support for backward compatibility
 * 
 * This module provides a synchronous translation function that works
 * with the existing codebase during the migration period.
 */

import type { TranslationParams, Locale } from './types';

// Import all translation modules
import enCommon from './locales/en/common';
import enCommands from './locales/en/commands';
import enUI from './locales/en/ui';
import enSettings from './locales/en/settings';
import enErrors from './locales/en/errors';
import enEfficiency from './locales/en/efficiency';

import zhCommon from './locales/zh/common';
import zhCommands from './locales/zh/commands';
import zhUI from './locales/zh/ui';
import zhSettings from './locales/zh/settings';
import zhErrors from './locales/zh/errors';
import zhEfficiency from './locales/zh/efficiency';

// Combine all translations into flat objects
const enTranslations = {
  ...enCommon,
  ...enCommands,
  ...enUI,
  ...enSettings,
  ...enErrors,
  ...enEfficiency,
};

const zhTranslations = {
  ...zhCommon,
  ...zhCommands,
  ...zhUI,
  ...zhSettings,
  ...zhErrors,
  ...zhEfficiency,
};

const translations: Record<string, Record<string, string>> = {
  'en': enTranslations,
  'en-GB': enTranslations, // Alias for backward compatibility
  'zh': zhTranslations,
};

/**
 * Get current locale from localStorage or browser
 */
export function getLocale(): Locale {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem('language');
    if (stored && stored in translations) {
      return stored as Locale;
    }
  }
  
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language;
    if (browserLang.startsWith('zh')) {
      return 'zh';
    }
  }
  
  return 'en';
}

/**
 * Synchronous translation function (legacy support)
 */
export function t(key: string, params?: TranslationParams): string {
  const locale = getLocale();
  const localeTranslations = translations[locale] || translations['en'];
  
  let translation = localeTranslations[key];
  
  // Fallback to English if not found
  if (!translation && locale !== 'en') {
    translation = translations['en'][key];
  }
  
  // Fallback to key if still not found
  if (!translation) {
    console.warn(`Translation not found for key: ${key}`);
    translation = key;
  }
  
  // Interpolate parameters
  if (params) {
    translation = translation.replace(/\{(\w+)\}/g, (match: string, paramKey: string) => {
      const value = params[paramKey];
      return value !== undefined ? String(value) : match;
    });
  }
  
  return translation;
}

/**
 * Debug function for locale information
 */
export function debugLocale(): void {
  console.log('=== Locale Debug Info ===');
  console.log('Current locale:', getLocale());
  console.log('localStorage language:', window.localStorage?.getItem('language'));
  console.log('navigator.language:', navigator.language);
  console.log('Available locales:', Object.keys(translations));
  console.log('========================');
}