import { describe, it, expect } from 'vitest';
import {
  calculateSelectionWeight,
  updateFamiliarityScore,
  selectWordsForReview
} from '../spacedRepetition';
import { VocabularyEntry } from '../../types/vocabulary';

describe('calculateSelectionWeight', () => {
  describe('边界条件测试', () => {
    it('should return maximum weight for familiarity score 0', () => {
      const weight = calculateSelectionWeight(0, 5);
      expect(weight).toBeGreaterThan(9.0); // 接近 maxWeight 10.0
    });

    it('should return minimum weight for familiarity score 100', () => {
      const weight = calculateSelectionWeight(100, 100);
      expect(weight).toBeGreaterThanOrEqual(0.1); // 至少是 minWeight
      expect(weight).toBeLessThan(1.0); // 但应该很小
    });

    it('should give bonus to never-reviewed words (timesReviewed = 0)', () => {
      const weightNeverReviewed = calculateSelectionWeight(50, 0);
      const weightReviewed = calculateSelectionWeight(50, 10);
      expect(weightNeverReviewed).toBeGreaterThan(weightReviewed);
    });

    it('should handle timesReviewed = 1', () => {
      const weight = calculateSelectionWeight(50, 1);
      expect(weight).toBeGreaterThan(0);
      expect(weight).toBeLessThanOrEqual(10.0);
    });

    it('should handle large timesReviewed values', () => {
      const weight = calculateSelectionWeight(50, 100);
      expect(weight).toBeGreaterThan(0);
      expect(weight).toBeLessThanOrEqual(10.0);
    });
  });

  describe('输入验证', () => {
    it('should throw error for negative familiarityScore', () => {
      expect(() => calculateSelectionWeight(-1, 5)).toThrow('Invalid familiarityScore');
    });

    it('should throw error for familiarityScore > 100', () => {
      expect(() => calculateSelectionWeight(101, 5)).toThrow('Invalid familiarityScore');
    });

    it('should throw error for negative timesReviewed', () => {
      expect(() => calculateSelectionWeight(50, -1)).toThrow('Invalid timesReviewed');
    });
  });
});

describe('updateFamiliarityScore', () => {
  describe('评分效果测试', () => {
    it('should decrease score for rating 1', () => {
      const newScore = updateFamiliarityScore(50, 1, 5);
      expect(newScore).toBeLessThan(50);
    });

    it('should decrease score for rating 2', () => {
      const newScore = updateFamiliarityScore(50, 2, 5);
      expect(newScore).toBeLessThan(50);
    });

    it('should slightly increase score for rating 3', () => {
      const newScore = updateFamiliarityScore(50, 3, 5);
      expect(newScore).toBeGreaterThan(50);
    });

    it('should increase score for rating 4', () => {
      const newScore = updateFamiliarityScore(50, 4, 5);
      expect(newScore).toBeGreaterThan(50);
    });

    it('should significantly increase score for rating 5', () => {
      const newScore = updateFamiliarityScore(50, 5, 5);
      expect(newScore).toBeGreaterThan(50);
      const score4 = updateFamiliarityScore(50, 4, 5);
      expect(newScore).toBeGreaterThan(score4);
    });
  });

  describe('边界条件测试', () => {
    it('should not go below 0', () => {
      const newScore = updateFamiliarityScore(5, 1, 0);
      expect(newScore).toBeGreaterThanOrEqual(0);
    });

    it('should not exceed 100', () => {
      const newScore = updateFamiliarityScore(95, 5, 0);
      expect(newScore).toBeLessThanOrEqual(100);
    });

    it('should handle currentScore = 0', () => {
      const newScore = updateFamiliarityScore(0, 5, 0);
      expect(newScore).toBeGreaterThan(0);
      expect(newScore).toBeLessThanOrEqual(100);
    });

    it('should handle currentScore = 50', () => {
      const newScore = updateFamiliarityScore(50, 3, 5);
      expect(newScore).toBeGreaterThanOrEqual(0);
      expect(newScore).toBeLessThanOrEqual(100);
    });

    it('should handle currentScore = 100', () => {
      const newScore = updateFamiliarityScore(100, 1, 10);
      expect(newScore).toBeGreaterThanOrEqual(0);
      expect(newScore).toBeLessThanOrEqual(100);
    });
  });

  describe('输入验证', () => {
    it('should throw error for negative currentScore', () => {
      expect(() => updateFamiliarityScore(-1, 3, 5)).toThrow('Invalid currentScore');
    });

    it('should throw error for currentScore > 100', () => {
      expect(() => updateFamiliarityScore(101, 3, 5)).toThrow('Invalid currentScore');
    });

    it('should throw error for invalid rating', () => {
      expect(() => updateFamiliarityScore(50, 0 as any, 5)).toThrow('Invalid rating');
      expect(() => updateFamiliarityScore(50, 6 as any, 5)).toThrow('Invalid rating');
    });

    it('should throw error for negative timesReviewed', () => {
      expect(() => updateFamiliarityScore(50, 3, -1)).toThrow('Invalid timesReviewed');
    });
  });
});

describe('selectWordsForReview', () => {
  const createMockWord = (id: number, familiarityScore: number, timesReviewed: number): VocabularyEntry => ({
    id,
    word: `word${id}`,
    familiarityScore,
    timesReviewed,
    timesCorrect: 0,
    definitions: [{ text: 'test definition' }]
  });

  describe('边界情况测试', () => {
    it('should return empty array for empty word list', () => {
      const selected = selectWordsForReview([], 10);
      expect(selected).toEqual([]);
    });

    it('should return empty array when count is 0', () => {
      const words = [createMockWord(1, 50, 5)];
      const selected = selectWordsForReview(words, 0);
      expect(selected).toEqual([]);
    });

    it('should return all words when count >= total words', () => {
      const words = [
        createMockWord(1, 50, 5),
        createMockWord(2, 60, 3)
      ];
      const selected = selectWordsForReview(words, 5);
      expect(selected.length).toBe(2);
    });

    it('should return exactly count words when count < total words', () => {
      const words = [
        createMockWord(1, 10, 0),
        createMockWord(2, 20, 1),
        createMockWord(3, 30, 2),
        createMockWord(4, 40, 3),
        createMockWord(5, 50, 4)
      ];
      const selected = selectWordsForReview(words, 3);
      expect(selected.length).toBe(3);
    });
  });

  describe('无重复选择测试', () => {
    it('should not select duplicate words', () => {
      const words = [
        createMockWord(1, 10, 0),
        createMockWord(2, 20, 1),
        createMockWord(3, 30, 2),
        createMockWord(4, 40, 3),
        createMockWord(5, 50, 4)
      ];
      const selected = selectWordsForReview(words, 3);
      const ids = selected.map(w => w.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });
  });

  describe('输入验证', () => {
    it('should throw error for negative count', () => {
      const words = [createMockWord(1, 50, 5)];
      expect(() => selectWordsForReview(words, -1)).toThrow('Invalid count');
    });

    it('should throw error for non-array input', () => {
      expect(() => selectWordsForReview(null as any, 5)).toThrow('allWords must be an array');
    });
  });
});
