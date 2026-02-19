/**
 * Recency Scoring Module
 * 
 * Calculates scores based on how recently words were reviewed.
 * Uses exponential decay to prioritize recently reviewed words.
 */

/**
 * Calculate recency score based on review history
 * Uses exponential decay: score = maxScore * e^(-k * hours)
 * 
 * @param recentReviews - Array of ISO 8601 timestamps (most recent last)
 * @param currentTime - Current timestamp for calculation
 * @returns Recency score (0.1 to 10.0, matching SR score range)
 */
export function calculateRecencyScore(
  recentReviews: string[] | undefined,
  currentTime: Date = new Date()
): number {
  const minScore = 0.1;
  const maxScore = 10.0;
  const defaultScore = 5.0; // Default score for words without review history
  
  // No review history: return default score (neutral)
  // This ensures words without recentReviews still have reasonable selection probability
  if (!recentReviews || recentReviews.length === 0) {
    return defaultScore;
  }
  
  try {
    // Get most recent review
    const mostRecentReview = new Date(recentReviews[recentReviews.length - 1]);
    
    // Check for invalid date
    if (isNaN(mostRecentReview.getTime())) {
      console.warn('Invalid timestamp in recentReviews', {
        timestamp: recentReviews[recentReviews.length - 1]
      });
      return defaultScore;
    }
    
    // Handle future timestamps (clock skew or invalid data)
    if (mostRecentReview.getTime() > currentTime.getTime()) {
      console.warn('Future timestamp detected in recentReviews', {
        timestamp: recentReviews[recentReviews.length - 1],
        currentTime: currentTime.toISOString()
      });
      return maxScore; // Treat as very recent
    }
    
    const hoursElapsed = (currentTime.getTime() - mostRecentReview.getTime()) / (1000 * 60 * 60);
    
    // Exponential decay parameters
    // k = 0.01 means:
    //   - 24 hours ago: score ≈ 7.9 (high)
    //   - 72 hours ago: score ≈ 5.0 (medium)
    //   - 168 hours (7 days) ago: score ≈ 1.9 (low)
    const k = 0.01;
    const score = maxScore * Math.exp(-k * hoursElapsed);
    
    return Math.max(minScore, Math.min(maxScore, score));
  } catch (error) {
    console.error('Error calculating recency score', error);
    return defaultScore;
  }
}
