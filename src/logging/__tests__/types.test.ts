import { describe, it, expect } from 'vitest';
import { LogEntry, ActionType, LogLevel } from '../types';

describe('Logging Types', () => {
  describe('LogEntry structure validation', () => {
    it('should accept valid log entry with all required fields', () => {
      const entry: LogEntry = {
        timestamp: '2026-02-04T14:30:45.123Z',
        actionType: ActionType.WORD_REVIEWED,
        properties: {
          wordId: 123,
          wordText: 'hello',
          rating: 4,
          familiarityBefore: 0.5,
          familiarityAfter: 0.7
        }
      };

      expect(entry.timestamp).toBe('2026-02-04T14:30:45.123Z');
      expect(entry.actionType).toBe(ActionType.WORD_REVIEWED);
      expect(entry.properties).toBeDefined();
    });

    it('should accept log entry with level field', () => {
      const entry: LogEntry = {
        timestamp: '2026-02-04T14:30:45.123Z',
        actionType: ActionType.ERROR,
        level: LogLevel.ERROR,
        message: 'An error occurred'
      };

      expect(entry.level).toBe(LogLevel.ERROR);
      expect(entry.message).toBe('An error occurred');
    });

    it('should accept log entry with error field', () => {
      const entry: LogEntry = {
        timestamp: '2026-02-04T14:30:45.123Z',
        actionType: ActionType.ERROR,
        level: LogLevel.ERROR,
        message: 'An error occurred',
        error: {
          message: 'File not found',
          stack: 'Error: File not found\n  at ...'
        }
      };

      expect(entry.error).toBeDefined();
      expect(entry.error?.message).toBe('File not found');
      expect(entry.error?.stack).toContain('Error: File not found');
    });

    it('should accept log entry with optional properties', () => {
      const entry: LogEntry = {
        timestamp: '2026-02-04T14:30:45.123Z',
        actionType: ActionType.SEARCH_PERFORMED
      };

      expect(entry.level).toBeUndefined();
      expect(entry.message).toBeUndefined();
      expect(entry.properties).toBeUndefined();
      expect(entry.error).toBeUndefined();
    });
  });

  describe('ActionType enum values', () => {
    it('should have all word management action types', () => {
      expect(ActionType.WORD_REVIEWED).toBe('word_reviewed');
      expect(ActionType.WORD_ADDED).toBe('word_added');
      expect(ActionType.WORD_EDITED).toBe('word_edited');
      expect(ActionType.WORD_DELETED).toBe('word_deleted');
    });

    it('should have all application activity action types', () => {
      expect(ActionType.SEARCH_PERFORMED).toBe('search_performed');
      expect(ActionType.REVIEW_QUEUE_GENERATED).toBe('review_queue_generated');
      expect(ActionType.DATA_IMPORTED).toBe('data_imported');
      expect(ActionType.DATA_EXPORTED).toBe('data_exported');
      expect(ActionType.PROJECT_OPENED).toBe('project_opened');
      expect(ActionType.PROJECT_CLOSED).toBe('project_closed');
    });

    it('should have all generic logging action types', () => {
      expect(ActionType.ERROR).toBe('error');
      expect(ActionType.WARNING).toBe('warning');
      expect(ActionType.INFO).toBe('info');
      expect(ActionType.DEBUG).toBe('debug');
      expect(ActionType.EVENT).toBe('event');
      expect(ActionType.TIMING).toBe('timing');
    });
  });

  describe('LogLevel enum values', () => {
    it('should have all log levels', () => {
      expect(LogLevel.ERROR).toBe('error');
      expect(LogLevel.WARN).toBe('warn');
      expect(LogLevel.INFO).toBe('info');
      expect(LogLevel.DEBUG).toBe('debug');
    });
  });
});
