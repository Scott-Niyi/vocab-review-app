// Test script to verify recency scoring behavior
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load vocabulary data
const vocabPath = path.join(__dirname, '../wordlist-imported-vocab-v3/vocabulary.json');
const data = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
const vocabulary = data.vocabulary;

console.log('Total words:', vocabulary.length);

// Count words with recentReviews
const wordsWithRecentReviews = vocabulary.filter(w => w.recentReviews && w.recentReviews.length > 0);
console.log('Words with recentReviews:', wordsWithRecentReviews.length);

// Show some examples
console.log('\n=== Words WITH recent reviews (first 5) ===');
wordsWithRecentReviews.slice(0, 5).forEach(w => {
  console.log(`- ${w.word}: ${w.recentReviews.length} reviews, last: ${w.recentReviews[w.recentReviews.length - 1]}`);
});

console.log('\n=== Words WITHOUT recent reviews (first 5) ===');
const wordsWithoutRecentReviews = vocabulary.filter(w => !w.recentReviews || w.recentReviews.length === 0);
wordsWithoutRecentReviews.slice(0, 5).forEach(w => {
  console.log(`- ${w.word}: no recent reviews (familiarity: ${w.familiarityScore}, reviewed: ${w.timesReviewed})`);
});

// Simulate scoring with old vs new logic
console.log('\n=== Scoring Comparison ===');
console.log('OLD logic: words without recentReviews get score 0.1');
console.log('NEW logic: words without recentReviews get score 5.0 (neutral)');
console.log('\nWith 80% recency weight (slider at right):');
console.log('- Word WITH recent review (score 8.0): blended = 8.0 * 0.8 + SR * 0.2');
console.log('- Word WITHOUT recent review (OLD 0.1): blended = 0.1 * 0.8 + SR * 0.2 = 0.08 + SR*0.2');
console.log('- Word WITHOUT recent review (NEW 5.0): blended = 5.0 * 0.8 + SR * 0.2 = 4.0 + SR*0.2');
console.log('\nNEW logic gives words without recentReviews a much better chance!');
