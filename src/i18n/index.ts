/**
 * Main internationalization API
 * 
 * This module provides both backward-compatible and new modular APIs
 * for accessing translations throughout the application.
 */

import { translationLoader, getLocale, setLocale, detectLocale, initializeI18n } from './loader';
import type { TranslationModule, TranslationParams, Locale } from './types';

// Initialize with detected locale
let isInitialized = false;

/**
 * Initialize the i18n system (called automatically on first use)
 */
async function ensureInitialized(): Promise<void> {
  if (!isInitialized) {
    const locale = detectLocale();
    await initializeI18n(locale);
    isInitialized = true;
  }
}

/**
 * Main translation function (backward compatible)
 * 
 * @param key - Translation key
 * @param params - Optional parameters for interpolation
 * @returns Translated string
 * 
 * @example
 * t('copyRelativePath') // "Copy relative path"
 * t('fileDuplicatedAs', { name: 'test.md' }) // "File duplicated: test.md"
 */
export async function t(key: string, params?: TranslationParams): Promise<string> {
  await ensureInitialized();
  return translationLoader.getTranslation(key, params);
}

/**
 * Synchronous translation function (for immediate use)
 * 
 * Note: This function assumes translations are already loaded.
 * Use with caution and prefer the async version when possible.
 * 
 * @param key - Translation key
 * @param params - Optional parameters for interpolation
 * @returns Translated string or key if not found
 */
export function tSync(key: string, params?: TranslationParams): string {
  // Import the legacy synchronous function
  const { t: legacyT } = require('./legacy');
  return legacyT(key, params);
}

/**
 * Modular translation function (new API)
 * 
 * @param module - Translation module name
 * @param key - Translation key within the module
 * @param params - Optional parameters for interpolation
 * @returns Translated string
 * 
 * @example
 * tm('commands', 'copyRelativePath') // "Copy relative path"
 * tm('errors', 'fileDuplicatedAs', { name: 'test.md' }) // "File duplicated: test.md"
 */
export async function tm(
  module: TranslationModule, 
  key: string, 
  params?: TranslationParams
): Promise<string> {
  await ensureInitialized();
  return translationLoader.getModuleTranslation(module, key, params);
}

/**
 * Get current locale
 */
export function getCurrentLocale(): Locale {
  return getLocale();
}

/**
 * Set current locale and reload translations
 */
export async function setCurrentLocale(locale: Locale): Promise<void> {
  setLocale(locale);
  
  // Store in localStorage for persistence
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('language', locale);
  }
  
  // Preload the new locale
  await translationLoader.preloadLocale(locale);
}

/**
 * Get available locales
 */
export function getAvailableLocales(): Locale[] {
  return translationLoader.getAvailableLocales();
}

/**
 * Check if a locale is available
 */
export function isLocaleAvailable(locale: Locale): boolean {
  return translationLoader.isLocaleAvailable(locale);
}

/**
 * Preload translations for a locale
 */
export async function preloadLocale(locale: Locale): Promise<void> {
  await translationLoader.preloadLocale(locale);
}

/**
 * Clear translation cache
 */
export function clearTranslationCache(locale?: Locale): void {
  translationLoader.clearCache(locale);
}

/**
 * Debug function to get all loaded translations
 */
export async function getDebugTranslations(locale?: Locale): Promise<Record<string, string>> {
  const targetLocale = locale || getLocale();
  return translationLoader.loadLocale(targetLocale);
}

// Re-export types for convenience
export type { TranslationModule, TranslationParams, Locale } from './types';

// Legacy export for backward compatibility
// This maintains the exact same API as the old locale.ts file
export { t as default };

/**
 * Legacy function for debugging locale (backward compatibility)
 */
export function debugLocale(): void {
  console.log('=== Locale Debug Info ===');
  console.log('Current locale:', getCurrentLocale());
  console.log('localStorage language:', window.localStorage?.getItem('language'));
  console.log('navigator.language:', navigator.language);
  console.log('Available locales:', getAvailableLocales());
  console.log('========================');
}