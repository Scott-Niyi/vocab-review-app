import React, { useState, useEffect, useMemo } from 'react';
import { VocabularyEntry } from '../types/vocabulary';
import VocabImage from './VocabImage';
import { TagFilter } from './TagFilter';
import { TagManager } from '../services/TagManager';
import { getLogger } from '../services';

interface LibraryProps {
  vocabulary: VocabularyEntry[];
  onEditWord: (entry: VocabularyEntry) => void;
  onRateWord?: (wordId: number, rating: 1 | 2 | 3 | 4 | 5) => void;
  onDeleteWord?: (wordId: number) => void;
  projectPath: string;
  isActive?: boolean;
}

const Library: React.FC<LibraryProps> = ({ vocabulary, onEditWord, onRateWord, onDeleteWord, projectPath, isActive = true }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState<VocabularyEntry | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const logger = getLogger();

  // Ref for library list to enable scrolling
  const libraryListRef = React.useRef<HTMLDivElement>(null);
  const libraryDetailRef = React.useRef<HTMLDivElement>(null);

  // Tag management
  const tagManager = useMemo(() => new TagManager(vocabulary), [vocabulary]);
  const allTags = useMemo(() => tagManager.getAllTags(), [tagManager]);
  const tagCounts = useMemo(() => tagManager.getTagCounts(), [tagManager]);

  const ratingConfig = [
    { value: 1, label: "Don't know" },
    { value: 2, label: 'Barely' },
    { value: 3, label: 'Familiar' },
    { value: 4, label: 'Know well' },
    { value: 5, label: 'Master' },
  ];

  // Calculate filtered words with tag and search filtering
  const filteredWords = useMemo(() => {
    let filtered = [...vocabulary];
    
    // Apply tag filter first
    if (activeTag) {
      filtered = tagManager.filterByTag(activeTag);
    }
    
    // Then apply search filter with relevance scoring
    const query = searchQuery.trim().toLowerCase();
    if (query !== '') {
      // Score each word by relevance
      const scoredWords = filtered.map(word => {
        let score = 0;
        
        // Exact word match (highest priority)
        if (word.word.toLowerCase() === query) {
          score += 1000;
        }
        // Word starts with query (high priority)
        else if (word.word.toLowerCase().startsWith(query)) {
          score += 500;
        }
        // Word contains query (medium priority)
        else if (word.word.toLowerCase().includes(query)) {
          score += 100;
        }
        
        // Variant exact match (same as word match)
        if (word.variants && word.variants.some(v => v.toLowerCase() === query)) {
          score += 1000;
        }
        // Variant starts with query
        else if (word.variants && word.variants.some(v => v.toLowerCase().startsWith(query))) {
          score += 500;
        }
        // Variant contains query
        else if (word.variants && word.variants.some(v => v.toLowerCase().includes(query))) {
          score += 100;
        }
        
        // Definition text match (lower priority)
        if (word.definitions && word.definitions.some(def => 
          def.text && def.text.toLowerCase().includes(query)
        )) {
          score += 50;
        }
        
        // Definition examples match (same priority as definition text)
        if (word.definitions && word.definitions.some(def =>
          def.examples && def.examples.some(ex => ex.toLowerCase().includes(query))
        )) {
          score += 50;
        }
        
        // Sub-definition examples match
        if (word.definitions && word.definitions.some(def =>
          def.subDefinitions && def.subDefinitions.some(subDef =>
            (subDef.text && subDef.text.toLowerCase().includes(query)) ||
            (subDef.examples && subDef.examples.some(ex => ex.toLowerCase().includes(query)))
          )
        )) {
          score += 50;
        }
        
        // Global example match (lowest priority)
        if (word.examples && word.examples.some(ex =>
          ex.toLowerCase().includes(query)
        )) {
          score += 10;
        }
        
        return { word, score };
      });
      
      // Filter out words with score 0 (no match) and sort by score descending
      filtered = scoredWords
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.word);
    }
    
    return filtered;
  }, [vocabulary, activeTag, searchQuery, tagManager]);

  // Log search queries (with debounce)
  useEffect(() => {
    if (searchQuery.trim() !== '') {
      const timer = setTimeout(() => {
        logger.trackEvent('search_performed', {
          query: searchQuery.trim(),
          resultCount: filteredWords.length
        });
      }, 500); // 500ms debounce
      
      return () => clearTimeout(timer);
    }
  }, [searchQuery, filteredWords.length, logger]);

  // Focus search on "/" key and handle Cmd+Down to jump to bottom
  useEffect(() => {
    // Only listen to keyboard events when Library is active
    if (!isActive) return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      const target = e.target as HTMLElement;
      const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      if (e.key === '/' && searchInputRef.current && !isInInput) {
        e.preventDefault();
        searchInputRef.current.focus();
      }
      
      // ESC key: Blur search input to enable W/S navigation
      if (e.key === 'Escape' && isInInput && searchInputRef.current === document.activeElement) {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.blur();
        }
      }
      
      // E key: Edit selected word
      if ((e.key === 'e' || e.key === 'E') && !isInInput && selectedWord) {
        e.preventDefault();
        onEditWord(selectedWord);
      }
      
      // W/S keys: Navigate list items (Vim-style)
      if (!isInInput && filteredWords.length > 0) {
        if (e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          const currentIndex = selectedWord ? filteredWords.findIndex(w => w.id === selectedWord.id) : -1;
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredWords.length - 1;
          setSelectedWord(filteredWords[prevIndex]);
          
          // Scroll item into view
          if (libraryListRef.current) {
            const items = libraryListRef.current.querySelectorAll('.library-item');
            items[prevIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          const currentIndex = selectedWord ? filteredWords.findIndex(w => w.id === selectedWord.id) : -1;
          const nextIndex = currentIndex < filteredWords.length - 1 ? currentIndex + 1 : 0;
          setSelectedWord(filteredWords[nextIndex]);
          
          // Scroll item into view
          if (libraryListRef.current) {
            const items = libraryListRef.current.querySelectorAll('.library-item');
            items[nextIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        }
      }
      
      // Arrow Up/Down: Scroll detail panel
      if (!isInInput && libraryDetailRef.current) {
        if (e.key === 'ArrowUp' && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          libraryDetailRef.current.scrollBy({ top: -100, behavior: 'smooth' });
        } else if (e.key === 'ArrowDown' && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          libraryDetailRef.current.scrollBy({ top: 100, behavior: 'smooth' });
        }
      }
      
      // Cmd/Ctrl + Down Arrow: Jump to bottom of list
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowDown' && libraryListRef.current) {
        e.preventDefault();
        libraryListRef.current.scrollTop = libraryListRef.current.scrollHeight;
        
        // Select last word
        if (filteredWords.length > 0) {
          setSelectedWord(filteredWords[filteredWords.length - 1]);
        }
      }
      
      // Cmd/Ctrl + Up Arrow: Jump to top of list
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowUp' && libraryListRef.current) {
        e.preventDefault();
        libraryListRef.current.scrollTop = 0;
        
        // Select first word
        if (filteredWords.length > 0) {
          setSelectedWord(filteredWords[0]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [filteredWords, selectedWord, onEditWord, isActive]);

  // Parse markdown-style bold (**text**), italic (*text* or _text_) and hyperlinks [[target|text]] in examples/definitions
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
        } else {
          // Malformed: no closing **, treat as plain text
          result.push(text[i]);
          i++;
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
        } else {
          // Malformed: no closing *, treat as plain text
          result.push(text[i]);
          i++;
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
        } else {
          // Malformed: no closing _, treat as plain text
          result.push(text[i]);
          i++;
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
                onClick={() => setSelectedWord(targetEntry)}
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
        } else {
          // Malformed link: no closing ]], treat as plain text
          result.push(text[i]);
          i++;
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
        } else {
          // Malformed: no closing ~, treat as plain text
          result.push(text[i]);
          i++;
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
        } else {
          // Malformed: no closing », treat as plain text
          result.push(text[i]);
          i++;
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
        } else {
          // Malformed: no closing }, treat as plain text
          result.push(text[i]);
          i++;
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

  const handleDelete = () => {
    if (selectedWord && onDeleteWord) {
      onDeleteWord(selectedWord.id);
      setShowDeleteConfirm(false);
      setSelectedWord(null);
    }
  };

  // Update selectedWord when vocabulary changes (to reflect updated stats)
  useEffect(() => {
    console.log('=== VOCABULARY CHANGED ===');
    console.log('Current selectedWord:', selectedWord?.word, selectedWord?.id);
    
    if (selectedWord) {
      const updatedWord = vocabulary.find(w => w.id === selectedWord.id);
      console.log('Found updated word:', updatedWord?.word, updatedWord?.id);
      
      if (updatedWord) {
        // 只有当数据真的变化时才更新（避免不必要的重新渲染）
        if (JSON.stringify(updatedWord) !== JSON.stringify(selectedWord)) {
          console.log('Updating selectedWord to:', updatedWord.word);
          setSelectedWord(updatedWord);
        }
      } else {
        // 如果单词被删除了，清空选择
        console.log('Word not found, clearing selection');
        setSelectedWord(null);
      }
    }
  }, [vocabulary, selectedWord]);

  return (
    <div className="library-container">
      <div className="library-sidebar">
        <div className="library-search">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search words... (press /)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <div className="search-stats">
            {filteredWords.length} of {vocabulary.length} words
            {activeTag && <span> · filtered by "{activeTag}"</span>}
            {searchQuery && <span> · searching: "{searchQuery}"</span>}
          </div>
        </div>

        <TagFilter
          tags={allTags}
          tagCounts={tagCounts}
          activeTag={activeTag}
          onTagSelect={setActiveTag}
        />
        
        <div style={{ 
          padding: '0.5rem 1rem', 
          fontSize: '0.75rem', 
          color: '#666',
          borderBottom: '1px solid #eee',
          background: '#fafafa'
        }}>
          Tip: Press <kbd style={{ 
            padding: '0.1rem 0.3rem', 
            background: '#fff', 
            border: '1px solid #ccc', 
            borderRadius: '3px',
            fontFamily: 'monospace',
            fontSize: '0.7rem'
          }}>ESC</kbd> to exit search and use <kbd style={{ 
            padding: '0.1rem 0.3rem', 
            background: '#fff', 
            border: '1px solid #ccc', 
            borderRadius: '3px',
            fontFamily: 'monospace',
            fontSize: '0.7rem'
          }}>W</kbd>/<kbd style={{ 
            padding: '0.1rem 0.3rem', 
            background: '#fff', 
            border: '1px solid #ccc', 
            borderRadius: '3px',
            fontFamily: 'monospace',
            fontSize: '0.7rem'
          }}>S</kbd> for navigation
        </div>

        <div className="library-list" ref={libraryListRef}>
          {filteredWords.length === 0 && searchQuery.trim() !== '' ? (
            <div style={{ padding: '1rem', color: '#999', textAlign: 'center' }}>
              No words found matching "{searchQuery}"
            </div>
          ) : (
            filteredWords.map((word) => (
              <div
                key={word.id}
                className={`library-item ${selectedWord?.id === word.id ? 'selected' : ''}`}
                onClick={() => {
                  console.log('=== CLICKED WORD ===');
                  console.log('Word:', word.word);
                  console.log('ID:', word.id);
                  console.log('Current selectedWord:', selectedWord?.word, selectedWord?.id);
                  setSelectedWord(word);
                }}
              >
                <div className="library-item-word">{word.word}</div>
                {word.pronunciation && (
                  <div className="library-item-pronunciation">/{word.pronunciation}/</div>
                )}
                {word.tags && word.tags.length > 0 && (
                  <div className="library-item-tags">
                    {word.tags.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="library-item-tag">{tag}</span>
                    ))}
                    {word.tags.length > 2 && (
                      <span className="library-item-tag library-item-tag-more">
                        +{word.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="library-detail" ref={libraryDetailRef}>
        {selectedWord ? (
          <>
            <div className="library-detail-header">
              <div>
                <h1 className="library-detail-word">
                  {selectedWord.word}
                  {selectedWord.variants && selectedWord.variants.length > 0 && (
                    <span className="word-title-variants">
                      {selectedWord.variants.map((variant, idx) => (
                        <span key={idx}> | {variant}</span>
                      ))}
                    </span>
                  )}
                </h1>
                {(selectedWord.pronunciation || selectedWord.respelling) && (
                  <p className="library-detail-pronunciation">
                    {selectedWord.pronunciation && `/${selectedWord.pronunciation}/`}
                    {selectedWord.respelling && (
                      <span className="word-respelling">
                        {selectedWord.pronunciation ? ' · ' : ''}{selectedWord.respelling}
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="edit-button"
                  onClick={() => onEditWord(selectedWord)}
                >
                  Edit
                </button>
                {onDeleteWord && (
                  <button
                    className="delete-button"
                    onClick={() => setShowDeleteConfirm(true)}
                    title="Delete word"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            <div className="library-detail-stats">
              <span className="stat-item">
                Familiarity <span className="stat-value">{selectedWord.familiarityScore.toFixed(0)}%</span>
              </span>
              <span className="stat-item">
                Reviewed <span className="stat-value">{selectedWord.timesReviewed}×</span>
              </span>
            </div>

            {onRateWord && (
              <div className="library-rating-section">
                <h3 className="library-rating-title">Rate Familiarity</h3>
                <div className="library-rating-buttons">
                  {ratingConfig.map((config) => (
                    <button
                      key={config.value}
                      onClick={() => {
                        onRateWord(selectedWord.id, config.value as 1 | 2 | 3 | 4 | 5);
                        setSelectedRating(null);
                      }}
                      onMouseEnter={() => setSelectedRating(config.value)}
                      onMouseLeave={() => setSelectedRating(null)}
                      className={`library-rating-button ${selectedRating === config.value ? 'selected' : ''}`}
                      title={`${config.value} - ${config.label}`}
                    >
                      <span className="library-rating-number">{config.value}</span>
                      <span className="library-rating-label">{config.label}</span>
                    </button>
                  ))}
                </div>
                <p className="library-rating-hint">Click to rate and update review stats</p>
              </div>
            )}

            <div className="library-detail-content">
              <div className="definitions-section">
                <h2 className="section-title">Definition</h2>
                {selectedWord.definitions.map((def, idx) => (
                  <div key={idx} className="definition-block">
                    <div className="definition-item">
                      {def.partOfSpeech && (
                        <span className="part-of-speech">{def.partOfSpeech}</span>
                      )}
                      <p className="definition-text">{renderTextWithLinks(def.text)}</p>
                    </div>
                    
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

              {selectedWord.examples && selectedWord.examples.length > 0 && (
                <div className="examples-section">
                  <h2 className="section-title">Example</h2>
                  {selectedWord.examples.map((example, idx) => (
                    <p key={idx} className="example-item">
                      {renderTextWithLinks(example)}
                    </p>
                  ))}
                </div>
              )}

              {selectedWord.images && selectedWord.images.length > 0 && (
                <div className="examples-section">
                  <h2 className="section-title">Images</h2>
                  <div className="images-grid">
                    {selectedWord.images.map((image, idx) => (
                      <VocabImage 
                        key={idx} 
                        src={image} 
                        alt={`${selectedWord.word} ${idx + 1}`} 
                        className="word-image"
                        projectPath={projectPath}
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedWord.tags && selectedWord.tags.length > 0 && (
                <div className="word-tags-section">
                  <h2 className="section-title">Tags</h2>
                  <div className="word-tags">
                    {selectedWord.tags.map((tag, idx) => (
                      <span key={idx} className="word-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="library-detail-empty">
            <p>Select a word to view details</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && selectedWord && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete Word?</h2>
            <p className="delete-confirm-message">
              Are you sure you want to delete "<strong>{selectedWord.word}</strong>"? This action cannot be undone.
            </p>
            <div className="delete-confirm-buttons">
              <button
                className="cancel-button"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-delete-button"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;
