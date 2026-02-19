# Review Recency Tuning Feature

## Overview

The Review Recency Tuning feature allows you to control the balance between reviewing recently-studied words (short-term reinforcement) and reviewing words based on the spaced repetition algorithm (long-term retention).

## How to Use

1. Open **Settings** from the navigation menu
2. Find the **🎯 复习热度 (Review Recency)** section
3. Adjust the slider:
   - **Left (间隔重复)**: Prioritizes traditional spaced repetition algorithm
   - **Center (平衡)**: Balanced approach (default)
   - **Right (最近复习)**: Prioritizes recently reviewed words

## How It Works

### The Algorithm

The system calculates two scores for each word:

1. **Spaced Repetition Score**: Based on familiarity and review history (existing algorithm)
2. **Recency Score**: Based on how recently the word was reviewed (exponential decay)

The final score is a weighted blend of these two scores, controlled by your slider position.

### Buffer Mechanism

Even at extreme slider positions, both scoring methods contribute at least 20% to ensure a balanced review experience:
- Slider at 0.0 (far left): 80% SR / 20% recency
- Slider at 0.5 (center): 50% SR / 50% recency  
- Slider at 1.0 (far right): 20% SR / 80% recency

### Data Tracking

- The system automatically tracks the last 10 review timestamps for each word
- Only reviews after this feature is deployed are tracked
- Old vocabulary data works seamlessly (backward compatible)

## Use Cases

### When to Use "偏向最近复习" (Favor Recent Reviews)

- Before an exam or test
- When you want to reinforce what you just learned
- Short-term memory consolidation

### When to Use "偏向间隔重复" (Favor Spaced Repetition)

- Long-term learning goals
- Building lasting vocabulary knowledge
- Following proven spaced repetition principles

### When to Use "平衡" (Balanced)

- General daily practice
- Maintaining both short-term and long-term retention
- Default recommended setting

## Technical Details

### Data Structure

**Vocabulary Entry** (vocabulary.json):
```json
{
  "id": 1,
  "word": "example",
  "recentReviews": [
    "2026-02-14T10:30:00.000Z",
    "2026-02-14T15:45:00.000Z"
  ]
}
```

**Config** (config.json):
```json
{
  "reviewRecencyWeight": 0.5
}
```

### Recency Score Calculation

Uses exponential decay: `score = 10.0 × e^(-0.01 × hours)`

- 24 hours ago: score ≈ 7.9 (high)
- 72 hours ago: score ≈ 5.0 (medium)
- 7 days ago: score ≈ 1.9 (low)

## Backward Compatibility

- Old vocabulary.json files without `recentReviews` work perfectly
- Missing fields are automatically initialized
- No data migration required
- Your existing progress is preserved

## Performance

- Optimized for large vocabulary lists (1000+ words)
- O(1) recency score calculation per word
- O(n) queue generation (same as before)
- No noticeable performance impact

## Privacy

- All data stored locally (file system or localStorage)
- No data sent to external servers
- Your review history stays on your device

---

**Implemented**: February 2026  
**Version**: 1.1.0
