import { ILLMService, LLMConfig, LLMNotConfiguredError, LLMAPIError } from './ILLMService';

/**
 * OpenAI implementation of LLM service
 */
export class OpenAIService implements ILLMService {
  private config: LLMConfig;
  private readonly STORAGE_KEY = 'llm_config';

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): LLMConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load LLM config:', error);
    }
    return { provider: 'openai' };
  }

  public saveConfig(config: LLMConfig): void {
    this.config = config;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
  }

  public getConfig(): LLMConfig {
    return { ...this.config };
  }

  isConfigured(): boolean {
    return !!this.config.apiKey && this.config.apiKey.trim().length > 0;
  }

  private async callOpenAI(messages: Array<{ role: string; content: string }>): Promise<string> {
    if (!this.isConfigured()) {
      throw new LLMNotConfiguredError();
    }

    const model = this.config.model || 'gpt-4o-mini';
    const baseURL = this.config.baseURL || 'https://api.openai.com/v1';

    try {
      const response = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new LLMAPIError(
          errorData.error?.message || `API request failed with status ${response.status}`,
          response.status
        );
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      if (error instanceof LLMNotConfiguredError || error instanceof LLMAPIError) {
        throw error;
      }
      throw new LLMAPIError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateIPA(word: string): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: 'You are a linguistic expert. Generate IPA (International Phonetic Alphabet) pronunciation for English words. Return ONLY the IPA notation, nothing else. Use proper IPA symbols including stress marks (ˈ for primary stress, ˌ for secondary stress).',
      },
      {
        role: 'user',
        content: `Generate IPA pronunciation for: ${word}`,
      },
    ];

    const result = await this.callOpenAI(messages);
    return result.trim().replace(/^\/|\/$/g, ''); // Remove surrounding slashes if present
  }

  async generateRespelling(word: string, ipa?: string): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: 'You are a linguistic expert. Generate natural pronunciation respelling for English words using simple phonetic spelling. Use CAPITAL LETTERS for stressed syllables. Return ONLY the respelling, nothing else. Examples: "bulk" → "BULK", "intrabeltway" → "in-truh-BELT-way", "pronunciation" → "pruh-nun-see-AY-shuhn"',
      },
      {
        role: 'user',
        content: ipa 
          ? `Generate natural respelling for: ${word} (IPA: ${ipa})`
          : `Generate natural respelling for: ${word}`,
      },
    ];

    const result = await this.callOpenAI(messages);
    return result.trim();
  }

  async generateExamples(word: string, definition: string, count: number = 2): Promise<string[]> {
    const messages = [
      {
        role: 'system',
        content: `You are a linguistic expert. Generate ${count} example sentences that demonstrate the usage of a word with a specific definition. 

CRITICAL FORMATTING RULES:
1. Make the target word BOLD by wrapping it with **word** (use straight ASCII asterisks, not curly quotes)
2. Return ONLY the example sentences, one per line
3. NO numbering, NO bullet points, NO extra formatting
4. Use straight double quotes " for any quotations (not curly quotes "" or '')
5. Use straight single quotes ' for contractions (not curly quotes '' or '')`,
      },
      {
        role: 'user',
        content: `Generate ${count} example sentences for:\nWord: ${word}\nDefinition: ${definition}\n\nRemember to make "${word}" bold using **${word}** with straight asterisks.`,
      },
    ];

    const result = await this.callOpenAI(messages);
    return result
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, count);
  }

  async suggestDefinitions(word: string): Promise<Array<{ partOfSpeech?: string; text: string }>> {
    const messages = [
      {
        role: 'system',
        content: `You are a linguistic expert. Provide dictionary definitions for English words.

CRITICAL JSON FORMATTING RULES:
1. Return ONLY valid JSON - no markdown code blocks, no extra text
2. Use straight double quotes " for all JSON strings (not curly quotes "" or '')
3. Format: [{"partOfSpeech": "noun", "text": "definition here"}]
4. Ensure all quotes are properly escaped within strings
5. Do not use single quotes ' in JSON

Example output:
[{"partOfSpeech": "noun", "text": "a large quantity"}, {"partOfSpeech": "verb", "text": "to increase in size"}]`,
      },
      {
        role: 'user',
        content: `Provide definitions for: ${word}\n\nReturn ONLY valid JSON with straight double quotes.`,
      },
    ];

    const result = await this.callOpenAI(messages);
    
    try {
      // Clean up common JSON formatting issues
      let cleanedResult = result.trim();
      // Remove markdown code blocks if present
      cleanedResult = cleanedResult.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      // Replace curly quotes with straight quotes
      cleanedResult = cleanedResult.replace(/[""]/g, '"').replace(/['']/g, "'");
      
      const parsed = JSON.parse(cleanedResult);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.error('JSON parsing failed:', error, 'Raw result:', result);
      // If JSON parsing fails, try to extract definitions from text
      const lines = result.split('\n').filter(line => line.trim());
      return lines.map(line => {
        const match = line.match(/^\s*\(?(noun|verb|adj|adv|adjective|adverb|prep|preposition|conj|conjunction|interj|interjection)\)?\s*[:.]\s*(.+)$/i);
        if (match) {
          return {
            partOfSpeech: match[1].toLowerCase(),
            text: match[2].trim(),
          };
        }
        return { text: line.trim() };
      });
    }

    return [];
  }

  async generateDefinitionFromExamples(word: string, examples: string[]): Promise<{
    partOfSpeech?: string;
    text: string;
  }> {
    const examplesText = examples.map((ex, idx) => `${idx + 1}. ${ex}`).join('\n');
    
    const messages = [
      {
        role: 'system',
        content: `You are a linguistic expert specializing in Oxford Dictionary style definitions. Based on example sentences, infer the definition of a word.

CRITICAL JSON FORMATTING RULES:
1. Return ONLY valid JSON - no markdown code blocks, no extra text
2. Use straight double quotes " for all JSON strings (not curly quotes "" or '')
3. Format: {"partOfSpeech": "noun", "text": "definition text"}
4. Ensure all quotes are properly escaped within strings
5. Do not use single quotes ' in JSON

Your definition should be:
- Concise and precise (Oxford Dictionary style)
- Clear, simple language
- Capture the meaning shown in the examples`,
      },
      {
        role: 'user',
        content: `Based on these example sentences, provide an Oxford Dictionary style definition for "${word}":\n\n${examplesText}\n\nReturn ONLY valid JSON: {"partOfSpeech": "...", "text": "..."}`,
      },
    ];

    const result = await this.callOpenAI(messages);
    
    try {
      // Clean up common JSON formatting issues
      let cleanedResult = result.trim();
      // Remove markdown code blocks if present
      cleanedResult = cleanedResult.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      // Replace curly quotes with straight quotes
      cleanedResult = cleanedResult.replace(/[""]/g, '"').replace(/['']/g, "'");
      
      const parsed = JSON.parse(cleanedResult);
      return {
        partOfSpeech: parsed.partOfSpeech || '',
        text: parsed.text || '',
      };
    } catch (error) {
      console.error('JSON parsing failed:', error, 'Raw result:', result);
      // Fallback: try to extract from text
      const match = result.match(/\(?(noun|verb|adj|adv|adjective|adverb|prep|preposition|conj|conjunction|interj|interjection)\)?\s*[:.]\s*(.+)/i);
      if (match) {
        return {
          partOfSpeech: match[1].toLowerCase(),
          text: match[2].trim(),
        };
      }
      throw new LLMAPIError('Failed to parse definition from API response');
    }
  }

  async generateWordData(word: string): Promise<{
    ipa: string;
    respelling: string;
    definitions: Array<{
      partOfSpeech?: string;
      text: string;
      examples?: string[];
    }>;
  }> {
    const messages = [
      {
        role: 'system',
        content: `You are a linguistic expert. Generate complete word data including IPA pronunciation, natural respelling, and definitions with examples.

CRITICAL JSON FORMATTING RULES:
1. Return ONLY valid JSON - no markdown code blocks, no extra text
2. Use straight double quotes " for all JSON strings (not curly quotes "" or '')
3. Use straight single quotes ' for contractions in text (not curly quotes '')
4. Ensure all quotes are properly escaped within strings
5. Format:
{
  "ipa": "IPA notation",
  "respelling": "natural respelling with CAPS for stress",
  "definitions": [
    {
      "partOfSpeech": "noun",
      "text": "definition text",
      "examples": ["example 1", "example 2"]
    }
  ]
}`,
      },
      {
        role: 'user',
        content: `Generate complete word data for: ${word}\n\nReturn ONLY valid JSON with straight double quotes.`,
      },
    ];

    const result = await this.callOpenAI(messages);
    
    try {
      // Clean up common JSON formatting issues
      let cleanedResult = result.trim();
      // Remove markdown code blocks if present
      cleanedResult = cleanedResult.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      // Replace curly quotes with straight quotes
      cleanedResult = cleanedResult.replace(/[""]/g, '"').replace(/['']/g, "'");
      
      const parsed = JSON.parse(cleanedResult);
      return {
        ipa: parsed.ipa || '',
        respelling: parsed.respelling || '',
        definitions: parsed.definitions || [],
      };
    } catch (error) {
      console.error('JSON parsing failed:', error, 'Raw result:', result);
      throw new LLMAPIError('Failed to parse word data from API response');
    }
  }
}
