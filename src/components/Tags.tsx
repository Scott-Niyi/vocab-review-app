import React, { useState, useMemo } from 'react';
import { VocabularyEntry } from '../types/vocabulary';
import { TagManager } from '../services/TagManager';
import VocabImage from './VocabImage';

interface TagsProps {
  vocabulary: VocabularyEntry[];
  onWordClick: (word: VocabularyEntry) => void;
  onEditWord?: (word: VocabularyEntry) => void;
  onRateWord?: (wordId: number, rating: 1 | 2 | 3 | 4 | 5) => void;
  onDeleteWord?: (wordId: number) => void;
  projectPath: string;
}

const Tags: React.FC<TagsProps> = ({ 
  vocabulary, 
  // onWordClick, 
  onEditWord,
  onRateWord,
  onDeleteWord,
  projectPath 
}) => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<VocabularyEntry | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Tag management
  const tagManager = useMemo(() => new TagManager(vocabulary), [vocabulary]);
  const allTags = useMemo(() => tagManager.getAllTags(), [tagManager]);
  const tagCounts = useMemo(() => tagManager.getTagCounts(), [tagManager]);

  // Get words for selected tag
  const filteredWords = useMemo(() => {
    if (!selectedTag) return [];
    const words = tagManager.filterByTag(selectedTag);
    // Remove duplicates by id
    const uniqueWords = words.filter((word, index, self) => 
      index === self.findIndex(w => w.id === word.id)
    );
    return uniqueWords;
  }, [selectedTag, tagManager]);

  const ratingConfig = [
    { value: 1, label: "Don't know" },
    { value: 2, label: 'Barely' },
    { value: 3, label: 'Familiar' },
    { value: 4, label: 'Know well' },
    { value: 5, label: 'Master' },
  ];

  const handleDelete = () => {
    if (selectedWord && onDeleteWord) {
      onDeleteWord(selectedWord.id);
      setShowDeleteConfirm(false);
      setSelectedWord(null);
    }
  };

  // Parse markdown-style bold and hyperlinks
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
        }
      }
      
      // Regular character
      let plainText = '';
      while (i < text.length && 
             text.substring(i, i + 2) !== '**' && 
             text.substring(i, i + 2) !== '[[') {
        plainText += text[i];
        i++;
      }
      
      if (plainText) {
        result.push(plainText);
      }
    }
    
    return result;
  };

  const handleWordClick = (word: VocabularyEntry) => {
    setSelectedWord(word);
  };

  const handleCloseDetail = () => {
    setSelectedWord(null);
  };

  // Handle Esc key to close modal
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedWord) {
        handleCloseDetail();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedWord]);

  return (
    <div className="tags-page-container">
      {/* Left Sidebar - Tags List */}
      <div className="tags-sidebar">
        <div className="tags-sidebar-header">
          <h2 className="tags-sidebar-title">Tags</h2>
          <div className="tags-sidebar-count">{allTags.length} tags</div>
        </div>

        <div className="tags-list">
          {allTags.length === 0 ? (
            <div className="tags-empty">
              <p>No tags yet</p>
              <p className="tags-empty-hint">Add tags to words to organize your vocabulary</p>
            </div>
          ) : (
            allTags.map(tag => (
              <div
                key={tag}
                className={`tag-list-item ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => {
                  setSelectedTag(tag);
                  setSelectedWord(null);
                }}
              >
                <span className="tag-list-name">{tag}</span>
                <span className="tag-list-count">{tagCounts.get(tag) || 0}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Middle - Words List */}
      <div className="tags-middle">
        {!selectedTag ? (
          <div className="tags-content-empty">
            <div className="tags-content-empty-icon">Tag</div>
            <h3 className="tags-content-empty-title">Select a tag</h3>
            <p className="tags-content-empty-text">
              Choose a tag from the left to view all words with that tag
            </p>
          </div>
        ) : (
          <>
            <div className="tags-middle-header">
              <h2 className="tags-middle-title">{selectedTag}</h2>
              <div className="tags-middle-count">
                {filteredWords.length} {filteredWords.length === 1 ? 'word' : 'words'}
              </div>
            </div>

            <div className="tags-middle-list">
              {filteredWords.map(word => (
                <div
                  key={word.id}
                  className="tags-middle-item"
                  onClick={() => handleWordClick(word)}
                >
                  <div className="tags-middle-item-word">{word.word}</div>
                  {word.pronunciation && (
                    <div className="tags-middle-item-pronunciation">/{word.pronunciation}/</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Word Detail Modal */}
      {selectedWord && (
        <div className="modal-overlay" onClick={handleCloseDetail}>
          <div className="modal-content tags-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-button-top-left" onClick={handleCloseDetail} title="Close (Esc)">
              ×
            </button>
            
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
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {onEditWord && (
                  <button
                    className="edit-button"
                    onClick={() => {
                      onEditWord(selectedWord);
                      handleCloseDetail();
                    }}
                  >
                    Edit
                  </button>
                )}
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
          </div>
        </div>
      )}

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

export default Tags;
