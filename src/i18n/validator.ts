/**
 * Translation validation utilities
 * 
 * This module provides tools to validate translation completeness,
 * consistency, and correctness across different locales.
 */

import type { TranslationModule, Locale, BaseTranslations } from './types';

export interface ValidationResult {
  isValid: boolean;
  missing: string[];
  extra: string[];
  errors: ValidationError[];
}

export interface ValidationError {
  type: 'missing_key' | 'extra_key' | 'empty_value' | 'invalid_interpolation';
  key: string;
  message: string;
  locale?: Locale;
  module?: TranslationModule;
}

export interface ModuleValidationResult {
  module: TranslationModule;
  locale: Locale;
  result: ValidationResult;
}

/**
 * Validate a single translation module against a reference
 */
export async function validateModule(
  module: TranslationModule,
  targetLocale: Locale,
  referenceLocale: Locale = 'en'
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const missing: string[] = [];
  const extra: string[] = [];
  
  try {
    // Load reference and target modules
    const referenceModule = await import(`./locales/${referenceLocale}/${module}.ts`);
    const targetModule = await import(`./locales/${targetLocale}/${module}.ts`);
    
    const referenceTranslations: BaseTranslations = referenceModule.default || {};
    const targetTranslations: BaseTranslations = targetModule.default || {};
    
    const referenceKeys = Object.keys(referenceTranslations);
    const targetKeys = Object.keys(targetTranslations);
    
    // Find missing keys
    for (const key of referenceKeys) {
      if (!targetTranslations.hasOwnProperty(key)) {
        missing.push(key);
        errors.push({
          type: 'missing_key',
          key,
          message: `Missing translation for key: ${key}`,
          locale: targetLocale,
          module,
        });
      } else {
        // Check for empty values
        const value = targetTranslations[key];
        if (!value || value.trim() === '') {
          errors.push({
            type: 'empty_value',
            key,
            message: `Empty translation value for key: ${key}`,
            locale: targetLocale,
            module,
          });
        }
        
        // Check interpolation consistency
        const referenceParams = extractInterpolationParams(referenceTranslations[key]);
        const targetParams = extractInterpolationParams(value);
        
        if (!arraysEqual(referenceParams, targetParams)) {
          errors.push({
            type: 'invalid_interpolation',
            key,
            message: `Interpolation parameters mismatch for key: ${key}. Expected: [${referenceParams.join(', ')}], Found: [${targetParams.join(', ')}]`,
            locale: targetLocale,
            module,
          });
        }
      }
    }
    
    // Find extra keys
    for (const key of targetKeys) {
      if (!referenceTranslations.hasOwnProperty(key)) {
        extra.push(key);
        errors.push({
          type: 'extra_key',
          key,
          message: `Extra translation key not found in reference: ${key}`,
          locale: targetLocale,
          module,
        });
      }
    }
    
  } catch (error) {
    errors.push({
      type: 'missing_key',
      key: 'MODULE_LOAD_ERROR',
      message: `Failed to load module ${module} for locale ${targetLocale}: ${error.message}`,
      locale: targetLocale,
      module,
    });
  }
  
  return {
    isValid: errors.length === 0,
    missing,
    extra,
    errors,
  };
}

/**
 * Validate all modules for a locale
 */
export async function validateLocale(
  targetLocale: Locale,
  referenceLocale: Locale = 'en'
): Promise<ModuleValidationResult[]> {
  const modules: TranslationModule[] = ['common', 'commands', 'ui', 'settings', 'errors', 'efficiency'];
  const results: ModuleValidationResult[] = [];
  
  for (const module of modules) {
    const result = await validateModule(module, targetLocale, referenceLocale);
    results.push({
      module,
      locale: targetLocale,
      result,
    });
  }
  
  return results;
}

/**
 * Validate all available locales
 */
export async function validateAllLocales(
  referenceLocale: Locale = 'en'
): Promise<Record<Locale, ModuleValidationResult[]>> {
  const availableLocales: Locale[] = ['en', 'zh']; // This could be dynamic
  const results: Record<Locale, ModuleValidationResult[]> = {};
  
  for (const locale of availableLocales) {
    if (locale !== referenceLocale) {
      results[locale] = await validateLocale(locale, referenceLocale);
    }
  }
  
  return results;
}

/**
 * Generate a validation report
 */
export function generateValidationReport(
  results: Record<Locale, ModuleValidationResult[]>
): string {
  let report = '# Translation Validation Report\n\n';
  
  for (const [locale, moduleResults] of Object.entries(results)) {
    report += `## Locale: ${locale}\n\n`;
    
    let totalErrors = 0;
    let totalMissing = 0;
    let totalExtra = 0;
    
    for (const moduleResult of moduleResults) {
      const { module, result } = moduleResult;
      totalErrors += result.errors.length;
      totalMissing += result.missing.length;
      totalExtra += result.extra.length;
      
      report += `### Module: ${module}\n`;
      report += `- Status: ${result.isValid ? '✅ Valid' : '❌ Invalid'}\n`;
      report += `- Missing keys: ${result.missing.length}\n`;
      report += `- Extra keys: ${result.extra.length}\n`;
      report += `- Total errors: ${result.errors.length}\n\n`;
      
      if (result.errors.length > 0) {
        report += '#### Errors:\n';
        for (const error of result.errors) {
          report += `- **${error.type}**: ${error.message}\n`;
        }
        report += '\n';
      }
    }
    
    report += `### Summary for ${locale}:\n`;
    report += `- Total missing keys: ${totalMissing}\n`;
    report += `- Total extra keys: ${totalExtra}\n`;
    report += `- Total errors: ${totalErrors}\n`;
    report += `- Overall status: ${totalErrors === 0 ? '✅ Valid' : '❌ Invalid'}\n\n`;
  }
  
  return report;
}

/**
 * Extract interpolation parameters from a translation string
 */
function extractInterpolationParams(text: string): string[] {
  const matches = text.match(/\{(\w+)\}/g);
  if (!matches) return [];
  
  return matches.map(match => match.slice(1, -1)).sort();
}

/**
 * Check if two arrays are equal
 */
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  
  return sortedA.every((val, index) => val === sortedB[index]);
}

/**
 * Get translation coverage statistics
 */
export async function getTranslationCoverage(
  targetLocale: Locale,
  referenceLocale: Locale = 'en'
): Promise<{
  totalKeys: number;
  translatedKeys: number;
  coverage: number;
  missingKeys: string[];
}> {
  const results = await validateLocale(targetLocale, referenceLocale);
  
  let totalKeys = 0;
  let missingKeys: string[] = [];
  
  for (const moduleResult of results) {
    totalKeys += moduleResult.result.missing.length + 
                 (Object.keys(moduleResult.result).length - moduleResult.result.extra.length);
    missingKeys = missingKeys.concat(moduleResult.result.missing);
  }
  
  const translatedKeys = totalKeys - missingKeys.length;
  const coverage = totalKeys > 0 ? (translatedKeys / totalKeys) * 100 : 100;
  
  return {
    totalKeys,
    translatedKeys,
    coverage: Math.round(coverage * 100) / 100,
    missingKeys,
  };
}