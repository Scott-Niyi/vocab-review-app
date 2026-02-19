/**
 * Logging types and interfaces for file-based logging system
 */

/**
 * Log levels for error, warn, info, debug messages
 */
export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug"
}

/**
 * Action types for user actions and system events
 */
export enum ActionType {
  // Word management
  WORD_REVIEWED = "word_reviewed",
  WORD_ADDED = "word_added",
  WORD_EDITED = "word_edited",
  WORD_DELETED = "word_deleted",
  
  // Application activity
  SEARCH_PERFORMED = "search_performed",
  REVIEW_QUEUE_GENERATED = "review_queue_generated",
  DATA_IMPORTED = "data_imported",
  DATA_EXPORTED = "data_exported",
  PROJECT_OPENED = "project_opened",
  PROJECT_CLOSED = "project_closed",
  
  // Generic logging
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
  DEBUG = "debug",
  EVENT = "event",
  TIMING = "timing"
}

/**
 * Core log entry structure
 */
export interface LogEntry {
  timestamp: string;        // ISO 8601 format: "2026-02-04T14:30:45.123Z"
  actionType: ActionType;   // Type of action being logged
  level?: LogLevel;         // For error/warn/info/debug calls
  message?: string;         // For error/warn/info/debug calls
  properties?: Record<string, any>;  // Action-specific data
  error?: {                 // For error calls
    message: string;
    stack?: string;
  };
}

/**
 * Word review action properties
 */
export interface WordReviewProperties {
  wordId: number;
  wordText: string;
  rating: number;
  familiarityBefore: number;
  familiarityAfter: number;
}

/**
 * Word added action properties
 */
export interface WordAddedProperties {
  wordId: number;
  word: string;
  pronunciation?: string;
  respelling?: string;
  definitions: any[];
  examples?: string[];
  images?: string[];
  tags?: string[];
  variants?: string[];
}

/**
 * Word edited action properties
 */
export interface WordEditedProperties {
  wordId: number;
  changes: {
    [fieldName: string]: {
      oldValue: any;
      newValue: any;
    }
  };
}

/**
 * Word deleted action properties
 */
export interface WordDeletedProperties {
  wordId: number;
  wordText: string;
}

/**
 * Search performed action properties
 */
export interface SearchPerformedProperties {
  query: string;
  resultCount: number;
}

/**
 * Review queue generated action properties
 */
export interface ReviewQueueGeneratedProperties {
  wordCount: number;
  selectionCriteria?: string;
}

/**
 * Data import action properties
 */
export interface DataImportedProperties {
  filePath: string;
  wordCount: number;
  format?: string;
}

/**
 * Data export action properties
 */
export interface DataExportedProperties {
  filePath: string;
  wordCount: number;
  format?: string;
}

/**
 * Project opened action properties
 */
export interface ProjectOpenedProperties {
  projectPath: string;
}

/**
 * Project closed action properties
 */
export interface ProjectClosedProperties {
  projectPath: string;
}
