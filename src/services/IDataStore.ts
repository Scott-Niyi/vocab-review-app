import { VocabularyEntry } from '../types/vocabulary';
import { AppConfig } from '../types/config';

/**
 * Data store interface for vocabulary management
 * Allows swapping between localStorage, SQLite, cloud storage, etc.
 */
export interface IDataStore {
  // Initialization
  initialize(): Promise<void>;
  
  // Vocabulary operations
  getVocabulary(): Promise<VocabularyEntry[]>;
  getWord(id: number): Promise<VocabularyEntry | null>;
  addWord(entry: Omit<VocabularyEntry, 'id'>): Promise<number>;
  updateWord(entry: VocabularyEntry): Promise<void>;
  deleteWord(id: number): Promise<void>;
  searchWords(query: string): Promise<VocabularyEntry[]>;
  
  // Review operations
  recordReview(wordId: number, rating: 1 | 2 | 3 | 4 | 5): Promise<void>;
  getReviewQueue(limit?: number): Promise<VocabularyEntry[]>;
  
  // Statistics
  getStats(): Promise<{
    totalWords: number;
    reviewedWords: number;
    averageFamiliarity: number;
  }>;
  
  // Data management
  exportData(): Promise<string>; // JSON string
  importData(data: string): Promise<void>;
  clearAllData(): Promise<void>;
  
  // Config operations
  getConfig(): Promise<AppConfig>;
  updateConfig(updates: Partial<AppConfig>): Promise<void>;
  
  // Sync operations (for future cloud sync)
  getLastSyncTime(): Promise<Date | null>;
  markSynced(): Promise<void>;
}

/**
 * Review statistics for a word
 */
export interface ReviewRecord {
  wordId: number;
  rating: number;
  timestamp: Date;
}
