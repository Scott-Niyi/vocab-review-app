import { useState } from 'react';
import { getLLMService } from '../services';
import { LLMNotConfiguredError, LLMAPIError } from '../services/ILLMService';

export type LLMStatus = 'idle' | 'loading' | 'success' | 'error' | 'not-configured';

export interface UseLLMResult {
  status: LLMStatus;
  error: string | null;
  isConfigured: boolean;
  generateIPA: (word: string) => Promise<string | null>;
  generateRespelling: (word: string, ipa?: string) => Promise<string | null>;
  generateExamples: (word: string, definition: string, count?: number) => Promise<string[] | null>;
  suggestDefinitions: (word: string) => Promise<Array<{
    partOfSpeech?: string;
    text: string;
  }> | null>;
  generateDefinitionFromExamples: (word: string, examples: string[]) => Promise<{
    partOfSpeech?: string;
    text: string;
  } | null>;
  generateWordData: (word: string) => Promise<{
    ipa: string;
    respelling: string;
    definitions: Array<{
      partOfSpeech?: string;
      text: string;
      examples?: string[];
    }>;
  } | null>;
}

export function useLLM(): UseLLMResult {
  const [status, setStatus] = useState<LLMStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const llmService = getLLMService();
  const isConfigured = llmService.isConfigured();

  const handleError = (err: unknown): void => {
    if (err instanceof LLMNotConfiguredError) {
      setStatus('not-configured');
      setError('LLM service is not configured. Please add your API key in Settings.');
    } else if (err instanceof LLMAPIError) {
      setStatus('error');
      setError(err.message);
    } else if (err instanceof Error) {
      setStatus('error');
      setError(err.message);
    } else {
      setStatus('error');
      setError('An unknown error occurred');
    }
  };

  const generateIPA = async (word: string): Promise<string | null> => {
    if (!isConfigured) {
      setStatus('not-configured');
      setError('Please configure your API key in Settings first');
      return null;
    }

    setStatus('loading');
    setError(null);

    try {
      const result = await llmService.generateIPA(word);
      setStatus('success');
      return result;
    } catch (err) {
      handleError(err);
      return null;
    }
  };

  const generateRespelling = async (word: string, ipa?: string): Promise<string | null> => {
    if (!isConfigured) {
      setStatus('not-configured');
      setError('Please configure your API key in Settings first');
      return null;
    }

    setStatus('loading');
    setError(null);

    try {
      const result = await llmService.generateRespelling(word, ipa);
      setStatus('success');
      return result;
    } catch (err) {
      handleError(err);
      return null;
    }
  };

  const generateExamples = async (
    word: string,
    definition: string,
    count: number = 2
  ): Promise<string[] | null> => {
    if (!isConfigured) {
      setStatus('not-configured');
      setError('Please configure your API key in Settings first');
      return null;
    }

    setStatus('loading');
    setError(null);

    try {
      const result = await llmService.generateExamples(word, definition, count);
      setStatus('success');
      return result;
    } catch (err) {
      handleError(err);
      return null;
    }
  };

  const suggestDefinitions = async (word: string) => {
    if (!isConfigured) {
      setStatus('not-configured');
      setError('Please configure your API key in Settings first');
      return null;
    }

    setStatus('loading');
    setError(null);

    try {
      const result = await llmService.suggestDefinitions(word);
      setStatus('success');
      return result;
    } catch (err) {
      handleError(err);
      return null;
    }
  };

  const generateWordData = async (word: string) => {
    if (!isConfigured) {
      setStatus('not-configured');
      setError('Please configure your API key in Settings first');
      return null;
    }

    setStatus('loading');
    setError(null);

    try {
      const result = await llmService.generateWordData(word);
      setStatus('success');
      return result;
    } catch (err) {
      handleError(err);
      return null;
    }
  };

  const generateDefinitionFromExamples = async (word: string, examples: string[]) => {
    if (!isConfigured) {
      setStatus('not-configured');
      setError('Please configure your API key in Settings first');
      return null;
    }

    if (examples.length === 0) {
      setStatus('error');
      setError('Please provide at least one example sentence');
      return null;
    }

    setStatus('loading');
    setError(null);

    try {
      const result = await llmService.generateDefinitionFromExamples(word, examples);
      setStatus('success');
      return result;
    } catch (err) {
      handleError(err);
      return null;
    }
  };

  return {
    status,
    error,
    isConfigured,
    generateIPA,
    generateRespelling,
    generateExamples,
    suggestDefinitions,
    generateDefinitionFromExamples,
    generateWordData,
  };
}
