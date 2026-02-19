import { VocabularyEntry } from '../types/vocabulary';
import { IDataStore } from './IDataStore';
import { AppConfig } from '../types/config';
import { migrateVocabularyEntry, migrateConfig } from '../utils/migration';
import { mockVocabulary, MOCK_DATA_VERSION } from '../data/mockData';
import { selectWordsForReview, updateFamiliarityScore } from '../utils/spacedRepetition';

const STORAGE_KEYS = {
  VOCABULARY: 'vocab_vocabulary',
  MOCK_VERSION: 'vocab_mock_version',
  LAST_SYNC: 'vocab_last_sync',
  USER_ID_COUNTER: 'vocab_user_id_counter',
  CONFIG: 'vocab_config',
};

/**
 * localStorage implementation of IDataStore
 * Handles mock data merging and user data persistence
 */
export class LocalStorageStore implements IDataStore {
  private vocabulary: VocabularyEntry[] = [];
  private userIdCounter: number = 1000;
  private config: AppConfig = {};

  async initialize(): Promise<void> {
    // Load user vocabulary from localStorage
    const storedVocab = localStorage.getItem(STORAGE_KEYS.VOCABULARY);
    const storedVersion = localStorage.getItem(STORAGE_KEYS.MOCK_VERSION);
    const storedCounter = localStorage.getItem(STORAGE_KEYS.USER_ID_COUNTER);

    if (storedCounter) {
      this.userIdCounter = parseInt(storedCounter, 10);
    }

    // Load config
    this.loadConfig();

    // Check if mock data needs to be merged
    const currentVersion = storedVersion ? parseInt(storedVersion, 10) : 0;
    
    if (currentVersion < MOCK_DATA_VERSION) {
      // Merge mock data with user data
      const userWords = storedVocab ? JSON.parse(storedVocab) : [];
      const userWordIds = new Set(userWords.map((w: VocabularyEntry) => w.id));
      
      // Add mock words that don't conflict with user words and migrate entries
      const mergedVocab = [
        ...mockVocabulary.filter(w => !userWordIds.has(w.id)).map(migrateVocabularyEntry),
        ...userWords.map(migrateVocabularyEntry),
      ];
      
      this.vocabulary = mergedVocab;
      
      // Update version
      localStorage.setItem(STORAGE_KEYS.MOCK_VERSION, MOCK_DATA_VERSION.toString());
      this.saveVocabulary();
    } else {
      // Just load user data and migrate
      const rawVocab = storedVocab ? JSON.parse(storedVocab) : mockVocabulary;
      this.vocabulary = rawVocab.map(migrateVocabularyEntry);
    }
  }

  async getVocabulary(): Promise<VocabularyEntry[]> {
    return [...this.vocabulary];
  }

  async getWord(id: number): Promise<VocabularyEntry | null> {
    return this.vocabulary.find(w => w.id === id) || null;
  }

  async addWord(entry: Omit<VocabularyEntry, 'id'>): Promise<number> {
    // 确保userIdCounter不会产生重复ID
    const existingIds = new Set(this.vocabulary.map(w => w.id));
    while (existingIds.has(this.userIdCounter)) {
      this.userIdCounter++;
    }
    
    const newId = this.userIdCounter++;
    const newWord: VocabularyEntry = {
      ...entry,
      id: newId,
      familiarityScore: entry.familiarityScore || 0,
      timesReviewed: entry.timesReviewed || 0,
      timesCorrect: entry.timesCorrect || 0,
    };
    
    this.vocabulary.push(newWord);
    this.saveVocabulary();
    localStorage.setItem(STORAGE_KEYS.USER_ID_COUNTER, this.userIdCounter.toString());
    
    return newId;
  }

  async updateWord(entry: VocabularyEntry): Promise<void> {
    const index = this.vocabulary.findIndex(w => w.id === entry.id);
    if (index !== -1) {
      this.vocabulary[index] = entry;
      this.saveVocabulary();
    }
  }

  async deleteWord(id: number): Promise<void> {
    this.vocabulary = this.vocabulary.filter(w => w.id !== id);
    this.saveVocabulary();
  }

  async searchWords(query: string): Promise<VocabularyEntry[]> {
    const lowerQuery = query.toLowerCase();
    return this.vocabulary.filter(w =>
      w.word.toLowerCase().includes(lowerQuery) ||
      (w.variants && w.variants.some(v => v.toLowerCase().includes(lowerQuery))) ||
      w.definitions.some(d => d.text.toLowerCase().includes(lowerQuery))
    );
  }

  async recordReview(wordId: number, rating: 1 | 2 | 3 | 4 | 5): Promise<void> {
    const word = this.vocabulary.find(w => w.id === wordId);
    if (!word) return;

    // 使用新的熟悉度更新算法
    const newScore = updateFamiliarityScore(
      word.familiarityScore,
      rating,
      word.timesReviewed
    );
    
    // 更新统计信息
    word.familiarityScore = newScore;
    word.timesReviewed++;
    
    if (rating >= 4) {
      word.timesCorrect++;
    }

    // Track review timestamp
    if (!word.recentReviews) {
      word.recentReviews = [];
    }
    
    const timestamp = new Date().toISOString();
    word.recentReviews.push(timestamp);
    
    // Maintain max 10 entries
    if (word.recentReviews.length > 10) {
      word.recentReviews = word.recentReviews.slice(-10);
    }

    this.saveVocabulary();
  }

  async getReviewQueue(limit: number = 20): Promise<VocabularyEntry[]> {
    // Load recency weight from config
    const recencyWeight = this.config.reviewRecencyWeight ?? 0.5;
    
    // 使用新的加权随机抽样算法
    return selectWordsForReview(this.vocabulary, limit, recencyWeight);
  }

  async getStats(): Promise<{
    totalWords: number;
    reviewedWords: number;
    averageFamiliarity: number;
  }> {
    const totalWords = this.vocabulary.length;
    const reviewedWords = this.vocabulary.filter(w => w.timesReviewed > 0).length;
    const averageFamiliarity = totalWords > 0
      ? this.vocabulary.reduce((sum, w) => sum + w.familiarityScore, 0) / totalWords
      : 0;

    return {
      totalWords,
      reviewedWords,
      averageFamiliarity,
    };
  }

  async exportData(): Promise<string> {
    return JSON.stringify({
      vocabulary: this.vocabulary,
      version: MOCK_DATA_VERSION,
      exportDate: new Date().toISOString(),
    }, null, 2);
  }

  async importData(data: string): Promise<void> {
    try {
      const parsed = JSON.parse(data);
      if (parsed.vocabulary && Array.isArray(parsed.vocabulary)) {
        this.vocabulary = parsed.vocabulary;
        this.saveVocabulary();
      }
    } catch (error) {
      throw new Error('Invalid import data format');
    }
  }

  async clearAllData(): Promise<void> {
    this.vocabulary = [];
    this.userIdCounter = 1000;
    localStorage.removeItem(STORAGE_KEYS.VOCABULARY);
    localStorage.removeItem(STORAGE_KEYS.MOCK_VERSION);
    localStorage.removeItem(STORAGE_KEYS.USER_ID_COUNTER);
    localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
  }

  async getLastSyncTime(): Promise<Date | null> {
    const timestamp = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return timestamp ? new Date(timestamp) : null;
  }

  async markSynced(): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  private saveVocabulary(): void {
    localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(this.vocabulary));
  }

  /**
   * Load config from localStorage
   */
  private loadConfig(): void {
    const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (stored) {
      this.config = migrateConfig(JSON.parse(stored));
    } else {
      this.config = migrateConfig({});
    }
  }

  /**
   * Save config to localStorage
   */
  private saveConfig(): void {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
  }

  /**
   * Get current config
   */
  async getConfig(): Promise<AppConfig> {
    return { ...this.config };
  }

  /**
   * Update config with partial updates
   */
  async updateConfig(updates: Partial<AppConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }
}
