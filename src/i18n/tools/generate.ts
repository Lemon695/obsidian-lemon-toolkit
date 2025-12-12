/**
 * Translation generation tools
 * 
 * This module provides utilities to generate new language packs,
 * extract translation keys from source code, and create templates.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { TranslationModule, Locale, BaseTranslations } from '../types';

export interface LanguageTemplate {
  locale: Locale;
  modules: Record<TranslationModule, BaseTranslations>;
}

export interface ExtractionResult {
  keys: string[];
  files: string[];
  missingKeys: string[];
}

/**
 * Generate a new language pack template
 */
export async function generateLanguageTemplate(
  newLocale: Locale,
  referenceLocale: Locale = 'en'
): Promise<LanguageTemplate> {
  const modules: TranslationModule[] = ['common', 'commands', 'ui', 'settings', 'errors', 'efficiency'];
  const template: LanguageTemplate = {
    locale: newLocale,
    modules: {} as Record<TranslationModule, BaseTranslations>,
  };
  
  for (const module of modules) {
    try {
      // Load reference module
      const referenceModule = await import(`../locales/${referenceLocale}/${module}.ts`);
      const referenceTranslations: BaseTranslations = referenceModule.default || {};
      
      // Create template with empty values
      const moduleTemplate: BaseTranslations = {};
      for (const key of Object.keys(referenceTranslations)) {
        moduleTemplate[key] = `[TODO: Translate] ${referenceTranslations[key]}`;
      }
      
      template.modules[module] = moduleTemplate;
    } catch (error) {
      console.warn(`Failed to load reference module ${module}:`, error);
      template.modules[module] = {};
    }
  }
  
  return template;
}

/**
 * Write language template to files
 */
export async function writeLanguageTemplate(
  template: LanguageTemplate,
  outputDir?: string
): Promise<void> {
  const baseDir = outputDir || path.join('src', 'i18n', 'locales', template.locale);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  
  // Write each module
  for (const [module, translations] of Object.entries(template.modules)) {
    const moduleContent = generateModuleFile(module as TranslationModule, translations, template.locale);
    const filePath = path.join(baseDir, `${module}.ts`);
    
    fs.writeFileSync(filePath, moduleContent, 'utf8');
    console.log(`Generated: ${filePath}`);
  }
  
  // Write index file
  const indexContent = generateIndexFile(Object.keys(template.modules) as TranslationModule[]);
  const indexPath = path.join(baseDir, 'index.ts');
  fs.writeFileSync(indexPath, indexContent, 'utf8');
  console.log(`Generated: ${indexPath}`);
}

/**
 * Generate module file content
 */
function generateModuleFile(
  module: TranslationModule,
  translations: BaseTranslations,
  locale: Locale
): string {
  const moduleNameMap: Record<string, string> = {
    common: 'Common',
    commands: 'Command',
    ui: 'UI Component',
    settings: 'Settings',
    errors: 'Error and notification',
    efficiency: 'Efficiency and statistics',
  };
  
  const moduleName = moduleNameMap[module] || module;
  const localeNameMap: Record<string, string> = {
    en: 'English',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    fr: 'French',
    de: 'German',
    es: 'Spanish',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
  };
  
  const localeName = localeNameMap[locale] || locale.toUpperCase();
  
  let content = `/**\n`;
  content += ` * ${moduleName} ${localeName} translations\n`;
  content += ` * \n`;
  content += ` * This module contains translations for ${module} functionality.\n`;
  content += ` */\n\n`;
  
  // Import type
  const typeMap: Record<string, string> = {
    common: 'CommonTranslations',
    commands: 'CommandTranslations',
    ui: 'UITranslations',
    settings: 'SettingsTranslations',
    errors: 'ErrorTranslations',
    efficiency: 'EfficiencyTranslations',
  };
  
  const typeName = typeMap[module];
  content += `import type { ${typeName} } from '../../types';\n\n`;
  
  // Generate translations object
  content += `const ${module}Translations: ${typeName} = {\n`;
  
  for (const [key, value] of Object.entries(translations)) {
    const escapedValue = value.replace(/'/g, "\\'").replace(/\n/g, '\\n');
    content += `  ${key}: '${escapedValue}',\n`;
  }
  
  content += `};\n\n`;
  content += `export default ${module}Translations;`;
  
  return content;
}

/**
 * Generate index file content
 */
function generateIndexFile(modules: TranslationModule[]): string {
  let content = `/**\n`;
  content += ` * Language pack entry point\n`;
  content += ` * \n`;
  content += ` * This file exports all translation modules for easy importing.\n`;
  content += ` */\n\n`;
  
  for (const module of modules) {
    content += `export { default as ${module} } from './${module}';\n`;
  }
  
  return content;
}

/**
 * Extract translation keys from source code
 */
export function extractTranslationKeys(sourceDir: string = 'src'): ExtractionResult {
  const keys = new Set<string>();
  const files: string[] = [];
  
  function scanDirectory(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
        scanDirectory(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const fileKeys = extractKeysFromContent(content);
        
        if (fileKeys.length > 0) {
          files.push(fullPath);
          fileKeys.forEach(key => keys.add(key));
        }
      }
    }
  }
  
  scanDirectory(sourceDir);
  
  return {
    keys: Array.from(keys).sort(),
    files,
    missingKeys: [], // This would be populated by comparing with existing translations
  };
}

/**
 * Extract translation keys from file content
 */
function extractKeysFromContent(content: string): string[] {
  const keys: string[] = [];
  
  // Match t('key') and t("key") patterns
  const tFunctionRegex = /\bt\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match;
  
  while ((match = tFunctionRegex.exec(content)) !== null) {
    keys.push(match[1]);
  }
  
  // Match tm('module', 'key') patterns
  const tmFunctionRegex = /\btm\s*\(\s*['"`]\w+['"`]\s*,\s*['"`]([^'"`]+)['"`]/g;
  
  while ((match = tmFunctionRegex.exec(content)) !== null) {
    keys.push(match[1]);
  }
  
  return keys;
}

/**
 * Generate translation coverage report
 */
export async function generateCoverageReport(
  targetLocale: Locale,
  referenceLocale: Locale = 'en'
): Promise<string> {
  const modules: TranslationModule[] = ['common', 'commands', 'ui', 'settings', 'errors', 'efficiency'];
  let report = `# Translation Coverage Report\n\n`;
  report += `**Target Locale:** ${targetLocale}\n`;
  report += `**Reference Locale:** ${referenceLocale}\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  
  let totalKeys = 0;
  let translatedKeys = 0;
  
  for (const module of modules) {
    try {
      const referenceModule = await import(`../locales/${referenceLocale}/${module}.ts`);
      const referenceTranslations: BaseTranslations = referenceModule.default || {};
      
      let targetTranslations: BaseTranslations = {};
      try {
        const targetModule = await import(`../locales/${targetLocale}/${module}.ts`);
        targetTranslations = targetModule.default || {};
      } catch {
        // Module doesn't exist for target locale
      }
      
      const referenceKeys = Object.keys(referenceTranslations);
      const targetKeys = Object.keys(targetTranslations);
      const moduleTranslatedKeys = referenceKeys.filter(key => 
        targetKeys.includes(key) && 
        targetTranslations[key] && 
        !targetTranslations[key].startsWith('[TODO:')
      );
      
      totalKeys += referenceKeys.length;
      translatedKeys += moduleTranslatedKeys.length;
      
      const coverage = referenceKeys.length > 0 
        ? (moduleTranslatedKeys.length / referenceKeys.length) * 100 
        : 100;
      
      report += `## Module: ${module}\n\n`;
      report += `- **Total keys:** ${referenceKeys.length}\n`;
      report += `- **Translated:** ${moduleTranslatedKeys.length}\n`;
      report += `- **Coverage:** ${coverage.toFixed(1)}%\n\n`;
      
      const missingKeys = referenceKeys.filter(key => !moduleTranslatedKeys.includes(key));
      if (missingKeys.length > 0) {
        report += `### Missing translations:\n`;
        for (const key of missingKeys) {
          report += `- \`${key}\`\n`;
        }
        report += '\n';
      }
      
    } catch (error) {
      report += `## Module: ${module}\n\n`;
      report += `❌ **Error:** Failed to load module - ${error.message}\n\n`;
    }
  }
  
  const overallCoverage = totalKeys > 0 ? (translatedKeys / totalKeys) * 100 : 100;
  
  report += `## Overall Summary\n\n`;
  report += `- **Total keys:** ${totalKeys}\n`;
  report += `- **Translated:** ${translatedKeys}\n`;
  report += `- **Overall coverage:** ${overallCoverage.toFixed(1)}%\n\n`;
  
  if (overallCoverage >= 100) {
    report += `🎉 **Status:** Complete!\n`;
  } else if (overallCoverage >= 80) {
    report += `✅ **Status:** Good progress\n`;
  } else if (overallCoverage >= 50) {
    report += `⚠️ **Status:** Needs work\n`;
  } else {
    report += `❌ **Status:** Incomplete\n`;
  }
  
  return report;
}