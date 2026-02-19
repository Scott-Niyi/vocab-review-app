import { IDataStore } from './IDataStore';
import { ILogger } from './ILogger';
import { ILLMService } from './ILLMService';
import { FileSystemStore } from './FileSystemStore';
// import { ConsoleLogger } from './ConsoleLogger';
import { OpenAIService } from './OpenAIService';
import { LoggerFactory } from '../logging/LoggerFactory';

/**
 * Service container for dependency injection
 * Allows easy swapping of implementations
 */
class ServiceContainer {
  private static instance: ServiceContainer;
  
  private _dataStore: IDataStore | null = null;
  private _logger: ILogger | null = null;
  private _llmService: ILLMService | null = null;
  // private _projectPath: string | null = null;

  private constructor() {}

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  get dataStore(): IDataStore {
    if (!this._dataStore) {
      throw new Error('DataStore not initialized. Call initializeServices() first.');
    }
    return this._dataStore;
  }

  get logger(): ILogger {
    if (!this._logger) {
      throw new Error('Logger not initialized. Call initializeServices() first.');
    }
    return this._logger;
  }

  get llmService(): ILLMService {
    if (!this._llmService) {
      throw new Error('LLM Service not initialized. Call initializeServices() first.');
    }
    return this._llmService;
  }

  async initialize(dataStore: IDataStore, logger: ILogger, llmService: ILLMService): Promise<void> {
    this._dataStore = dataStore;
    this._logger = logger;
    this._llmService = llmService;
    
    // Initialize data store
    await dataStore.initialize();
    
    logger.info('Services initialized successfully');
  }

  /**
   * Update logger when project path changes
   * @param projectPath New project path
   */
  async updateLogger(projectPath: string | null): Promise<void> {
    // this._projectPath = projectPath;
    
    // const isDevelopment = import.meta.env.DEV;
    
    // Create new logger with project path
    this._logger = LoggerFactory.createLogger(
      projectPath,
      (window as any).electronAPI
    );
    
    // Update data store with new logger
    if (this._dataStore && projectPath) {
      this._dataStore = new FileSystemStore(projectPath, this._logger);
      await this._dataStore.initialize();
    }
    
    this._logger.info('Logger updated', { projectPath });
  }
}

/**
 * Initialize services with default implementations
 * Can be customized for different environments
 */
export async function initializeServices(projectPath?: string): Promise<void> {
  // const isDevelopment = import.meta.env.DEV;
  
  // Create logger using LoggerFactory (will use CompositeLogger if projectPath provided)
  const logger = LoggerFactory.createLogger(
    projectPath || null,
    (window as any).electronAPI
  );
  
  // Create data store with logger
  const dataStore = new FileSystemStore(projectPath, logger);
  
  // Create LLM service
  const llmService = new OpenAIService();
  
  // Initialize container
  await ServiceContainer.getInstance().initialize(dataStore, logger, llmService);
}

/**
 * Update logger when project path changes
 * @param projectPath New project path
 */
export async function updateLoggerForProject(projectPath: string | null): Promise<void> {
  await ServiceContainer.getInstance().updateLogger(projectPath);
}

/**
 * Get the data store instance
 */
export function getDataStore(): IDataStore {
  return ServiceContainer.getInstance().dataStore;
}

/**
 * Get the logger instance
 */
export function getLogger(): ILogger {
  return ServiceContainer.getInstance().logger;
}

/**
 * Get the LLM service instance
 */
export function getLLMService(): ILLMService {
  return ServiceContainer.getInstance().llmService;
}

// Export types and interfaces
export type { IDataStore } from './IDataStore';
export type { ILogger } from './ILogger';
export type { ILLMService } from './ILLMService';
export { LogLevel } from './ILogger';
