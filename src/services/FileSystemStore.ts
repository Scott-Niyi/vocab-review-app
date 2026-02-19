import { VocabularyEntry } from '../types/vocabulary';
import { IDataStore } from './IDataStore';
import { ILogger } from './ILogger';
import { AppConfig } from '../types/config';
import { migrateVocabularyEntry, migrateConfig } from '../utils/migration';
import { mockVocabulary, MOCK_DATA_VERSION } from '../data/mockData';
import { selectWordsForReview, updateFamiliarityScore } from '../utils/spacedRepetition';
// import { ActionType } from '../logging/types';

const CONFIG_KEY = 'vocab_project_path';

interface VocabularyData {
  vocabulary: VocabularyEntry[] ;
  version: number;
  lastModified: string;
  userIdCounter: number;
}

/**
 * File system implementation of IDataStore
 * Stores data in a JSON file for true persistence and portability
 * Uses Electron IPC for file operations in Electron environment
 * Falls back to localStorage in browser environment
 */
export class FileSystemStore implements IDataStore {
  private vocabulary: VocabularyEntry[] = [];
  private userIdCounter: number = 1000;
  private config: AppConfig = {};
  private projectPath: string;
  private isElectron: boolean;
  private logger: ILogger;

  constructor(projectPath?: string, logger?: ILogger) {
    // Project path is the folder containing vocabulary.json
    // DO NOT auto-load from localStorage - user must explicitly select project
    this.projectPath = projectPath || '';
    
    // Check if we're in Electron environment
    this.isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI?.fs;
    
    // Store logger instance (use console logger if not provided)
    this.logger = logger || {
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      info: console.log.bind(console),
      debug: console.log.bind(console),
      trackEvent: () => {},
      trackTiming: () => {}
    };
  }

  async initialize(): Promise<void> {
    // If no project path, don't try to load
    if (!this.projectPath) {
      this.vocabulary = [];
      return;
    }
    
    try {
      await this.loadFromFile();
      await this.loadConfig();
    } catch (error) {
      console.error('Failed to load from file, initializing with mock data:', error);
      this.vocabulary = [...mockVocabulary];
      await this.saveToFile();
    }
  }

  private async loadFromFile(): Promise<void> {
    if (!this.isElectron) {
      return this.loadFromLocalStorage();
    }

    try {
      const electronAPI = (window as any).electronAPI;
      const vocabFile = `${this.projectPath}/vocabulary.json`;
      
      // Check if file exists
      const existsResult = await electronAPI.fs.exists(vocabFile);
      if (!existsResult.success || !existsResult.exists) {
        this.vocabulary = [...mockVocabulary];
        this.userIdCounter = 1000;
        await this.saveToFile();
        return;
      }

      // Read and parse file
      const readResult = await electronAPI.fs.readFile(vocabFile);
      if (!readResult.success) {
        throw new Error(readResult.error || 'Failed to read file');
      }

      const data: VocabularyData = JSON.parse(readResult.data);

      // Migrate vocabulary entries
      this.vocabulary = (data.vocabulary || []).map(migrateVocabularyEntry);
      this.userIdCounter = data.userIdCounter || 1000;

      // If vocabulary is empty (new project), load mock data
      if (this.vocabulary.length === 0) {
        this.vocabulary = [...mockVocabulary];
        await this.saveToFile();
        return;
      }

      // Merge with mock data if version changed
      if (data.version < MOCK_DATA_VERSION) {
        const userWordIds = new Set(this.vocabulary.map(w => w.id));
        const newMockWords = mockVocabulary.filter(w => !userWordIds.has(w.id));
        this.vocabulary = [...newMockWords, ...this.vocabulary];
        await this.saveToFile();
      }
    } catch (error) {
      console.error('Error loading from file:', error);
      throw error;
    }
  }

  private async saveToFile(): Promise<void> {
    if (!this.isElectron) {
      return this.saveToLocalStorage();
    }

    try {
      const data: VocabularyData = {
        vocabulary: this.vocabulary,
        version: MOCK_DATA_VERSION,
        lastModified: new Date().toISOString(),
        userIdCounter: this.userIdCounter,
      };

      const electronAPI = (window as any).electronAPI;
      const vocabFile = `${this.projectPath}/vocabulary.json`;
      
      const writeResult = await electronAPI.fs.writeFile(
        vocabFile,
        JSON.stringify(data, null, 2)
      );

      if (!writeResult.success) {
        throw new Error(writeResult.error || 'Failed to write file');
      }
    } catch (error) {
      console.error('Error saving to file:', error);
      this.saveToLocalStorage();
    }
  }

  // Fallback methods for when Electron is not available (browser environment)
  private loadFromLocalStorage(): void {
    const stored = localStorage.getItem('vocab_vocabulary');
    const storedCounter = localStorage.getItem('vocab_user_id_counter');
    const storedVersion = localStorage.getItem('vocab_data_version');
    
    if (stored) {
      this.vocabulary = JSON.parse(stored);
    } else {
      this.vocabulary = [...mockVocabulary];
    }
    
    if (storedCounter) {
      this.userIdCounter = parseInt(storedCounter, 10);
    }

    // Merge with mock data if version changed
    const currentVersion = storedVersion ? parseInt(storedVersion, 10) : 0;
    if (currentVersion < MOCK_DATA_VERSION) {
      const userWordIds = new Set(this.vocabulary.map(w => w.id));
      const newMockWords = mockVocabulary.filter(w => !userWordIds.has(w.id));
      this.vocabulary = [...newMockWords, ...this.vocabulary];
      localStorage.setItem('vocab_data_version', MOCK_DATA_VERSION.toString());
    }
  }

  private saveToLocalStorage(): void {
    localStorage.setItem('vocab_vocabulary', JSON.stringify(this.vocabulary));
    localStorage.setItem('vocab_user_id_counter', this.userIdCounter.toString());
    localStorage.setItem('vocab_data_version', MOCK_DATA_VERSION.toString());
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
    await this.saveToFile();
    
    // Log the word addition
    this.logger.trackEvent('word_added', {
      wordId: newId,
      word: newWord.word,
      pronunciation: newWord.pronunciation,
      respelling: newWord.respelling,
      definitions: newWord.definitions,
      examples: newWord.examples,
      images: newWord.images,
      tags: newWord.tags,
      variants: newWord.variants
    });
    
    return newId;
  }

  async updateWord(entry: VocabularyEntry): Promise<void> {
    const index = this.vocabulary.findIndex(w => w.id === entry.id);
    if (index !== -1) {
      const oldWord = this.vocabulary[index];
      
      // Track changes
      const changes: Record<string, { oldValue: any; newValue: any }> = {};
      
      // Compare all fields
      const fieldsToCompare: (keyof VocabularyEntry)[] = [
        'word', 'pronunciation', 'respelling', 'definitions', 
        'examples', 'images', 'tags', 'variants'
      ];
      
      for (const field of fieldsToCompare) {
        const oldValue = oldWord[field];
        const newValue = entry[field];
        
        // Simple comparison (stringify for objects/arrays)
        const oldStr = JSON.stringify(oldValue);
        const newStr = JSON.stringify(newValue);
        
        if (oldStr !== newStr) {
          changes[field] = { oldValue, newValue };
        }
      }
      
      this.vocabulary[index] = entry;
      await this.saveToFile();
      
      // Log the word edit if there were changes
      if (Object.keys(changes).length > 0) {
        this.logger.trackEvent('word_edited', {
          wordId: entry.id,
          changes
        });
      }
    } else {
      this.logger.warn('Attempted to update non-existent word', { wordId: entry.id });
    }
  }

  async deleteWord(id: number): Promise<void> {
    const word = this.vocabulary.find(w => w.id === id);
    
    if (word) {
      this.vocabulary = this.vocabulary.filter(w => w.id !== id);
      await this.saveToFile();
      
      // Log the word deletion
      this.logger.trackEvent('word_deleted', {
        wordId: id,
        wordText: word.word
      });
    } else {
      this.logger.warn('Attempted to delete non-existent word', { wordId: id });
    }
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
    if (!word) {
      this.logger.warn('Attempted to record review for non-existent word', { wordId });
      return;
    }

    // Store old values for logging
    const familiarityBefore = word.familiarityScore;

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

    await this.saveToFile();
    
    // Log the review action
    this.logger.trackEvent('word_reviewed', {
      wordId: word.id,
      wordText: word.word,
      rating,
      familiarityBefore,
      familiarityAfter: word.familiarityScore,
      reviewTimestamp: timestamp
    });
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
      userIdCounter: this.userIdCounter,
    }, null, 2);
  }

  async importData(data: string): Promise<void> {
    try {
      const parsed = JSON.parse(data);
      if (parsed.vocabulary && Array.isArray(parsed.vocabulary)) {
        this.vocabulary = parsed.vocabulary;
        this.userIdCounter = parsed.userIdCounter || 1000;
        await this.saveToFile();
      }
    } catch (error) {
      throw new Error('Invalid import data format');
    }
  }

  async clearAllData(): Promise<void> {
    this.vocabulary = [];
    this.userIdCounter = 1000;
    await this.saveToFile();
  }

  async getLastSyncTime(): Promise<Date | null> {
    if (!this.isElectron) {
      return null;
    }
    
    try {
      const electronAPI = (window as any).electronAPI;
      const vocabFile = `${this.projectPath}/vocabulary.json`;
      const statsResult = await electronAPI.fs.getStats(vocabFile);
      if (statsResult.success && statsResult.mtime) {
        return new Date(statsResult.mtime);
      }
      return null;
    } catch {
      return null;
    }
  }

  async markSynced(): Promise<void> {
    // File modification time is automatically updated on save
    await this.saveToFile();
  }

  /**
   * Change the project path (for switching between projects)
   */
  async setProjectPath(newProjectPath: string): Promise<void> {
    this.projectPath = newProjectPath;
    localStorage.setItem(CONFIG_KEY, newProjectPath);
    await this.loadFromFile();
  }

  /**
   * Get current project path
   */
  getProjectPath(): string {
    return this.projectPath;
  }

  /**
   * Get full path to project directory (Electron only)
   */
  async getProjectDirectory(): Promise<string | null> {
    if (!this.isElectron) {
      return null;
    }

    return this.projectPath || null;
  }

  /**
   * Load config from config.json file
   */
  private async loadConfig(): Promise<void> {
    if (!this.isElectron) {
      return this.loadConfigFromLocalStorage();
    }

    try {
      const electronAPI = (window as any).electronAPI;
      const configFile = `${this.projectPath}/config.json`;
      
      // Check if file exists
      const existsResult = await electronAPI.fs.exists(configFile);
      if (!existsResult.success || !existsResult.exists) {
        // Config doesn't exist - use defaults
        this.config = migrateConfig({});
        await this.saveConfig();
        return;
      }

      // Read and parse file
      const readResult = await electronAPI.fs.readFile(configFile);
      if (!readResult.success) {
        throw new Error(readResult.error || 'Failed to read config file');
      }

      const parsedConfig = JSON.parse(readResult.data);
      this.config = migrateConfig(parsedConfig);
    } catch (error) {
      this.logger.warn('Config load failed, using defaults', error);
      this.config = migrateConfig({});
      await this.saveConfig();
    }
  }

  /**
   * Save config to config.json file
   */
  private async saveConfig(): Promise<void> {
    if (!this.isElectron) {
      return this.saveConfigToLocalStorage();
    }

    try {
      const electronAPI = (window as any).electronAPI;
      const configFile = `${this.projectPath}/config.json`;
      
      const writeResult = await electronAPI.fs.writeFile(
        configFile,
        JSON.stringify(this.config, null, 2)
      );

      if (!writeResult.success) {
        throw new Error(writeResult.error || 'Failed to write config file');
      }
    } catch (error) {
      this.logger.error('Error saving config to file', error as Error);
      this.saveConfigToLocalStorage();
    }
  }

  /**
   * Load config from localStorage (fallback)
   */
  private loadConfigFromLocalStorage(): void {
    const stored = localStorage.getItem('vocab_config');
    if (stored) {
      this.config = migrateConfig(JSON.parse(stored));
    } else {
      this.config = migrateConfig({});
    }
  }

  /**
   * Save config to localStorage (fallback)
   */
  private saveConfigToLocalStorage(): void {
    localStorage.setItem('vocab_config', JSON.stringify(this.config));
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
    await this.saveConfig();
    
    this.logger.trackEvent('config_updated', {
      updates
    });
  }
}
