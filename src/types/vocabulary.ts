export interface SubDefinition {
  phrase: string;  // e.g., "in bulk", "bulk up"
  partOfSpeech?: string;  // Optional part of speech for the phrase
  text: string;    // Definition of the sub-phrase
  examples?: string[];  // Examples for this sub-phrase
}

export interface Definition {
  partOfSpeech?: string;
  text: string;
  subDefinitions?: SubDefinition[];  // Changed from string[] to SubDefinition[]
  examples?: string[];  // Examples specific to this definition
}

export interface Hyperlink {
  label: string;
  targetWord: string;
  displayText?: string;
}

export interface VocabularyEntry {
  id: number;
  word: string;
  variants?: string[];  // Alternative spellings: ["inside-the-beltway", "also intra-beltway"]
  pronunciation?: string;  // IPA notation
  respelling?: string;  // Natural pronunciation respelling (e.g., "pruh-nuhn-see-AY-shuhn")
  definitions: Definition[];
  examples?: string[];  // Global examples that apply to all definitions
  images?: string[];
  hyperlinks?: Hyperlink[];
  tags?: string[];  // Custom tags for categorization (e.g., ["academic", "daily"])
  familiarityScore: number;
  timesReviewed: number;
  timesCorrect: number;
  recentReviews?: string[];  // ISO 8601 timestamps of recent reviews, max 10 entries, most recent last
}
