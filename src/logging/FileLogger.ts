import { ILogger } from '../services/ILogger';
import { LogEntry, ActionType, LogLevel as LoggingLogLevel } from './types';
import { LogEntryQueue } from './LogEntryQueue';

interface ElectronAPI {
  fs: {
    appendToFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
    ensureDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
    fileExists: (filePath: string) => Promise<{ success: boolean; exists?: boolean; error?: string }>;
  };
}

/**
 * File-based logger that writes log entries to disk
 * Implements ILogger interface for compatibility with existing logging infrastructure
 */
export class FileLogger implements ILogger {
  private queue: LogEntryQueue;
  private projectPath: string;
  private electronAPI: ElectronAPI;
  private logsInitialized: boolean = false;

  constructor(projectPath: string, electronAPI: ElectronAPI) {
    this.projectPath = projectPath;
    this.electronAPI = electronAPI;
    
    try {
      this.queue = new LogEntryQueue(projectPath, electronAPI);
      
      // Ensure logs folder exists
      this.ensureLogsFolder();
    } catch (error) {
      console.error('[FileLogger] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Ensure the logs folder exists
   */
  private async ensureLogsFolder(): Promise<void> {
    if (this.logsInitialized) {
      return;
    }

    try {
      const logsDir = `${this.projectPath}/logs`;
      const result = await this.electronAPI.fs.ensureDirectory(logsDir);
      
      if (result.success) {
        this.logsInitialized = true;
      } else {
        console.error('[FileLogger] Failed to create logs folder:', result.error);
      }
    } catch (error) {
      console.error('[FileLogger] Error ensuring logs folder:', error);
    }
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      actionType: ActionType.ERROR,
      level: LoggingLogLevel.ERROR,
      message,
      properties: context,
      error: error ? {
        message: error.message,
        stack: error.stack
      } : undefined
    };

    this.queue.enqueue(entry);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      actionType: ActionType.WARNING,
      level: LoggingLogLevel.WARN,
      message,
      properties: context
    };

    this.queue.enqueue(entry);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      actionType: ActionType.INFO,
      level: LoggingLogLevel.INFO,
      message,
      properties: context
    };

    this.queue.enqueue(entry);
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      actionType: ActionType.DEBUG,
      level: LoggingLogLevel.DEBUG,
      message,
      properties: context
    };

    this.queue.enqueue(entry);
  }

  /**
   * Track an event with properties
   */
  trackEvent(event: string, properties?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      actionType: ActionType.EVENT,
      message: event,
      properties
    };

    this.queue.enqueue(entry);
  }

  /**
   * Track a timing metric
   */
  trackTiming(metric: string, duration: number): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      actionType: ActionType.TIMING,
      message: metric,
      properties: {
        duration,
        metric
      }
    };

    this.queue.enqueue(entry);
  }
}
