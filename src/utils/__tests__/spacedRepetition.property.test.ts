import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  calculateSelectionWeight,
  updateFamiliarityScore,
  selectWordsForReview
} from '../spacedRepetition';
import { VocabularyEntry } from '../../types/vocabulary';

describe('Spaced Repetition Algorithm - Property Tests', () => {
  // Feature: spaced-repetition-algorithm, Property 1: Weight decreases as familiarity increases
  it('Property 1: 权重单调性 - 熟悉度增加时权重递减或相等', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 99 }),  // score1
        fc.integer({ min: 0, max: 100 }), // timesReviewed
        (score1, times) => {
          // score2 必须大于 score1 且不超过 100
          const score2 = Math.min(100, score1 + 1);
          const weight1 = calculateSelectionWeight(score1, times);
          const weight2 = calculateSelectionWeight(score2, times);
          // 权重应该递减或相等（当都达到 minWeight 时）
          return weight1 >= weight2;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: spaced-repetition-algorithm, Property 2: Review bonus decreases with more reviews
  it('Property 2: 复习次数加成 - 复习次数少时权重更高', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),  // familiarityScore
        fc.integer({ min: 0, max: 99 }),   // times1
        fc.integer({ min: 1, max: 100 }),  // times2Offset (确保 times2 > times1)
        (score, times1, times2Offset) => {
          const times2 = times1 + times2Offset;
          const weight1 = calculateSelectionWeight(score, times1);
          const weight2 = calculateSelectionWeight(score, times2);
          return weight1 >= weight2;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: spaced-repetition-algorithm, Property 3: Familiarity dominates when difference is large
  it('Property 3: 熟悉度主导性 - 熟悉度差异大时主导权重', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 79 }),   // scoreA (确保 scoreB 可以比 scoreA 高 20+)
        fc.integer({ min: 0, max: 100 }),  // timesA
        fc.integer({ min: 0, max: 100 }),  // timesB
        (scoreA, timesA, timesB) => {
          const scoreB = scoreA + 20; // B 比 A 高至少 20 分
          const weightA = calculateSelectionWeight(scoreA, timesA);
          const weightB = calculateSelectionWeight(scoreB, timesB);
          // A 的权重应该显著大于 B，无论复习次数如何
          return weightA > weightB;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: spaced-repetition-algorithm, Property 4: Score stays within bounds
  it('Property 4: 分数边界不变量 - 分数始终在 [0, 100] 范围内', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),     // currentScore
        fc.constantFrom(1, 2, 3, 4, 5),       // rating
        fc.integer({ min: 0, max: 100 }),     // timesReviewed
        (score, rating, times) => {
          const newScore = updateFamiliarityScore(score, rating as 1 | 2 | 3 | 4 | 5, times);
          return newScore >= 0 && newScore <= 100;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: spaced-repetition-algorithm, Property 5: Higher rating leads to higher score
  it('Property 5: 评分效果单调性 - 更高评分导致更高分数', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),     // currentScore
        fc.constantFrom(1, 2, 3, 4),          // rating1
        fc.integer({ min: 0, max: 100 }),     // timesReviewed
        (score, rating1, times) => {
          const rating2 = (rating1 + 1) as 1 | 2 | 3 | 4 | 5;
          const newScore1 = updateFamiliarityScore(score, rating1 as 1 | 2 | 3 | 4 | 5, times);
          const newScore2 = updateFamiliarityScore(score, rating2, times);
          return newScore1 <= newScore2;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: spaced-repetition-algorithm, Property 6: Learning rate decreases with higher scores
  it('Property 6: 学习率递减 - 高分时提高幅度更小', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 49 }),      // score1 (确保 score2 可以更高)
        fc.integer({ min: 1, max: 50 }),      // scoreOffset
        fc.constantFrom(4, 5),                // rating (正面评分)
        fc.integer({ min: 0, max: 100 }),     // timesReviewed
        (score1, scoreOffset, rating, times) => {
          const score2 = score1 + scoreOffset;
          const increase1 = updateFamiliarityScore(score1, rating as 4 | 5, times) - score1;
          const increase2 = updateFamiliarityScore(score2, rating as 4 | 5, times) - score2;
          // 低分时的提高幅度应该大于或等于高分时的提高幅度
          return increase1 >= increase2;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: spaced-repetition-algorithm, Property 7: Forgetting penalty increases with higher scores
  it('Property 7: 遗忘惩罚 - 高分低评分时降低幅度更大', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 49 }),      // score1
        fc.integer({ min: 1, max: 50 }),      // scoreOffset
        fc.constantFrom(1, 2),                // rating (负面评分)
        fc.integer({ min: 0, max: 100 }),     // timesReviewed
        (score1, scoreOffset, rating, times) => {
          const score2 = score1 + scoreOffset;
          const decrease1 = score1 - updateFamiliarityScore(score1, rating as 1 | 2, times);
          const decrease2 = score2 - updateFamiliarityScore(score2, rating as 1 | 2, times);
          // 高分时的降低幅度应该大于或等于低分时的降低幅度
          return decrease2 >= decrease1;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: spaced-repetition-algorithm, Property 8: Returns correct number of words
  it('Property 8: 选择数量正确性 - 返回正确数量的单词', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.integer(),
            word: fc.string(),
            familiarityScore: fc.integer({ min: 0, max: 100 }),
            timesReviewed: fc.integer({ min: 0, max: 100 }),
            timesCorrect: fc.integer({ min: 0, max: 100 }),
            definitions: fc.constant([{ text: 'test', partOfSpeech: 'n.' }])
          }),
          { minLength: 0, maxLength: 50 }
        ),
        fc.integer({ min: 0, max: 50 }),
        (words, count) => {
          const selected = selectWordsForReview(words as unknown as VocabularyEntry[], count);
          return selected.length === Math.min(count, words.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: spaced-repetition-algorithm, Property 9: No duplicate words in selection
  it('Property 9: 选择唯一性 - 无重复选择', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.integer(),
            word: fc.string(),
            familiarityScore: fc.integer({ min: 0, max: 100 }),
            timesReviewed: fc.integer({ min: 0, max: 100 }),
            timesCorrect: fc.integer({ min: 0, max: 100 }),
            definitions: fc.constant([{ text: 'test' }])
          }),
          { minLength: 1, maxLength: 50 }
        ).map(words => {
          // 确保每个单词有唯一的 ID
          return words.map((word, index) => ({ ...word, id: index, definitions: [{ text: 'test', partOfSpeech: 'n.' }] }));
        }),
        fc.integer({ min: 1, max: 20 }),
        (words, count) => {
          const selected = selectWordsForReview(words as unknown as VocabularyEntry[], count);
          const ids = selected.map(w => w.id);
          const uniqueIds = new Set(ids);
          return ids.length === uniqueIds.size;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: spaced-repetition-algorithm, Property 10: Low familiarity words selected more often
  it('Property 10: 加权随机抽样正确性 - 低熟悉度单词被选中更多', () => {
    // 创建两个单词：一个低熟悉度，一个高熟悉度
    const lowFamiliarityWord: VocabularyEntry = {
      id: 1,
      word: 'low',
      familiarityScore: 10,
      timesReviewed: 5,
      timesCorrect: 0,
      definitions: [{ text: 'test' }]
    };
    
    const highFamiliarityWord: VocabularyEntry = {
      id: 2,
      word: 'high',
      familiarityScore: 90,
      timesReviewed: 5,
      timesCorrect: 5,
      definitions: [{ text: 'test' }]
    };
    
    const words = [lowFamiliarityWord, highFamiliarityWord];
    
    // 运行多次选择，统计每个单词被选中的次数
    const selectionCounts = { 1: 0, 2: 0 };
    const iterations = 1000;
    
    for (let i = 0; i < iterations; i++) {
      const selected = selectWordsForReview(words, 1);
      if (selected.length > 0) {
        selectionCounts[selected[0].id as 1 | 2]++;
      }
    }
    
    // 低熟悉度单词应该被选中更多次
    expect(selectionCounts[1]).toBeGreaterThan(selectionCounts[2]);
    
    // 统计显著性：至少 2:1 的比例
    expect(selectionCounts[1] / selectionCounts[2]).toBeGreaterThan(2);
  });
});
