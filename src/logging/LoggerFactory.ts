import { ILogger } from '../services/ILogger';
import { ConsoleLogger } from '../services/ConsoleLogger';
import { FileLogger } from './FileLogger';
import { CompositeLogger } from './CompositeLogger';

interface ElectronAPI {
  fs: {
    appendToFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
    ensureDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
    fileExists: (filePath: string) => Promise<{ success: boolean; exists?: boolean; error?: string }>;
  };
}

/**
 * Factory for creating logger instances
 * Creates appropriate logger based on environment and configuration
 */
export class LoggerFactory {
  /**
   * Create a logger instance
   * @param projectPath Path to project folder (null if no project open)
   * @param electronAPI Electron API for file operations
   * @returns Logger instance (ConsoleLogger or CompositeLogger)
   */
  static createLogger(projectPath: string | null, electronAPI?: ElectronAPI): ILogger {
    const consoleLogger = new ConsoleLogger();

    // If no project path or no electronAPI, return console logger only
    if (!projectPath || !electronAPI) {
      return consoleLogger;
    }

    // Create file logger and composite logger
    try {
      const fileLogger = new FileLogger(projectPath, electronAPI);
      return LoggerFactory.createCompositeLogger([consoleLogger, fileLogger]);
    } catch (error) {
      console.error('[LoggerFactory] Failed to create file logger, falling back to console only:', error);
      return consoleLogger;
    }
  }

  /**
   * Create a composite logger from multiple loggers
   * @param loggers Array of logger instances
   * @returns CompositeLogger instance
   */
  static createCompositeLogger(loggers: ILogger[]): ILogger {
    return new CompositeLogger(loggers);
  }
}
