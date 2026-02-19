import { VocabularyEntry } from '../types/vocabulary';

/**
 * TagManager service for managing vocabulary tags
 * Provides methods for extracting, counting, filtering, and validating tags
 */
export class TagManager {
  private vocabulary: VocabularyEntry[];

  constructor(vocabulary: VocabularyEntry[]) {
    this.vocabulary = vocabulary;
  }

  /**
   * Get all unique tags from the vocabulary collection
   * @returns Array of unique tag strings
   */
  getAllTags(): string[] {
    const tagSet = new Set<string>();
    
    for (const entry of this.vocabulary) {
      if (entry.tags && Array.isArray(entry.tags)) {
        for (const tag of entry.tags) {
          tagSet.add(tag);
        }
      }
    }
    
    return Array.from(tagSet).sort();
  }

  /**
   * Get count of vocabulary entries for each tag
   * @returns Map of tag to count
   */
  getTagCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    
    for (const entry of this.vocabulary) {
      if (entry.tags && Array.isArray(entry.tags)) {
        for (const tag of entry.tags) {
          counts.set(tag, (counts.get(tag) || 0) + 1);
        }
      }
    }
    
    return counts;
  }

  /**
   * Filter vocabulary entries by tag
   * @param tag Tag to filter by
   * @returns Array of vocabulary entries that have the specified tag
   */
  filterByTag(tag: string): VocabularyEntry[] {
    return this.vocabulary.filter(entry => 
      entry.tags && Array.isArray(entry.tags) && entry.tags.includes(tag)
    );
  }

  /**
   * Validate a tag string
   * @param tag Tag string to validate
   * @returns Error message if invalid, null if valid
   */
  static validateTag(tag: string): string | null {
    // Check for empty or whitespace-only strings
    if (!tag || tag.trim().length === 0) {
      return 'Tag cannot be empty or contain only whitespace';
    }
    
    // Check for length limit (50 characters)
    if (tag.length > 50) {
      return 'Tag cannot exceed 50 characters';
    }
    
    return null;
  }

  /**
   * Normalize a tag by trimming whitespace
   * @param tag Tag string to normalize
   * @returns Normalized tag string
   */
  static normalizeTag(tag: string): string {
    return tag.trim();
  }
}
