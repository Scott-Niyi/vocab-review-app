import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VocabularyEntry } from '../types/vocabulary';

interface RichTextInputProps {
  value: string;
  onChange: (value: string) => void;
  vocabulary: VocabularyEntry[];
  placeholder?: string;
}

const RichTextInput: React.FC<RichTextInputProps> = ({ value, onChange, vocabulary, placeholder }) => {
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const filteredWords = vocabulary.filter(w =>
    w.word.toLowerCase().includes(linkSearch.toLowerCase())
  ).slice(0, 5);

  // Reset selected index when filtered words change
  useEffect(() => {
    setSelectedIndex(0);
  }, [linkSearch]);

  // Define all callback functions first
  const insertSmallCaps = useCallback(() => {
    if (!inputRef.current) return;
    const start = inputRef.current.selectionStart;
    const end = inputRef.current.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText) {
      const newValue = value.substring(0, start) + `\\textsc{${selectedText}}` + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(start + 8, start + 8 + selectedText.length);
          inputRef.current.focus();
        }
      }, 0);
    } else {
      const newValue = value.substring(0, start) + `\\textsc{text}` + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(start + 8, start + 12);
          inputRef.current.focus();
        }
      }, 0);
    }
  }, [value, onChange]);

  const insertOldstyleNums = useCallback(() => {
    if (!inputRef.current) return;
    const start = inputRef.current.selectionStart;
    const end = inputRef.current.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText) {
      const newValue = value.substring(0, start) + `~${selectedText}~` + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(start + 1, start + 1 + selectedText.length);
          inputRef.current.focus();
        }
      }, 0);
    } else {
      const newValue = value.substring(0, start) + `~123~` + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(start + 1, start + 4);
          inputRef.current.focus();
        }
      }, 0);
    }
  }, [value, onChange]);

  const insertBold = useCallback(() => {
    if (!inputRef.current) return;
    const start = inputRef.current.selectionStart;
    const end = inputRef.current.selectionEnd;
    const selectedText = value.substring(start, end);
    
    if (selectedText) {
      const newValue = value.substring(0, start) + `**${selectedText}**` + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(start + 2, start + 2 + selectedText.length);
          inputRef.current.focus();
        }
      }, 0);
    } else {
      const newValue = value.substring(0, start) + `**text**` + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(start + 2, start + 6);
          inputRef.current.focus();
        }
      }, 0);
    }
  }, [value, onChange]);

  const insertItalic = useCallback(() => {
    if (!inputRef.current) return;
    const start = inputRef.current.selectionStart;
    const end = inputRef.current.selectionEnd;
    const selectedText = value.substring(start, end);
    
    if (selectedText) {
      const newValue = value.substring(0, start) + `*${selectedText}*` + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(start + 1, start + 1 + selectedText.length);
          inputRef.current.focus();
        }
      }, 0);
    } else {
      const newValue = value.substring(0, start) + `*text*` + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(start + 1, start + 5);
          inputRef.current.focus();
        }
      }, 0);
    }
  }, [value, onChange]);

  const openLinkPicker = useCallback(() => {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart);
    }
    setShowLinkPicker(true);
    setLinkSearch('');
  }, []);

  const insertLink = useCallback((word: VocabularyEntry) => {
    const linkText = `[[${word.word}|${word.word}]]`;
    const newValue = value.substring(0, cursorPosition) + linkText + value.substring(cursorPosition);
    onChange(newValue);
    setShowLinkPicker(false);
    
    setTimeout(() => {
      if (inputRef.current) {
        const newPos = cursorPosition + linkText.length;
        inputRef.current.setSelectionRange(newPos, newPos);
        inputRef.current.focus();
      }
    }, 0);
  }, [value, cursorPosition, onChange]);

  // Handle keyboard navigation in link picker
  useEffect(() => {
    if (!showLinkPicker) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredWords.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredWords.length > 0) {
        e.preventDefault();
        insertLink(filteredWords[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setShowLinkPicker(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [showLinkPicker, filteredWords, selectedIndex, insertLink]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + B for bold
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        insertBold();
      }
      // Ctrl/Cmd + I for italic
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        insertItalic();
      }
      // Ctrl/Cmd + K for link
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openLinkPicker();
      }
      // Shift + Ctrl/Cmd + C for small caps
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'c') {
        e.preventDefault();
        insertSmallCaps();
      }
      // Shift + Ctrl/Cmd + N for oldstyle nums
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        insertOldstyleNums();
      }
      
      // Auto-wrap with brackets/quotes when text is selected
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
      
      if (bracketPairs[e.key] && inputRef.current) {
        const start = inputRef.current.selectionStart;
        const end = inputRef.current.selectionEnd;
        const selectedText = value.substring(start, end);
        
        // Only wrap if text is selected
        if (selectedText && start !== end) {
          e.preventDefault();
          const closingBracket = bracketPairs[e.key];
          const newValue = value.substring(0, start) + e.key + selectedText + closingBracket + value.substring(end);
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

    const textarea = inputRef.current;
    if (textarea) {
      textarea.addEventListener('keydown', handleKeyDown);
      return () => textarea.removeEventListener('keydown', handleKeyDown);
    }
  }, [value, insertBold, insertItalic, insertSmallCaps, insertOldstyleNums, openLinkPicker, onChange]);

  // Render preview with formatting
  const renderPreview = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|~[^~]+~|\[\[[^\]]+\]\]|\\textsc\{[^}]+\})/g);

    return parts.map((part, idx) => {
      // Handle bold text **...**
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }

      // Handle italic text *...* or _..._
      if ((part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) ||
          (part.startsWith('_') && part.endsWith('_'))) {
        return <em key={idx}>{part.slice(1, -1)}</em>;
      }

      // Handle oldstyle nums ~...~
      if (part.startsWith('~') && part.endsWith('~')) {
        return <span key={idx} className="oldstyle-nums">{part.slice(1, -1)}</span>;
      }

      // Handle small caps \textsc{...}
      if (part.startsWith('\\textsc{') && part.endsWith('}')) {
        return <span key={idx} className="small-caps">{part.slice(8, -1)}</span>;
      }

      // Handle hyperlinks [[target|displayText]]
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const linkContent = part.slice(2, -2);
        const [, displayText] = linkContent.split('|');

        return (
          <span key={idx} className="preview-link">
            {displayText || linkContent}
          </span>
        );
      }

      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="rich-text-input">
      <div className="rich-text-toolbar">
        <button
          type="button"
          className="toolbar-button"
          onClick={insertBold}
          title="Bold (Ctrl/Cmd+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="toolbar-button"
          onClick={insertItalic}
          title="Italic (Ctrl/Cmd+I)"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className="toolbar-button"
          onClick={openLinkPicker}
          title="Insert link (Ctrl/Cmd+K)"
        >
          Link
        </button>
        <button
          type="button"
          className="toolbar-button"
          onClick={insertSmallCaps}
          title="Small Caps (Shift+Cmd+C)"
        >
          <span style={{ fontFamily: 'Cambria, serif', fontVariant: 'small-caps' }}>Sc</span>
        </button>
        <button
          type="button"
          className="toolbar-button"
          onClick={insertOldstyleNums}
          title="Oldstyle Numbers (Shift+Cmd+N)"
        >
          <span style={{ fontFamily: 'Cambria, serif', fontVariant: 'oldstyle-nums' }}>123</span>
        </button>
        <div className="toolbar-divider"></div>
        <button
          type="button"
          className={`toolbar-button ${showPreview ? 'active' : ''}`}
          onClick={() => setShowPreview(!showPreview)}
          title="Toggle preview"
        >
          Preview
        </button>
      </div>
      
      <div className="rich-text-editor-container">
        <textarea
          ref={inputRef}
          className={`rich-text-area ${showPreview ? 'with-preview' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
        />
        
        {showPreview && value && (
          <div className="rich-text-preview">
            <div className="rich-text-preview-label">Preview:</div>
            <div className="rich-text-preview-content">
              {renderPreview(value)}
            </div>
          </div>
        )}
      </div>

      {showLinkPicker && (
        <div className="link-picker-overlay" onClick={() => setShowLinkPicker(false)}>
          <div className="link-picker" onClick={(e) => e.stopPropagation()}>
            <div className="link-picker-header">
              <div className="link-picker-title">Insert Link</div>
              <input
                type="text"
                className="link-picker-search"
                placeholder="Search words..."
                value={linkSearch}
                onChange={(e) => setLinkSearch(e.target.value)}
                autoFocus
              />
              <button
                className="link-picker-close"
                onClick={() => setShowLinkPicker(false)}
              >
                ×
              </button>
            </div>
            
            <div className="link-picker-results">
              {filteredWords.length > 0 ? (
                filteredWords.map((word, index) => (
                  <div
                    key={word.id}
                    className={`link-picker-item ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => insertLink(word)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="link-picker-word">{word.word}</div>
                    <div className="link-picker-pronunciation">/{word.pronunciation}/</div>
                  </div>
                ))
              ) : (
                <div className="link-picker-empty">
                  {linkSearch ? 'No words found' : 'Start typing to search...'}
                </div>
              )}
            </div>
            
            <div className="link-picker-footer">
              <span className="link-picker-hint">⌨ Use ↑↓ to navigate · Enter to select · Esc to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextInput;
