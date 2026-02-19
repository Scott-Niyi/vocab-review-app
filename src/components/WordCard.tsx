import React from 'react';
import { VocabularyEntry } from '../types/vocabulary';
// import { mockVocabulary } from '../data/mockData';
import VocabImage from './VocabImage';

interface WordCardProps {
  entry: VocabularyEntry;
  onRate: (rating: 1 | 2 | 3 | 4 | 5) => void;
  onNavigateToWord: (wordId: number) => void;
  onBack: () => void;
  onForward: () => void;
  onEndSession: () => void;
  onEdit: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  wordsReviewed: number;
  currentIndex: number;
  totalInSession: number;
  projectPath: string;
  vocabulary: VocabularyEntry[];
  reviewQueue: VocabularyEntry[];
  showQueuePreview: boolean;
  onToggleQueuePreview: () => void;
}

const WordCard: React.FC<WordCardProps> = ({ 
  entry, 
  onRate, 
  onNavigateToWord,
  onBack,
  onForward,
  onEndSession,
  onEdit,
  canGoBack,
  canGoForward,
  wordsReviewed,
  currentIndex,
  totalInSession,
  projectPath,
  vocabulary,
  reviewQueue,
  showQueuePreview,
  onToggleQueuePreview
}) => {
  const [selectedRating, setSelectedRating] = React.useState<number | null>(null);
  const [showDefinition, setShowDefinition] = React.useState(false);
  const wordCardRef = React.useRef<HTMLDivElement>(null);

  const ratingConfig = [
    { value: 1, label: "Don't know" },
    { value: 2, label: 'Barely' },
    { value: 3, label: 'Familiar' },
    { value: 4, label: 'Know well' },
    { value: 5, label: 'Master' },
  ];

  // Parse markdown-style bold (**text**) and hyperlinks [[target|text]] in examples/definitions
  // Supports nested patterns like **bold with [[link]]**
  const renderTextWithLinks = (text: string) => {
    const result: React.ReactNode[] = [];
    let i = 0;
    let key = 0;
    
    while (i < text.length) {
      // Check for bold pattern **...**
      if (text.substring(i, i + 2) === '**') {
        // Find the closing **
        let end = i + 2;
        let depth = 1;
        while (end < text.length - 1 && depth > 0) {
          if (text.substring(end, end + 2) === '**') {
            depth--;
            if (depth === 0) break;
          }
          end++;
        }
        
        if (depth === 0 && end < text.length) {
          // Found matching closing **
          const boldContent = text.substring(i + 2, end);
          result.push(
            <strong key={key++}>
              {renderTextWithLinks(boldContent)}
            </strong>
          );
          i = end + 2;
          continue;
        }
      }
      
      // Check for italic pattern *...* (single asterisk, not double)
      if (text[i] === '*' && text[i + 1] !== '*') {
        // Find the closing *
        let end = i + 1;
        while (end < text.length && text[end] !== '*') {
          end++;
        }
        
        if (end < text.length) {
          // Found matching closing *
          const italicContent = text.substring(i + 1, end);
          result.push(
            <em key={key++}>
              {renderTextWithLinks(italicContent)}
            </em>
          );
          i = end + 1;
          continue;
        }
      }
      
      // Check for italic pattern _..._
      if (text[i] === '_') {
        // Find the closing _
        let end = i + 1;
        while (end < text.length && text[end] !== '_') {
          end++;
        }
        
        if (end < text.length) {
          // Found matching closing _
          const italicContent = text.substring(i + 1, end);
          result.push(
            <em key={key++}>
              {renderTextWithLinks(italicContent)}
            </em>
          );
          i = end + 1;
          continue;
        }
      }
      
      // Check for hyperlink pattern [[...]]
      if (text.substring(i, i + 2) === '[[') {
        // Find the closing ]]
        let end = text.indexOf(']]', i + 2);
        if (end !== -1) {
          const linkContent = text.substring(i + 2, end);
          const [targetWord, displayText] = linkContent.split('|');
          
          // Find the target word in vocabulary
          const targetEntry = vocabulary.find(
            w => w.word.toLowerCase() === targetWord.trim().toLowerCase()
          );
          
          if (targetEntry) {
            result.push(
              <span
                key={key++}
                className="inline-hyperlink"
                onClick={() => onNavigateToWord(targetEntry.id)}
              >
                {displayText ? renderTextWithLinks(displayText) : targetWord}
              </span>
            );
          } else {
            // If target not found, show as plain text
            result.push(<span key={key++}>{displayText || targetWord}</span>);
          }
          
          i = end + 2;
          continue;
        }
      }

      // Check for oldstyle nums pattern ~...~
      if (text[i] === '~') {
        // Find the closing ~
        let end = i + 1;
        while (end < text.length && text[end] !== '~') {
          end++;
        }
        
        if (end < text.length) {
          // Found matching closing ~
          const numContent = text.substring(i + 1, end);
          result.push(
            <span key={key++} className="oldstyle-nums">
              {numContent}
            </span>
          );
          i = end + 1;
          continue;
        }
      }

      // Check for small-caps pattern «...» (new syntax)
      if (text[i] === '«') {
        const end = text.indexOf('»', i + 1);
        if (end !== -1) {
          const scContent = text.substring(i + 1, end);
          result.push(
            <span key={key++} className="small-caps">
              {renderTextWithLinks(scContent)}
            </span>
          );
          i = end + 1;
          continue;
        }
      }

      // Check for small-caps pattern \textsc{...} (legacy syntax)
      if (text.substring(i, i + 8) === '\\textsc{') {
        const end = text.indexOf('}', i + 8);
        if (end !== -1) {
          const scContent = text.substring(i + 8, end);
          result.push(
            <span key={key++} className="small-caps">
              {renderTextWithLinks(scContent)}
            </span>
          );
          i = end + 1;
          continue;
        }
      }

      // Regular character
      let plainText = '';
      while (i < text.length) {
        // Check if we're at the start of any special pattern
        if (text.substring(i, i + 2) === '**' ||
            (text[i] === '*' && text[i + 1] !== '*') ||
            text[i] === '_' ||
            text[i] === '~' ||
            text[i] === '«' ||
            text.substring(i, i + 2) === '[[' ||
            text.substring(i, i + 8) === '\\textsc{') {
          break;
        }
        plainText += text[i];
        i++;
      }

      if (plainText) {
        result.push(plainText);
      }
    }

    return result;
  };

  const handleKeyPress = React.useCallback((e: KeyboardEvent) => {
    // Don't handle keys if a modal is open or if focus is in an input/textarea
    const target = e.target as HTMLElement;
    const isInputFocused = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable ||
                          target.closest('.modal-overlay') ||
                          target.closest('.library-container') ||
                          target.closest('.tags-page-container');
    
    if (isInputFocused) {
      return; // Let the input handle the key
    }
    
    const key = e.key;
    
    // Escape to end session
    if (key === 'Escape') {
      e.preventDefault();
      onEndSession();
      return;
    }
    
    // Backspace to go back
    if (key === 'Backspace' && canGoBack) {
      e.preventDefault();
      onBack();
      return;
    }
    
    // Arrow right or ] to go forward (only if Command/Ctrl is NOT pressed)
    if ((key === 'ArrowRight' || key === ']') && canGoForward && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      onForward();
      return;
    }
    
    // Arrow left or [ to go back (only if Command/Ctrl is NOT pressed)
    if ((key === 'ArrowLeft' || key === '[') && canGoBack && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      onBack();
      return;
    }
    
    // w/s keys to scroll word card content (case-insensitive for Caps Lock support)
    if (key.toLowerCase() === 'w' || key.toLowerCase() === 's') {
      e.preventDefault();
      if (wordCardRef.current) {
        const scrollAmount = 100; // pixels to scroll
        if (key.toLowerCase() === 'w') {
          wordCardRef.current.scrollTop -= scrollAmount;
        } else {
          wordCardRef.current.scrollTop += scrollAmount;
        }
      }
      return;
    }

    // e key to edit (case-insensitive for Caps Lock support)
    if (key.toLowerCase() === 'e') {
      e.preventDefault();
      onEdit();
      return;
    }
    
    // Space or Tab to reveal definition
    if ((key === ' ' || key === 'Tab') && !showDefinition) {
      e.preventDefault();
      setShowDefinition(true);
      return;
    }
    
    // Direct rating with 1-5
    if (key >= '1' && key <= '5') {
      const rating = parseInt(key) as 1 | 2 | 3 | 4 | 5;
      onRate(rating);
      setShowDefinition(false);
      setSelectedRating(null);
    } 
    // Arrow keys or vim keys to select (case-insensitive for Caps Lock support)
    else if (key === 'ArrowUp' || key.toLowerCase() === 'k') {
      e.preventDefault();
      setSelectedRating(prev => Math.max(1, (prev || 3) - 1));
    } else if (key === 'ArrowDown' || key.toLowerCase() === 'j') {
      e.preventDefault();
      setSelectedRating(prev => Math.min(5, (prev || 3) + 1));
    } 
    // Enter to confirm selection
    else if (key === 'Enter' && selectedRating) {
      e.preventDefault();
      onRate(selectedRating as 1 | 2 | 3 | 4 | 5);
      setShowDefinition(false);
      setSelectedRating(null);
    }
  }, [onRate, onBack, onForward, onEndSession, onEdit, selectedRating, showDefinition, canGoBack, canGoForward]);

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Reset definition when word changes
  React.useEffect(() => {
    setShowDefinition(false);
    setSelectedRating(null);
  }, [entry.id]);

  return (
    <>
      <div className="progress-bar">
        <div className="progress-text">
          Word {currentIndex + 1} of {totalInSession} · {wordsReviewed} reviewed · Press ESC to end · Press E to edit
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${((currentIndex + 1) / totalInSession) * 100}%` }} />
        </div>
        <button 
          className="queue-preview-button" 
          onClick={onToggleQueuePreview}
          title="Preview upcoming words"
        >
          {showQueuePreview ? '✕' : `Next ${Math.min(10, reviewQueue.length - currentIndex - 1)}`}
        </button>
      </div>

      {showQueuePreview && (
        <div className="queue-preview-panel">
          <h3 className="queue-preview-title">Upcoming Words</h3>
          <div className="queue-preview-list">
            {reviewQueue.slice(currentIndex + 1, currentIndex + 11).map((word, idx) => (
              <div key={word.id} className="queue-preview-item">
                <span className="queue-preview-number">{idx + 1}</span>
                <span className="queue-preview-word">{word.word}</span>
                <span className="queue-preview-familiarity">{word.familiarityScore.toFixed(0)}</span>
              </div>
            ))}
            {reviewQueue.length - currentIndex - 1 === 0 && (
              <div className="queue-preview-empty">No more words in queue</div>
            )}
          </div>
        </div>
      )}

      <div className="word-card-container">
        <button 
          className="back-button" 
          onClick={onBack}
          disabled={!canGoBack}
          title="Go back (← or [)"
        >
          ←
        </button>

        <button 
          className="forward-button" 
          onClick={onForward}
          disabled={!canGoForward}
          title="Go forward (→ or ])"
        >
          →
        </button>

        <div className="word-card" ref={wordCardRef}>
          <h1 className="word-title">
            {entry.word}
            {entry.variants && entry.variants.length > 0 && (
              <span className="word-title-variants">
                {entry.variants.map((variant, idx) => (
                  <span key={idx}> | {variant}</span>
                ))}
              </span>
            )}
          </h1>

          {(entry.pronunciation || entry.respelling) && (
            <p className="word-pronunciation">
              {entry.pronunciation && `/${entry.pronunciation}/`}
              {entry.respelling && (
                <span className="word-respelling">
                  {entry.pronunciation ? ' · ' : ''}{entry.respelling}
                </span>
              )}
            </p>
          )}

          {!showDefinition ? (
            <div className="reveal-hint">
              Press <span className="reveal-hint-key">Space</span> or <span className="reveal-hint-key">Tab</span> to reveal
            </div>
          ) : (
            <>
              <div className="word-stats">
                <span className="stat-item">
                  Familiarity <span className="stat-value">{entry.familiarityScore.toFixed(0)}%</span>
                </span>
                <span className="stat-item">
                  Reviewed <span className="stat-value">{entry.timesReviewed}×</span>
                </span>
              </div>

              <div className="definitions-section">
                <h2 className="section-title">Definition</h2>
                {entry.definitions.map((def, idx) => (
                  <div key={idx} className="definition-block">
                    <div className="definition-item">
                      {def.partOfSpeech && (
                        <span className="part-of-speech">{def.partOfSpeech}</span>
                      )}
                      <p className="definition-text">{renderTextWithLinks(def.text)}</p>
                    </div>
                    
                    {/* Sub-definitions (like "in bulk", "bulk up") */}
                    {def.subDefinitions && def.subDefinitions.length > 0 && (
                      <div className="sub-definitions">
                        {def.subDefinitions.map((subDef, subIdx) => (
                          <div key={subIdx} className={`sub-definition-item ${subDef.phrase ? 'has-phrase' : 'no-phrase'}`}>
                            {subDef.phrase && (
                              <div className="sub-phrase-header">
                                <span className="sub-phrase">{subDef.phrase}</span>
                                {subDef.partOfSpeech && (
                                  <span className="sub-phrase-pos">{subDef.partOfSpeech}</span>
                                )}
                              </div>
                            )}
                            {subDef.text && <p className="sub-definition-text">{renderTextWithLinks(subDef.text)}</p>}
                            {subDef.examples && subDef.examples.length > 0 && (
                              <div className="sub-examples">
                                {subDef.examples.map((example, exIdx) => (
                                  <p key={exIdx} className="example-item">
                                    {renderTextWithLinks(example)}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Examples specific to this definition */}
                    {def.examples && def.examples.length > 0 && (
                      <div className="definition-examples">
                        {def.examples.map((example, exIdx) => (
                          <p key={exIdx} className="example-item">
                            {renderTextWithLinks(example)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Global examples that apply to all definitions */}
              {entry.examples && entry.examples.length > 0 && (
                <div className="examples-section">
                  <h2 className="section-title">Example</h2>
                  {entry.examples.map((example, idx) => (
                    <p key={idx} className="example-item">
                      {renderTextWithLinks(example)}
                    </p>
                  ))}
                </div>
              )}

              {entry.images && entry.images.length > 0 && (
                <div className="examples-section">
                  <h2 className="section-title">Images</h2>
                  <div className="images-grid">
                    {entry.images.map((image, idx) => (
                      <VocabImage 
                        key={idx} 
                        src={image} 
                        alt={`${entry.word} ${idx + 1}`} 
                        className="word-image"
                        projectPath={projectPath}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="rating-container">
          <div className="rating-actions">
            <button 
              className="rating-action-button"
              onClick={onEdit}
              title="Edit word (E)"
            >
              Edit
            </button>
            <button 
              className="rating-action-button"
              onClick={onEndSession}
              title="End session (ESC)"
            >
              End Session
            </button>
          </div>
          
          <h3 className="rating-title">Rate Familiarity</h3>
          <div className="rating-buttons">
            {ratingConfig.map((config) => (
              <button
                key={config.value}
                onClick={() => {
                  onRate(config.value as 1 | 2 | 3 | 4 | 5);
                  setShowDefinition(false);
                  setSelectedRating(null);
                }}
                onMouseEnter={() => setSelectedRating(config.value)}
                onMouseLeave={() => setSelectedRating(null)}
                className={`rating-button ${selectedRating === config.value ? 'selected' : ''}`}
              >
                <div className="rating-button-content">
                  <span className="rating-number">{config.value}</span>
                  <span className="rating-label">{config.label}</span>
                </div>
              </button>
            ))}
          </div>
          <p className="rating-hint">
            <span className="rating-hint-key">1-5</span> direct<br/>
            <span className="rating-hint-key">↑ ↓</span> or <span className="rating-hint-key">j k</span> select<br/>
            <span className="rating-hint-key">Enter</span> confirm<br/>
            <span className="rating-hint-key">← →</span> or <span className="rating-hint-key">[ ]</span> navigate<br/>
            <span className="rating-hint-key">E</span> edit<br/>
            <span className="rating-hint-key">w s</span> scroll<br/>
            <span className="rating-hint-key">ESC</span> end session
          </p>
        </div>
      </div>
    </>
  );
};

export default WordCard;
