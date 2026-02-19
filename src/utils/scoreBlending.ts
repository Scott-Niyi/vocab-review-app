/**
 * Score Blending Module
 * 
 * Blends spaced repetition scores and recency scores according to user preference.
 * Implements a buffer mechanism to ensure both methods contribute meaningfully.
 */

/**
 * Calculate blended score with buffer mechanism
 * 
 * @param srScore - Spaced repetition score (from calculateSelectionWeight)
 * @param recencyScore - Recency score (from calculateRecencyScore)
 * @param recencyWeight - User preference (0.0 to 1.0)
 * @returns Blended score for word selection
 */
export function calculateBlendedScore(
  srScore: number,
  recencyScore: number,
  recencyWeight: number
): number {
  // Validate inputs
  if (recencyWeight < 0 || recencyWeight > 1) {
    throw new Error(`Invalid recencyWeight: ${recencyWeight}. Must be in range [0, 1]`);
  }
  
  // Buffer mechanism: ensure both methods contribute at least 20%
  const minContribution = 0.2;
  const maxContribution = 0.8;
  
  // Map recencyWeight (0.0 to 1.0) to actual weights with buffer
  // recencyWeight = 0.0 → recency gets 20%, SR gets 80%
  // recencyWeight = 0.5 → recency gets 50%, SR gets 50%
  // recencyWeight = 1.0 → recency gets 80%, SR gets 20%
  const actualRecencyWeight = minContribution + (recencyWeight * (maxContribution - minContribution));
  const actualSRWeight = 1.0 - actualRecencyWeight;
  
  // Blend scores
  const blendedScore = (srScore * actualSRWeight) + (recencyScore * actualRecencyWeight);
  
  return blendedScore;
}
