import React, { useState, useRef, useEffect } from 'react';

interface IPAInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showHelper?: boolean;
}

// IPA shortcuts based on TIPA package
const IPA_SHORTCUTS: Record<string, { symbol: string; description: string }> = {
  // Vowels
  'ae': { symbol: 'æ', description: 'ash (cat)' },
  '@': { symbol: 'ə', description: 'schwa (about)' },
  'schwa': { symbol: 'ə', description: 'schwa (about)' },
  'A': { symbol: 'ɑ', description: 'open back (father)' },
  'O': { symbol: 'ɔ', description: 'open-mid back (thought)' },
  'V': { symbol: 'ʌ', description: 'caret (cup)' },
  'U': { symbol: 'ʊ', description: 'upsilon (book)' },
  'I': { symbol: 'ɪ', description: 'small capital I (bit)' },
  'E': { symbol: 'ɛ', description: 'epsilon (bed)' },
  
  // Consonants
  'S': { symbol: 'ʃ', description: 'esh (ship)' },
  'Z': { symbol: 'ʒ', description: 'ezh (measure)' },
  'T': { symbol: 'θ', description: 'theta (think)' },
  'D': { symbol: 'ð', description: 'eth (this)' },
  'N': { symbol: 'ŋ', description: 'eng (sing)' },
  
  // Stress marks
  "'": { symbol: 'ˈ', description: 'primary stress' },
  '"': { symbol: 'ˈ', description: 'primary stress' },
  ',': { symbol: 'ˌ', description: 'secondary stress' },
  ':': { symbol: 'ː', description: 'long vowel' },
  
  // R-colored vowels
  '3': { symbol: 'ɜ', description: 'open-mid central (bird)' },
  '3:': { symbol: 'ɜː', description: 'long open-mid central (bird UK)' },
};

const IPAInput: React.FC<IPAInputProps> = ({ value, onChange, placeholder, showHelper = true }) => {
  const [suggestion, setSuggestion] = useState<{ text: string; symbol: string; description: string } | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isHelperExpanded, setIsHelperExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect potential IPA shortcuts
  useEffect(() => {
    if (!inputRef.current) return;

    const pos = inputRef.current.selectionStart || 0;
    const textBeforeCursor = value.substring(0, pos);
    
    // Check for matches at the end of text before cursor
    let foundMatch: { key: string; match: { symbol: string; description: string } } | null = null;
    
    // Sort by length (longest first) to match longer patterns first
    const sortedKeys = Object.keys(IPA_SHORTCUTS).sort((a, b) => b.length - a.length);
    
    for (const key of sortedKeys) {
      if (textBeforeCursor.endsWith(key)) {
        foundMatch = { key, match: IPA_SHORTCUTS[key] };
        break;
      }
    }

    if (foundMatch) {
      setSuggestion({
        text: foundMatch.key,
        symbol: foundMatch.match.symbol,
        description: foundMatch.match.description,
      });
      setCursorPosition(pos);
    } else {
      setSuggestion(null);
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      
      // Replace the shortcut with the IPA symbol
      const pos = cursorPosition;
      const textBefore = value.substring(0, pos - suggestion.text.length);
      const textAfter = value.substring(pos);
      const newValue = textBefore + suggestion.symbol + textAfter;
      
      onChange(newValue);
      setSuggestion(null);
      
      // Set cursor position after the inserted symbol
      setTimeout(() => {
        if (inputRef.current) {
          const newPos = textBefore.length + suggestion.symbol.length;
          inputRef.current.setSelectionRange(newPos, newPos);
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  return (
    <div className="ipa-input-container">
      <div className="ipa-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="form-input ipa-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        
        {suggestion && (
          <div className="ipa-suggestion">
            <span className="ipa-suggestion-symbol">{suggestion.symbol}</span>
            <span className="ipa-suggestion-desc">{suggestion.description}</span>
            <span className="ipa-suggestion-hint">Press Tab to insert</span>
          </div>
        )}
      </div>

      {showHelper && (
        <div className="ipa-helper">
          <div 
            className="ipa-helper-header" 
            onClick={() => setIsHelperExpanded(!isHelperExpanded)}
            style={{ cursor: 'pointer' }}
          >
            <div className="ipa-helper-title">
              IPA Quick Reference
              <span className="ipa-helper-toggle">{isHelperExpanded ? '▼' : '▶'}</span>
            </div>
          </div>
          {isHelperExpanded && (
            <div className="ipa-helper-content">
              <div className="ipa-helper-grid">
                <div className="ipa-helper-section">
                  <div className="ipa-helper-section-title">Vowels</div>
                  <div className="ipa-helper-item"><code>ae</code> → æ (cat)</div>
                  <div className="ipa-helper-item"><code>@</code> or <code>schwa</code> → ə (about)</div>
                  <div className="ipa-helper-item"><code>A</code> → ɑ (father)</div>
                  <div className="ipa-helper-item"><code>O</code> → ɔ (thought)</div>
                  <div className="ipa-helper-item"><code>V</code> → ʌ (cup)</div>
                  <div className="ipa-helper-item"><code>U</code> → ʊ (book)</div>
                  <div className="ipa-helper-item"><code>I</code> → ɪ (bit)</div>
                  <div className="ipa-helper-item"><code>E</code> → ɛ (bed)</div>
                  <div className="ipa-helper-item"><code>3</code> → ɜ (bird)</div>
                </div>
                
                <div className="ipa-helper-section">
                  <div className="ipa-helper-section-title">Consonants</div>
                  <div className="ipa-helper-item"><code>S</code> → ʃ (ship)</div>
                  <div className="ipa-helper-item"><code>Z</code> → ʒ (measure)</div>
                  <div className="ipa-helper-item"><code>T</code> → θ (think)</div>
                  <div className="ipa-helper-item"><code>D</code> → ð (this)</div>
                  <div className="ipa-helper-item"><code>N</code> → ŋ (sing)</div>
                </div>
                
                <div className="ipa-helper-section">
                  <div className="ipa-helper-section-title">Stress & Length</div>
                  <div className="ipa-helper-item"><code>'</code> or <code>"</code> → ˈ (primary stress)</div>
                  <div className="ipa-helper-item"><code>,</code> → ˌ (secondary stress)</div>
                  <div className="ipa-helper-item"><code>:</code> → ː (long vowel)</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IPAInput;
