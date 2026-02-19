import { LogEntry } from './types';

/**
 * Formats log entries for file output
 * Ensures single-line JSON format for easy parsing
 */
export class LogEntryFormatter {
  /**
   * Format a log entry as a single-line JSON string
   * @param entry The log entry to format
   * @returns Single-line JSON string with no internal newlines
   */
  static formatLogEntry(entry: LogEntry): string {
    // Use JSON.stringify without pretty-printing to ensure single line
    // This removes all newlines and extra whitespace
    return JSON.stringify(entry);
  }

  /**
   * Format multiple log entries, one per line
   * @param entries Array of log entries
   * @returns String with one JSON object per line
   */
  static formatLogEntries(entries: LogEntry[]): string {
    return entries.map(entry => this.formatLogEntry(entry)).join('\n');
  }

  /**
   * Parse a log entry from a JSON string
   * @param line Single line of JSON
   * @returns Parsed log entry or null if invalid
   */
  static parseLogEntry(line: string): LogEntry | null {
    try {
      const trimmed = line.trim();
      if (!trimmed) {
        return null;
      }
      return JSON.parse(trimmed) as LogEntry;
    } catch (error) {
      console.error('Failed to parse log entry:', error);
      return null;
    }
  }

  /**
   * Parse multiple log entries from a multi-line string
   * @param content Multi-line string with one JSON object per line
   * @returns Array of parsed log entries (skips invalid lines)
   */
  static parseLogEntries(content: string): LogEntry[] {
    const lines = content.split('\n');
    const entries: LogEntry[] = [];
    
    for (const line of lines) {
      const entry = this.parseLogEntry(line);
      if (entry) {
        entries.push(entry);
      }
    }
    
    return entries;
  }

  /**
   * Validate that a log entry has all required fields
   * @param entry Log entry to validate
   * @returns True if valid, false otherwise
   */
  static validateLogEntry(entry: any): entry is LogEntry {
    if (!entry || typeof entry !== 'object') {
      return false;
    }

    // Check required fields
    if (!entry.timestamp || typeof entry.timestamp !== 'string') {
      return false;
    }

    if (!entry.actionType || typeof entry.actionType !== 'string') {
      return false;
    }

    // Validate timestamp format (ISO 8601)
    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    if (!timestampRegex.test(entry.timestamp)) {
      return false;
    }

    return true;
  }
}
