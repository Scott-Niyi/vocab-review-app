import { LogEntry } from './types';
import { LogEntryFormatter } from './LogEntryFormatter';

interface ElectronAPI {
  fs: {
    appendToFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
    ensureDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
    fileExists: (filePath: string) => Promise<{ success: boolean; exists?: boolean; error?: string }>;
  };
}

/**
 * Queue for managing log entry writes to disk
 * Handles async file operations with retry logic and error handling
 */
export class LogEntryQueue {
  private queue: LogEntry[] = [];
  private processing: boolean = false;
  private projectPath: string;
  private electronAPI: ElectronAPI;
  private readonly MAX_QUEUE_SIZE = 1000;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [100, 200, 400]; // Exponential backoff in ms

  constructor(projectPath: string, electronAPI: ElectronAPI) {
    this.projectPath = projectPath;
    this.electronAPI = electronAPI;
  }

  /**
   * Add a log entry to the queue
   * @param entry Log entry to enqueue
   */
  enqueue(entry: LogEntry): void {
    // Check for queue overflow
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      console.warn('[LogEntryQueue] Queue overflow - dropping oldest entry');
      this.queue.shift(); // Remove oldest entry
      
      // Log overflow event
      const overflowEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        actionType: 'warning' as any,
        level: 'warn' as any,
        message: 'Log queue overflow - entries were dropped'
      };
      this.queue.push(overflowEntry);
    }
    
    this.queue.push(entry);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Process the queue by writing entries to disk
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const entry = this.queue[0]; // Peek at first entry
      const filePath = this.getLogFilePath(new Date(entry.timestamp));
      
      try {
        await this.writeEntry(entry, filePath);
        this.queue.shift(); // Remove successfully written entry
      } catch (error) {
        // Entry will remain in queue and be retried on next process
        console.error('[LogEntryQueue] Failed to write entry after retries:', error);
        this.queue.shift(); // Remove failed entry to prevent blocking
        break;
      }
    }

    this.processing = false;
  }

  /**
   * Write a single entry to the log file with retry logic
   * @param entry Log entry to write
   * @param filePath Path to log file
   */
  private async writeEntry(entry: LogEntry, filePath: string): Promise<void> {
    return this.retryWrite(entry, filePath, this.MAX_RETRIES);
  }

  /**
   * Retry writing an entry with exponential backoff
   * @param entry Log entry to write
   * @param filePath Path to log file
   * @param attemptsLeft Number of retry attempts remaining
   */
  private async retryWrite(entry: LogEntry, filePath: string, attemptsLeft: number): Promise<void> {
    try {
      // Ensure logs directory exists
      const logsDir = `${this.projectPath}/logs`;
      await this.electronAPI.fs.ensureDirectory(logsDir);
      
      // Format entry as single-line JSON using formatter
      const jsonLine = LogEntryFormatter.formatLogEntry(entry) + '\n';
      
      // Append to file
      const result = await this.electronAPI.fs.appendToFile(filePath, jsonLine);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to append to file');
      }
    } catch (error) {
      if (attemptsLeft > 1) {
        // Wait before retrying
        const delay = this.RETRY_DELAYS[this.MAX_RETRIES - attemptsLeft];
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry
        return this.retryWrite(entry, filePath, attemptsLeft - 1);
      } else {
        // All retries exhausted
        this.handleWriteFailure(entry, error as Error);
        throw error;
      }
    }
  }

  /**
   * Handle write failure after all retries exhausted
   * @param entry Log entry that failed to write
   * @param error Error that occurred
   */
  private handleWriteFailure(entry: LogEntry, error: Error): void {
    console.error('[LogEntryQueue] Failed to write log entry after all retries:', {
      entry,
      error: error.message,
      stack: error.stack
    });
  }

  /**
   * Get the log file path for a given date
   * @param date Date for the log file
   * @returns Path to log file in format {projectPath}/logs/YYYY-MM-DD.log
   */
  private getLogFilePath(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const fileName = `${year}-${month}-${day}.log`;
    
    return `${this.projectPath}/logs/${fileName}`;
  }
}
