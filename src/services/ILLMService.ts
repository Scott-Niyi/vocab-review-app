/**
 * LLM Service interface for AI-powered features
 */
export interface ILLMService {
  /**
   * Check if the service is configured and ready to use
   */
  isConfigured(): boolean;
  
  /**
   * Get current configuration
   */
  getConfig(): LLMConfig;
  
  /**
   * Save configuration
   */
  saveConfig(config: LLMConfig): void;
  
  /**
   * Generate IPA pronunciation for a word
   * @param word - The word to generate pronunciation for
   * @returns IPA notation (e.g., "bʌlk")
   */
  generateIPA(word: string): Promise<string>;
  
  /**
   * Generate natural respelling for a word
   * @param word - The word
   * @param ipa - Optional IPA to help with generation
   * @returns Natural respelling with CAPS for stress (e.g., "BULK")
   */
  generateRespelling(word: string, ipa?: string): Promise<string>;
  
  /**
   * Generate example sentences for a word and definition
   * @param word - The word
   * @param definition - The definition
   * @param count - Number of examples to generate (default: 2)
   * @returns Array of example sentences
   */
  generateExamples(word: string, definition: string, count?: number): Promise<string[]>;
  
  /**
   * Suggest definitions for a word
   * @param word - The word to define
   * @returns Array of suggested definitions
   */
  suggestDefinitions(word: string): Promise<Array<{
    partOfSpeech?: string;
    text: string;
  }>>;
  
  /**
   * Generate definition from example sentences (reverse engineering)
   * @param word - The word
   * @param examples - Example sentences showing usage
   * @returns Definition with part of speech in Oxford Dictionary style
   */
  generateDefinitionFromExamples(word: string, examples: string[]): Promise<{
    partOfSpeech?: string;
    text: string;
  }>;
  
  /**
   * Generate all fields at once (more efficient)
   * @param word - The word
   * @returns Complete word data
   */
  generateWordData(word: string): Promise<{
    ipa: string;
    respelling: string;
    definitions: Array<{
      partOfSpeech?: string;
      text: string;
      examples?: string[];
    }>;
  }>;
}

/**
 * LLM Service configuration
 */
export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'local';
  apiKey?: string;
  model?: string;
  baseURL?: string;
}

/**
 * Error thrown when LLM service is not configured
 */
export class LLMNotConfiguredError extends Error {
  constructor() {
    super('LLM service is not configured. Please add your API key in Settings.');
    this.name = 'LLMNotConfiguredError';
  }
}

/**
 * Error thrown when LLM API call fails
 */
export class LLMAPIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'LLMAPIError';
  }
}
