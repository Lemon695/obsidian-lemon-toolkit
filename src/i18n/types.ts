/**
 * TypeScript type definitions for the internationalization system
 * 
 * This file defines the structure and types for all translation modules,
 * ensuring type safety across the entire i18n system.
 */

// Base translation interface - flexible to allow any string keys
export interface BaseTranslations {
  [key: string]: string;
}

// Translation module interfaces - flexible to accommodate all keys
export interface CommonTranslations extends BaseTranslations {}
export interface CommandTranslations extends BaseTranslations {}
export interface UITranslations extends BaseTranslations {}
export interface SettingsTranslations extends BaseTranslations {}
export interface ErrorTranslations extends BaseTranslations {}
export interface EfficiencyTranslations extends BaseTranslations {}

// Complete translation keys interface
export interface TranslationKeys {
  common: CommonTranslations;
  commands: CommandTranslations;
  ui: UITranslations;
  settings: SettingsTranslations;
  errors: ErrorTranslations;
  efficiency: EfficiencyTranslations;
}

// Type for all possible translation keys (flat structure for backward compatibility)
export type TranslationKey = keyof (
  CommonTranslations & 
  CommandTranslations & 
  UITranslations & 
  SettingsTranslations & 
  ErrorTranslations & 
  EfficiencyTranslations
);

// Locale type
export type Locale = 'en' | 'zh' | string;

// Translation module names
export type TranslationModule = keyof TranslationKeys;

// Translation parameters for interpolation
export interface TranslationParams {
  [key: string]: string | number;
}