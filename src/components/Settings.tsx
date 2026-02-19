import React, { useState, useEffect } from 'react';
import { getLLMService, getDataStore, getLogger } from '../services';
import { LLMConfig } from '../services/ILLMService';

interface SettingsProps {
  onClose: () => void;
  onProjectSwitch?: (projectPath: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose, onProjectSwitch }) => {
  const logger = getLogger();
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [isElectron, setIsElectron] = useState(false);
  const [reviewRecencyWeight, setReviewRecencyWeight] = useState(0.5);
  const [contentFontSize, setContentFontSize] = useState(1.0);

  useEffect(() => {
    const llmService = getLLMService();
    const currentConfig = llmService.getConfig();
    setApiKey(currentConfig.apiKey || '');
    setModel(currentConfig.model || 'gpt-4o-mini');

    // Load review recency weight from config
    const loadConfig = async () => {
      const dataStore = getDataStore();
      if ('getConfig' in dataStore) {
        const config = await (dataStore as any).getConfig();
        setReviewRecencyWeight(config.reviewRecencyWeight ?? 0.5);
        setContentFontSize(config.contentFontSize ?? 1.0);
      }
    };
    loadConfig();

    // Check if running in Electron and get project path
    const checkElectron = async () => {
      const isElectronEnv = typeof window !== 'undefined' && !!(window as any).electronAPI?.fs;
      setIsElectron(isElectronEnv);

      if (isElectronEnv) {
        try {
          const dataStore = getDataStore();
          if ('getProjectPath' in dataStore) {
            const path = (dataStore as any).getProjectPath();
            setProjectPath(path);
          }
        } catch (error) {
          console.error('Failed to get project path:', error);
        }
      }
    };

    checkElectron();
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose]);

  const handleSave = () => {
    const llmService = getLLMService();
    const newConfig: LLMConfig = {
      provider: 'openai',
      apiKey: apiKey.trim(),
      model: model,
    };
    llmService.saveConfig(newConfig);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setTestStatus('testing');
    setTestMessage('');

    try {
      const llmService = getLLMService();
      
      // Temporarily save config for testing
      const tempConfig: LLMConfig = {
        provider: 'openai',
        apiKey: apiKey.trim(),
        model: model,
      };
      llmService.saveConfig(tempConfig);

      // Test with a simple word
      const result = await llmService.generateIPA('test');
      
      if (result) {
        setTestStatus('success');
        setTestMessage(`Success! Generated IPA: ${result}`);
      } else {
        setTestStatus('error');
        setTestMessage('API responded but returned empty result');
      }
    } catch (error) {
      setTestStatus('error');
      if (error instanceof Error) {
        setTestMessage(error.message);
      } else {
        setTestMessage('Unknown error occurred');
      }
    }
  };

  const handleClear = () => {
    setApiKey('');
    setModel('gpt-4o-mini');
    setTestStatus('idle');
    setTestMessage('');
  };

  const handleRecencyWeightChange = async (value: number) => {
    setReviewRecencyWeight(value);
    
    // Save to config immediately
    const dataStore = getDataStore();
    if ('updateConfig' in dataStore) {
      await (dataStore as any).updateConfig({ reviewRecencyWeight: value });
    }
    
    logger.trackEvent('recency_weight_changed', {
      newValue: value
    });
  };

  const handleFontSizeChange = async (value: number) => {
    setContentFontSize(value);
    
    // Apply CSS variable immediately
    document.documentElement.style.setProperty('--content-font-size-multiplier', value.toString());
    
    // Save to config
    const dataStore = getDataStore();
    if ('updateConfig' in dataStore) {
      await (dataStore as any).updateConfig({ contentFontSize: value });
    }
    
    logger.trackEvent('font_size_changed', {
      newValue: value
    });
  };

  const handleExportProject = async () => {
    if (!isElectron) {
      // Browser mode: export JSON only
      try {
        const dataStore = getDataStore();
        const data = await dataStore.exportData();
        const vocabulary = await dataStore.getVocabulary();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const fileName = `vocabulary-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        logger.trackEvent('data_exported', {
          filePath: fileName,
          wordCount: vocabulary.length,
          format: 'json'
        });
      } catch (error) {
        console.error('Failed to export data:', error);
        logger.error('Failed to export data', error as Error);
        alert('Failed to export data. Check console for details.');
      }
      return;
    }

    // Electron mode: export entire project folder
    try {
      const electronAPI = (window as any).electronAPI;
      const result = await electronAPI.fs.exportProject(projectPath);
      
      if (result.success) {
        const dataStore = getDataStore();
        const vocabulary = await dataStore.getVocabulary();
        alert(`Project exported successfully to:\n${result.exportPath}`);
        
        logger.trackEvent('data_exported', {
          filePath: result.exportPath,
          wordCount: vocabulary.length,
          format: 'project_folder'
        });
      } else if (!result.canceled) {
        alert(`Failed to export project: ${result.error}`);
        logger.error('Failed to export project', new Error(result.error));
      }
    } catch (error) {
      console.error('Failed to export project:', error);
      logger.error('Failed to export project', error as Error);
      alert('Failed to export project. Check console for details.');
    }
  };

  const handleImportProject = async () => {
    if (!isElectron) {
      // Browser mode: import JSON only
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
          const text = await file.text();
          const dataStore = getDataStore();
          await dataStore.importData(text);
          const vocabulary = await dataStore.getVocabulary();
          alert('Data imported successfully! Refresh the page to see changes.');
          
          logger.trackEvent('data_imported', {
            filePath: file.name,
            wordCount: vocabulary.length,
            format: 'json'
          });
        } catch (error) {
          console.error('Failed to import data:', error);
          logger.error('Failed to import data', error as Error);
          alert('Failed to import data. Make sure the file is valid JSON.');
        }
      };
      input.click();
      return;
    }

    // Electron mode: import project folder
    try {
      const electronAPI = (window as any).electronAPI;
      const result = await electronAPI.fs.selectProjectFolder();
      
      if (result.success && result.projectPath) {
        // Get word count before switching
        const dataStore = getDataStore();
        const vocabulary = await dataStore.getVocabulary();
        
        // Switch to the imported project immediately
        if (onProjectSwitch) {
          onProjectSwitch(result.projectPath);
          alert(`Project imported successfully!\n\nPath: ${result.projectPath}`);
        } else {
          // Fallback: reload
          localStorage.setItem('vocab_project_path', result.projectPath);
          window.location.reload();
        }
        
        logger.trackEvent('data_imported', {
          filePath: result.projectPath,
          wordCount: vocabulary.length,
          format: 'project_folder'
        });
      } else if (!result.canceled) {
        alert('Invalid project folder. Make sure it contains vocabulary.json');
        logger.warn('Invalid project folder selected');
      }
    } catch (error) {
      console.error('Failed to import project:', error);
      logger.error('Failed to import project', error as Error);
      alert('Failed to import project. Check console for details.');
    }
  };

  const handleSwitchProject = () => {
    if (confirm('Switch to a different vocabulary project? Current session will be saved.')) {
      if (onProjectSwitch) {
        // Close settings and trigger project selector
        onClose();
        onProjectSwitch(''); // Empty string triggers selector
      } else {
        // Fallback: reload
        localStorage.removeItem('vocab_project_path');
        window.location.reload();
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Settings</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="settings-section">
            <h3 className="settings-section-title">Data Storage</h3>
            {isElectron ? (
              <>
                <p className="settings-description">
                  Your vocabulary data is stored in a project folder for true persistence and portability.
                </p>
                {projectPath && (
                  <div className="form-group">
                    <label className="form-label">Project Location</label>
                    <code className="settings-path">{projectPath}</code>
                    <div className="form-hint">
                      <span className="form-hint-label">
                        Contains: vocabulary.json, logs/, config.json
                      </span>
                    </div>
                  </div>
                )}
                <div className="settings-actions">
                  <button className="form-button secondary" onClick={handleSwitchProject}>
                    Switch Project
                  </button>
                  <button className="form-button secondary" onClick={handleExportProject}>
                    Export Project
                  </button>
                  <button className="form-button secondary" onClick={handleImportProject}>
                    Import Project
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="settings-description">
                  Warning: Running in browser mode. Data is stored in localStorage (browser-specific).
                  For true file persistence, run the Electron app with <code>npm run dev</code>
                </p>
                <div className="settings-actions">
                  <button className="form-button secondary" onClick={handleExportProject}>
                    Export Backup (JSON)
                  </button>
                  <button className="form-button secondary" onClick={handleImportProject}>
                    Import Backup (JSON)
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">Review Strategy</h3>
            <p className="settings-description">
              Control what proportion of your review queue consists of recently reviewed words 
              (reviewed within the last 7 days) versus words selected by the spaced repetition algorithm.
            </p>
            
            <div className="slider-container">
              <div className="slider-labels">
                <span className="slider-label-left">0% Recent</span>
                <span className="slider-label-right">100% Recent</span>
              </div>
              
              <div className="slider-track-wrapper">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={reviewRecencyWeight}
                  onChange={(e) => handleRecencyWeightChange(parseFloat(e.target.value))}
                  className="form-slider"
                />
              </div>
              
              <div className="slider-value-indicator">
                <div className="slider-value-label">
                  {Math.round(reviewRecencyWeight * 100)}% recently reviewed words
                </div>
                <div className="slider-value-description">
                  {reviewRecencyWeight === 0 && 
                    'Pure spaced repetition - no recent words prioritized'}
                  {reviewRecencyWeight > 0 && reviewRecencyWeight < 0.33 && 
                    `About ${Math.round(reviewRecencyWeight * 100)}% of your queue will be words reviewed in the last 7 days`}
                  {reviewRecencyWeight >= 0.33 && reviewRecencyWeight <= 0.67 && 
                    `About ${Math.round(reviewRecencyWeight * 100)}% of your queue will be words reviewed in the last 7 days`}
                  {reviewRecencyWeight > 0.67 && reviewRecencyWeight < 1 && 
                    `About ${Math.round(reviewRecencyWeight * 100)}% of your queue will be words reviewed in the last 7 days`}
                  {reviewRecencyWeight === 1 && 
                    'Only recently reviewed words - maximum reinforcement'}
                </div>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">Display Settings</h3>
            <p className="settings-description">
              Adjust the font size of definitions, examples, and other content text.
            </p>
            
            <div className="slider-container">
              <div className="slider-labels">
                <span className="slider-label-left">Small</span>
                <span className="slider-label-right">Large</span>
              </div>
              
              <div className="slider-track-wrapper">
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.05"
                  value={contentFontSize}
                  onChange={(e) => handleFontSizeChange(parseFloat(e.target.value))}
                  className="form-slider"
                />
              </div>
              
              <div className="slider-value-indicator">
                <div className="slider-value-label">
                  {Math.round(contentFontSize * 100)}% size
                </div>
                <div className="slider-value-description">
                  {contentFontSize < 0.9 && 'Compact text for more content on screen'}
                  {contentFontSize >= 0.9 && contentFontSize <= 1.1 && 'Default size - balanced readability'}
                  {contentFontSize > 1.1 && 'Larger text for better readability'}
                </div>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">LLM Integration (AI Features)</h3>
            <p className="settings-description">
              Configure OpenAI API to enable AI-powered features like automatic IPA generation, 
              respelling, and example sentences.
            </p>

            <div className="form-group">
              <label className="form-label">Provider</label>
              <select 
                className="form-input"
                value="openai"
                disabled
              >
                <option value="openai">OpenAI</option>
              </select>
              <div className="form-hint">
                <span className="form-hint-label">Currently only OpenAI is supported</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">API Key</label>
              <div className="api-key-input-group">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  className="form-input"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <button
                  className="form-button secondary small"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="form-hint">
                <span className="form-hint-label">
                  Get your API key from{' '}
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="settings-link"
                  >
                    platform.openai.com
                  </a>
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Model</label>
              <select 
                className="form-input"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                <option value="gpt-4o-mini">GPT-4o Mini (Recommended - Fast & Cheap)</option>
                <option value="gpt-4o">GPT-4o (Higher Quality)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Cheapest)</option>
              </select>
              <div className="form-hint">
                <span className="form-hint-label">
                  GPT-4o Mini is recommended for best balance of quality and cost (~$0.10/month for typical use)
                </span>
              </div>
            </div>

            <div className="settings-actions">
              <button
                className="form-button secondary"
                onClick={handleTest}
                disabled={!apiKey.trim() || testStatus === 'testing'}
              >
                {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                className="form-button secondary"
                onClick={handleClear}
              >
                Clear
              </button>
            </div>

            {testStatus !== 'idle' && (
              <div className={`test-result ${testStatus}`}>
                <div className="test-result-icon">
                  {testStatus === 'testing' && '...'}
                  {testStatus === 'success' && 'OK'}
                  {testStatus === 'error' && 'Error'}
                </div>
                <div className="test-result-message">{testMessage}</div>
              </div>
            )}
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">Privacy & Cost</h3>
            <ul className="settings-info-list">
              <li>Your API key is stored locally in your browser</li>
              <li>Only the word and context are sent to OpenAI</li>
              <li>Your full vocabulary list is never uploaded</li>
              <li>Typical cost: $0.01-0.05 per 100 words processed</li>
              <li>You can disable AI features anytime by clearing the API key</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button className="form-button secondary" onClick={onClose}>
            Close
          </button>
          <button 
            className="form-button primary" 
            onClick={handleSave}
            disabled={!apiKey.trim()}
          >
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
