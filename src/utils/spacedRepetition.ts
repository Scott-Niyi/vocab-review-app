import { VocabularyEntry } from '../types/vocabulary';

/**
 * 计算单词的选择权重
 * 权重越高，被选中的概率越大
 * 
 * @param familiarityScore - 熟悉度分数 (0-100)
 * @param timesReviewed - 复习次数
 * @returns 选择权重 (0.1 - 10.0)
 */
export function calculateSelectionWeight(
  familiarityScore: number,
  timesReviewed: number
): number {
  // 验证输入
  if (familiarityScore < 0 || familiarityScore > 100) {
    throw new Error(`Invalid familiarityScore: ${familiarityScore}. Must be in range [0, 100]`);
  }
  
  if (timesReviewed < 0) {
    throw new Error(`Invalid timesReviewed: ${timesReviewed}. Must be non-negative`);
  }
  
  const minWeight = 0.1;
  const maxWeight = 10.0;
  
  // 基于熟悉度的权重（指数衰减）
  // weight = maxWeight * e^(-k * familiarity)
  const k = 0.05; // 衰减常数
  const familiarityWeight = maxWeight * Math.exp(-k * familiarityScore);
  
  // 基于复习次数的调整因子
  // 复习次数少的单词获得额外权重
  // 使用对数函数确保调整幅度合理
  const reviewBonus = timesReviewed === 0 
    ? 2.0  // 从未复习的单词获得 2x 加成
    : 1.0 + Math.max(0, 1.0 - Math.log10(timesReviewed + 1));
  
  // 最终权重 = 熟悉度权重 * 复习次数调整因子
  const finalWeight = familiarityWeight * reviewBonus;
  
  return Math.max(minWeight, Math.min(maxWeight, finalWeight));
}

/**
 * 根据用户评分更新熟悉度分数
 * 
 * @param currentScore - 当前熟悉度分数 (0-100)
 * @param rating - 用户评分 (1-5)
 * @param timesReviewed - 复习次数
 * @returns 更新后的熟悉度分数 (0-100)
 */
export function updateFamiliarityScore(
  currentScore: number,
  rating: 1 | 2 | 3 | 4 | 5,
  timesReviewed: number
): number {
  // 验证输入
  if (currentScore < 0 || currentScore > 100) {
    throw new Error(`Invalid currentScore: ${currentScore}. Must be in range [0, 100]`);
  }
  
  if (![1, 2, 3, 4, 5].includes(rating)) {
    throw new Error(`Invalid rating: ${rating}. Must be 1, 2, 3, 4, or 5`);
  }
  
  if (timesReviewed < 0) {
    throw new Error(`Invalid timesReviewed: ${timesReviewed}. Must be non-negative`);
  }
  
  // 评分对应的基础分数变化
  const ratingEffects: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: -20.0,  // 完全不认识 - 大幅降低
    2: 5.0,    // 勉强认识 - 小幅提高（改为正值，表示至少有印象）
    3: 15.0,   // 有些熟悉 - 中等提高
    4: 25.0,   // 很熟悉 - 较大提高
    5: 35.0    // 完全掌握 - 大幅提高
  };
  
  const baseChange = ratingEffects[rating];
  
  // 递减学习率：分数越高，越难继续提高
  // 分数越高，遗忘时降低幅度越大
  let learningRate: number;
  
  if (baseChange > 0) {
    // 提高分数：分数越高越难提高
    // 当 score = 0 时，learningRate = 1.0
    // 当 score = 100 时，learningRate ≈ 0.33
    learningRate = 1.0 - (currentScore / 150.0);
  } else {
    // 降低分数：分数越高，遗忘时降低越多
    // 当 score = 0 时，learningRate = 1.0
    // 当 score = 100 时，learningRate = 1.5
    learningRate = 1.0 + (currentScore / 200.0);
  }
  
  // 应用学习率
  const change = baseChange * learningRate;
  const newScore = currentScore + change;
  
  // 限制在 [0, 100] 范围内
  return Math.max(0.0, Math.min(100.0, newScore));
}

/**
 * 打乱数组顺序（Fisher-Yates 算法）
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Check if a word was reviewed recently (within the last 7 days)
 */
function wasReviewedRecently(word: VocabularyEntry, currentTime: Date): boolean {
  if (!word.recentReviews || word.recentReviews.length === 0) {
    return false;
  }
  
  try {
    const mostRecentReview = new Date(word.recentReviews[word.recentReviews.length - 1]);
    if (isNaN(mostRecentReview.getTime())) {
      return false;
    }
    
    const hoursElapsed = (currentTime.getTime() - mostRecentReview.getTime()) / (1000 * 60 * 60);
    const daysElapsed = hoursElapsed / 24;
    
    // Consider "recent" if reviewed within last 7 days
    return daysElapsed <= 7;
  } catch {
    return false;
  }
}

/**
 * Weighted random selection from a pool
 */
function weightedRandomSelect(
  pool: Array<{ word: VocabularyEntry; weight: number }>,
  count: number
): VocabularyEntry[] {
  const selected: VocabularyEntry[] = [];
  const remaining = [...pool];
  
  for (let i = 0; i < count && remaining.length > 0; i++) {
    const totalWeight = remaining.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let j = 0; j < remaining.length; j++) {
      random -= remaining[j].weight;
      if (random <= 0) {
        selected.push(remaining[j].word);
        remaining.splice(j, 1);
        break;
      }
    }
  }
  
  return selected;
}

/**
 * 使用配额制选择复习单词
 * 
 * 算法说明：
 * - recencyWeight 控制最近复习单词的比例（不是权重）
 * - recencyWeight = 0.0: 0% 最近复习的单词（纯 SR 算法）
 * - recencyWeight = 0.5: 50% 最近复习的单词
 * - recencyWeight = 1.0: 100% 最近复习的单词
 * 
 * 例如：如果上周复习了 100 个单词，recencyWeight = 0.66 时，
 * 队列中约 66% 的单词会是上周复习过的单词
 * 
 * @param allWords - 所有单词
 * @param count - 需要选择的单词数量
 * @param recencyWeight - 最近复习单词的比例 (0.0 到 1.0)，默认 0.5
 * @returns 选中的单词数组
 */
export function selectWordsForReview(
  allWords: VocabularyEntry[],
  count: number,
  recencyWeight: number = 0.5
): VocabularyEntry[] {
  // 验证输入
  if (count < 0) {
    throw new Error(`Invalid count: ${count}. Must be non-negative`);
  }
  
  if (!Array.isArray(allWords)) {
    throw new Error('allWords must be an array');
  }
  
  if (allWords.length === 0) {
    return [];
  }
  
  // 如果请求的数量大于等于总数，返回所有单词（打乱顺序）
  if (count >= allWords.length) {
    return shuffleArray([...allWords]);
  }
  
  const currentTime = new Date();
  
  // 将单词分为两组：最近复习的 vs 其他
  const recentWords: VocabularyEntry[] = [];
  const otherWords: VocabularyEntry[] = [];
  
  for (const word of allWords) {
    if (wasReviewedRecently(word, currentTime)) {
      recentWords.push(word);
    } else {
      otherWords.push(word);
    }
  }
  
  // 计算配额
  // recentQuota: 从最近复习的单词中选择的数量
  // otherQuota: 从其他单词中选择的数量
  let recentQuota = Math.round(count * recencyWeight);
  let otherQuota = count - recentQuota;
  
  // 如果最近复习的单词不够，调整配额
  if (recentWords.length < recentQuota) {
    recentQuota = recentWords.length;
    otherQuota = count - recentQuota;
  }
  
  // 如果其他单词不够，调整配额
  if (otherWords.length < otherQuota) {
    otherQuota = otherWords.length;
    recentQuota = Math.min(count - otherQuota, recentWords.length);
  }
  
  // 从最近复习的单词中选择（使用 SR 权重）
  const recentPool = recentWords.map(word => ({
    word,
    weight: calculateSelectionWeight(word.familiarityScore, word.timesReviewed)
  }));
  
  const selectedRecent = weightedRandomSelect(recentPool, recentQuota);
  
  // 从其他单词中选择（使用 SR 权重）
  const otherPool = otherWords.map(word => ({
    word,
    weight: calculateSelectionWeight(word.familiarityScore, word.timesReviewed)
  }));
  
  const selectedOther = weightedRandomSelect(otherPool, otherQuota);
  
  // 合并并打乱顺序
  const result = shuffleArray([...selectedRecent, ...selectedOther]);
  
  return result;
}
