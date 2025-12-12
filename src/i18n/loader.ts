/**
 * Dynamic translation loader with caching and performance optimization
 * 
 * This module handles loading translation modules on-demand and provides
 * caching mechanisms to optimize performance.
 */

import type { TranslationKeys, TranslationModule, Locale, BaseTranslations } from './types';

interface LoadedTranslations {
  [locale: string]: {
    [module: string]: BaseTranslations;
  };
}

interface TranslationCache {
  [locale: string]: BaseTranslations; // Flattened translations for backward compatibility
}

class TranslationLoader {
  private moduleCache: LoadedTranslations = {};
  private flatCache: TranslationCache = {};
  private currentLocale: Locale = 'en';
  
  /**
   * Set the current locale
   */
  setLocale(locale: Locale): void {
    this.currentLocale = locale;
  }
  
  /**
   * Get the current locale
   */
  getLocale(): Locale {
    return this.currentLocale;
  }
  
  /**
   * Load a specific translation module for a locale
   */
  async loadModule(locale: Locale, module: TranslationModule): Promise<BaseTranslations> {
    const cacheKey = `${locale}/${module}`;
    
    if (!this.moduleCache[locale]?.[module]) {
      try {
        // Dynamic import of the translation module
        const translationModule = await import(`./locales/${locale}/${module}.ts`);
        
        // Initialize locale cache if needed
        if (!this.moduleCache[locale]) {
          this.moduleCache[locale] = {};
        }
        
        // Store the loaded translations
        this.moduleCache[locale][module] = translationModule.default || {};
      } catch (error) {
        console.warn(`Failed to load translation module ${cacheKey}:`, error);
        
        // Fallback to English if available
        if (locale !== 'en') {
          return this.loadModule('en', module);
        }
        
        // Return empty object as last resort
        return {};
      }
    }
    
    return this.moduleCache[locale][module];
  }
  
  /**
   * Load all modules for a locale and create flattened translation object
   */
  async loadLocale(locale: Locale): Promise<BaseTranslations> {
    if (this.flatCache[locale]) {
      return this.flatCache[locale];
    }
    
    const modules: TranslationModule[] = ['common', 'commands', 'ui', 'settings', 'errors', 'efficiency'];
    const translations: BaseTranslations = {};
    
    // Load all modules in parallel
    const modulePromises = modules.map(module => this.loadModule(locale, module));
    const moduleTranslations = await Promise.all(modulePromises);
    
    // Flatten all translations into a single object
    moduleTranslations.forEach(moduleTranslation => {
      Object.assign(translations, moduleTranslation);
    });
    
    // Cache the flattened translations
    this.flatCache[locale] = translations;
    
    return translations;
  }
  
  /**
   * Get a translation by key from the current locale
   */
  async getTranslation(key: string, params?: Record<string, string | number>): Promise<string> {
    const translations = await this.loadLocale(this.currentLocale);
    let translation = translations[key];
    
    // Fallback to English if translation not found
    if (!translation && this.currentLocale !== 'en') {
      const englishTranslations = await this.loadLocale('en');
      translation = englishTranslations[key];
    }
    
    // Fallback to key if no translation found
    if (!translation) {
      console.warn(`Translation not found for key: ${key}`);
      translation = key;
    }
    
    // Interpolate parameters if provided
    if (params) {
      translation = this.interpolate(translation, params);
    }
    
    return translation;
  }
  
  /**
   * Get a translation from a specific module
   */
  async getModuleTranslation(
    module: TranslationModule, 
    key: string, 
    params?: Record<string, string | number>
  ): Promise<string> {
    const moduleTranslations = await this.loadModule(this.currentLocale, module);
    let translation = moduleTranslations[key];
    
    // Fallback to English if translation not found
    if (!translation && this.currentLocale !== 'en') {
      const englishModuleTranslations = await this.loadModule('en', module);
      translation = englishModuleTranslations[key];
    }
    
    // Fallback to key if no translation found
    if (!translation) {
      console.warn(`Translation not found for key: ${key} in module: ${module}`);
      translation = key;
    }
    
    // Interpolate parameters if provided
    if (params) {
      translation = this.interpolate(translation, params);
    }
    
    return translation;
  }
  
  /**
   * Preload all translations for a locale
   */
  async preloadLocale(locale: Locale): Promise<void> {
    await this.loadLocale(locale);
  }
  
  /**
   * Clear cache for a specific locale or all locales
   */
  clearCache(locale?: Locale): void {
    if (locale) {
      delete this.moduleCache[locale];
      delete this.flatCache[locale];
    } else {
      this.moduleCache = {};
      this.flatCache = {};
    }
  }
  
  /**
   * Interpolate parameters in a translation string
   */
  private interpolate(text: string, params: Record<string, string | number>): string {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      const value = params[key];
      return value !== undefined ? String(value) : match;
    });
  }
  
  /**
   * Get available locales by checking the locales directory
   */
  getAvailableLocales(): Locale[] {
    // This would be populated by the build system or runtime detection
    return ['en', 'zh'];
  }
  
  /**
   * Check if a locale is available
   */
  isLocaleAvailable(locale: Locale): boolean {
    return this.getAvailableLocales().includes(locale);
  }
}

// Singleton instance
export const translationLoader = new TranslationLoader();

/**
 * Initialize the translation system with a locale
 */
export async function initializeI18n(locale: Locale = 'en'): Promise<void> {
  translationLoader.setLocale(locale);
  await translationLoader.preloadLocale(locale);
}

/**
 * Get the current locale
 */
export function getLocale(): Locale {
  return translationLoader.getLocale();
}

/**
 * Set the current locale
 */
export function setLocale(locale: Locale): void {
  translationLoader.setLocale(locale);
}

/**
 * Detect locale from browser or storage
 */
export function detectLocale(): Locale {
  // Check localStorage first
  const storedLocale = window.localStorage?.getItem('language');
  if (storedLocale && translationLoader.isLocaleAvailable(storedLocale)) {
    return storedLocale as Locale;
  }
  
  // Check browser language
  const browserLocale = navigator.language;
  if (browserLocale.startsWith('zh')) {
    return 'zh';
  }
  
  // Default to English
  return 'en';
}