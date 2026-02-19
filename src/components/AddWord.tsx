import React, { useState, useEffect, useMemo } from 'react';
import { VocabularyEntry } from '../types/vocabulary';
import RichTextInput from './RichTextInput';
import IPAInput from './IPAInput';
import { useLLM } from '../hooks/useLLM';
import { TagSelector } from './TagSelector';
import { TagManager } from '../services/TagManager';
import { useBracketWrap } from '../hooks/useBracketWrap';

interface AddWordProps {
  vocabulary: VocabularyEntry[];
  onWordAdded: (word: Omit<VocabularyEntry, 'id'>) => void;
  onNavigateToExisting: (word: VocabularyEntry) => void;
  projectPath: string;
}

const AddWord: React.FC<AddWordProps> = ({ vocabulary, onWordAdded, onNavigateToExisting, projectPath }) => {
  const [wordInput, setWordInput] = useState('');
  const [existingWord, setExistingWord] = useState<VocabularyEntry | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [pronunciation, setPronunciation] = useState('');
  const [respelling, setRespelling] = useState('');
  const [definitions, setDefinitions] = useState([{ 
    partOfSpeech: '', 
    text: '', 
    examples: [] as string[],
    subDefinitions: [] as Array<{ phrase: string; text: string; examples: string[] }>
  }]);
  const [globalExamples, setGlobalExamples] = useState(['']);
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // LLM integration
  const llm = useLLM();

  // Tag management
  const tagManager = useMemo(() => new TagManager(vocabulary), [vocabulary]);
  const availableTags = useMemo(() => tagManager.getAllTags(), [tagManager]);

  // Refs for bracket wrapping
  const wordInputRef = React.useRef<HTMLInputElement>(null);
  const respellingInputRef = React.useRef<HTMLInputElement>(null);

  // Enable bracket wrapping for text inputs
  useBracketWrap(wordInputRef, wordInput, setWordInput);
  useBracketWrap(respellingInputRef, respelling, setRespelling);

  // Auto-focus word input when Enter is pressed (and not already in an input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInInput = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.isContentEditable;
      
      // If Enter is pressed and not in an input, focus the word input
      if (e.key === 'Enter' && !isInInput && wordInputRef.current) {
        e.preventDefault();
        wordInputRef.current.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleGenerateIPA = async () => {
    if (!wordInput.trim()) return;
    const result = await llm.generateIPA(wordInput.trim());
    if (result) {
      setPronunciation(result);
    }
  };

  const handleGenerateRespelling = async () => {
    if (!wordInput.trim()) return;
    const result = await llm.generateRespelling(wordInput.trim(), pronunciation);
    if (result) {
      setRespelling(result);
    }
  };

  const handleGenerateDefinitions = async () => {
    if (!wordInput.trim()) return;
    const result = await llm.suggestDefinitions(wordInput.trim());
    if (result && result.length > 0) {
      // Replace current definitions with AI-generated ones
      setDefinitions(result.map(def => ({
        partOfSpeech: def.partOfSpeech || '',
        text: def.text,
        examples: [],
        subDefinitions: []
      })));
    }
  };

  const handleGenerateGlobalExamples = async () => {
    if (!wordInput.trim() || definitions.length === 0 || !definitions[0].text.trim()) return;
    const result = await llm.generateExamples(
      wordInput.trim(),
      definitions[0].text,
      2
    );
    if (result && result.length > 0) {
      setGlobalExamples([...globalExamples.filter(e => e.trim()), ...result]);
    }
  };

  const handleGenerateDefinitionFromExamples = async (defIndex: number) => {
    if (!wordInput.trim()) return;
    
    const def = definitions[defIndex];
    const examplesForDef = def.examples?.filter(e => e.trim()) || [];
    
    if (examplesForDef.length === 0) {
      return;
    }

    const result = await llm.generateDefinitionFromExamples(wordInput.trim(), examplesForDef);
    if (result) {
      const newDefs = [...definitions];
      newDefs[defIndex].partOfSpeech = result.partOfSpeech || '';
      newDefs[defIndex].text = result.text;
      setDefinitions(newDefs);
    }
  };

  // Auto-check for existing word (debounced)
  useEffect(() => {
    if (!wordInput.trim()) {
      setExistingWord(null);
      setShowForm(false);
      return;
    }

    const timer = setTimeout(() => {
      const found = vocabulary.find(
        w => w.word.toLowerCase() === wordInput.toLowerCase().trim()
      );
      setExistingWord(found || null);
      setShowForm(!found);
    }, 500);

    return () => clearTimeout(timer);
  }, [wordInput]);

  const handleAddDefinition = () => {
    setDefinitions([...definitions, { partOfSpeech: '', text: '', examples: [], subDefinitions: [] }]);
  };

  const handleAddExampleToDefinition = (defIndex: number) => {
    const newDefs = [...definitions];
    if (!newDefs[defIndex].examples) {
      newDefs[defIndex].examples = [];
    }
    newDefs[defIndex].examples!.push('');
    setDefinitions(newDefs);
  };

  const handleAddSubDefinition = (defIndex: number) => {
    const newDefs = [...definitions];
    if (!newDefs[defIndex].subDefinitions) {
      newDefs[defIndex].subDefinitions = [];
    }
    newDefs[defIndex].subDefinitions!.push({ phrase: '', text: '', examples: [] });
    setDefinitions(newDefs);
  };

  const handleAddExampleToSubDefinition = (defIndex: number, subDefIndex: number) => {
    const newDefs = [...definitions];
    if (!newDefs[defIndex].subDefinitions![subDefIndex].examples) {
      newDefs[defIndex].subDefinitions![subDefIndex].examples = [];
    }
    newDefs[defIndex].subDefinitions![subDefIndex].examples!.push('');
    setDefinitions(newDefs);
  };

  const handleAddGlobalExample = () => {
    setGlobalExamples([...globalExamples, '']);
  };

  const handleAddImage = () => {
    setImages([...images, '']);
  };

  const handleAddVariant = () => {
    setVariants([...variants, '']);
  };

  const handleImageUpload = async (index: number, file: File) => {
    // Check if we're in Electron environment
    const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI?.fs;
    
    if (isElectron && projectPath) {
      // Save image to project's images/ folder
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        
        try {
          const electronAPI = (window as any).electronAPI;
          const result = await electronAPI.fs.saveImage(projectPath, dataUrl, file.name);
          
          if (result.success && result.relativePath) {
            // Store relative path (e.g., "images/photo.jpg")
            const newImages = [...images];
            newImages[index] = result.relativePath;
            setImages(newImages);
          } else {
            console.error('Failed to save image:', result.error);
            alert('Failed to save image: ' + (result.error || 'Unknown error'));
          }
        } catch (error) {
          console.error('Error saving image:', error);
          alert('Error saving image');
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Fallback: store as base64 in JSON (old behavior for browser mode)
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImages = [...images];
        newImages[index] = e.target?.result as string;
        setImages(newImages);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    // DataStore will assign the ID
    const newWord: Omit<VocabularyEntry, 'id'> = {
      word: wordInput.trim(),
      pronunciation,
      respelling,
      definitions: definitions.filter(d => d.text.trim()).map(d => ({
        partOfSpeech: d.partOfSpeech,
        text: d.text,
        examples: d.examples?.filter(e => e.trim()) || [],
        subDefinitions: d.subDefinitions?.filter(sd => sd.phrase.trim()).map(sd => ({
          phrase: sd.phrase,
          text: sd.text,
          examples: sd.examples?.filter(e => e.trim()) || []
        })) || []
      })),
      examples: globalExamples.filter(e => e.trim()),
      images: images.filter(img => img.trim()),
      variants: variants.filter(v => v.trim()),
      tags: tags.filter(t => t.trim()),
      hyperlinks: [],
      familiarityScore: 0,
      timesReviewed: 0,
      timesCorrect: 0,
    };
    
    onWordAdded(newWord);
    
    // Reset form
    setWordInput('');
    setPronunciation('');
    setRespelling('');
    setDefinitions([{ partOfSpeech: '', text: '', examples: [], subDefinitions: [] }]);
    setGlobalExamples(['']);
    setImages([]);
    setVariants([]);
    setTags([]);
    setShowForm(false);
  };

  return (
    <div className="add-word-container">
      <div className="add-word-card">
        <h1 className="add-word-title">Add New Word</h1>

        <div className="form-group">
          <label className="form-label">Word</label>
          <input
            ref={wordInputRef}
            type="text"
            className="form-input"
            placeholder="Enter word..."
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            autoFocus
          />
        </div>

        {existingWord && (
          <div className="existing-word-alert">
            <div className="alert-header">
              <span className="alert-icon">!</span>
              <span className="alert-title">Word already exists</span>
            </div>
            <div className="alert-content">
              <p className="alert-word">{existingWord.word}</p>
              <p className="alert-pronunciation">/{existingWord.pronunciation}/</p>
              <div className="alert-definitions">
                {existingWord.definitions.map((def, idx) => (
                  <p key={idx}>
                    {def.partOfSpeech && <span className="part-of-speech">{def.partOfSpeech}</span>}
                    {def.text}
                  </p>
                ))}
              </div>
            </div>
            <div className="alert-actions">
              <button
                className="alert-button primary"
                onClick={() => onNavigateToExisting(existingWord)}
              >
                View in Library
              </button>
              <button
                className="alert-button secondary"
                onClick={() => setShowForm(true)}
              >
                Add Another Definition
              </button>
            </div>
          </div>
        )}

        {showForm && !existingWord && (
          <>
            <div className="form-group">
              <div className="form-label-with-action">
                <label className="form-label">Pronunciation (IPA)</label>
                <button 
                  className="form-hint-button inline-ai-button" 
                  onClick={handleGenerateIPA}
                  disabled={!wordInput.trim() || llm.status === 'loading'}
                  title="Generate IPA with AI"
                >
                  {llm.status === 'loading' ? 'Generating...' : 'Generate with AI'}
                </button>
              </div>
              <IPAInput
                value={pronunciation}
                onChange={setPronunciation}
                placeholder="e.g., ˈbʌlk or ˌɪntrəˈbɛltweɪ"
                showHelper={true}
              />
              <div className="form-hint">
                <span className="form-hint-label">⌨ Type shortcuts and press Tab to insert IPA symbols</span>
              </div>
              {llm.status === 'not-configured' && (
                <div className="form-hint">
                  <span className="llm-error">Warning: Configure API key in Settings</span>
                </div>
              )}
              {llm.status === 'error' && llm.error && (
                <div className="form-hint">
                  <span className="llm-error">Error: {llm.error}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <div className="form-label-with-action">
                <label className="form-label">Natural Pronunciation (Respelling)</label>
                <button 
                  className="form-hint-button inline-ai-button"
                  onClick={handleGenerateRespelling}
                  disabled={!wordInput.trim() || llm.status === 'loading'}
                  title="Generate respelling with AI"
                >
                  {llm.status === 'loading' ? 'Generating...' : 'Generate with AI'}
                </button>
              </div>
              <input
                ref={respellingInputRef}
                type="text"
                className="form-input respelling-input"
                placeholder="e.g., BULK or in-truh-BELT-way"
                value={respelling}
                onChange={(e) => setRespelling(e.target.value)}
              />
              <div className="form-hint">
                <span className="form-hint-label">⌨ Use CAPS for stressed syllables (e.g., pruh-nun-see-AY-shuhn)</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Alternative Spellings / Variants (Optional)</label>
              {variants.map((variant, idx) => (
                <div key={idx} className="variant-input-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., inside-the-beltway"
                    value={variant}
                    onChange={(e) => {
                      const newVariants = [...variants];
                      newVariants[idx] = e.target.value;
                      setVariants(newVariants);
                    }}
                  />
                  <button
                    className="remove-button"
                    onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button className="add-more-button" onClick={handleAddVariant}>
                + Add variant
              </button>
            </div>

            <div className="form-group">
              <div className="form-label-with-action">
                <label className="form-label">Definitions</label>
                <button 
                  className="form-hint-button inline-ai-button"
                  onClick={handleGenerateDefinitions}
                  disabled={!wordInput.trim() || llm.status === 'loading'}
                  title="Generate definitions with AI"
                >
                  {llm.status === 'loading' ? 'Generating...' : 'Generate with AI'}
                </button>
              </div>
              <div className="form-hint">
                <span className="form-hint-label">⌨ Cmd/Ctrl+B for bold · Cmd/Ctrl+K for link · ◐ to preview</span>
              </div>
              {definitions.map((def, idx) => (
                <div key={idx} className="definition-group">
                  <div className="definition-input-group">
                    <input
                      type="text"
                      className="form-input small"
                      placeholder="Part of speech (optional)"
                      value={def.partOfSpeech}
                      onChange={(e) => {
                        const newDefs = [...definitions];
                        newDefs[idx].partOfSpeech = e.target.value;
                        setDefinitions(newDefs);
                      }}
                    />
                    <RichTextInput
                      value={def.text}
                      onChange={(newText) => {
                        const newDefs = [...definitions];
                        newDefs[idx].text = newText;
                        setDefinitions(newDefs);
                      }}
                      vocabulary={vocabulary}
                      placeholder="Definition text (use toolbar for formatting)"
                    />
                    <button
                      className="remove-button"
                      onClick={() => setDefinitions(definitions.filter((_, i) => i !== idx))}
                    >
                      ×
                    </button>
                  </div>
                  
                  {/* Sub-definitions (phrases like "in bulk", "bulk up") */}
                  {def.subDefinitions && def.subDefinitions.length > 0 && (
                    <div className="definition-examples-section">
                      <label className="form-sublabel">Derived Phrases / Sub-definitions:</label>
                      {def.subDefinitions.map((subDef, subIdx) => (
                        <div key={subIdx} className="sub-definition-edit">
                          <div className="sub-definition-header">
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Phrase (e.g., 'in bulk', 'bulk up')"
                              value={subDef.phrase}
                              onChange={(e) => {
                                const newDefs = [...definitions];
                                newDefs[idx].subDefinitions![subIdx].phrase = e.target.value;
                                setDefinitions(newDefs);
                              }}
                            />
                            <button
                              className="remove-button"
                              onClick={() => {
                                const newDefs = [...definitions];
                                newDefs[idx].subDefinitions = newDefs[idx].subDefinitions!.filter((_, i) => i !== subIdx);
                                setDefinitions(newDefs);
                              }}
                            >
                              ×
                            </button>
                          </div>
                          <RichTextInput
                            value={subDef.text}
                            onChange={(newText) => {
                              const newDefs = [...definitions];
                              newDefs[idx].subDefinitions![subIdx].text = newText;
                              setDefinitions(newDefs);
                            }}
                            vocabulary={vocabulary}
                            placeholder="Definition of this phrase"
                          />
                          
                          {/* Examples for this sub-definition */}
                          {subDef.examples && subDef.examples.length > 0 && (
                            <div className="sub-examples-section">
                              {subDef.examples.map((example, exIdx) => (
                                <div key={exIdx} className="example-input-group">
                                  <RichTextInput
                                    value={example}
                                    onChange={(newText) => {
                                      const newDefs = [...definitions];
                                      newDefs[idx].subDefinitions![subIdx].examples![exIdx] = newText;
                                      setDefinitions(newDefs);
                                    }}
                                    vocabulary={vocabulary}
                                    placeholder="Example for this phrase"
                                  />
                                  <button
                                    className="remove-button"
                                    onClick={() => {
                                      const newDefs = [...definitions];
                                      newDefs[idx].subDefinitions![subIdx].examples = 
                                        newDefs[idx].subDefinitions![subIdx].examples!.filter((_, i) => i !== exIdx);
                                      setDefinitions(newDefs);
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <button 
                            className="add-sub-button" 
                            onClick={() => handleAddExampleToSubDefinition(idx, subIdx)}
                          >
                            + Add example for this phrase
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <button 
                    className="add-sub-button" 
                    onClick={() => handleAddSubDefinition(idx)}
                  >
                    + Add derived phrase / sub-definition
                  </button>
                  
                  {/* Examples for this specific definition */}
                  {def.examples && def.examples.length > 0 && (
                    <div className="definition-examples-section">
                      <label className="form-sublabel">Examples for this definition:</label>
                      {def.examples.map((example, exIdx) => (
                        <div key={exIdx} className="example-input-group">
                          <RichTextInput
                            value={example}
                            onChange={(newText) => {
                              const newDefs = [...definitions];
                              newDefs[idx].examples![exIdx] = newText;
                              setDefinitions(newDefs);
                            }}
                            vocabulary={vocabulary}
                            placeholder="Example sentence"
                          />
                          <button
                            className="remove-button"
                            onClick={() => {
                              const newDefs = [...definitions];
                              newDefs[idx].examples = newDefs[idx].examples!.filter((_, i) => i !== exIdx);
                              setDefinitions(newDefs);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <button 
                    className="add-sub-button" 
                    onClick={() => handleAddExampleToDefinition(idx)}
                  >
                    + Add example for this definition
                  </button>
                  
                  {/* Generate definition from examples button */}
                  {def.examples && def.examples.filter(e => e.trim()).length > 0 && (
                    <div className="form-hint" style={{ marginTop: '0.5rem' }}>
                      <span className="form-hint-label">LLM Assistant</span>
                      <button 
                        className="form-hint-button"
                        onClick={() => handleGenerateDefinitionFromExamples(idx)}
                        disabled={llm.status === 'loading'}
                      >
                        {llm.status === 'loading' ? 'Generating...' : 'Auto-fill definition from examples'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button className="add-more-button" onClick={handleAddDefinition}>
                + Add another definition
              </button>
            </div>

            <div className="form-group">
              <div className="form-label-with-action">
                <label className="form-label">Global Examples (Optional)</label>
                <button 
                  className="form-hint-button inline-ai-button"
                  onClick={handleGenerateGlobalExamples}
                  disabled={!wordInput.trim() || !definitions[0]?.text.trim() || llm.status === 'loading'}
                  title="Generate examples with AI"
                >
                  {llm.status === 'loading' ? 'Generating...' : 'Generate with AI'}
                </button>
              </div>
              <div className="form-hint">
                <span className="form-hint-label">⌨ These examples apply to all definitions · Cmd/Ctrl+B for bold · Cmd/Ctrl+K for link</span>
              </div>
              {globalExamples.map((example, idx) => (
                <div key={idx} className="example-input-group">
                  <RichTextInput
                    value={example}
                    onChange={(newText) => {
                      const newExamples = [...globalExamples];
                      newExamples[idx] = newText;
                      setGlobalExamples(newExamples);
                    }}
                    vocabulary={vocabulary}
                    placeholder="Example sentence (use toolbar for formatting)"
                  />
                  <button
                    className="remove-button"
                    onClick={() => setGlobalExamples(globalExamples.filter((_, i) => i !== idx))}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button className="add-more-button" onClick={handleAddGlobalExample}>
                + Add another global example
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Images (Optional)</label>
              {images.map((image, idx) => (
                <div key={idx} className="image-input-group">
                  {image ? (
                    <div className="image-preview">
                      <img src={image} alt={`Preview ${idx + 1}`} />
                      <button
                        className="remove-button"
                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="image-upload">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(idx, file);
                        }}
                        className="image-input"
                      />
                      <span className="image-upload-text">Choose image or drag here</span>
                    </div>
                  )}
                </div>
              ))}
              <button className="add-more-button" onClick={handleAddImage}>
                + Add image
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Tags (Optional)</label>
              <div className="form-hint">
                <span className="form-hint-label">⌨ Organize words with custom tags like "academic", "daily", "business"</span>
              </div>
              <TagSelector
                selectedTags={tags}
                availableTags={availableTags}
                onTagsChange={setTags}
              />
            </div>

            <div className="form-actions">
              <button className="form-button secondary" onClick={() => {
                setWordInput('');
                setShowForm(false);
              }}>
                Cancel
              </button>
              <button
                className="form-button primary"
                onClick={handleSubmit}
                disabled={!wordInput.trim() || !definitions.some(d => d.text.trim())}
              >
                Add Word
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddWord;
