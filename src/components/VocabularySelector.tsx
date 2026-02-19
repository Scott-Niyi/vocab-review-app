import React, { useState, useEffect } from 'react';

interface VocabProject {
  name: string;
  path: string;
  lastModified: string;
  wordCount: number;
}

interface VocabularySelectorProps {
  onSelect: (projectPath: string) => void;
}

const VocabularySelector: React.FC<VocabularySelectorProps> = ({ onSelect }) => {
  const [recentProjects, setRecentProjects] = useState<VocabProject[]>([]);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    const checkElectron = async () => {
      const isElectronEnv = typeof window !== 'undefined' && !!(window as any).electronAPI?.fs;
      setIsElectron(isElectronEnv);

      if (isElectronEnv) {
        await loadRecentProjects();
      }
    };

    checkElectron();
  }, []);

  const loadRecentProjects = async () => {
    try {
      const electronAPI = (window as any).electronAPI;
      const result = await electronAPI.fs.getRecentProjects();
      
      if (result.success && result.projects) {
        setRecentProjects(result.projects);
      }
    } catch (error) {
      console.error('Failed to load recent projects:', error);
    }
  };

  const handleCreateNew = async () => {
    if (!isElectron) {
      alert('Project creation is only available in Electron mode');
      return;
    }

    try {
      const electronAPI = (window as any).electronAPI;
      const result = await electronAPI.fs.createNewProject();
      
      if (result.success && result.projectPath) {
        onSelect(result.projectPath);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Check console for details.');
    }
  };

  const handleImportExisting = async () => {
    if (!isElectron) {
      alert('Project import is only available in Electron mode');
      return;
    }

    try {
      const electronAPI = (window as any).electronAPI;
      const result = await electronAPI.fs.selectProjectFolder();
      
      if (result.success && result.projectPath) {
        onSelect(result.projectPath);
      } else if (!result.canceled) {
        alert('Invalid project folder. Make sure it contains vocabulary.json');
      }
    } catch (error) {
      console.error('Failed to import project:', error);
      alert('Failed to import project. Check console for details.');
    }
  };

  const handleSelectProject = (projectPath: string) => {
    onSelect(projectPath);
  };

  if (!isElectron) {
    return (
      <div className="vocab-selector-container">
        <div className="vocab-selector-card">
          <h1 className="vocab-selector-title">Browser Mode</h1>
          <p className="vocab-selector-description">
            Project management is only available in Electron mode.
            Run <code>npm run dev</code> to use the desktop app.
          </p>
          <button 
            className="vocab-selector-button primary"
            onClick={() => onSelect('default')}
          >
            Continue with Default (localStorage)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vocab-selector-container">
      <div className="vocab-selector-card">
        <h1 className="vocab-selector-title">Welcome to Vocabulary Review</h1>
        <p className="vocab-selector-description">
          Choose how you want to get started
        </p>

        <div className="vocab-selector-actions">
          <button 
            className="vocab-selector-button primary"
            onClick={handleCreateNew}
          >
            Create New Project
          </button>
          <button 
            className="vocab-selector-button secondary"
            onClick={handleImportExisting}
          >
            Open Existing Project
          </button>
        </div>

        {recentProjects.length > 0 && (
          <div className="vocab-selector-section">
            <h3 className="vocab-selector-section-title">Recent Projects</h3>
            <div className="vocab-selector-list">
              {recentProjects.map((project) => (
                <div
                  key={project.path}
                  className="vocab-selector-item"
                  onClick={() => handleSelectProject(project.path)}
                >
                  <div className="vocab-selector-item-header">
                    <span className="vocab-selector-item-name">{project.name}</span>
                    <span className="vocab-selector-item-count">{project.wordCount} words</span>
                  </div>
                  <div className="vocab-selector-item-meta">
                    {project.path}
                  </div>
                  <div className="vocab-selector-item-meta">
                    Last modified: {new Date(project.lastModified).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="vocab-selector-hint">
          Tip: Each project is a folder containing your vocabulary data, logs, and settings
        </div>
      </div>
    </div>
  );
};

export default VocabularySelector;
