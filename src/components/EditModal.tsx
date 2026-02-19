import React, { useState, useEffect } from 'react';
import { VocabularyEntry } from '../types/vocabulary';
import RichTextInput from './RichTextInput';
import IPAInput from './IPAInput';
import { useLLM } from '../hooks/useLLM';
import { TagSelector } from './TagSelector';
import { TagManager } from '../services/TagManager';
import { useBracketWrap } from '../hooks/useBracketWrap';

interface EditModalProps {
  entry: VocabularyEntry;
  vocabulary: VocabularyEntry[];
  onSave: (updatedEntry: VocabularyEntry) => void;
  onClose: () => void;
  projectPath: string;
}

const EditModal: React.FC<EditModalProps> = ({ entry, vocabulary, onSave, onClose, projectPath }) => {
  const [word, setWord] = useState(entry.word);
  const [pronunciation, setPronunciation] = useState(entry.pronunciation || '');
  const [respelling, setRespelling] = useState(entry.respelling || '');
  const [definitions, setDefinitions] = useState(entry.definitions.map(d => ({
    ...d,
    examples: d.examples || [],
    subDefinitions: d.subDefinitions || []
  })));
  const [globalExamples, setGlobalExamples] = useState(entry.examples || []);
  const [images, setImages] = useState(entry.images || []);
  const [variants, setVariants] = useState(entry.variants || []);
  const [tags, setTags] = useState(entry.tags || []);

  // Refs for bracket wrapping
  const wordInputRef = React.useRef<HTMLInputElement>(null);
  const pronunciationInputRef = React.useRef<HTMLInputElement>(null);
  const respellingInputRef = React.useRef<HTMLInputElement>(null);

  // Enable bracket wrapping for text inputs
  useBracketWrap(wordInputRef, word, setWord);
  useBracketWrap(pronunciationInputRef, pronunciation, setPronunciation);
  useBracketWrap(respellingInputRef, respelling, setRespelling);

  // Debug: log the initial state
  useEffect(() => {
    console.log('EditModal initialized with entry:', {
      word: entry.word,
      definitionsCount: entry.definitions.length,
      globalExamplesCount: entry.examples?.length || 0,
      definitions: entry.definitions.map(d => ({
        text: d.text,
        examplesCount: d.examples?.length || 0
      }))
    });
  }, []);

  // LLM integration
  const llm = useLLM();

  const handleGenerateIPA = async () => {
    const result = await llm.generateIPA(word);
    if (result) {
      setPronunciation(result);
    }
  };

  const handleGenerateRespelling = async () => {
    const result = await llm.generateRespelling(word, pronunciation);
    if (result) {
      setRespelling(result);
    }
  };

  const handleGenerateDefinitions = async () => {
    const result = await llm.suggestDefinitions(word);
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
    if (definitions.length === 0 || !definitions[0].text.trim()) return;
    const result = await llm.generateExamples(word, definitions[0].text, 2);
    if (result && result.length > 0) {
      setGlobalExamples([...globalExamples.filter(e => e.trim()), ...result]);
    }
  };

  const handleGenerateDefinitionFromExamples = async (defIndex: number) => {
    const def = definitions[defIndex];
    const examplesForDef = def.examples?.filter(e => e.trim()) || [];
    
    if (examplesForDef.length === 0) {
      return;
    }

    const result = await llm.generateDefinitionFromExamples(word, examplesForDef);
    if (result) {
      const newDefs = [...definitions];
      newDefs[defIndex].partOfSpeech = result.partOfSpeech || '';
      newDefs[defIndex].text = result.text;
      setDefinitions(newDefs);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // If event was already handled (e.g., by link picker), don't process it
      if (e.defaultPrevented) {
        return;
      }
      
      // Don't intercept keyboard shortcuts in input fields
      const target = e.target as HTMLElement;
      const isInInput = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.isContentEditable;
      
      // Allow Tab in input fields (for IPA shortcuts)
      if (isInInput && e.key === 'Tab') {
        return; // Let the input handle it
      }
      
      // Allow Cmd/Ctrl+B and Cmd/Ctrl+K in textareas (for RichTextInput)
      if (isInInput && (e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'k')) {
        return; // Let RichTextInput handle it
      }
      
      // Stop propagation to prevent WordCard from handling keys
      e.stopPropagation();
      
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    // Add listener WITHOUT capture phase, so RichTextInput's capture handler runs first
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose]);

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
    newDefs[defIndex].subDefinitions!.push({ phrase: '', partOfSpeech: '', text: '', examples: [] });
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

  const handleSave = () => {
    console.log('Saving with state:', {
      globalExamplesCount: globalExamples.length,
      globalExamples: globalExamples,
      definitions: definitions.map(d => ({
        text: d.text,
        examplesCount: d.examples?.length || 0,
        examples: d.examples
      }))
    });
    
    const updatedEntry: VocabularyEntry = {
      ...entry,
      word: word.trim(),
      pronunciation,
      respelling,
      definitions: definitions
        .filter(d => d.text.trim() || (d.examples && d.examples.some(e => e.trim())) || (d.subDefinitions && d.subDefinitions.length > 0))
        .map(d => ({
          partOfSpeech: d.partOfSpeech,
          text: d.text,
          examples: d.examples?.filter(e => e.trim()) || [],
          subDefinitions: d.subDefinitions?.filter(sd => sd.phrase.trim() || sd.text.trim()).map(sd => ({
            phrase: sd.phrase.trim(),
            partOfSpeech: sd.partOfSpeech?.trim() || undefined,
            text: sd.text.trim(),
            examples: sd.examples?.filter(e => e.trim()) || []
          })) || []
        })),
      examples: globalExamples.filter(e => e.trim()),
      images: images.filter(img => img.trim()),
      variants: variants.filter(v => v.trim()),
      tags: Array.from(new Set(tags.filter(t => t.trim()))), // Remove duplicates
    };
    
    console.log('Saving updatedEntry:', {
      word: updatedEntry.word,
      globalExamplesCount: updatedEntry.examples?.length || 0,
      globalExamples: updatedEntry.examples,
      definitions: updatedEntry.definitions.map(d => ({
        text: d.text,
        examplesCount: d.examples?.length || 0,
        examples: d.examples
      }))
    });
    
    onSave(updatedEntry);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Word</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Word</label>
            <input
              ref={wordInputRef}
              type="text"
              className="form-input"
              placeholder="Enter word"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <div className="form-label-with-action">
              <label className="form-label">Pronunciation (IPA)</label>
              <button 
                className="form-hint-button inline-ai-button"
                onClick={handleGenerateIPA}
                disabled={llm.status === 'loading'}
                title="Generate IPA with AI"
              >
                {llm.status === 'loading' ? 'Generating...' : 'Generate with AI'}
              </button>
            </div>
            <IPAInput
              value={pronunciation}
              onChange={setPronunciation}
              placeholder="e.g., ˈbʌlk"
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
                disabled={llm.status === 'loading'}
                title="Generate respelling with AI"
              >
                {llm.status === 'loading' ? 'Generating...' : 'Generate with AI'}
              </button>
            </div>
            <input
              ref={respellingInputRef}
              type="text"
              className="form-input respelling-input"
              placeholder="e.g., BULK"
              value={respelling}
              onChange={(e) => setRespelling(e.target.value)}
            />
            <div className="form-hint">
              <span className="form-hint-label">⌨ Use CAPS for stressed syllables</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Alternative Spellings / Variants</label>
            {variants.map((variant, idx) => (
              <div key={idx} className="variant-input-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Alternative spelling"
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
            <label className="form-label">Tags</label>
            <TagSelector
              selectedTags={tags}
              availableTags={(() => {
                const tagManager = new TagManager(vocabulary);
                return tagManager.getAllTags();
              })()}
              onTagsChange={setTags}
            />
          </div>

          <div className="form-group">
            <div className="form-label-with-action">
              <label className="form-label">Definitions</label>
              <button 
                className="form-hint-button inline-ai-button"
                onClick={handleGenerateDefinitions}
                disabled={!word.trim() || llm.status === 'loading'}
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
                    placeholder="Part of speech"
                    value={def.partOfSpeech || ''}
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
                    placeholder="Definition text"
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
                          <input
                            type="text"
                            className="form-input small"
                            placeholder="Part of speech"
                            value={subDef.partOfSpeech || ''}
                            onChange={(e) => {
                              const newDefs = [...definitions];
                              newDefs[idx].subDefinitions![subIdx].partOfSpeech = e.target.value;
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
                <div className="definition-examples-section">
                  <label className="form-sublabel">Examples for this definition:</label>
                  {def.examples && def.examples.length > 0 && (
                    <>
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
                    </>
                  )}
                  
                  <button 
                    className="add-sub-button" 
                    onClick={() => handleAddExampleToDefinition(idx)}
                  >
                    + Add example for this definition
                  </button>
                </div>
                
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
              + Add definition
            </button>
          </div>

          <div className="form-group">
            <div className="form-label-with-action">
              <label className="form-label">Global Examples</label>
              <button 
                className="form-hint-button inline-ai-button"
                onClick={handleGenerateGlobalExamples}
                disabled={!definitions[0]?.text.trim() || llm.status === 'loading'}
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
                  placeholder="Example sentence"
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
              + Add example
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Images</label>
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
                    <span className="image-upload-text">Choose image</span>
                  </div>
                )}
              </div>
            ))}
            <button className="add-more-button" onClick={handleAddImage}>
              + Add image
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="form-button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="form-button primary" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
