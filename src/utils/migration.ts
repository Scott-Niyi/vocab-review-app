/**
 * Data Migration Utilities
 * 
 * Handles backward compatibility by initializing missing fields
 * in vocabulary entries and config files.
 */

import { VocabularyEntry } from '../types/vocabulary';
import { AppConfig } from '../types/config';

/**
 * Migrate a vocabulary entry to include new fields
 * Initializes missing recentReviews field while preserving all existing fields
 * 
 * @param entry - Raw vocabulary entry object (may be missing new fields)
 * @returns Migrated vocabulary entry with all required fields
 */
export function migrateVocabularyEntry(entry: any): VocabularyEntry {
  return {
    ...entry,
    recentReviews: entry.recentReviews ?? []
  };
}

/**
 * Migrate config to include new fields
 * Initializes missing reviewRecencyWeight field while preserving all existing fields
 * 
 * @param config - Raw config object (may be missing new fields)
 * @returns Migrated config with all required fields
 */
export function migrateConfig(config: any): AppConfig {
  return {
    ...config,
    reviewRecencyWeight: config.reviewRecencyWeight ?? 0.5
  };
}
