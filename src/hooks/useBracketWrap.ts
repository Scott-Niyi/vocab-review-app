import { useEffect, RefObject } from 'react';

/**
 * Hook to enable auto-wrapping selected text with brackets/quotes
 * When user selects text and presses a bracket key, it wraps the text instead of replacing it
 */
export const useBracketWrap = (
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  value: string,
  onChange: (newValue: string) => void
) => {
  useEffect(() => {
    const handleKeyDown = (e: Event) => {
      const keyEvent = e as unknown as KeyboardEvent;
      const bracketPairs: Record<string, string> = {
        '(': ')',
        '[': ']',
        '{': '}',
        '<': '>',
        '"': '"',
        "'": "'",
        '`': '`',
        '*': '*',
        '_': '_'
      };
      
      if (bracketPairs[keyEvent.key] && inputRef.current) {
        const start = inputRef.current.selectionStart || 0;
        const end = inputRef.current.selectionEnd || 0;
        const selectedText = value.substring(start, end);
        
        // Only wrap if text is selected
        if (selectedText && start !== end) {
          keyEvent.preventDefault();
          const closingBracket = bracketPairs[keyEvent.key];
          const newValue = value.substring(0, start) + keyEvent.key + selectedText + closingBracket + value.substring(end);
          onChange(newValue);
          
          // Keep the wrapped text selected (including brackets)
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.setSelectionRange(start + 1, start + 1 + selectedText.length);
              inputRef.current.focus();
            }
          }, 0);
        }
      }
    };

    const input = inputRef.current;
    if (input) {
      input.addEventListener('keydown', handleKeyDown);
      return () => input.removeEventListener('keydown', handleKeyDown);
    }
  }, [inputRef, value, onChange]);
};
