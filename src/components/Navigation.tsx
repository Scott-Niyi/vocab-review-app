import React from 'react';

interface NavigationProps {
  currentView: 'review' | 'library' | 'add' | 'tags';
  onViewChange: (view: 'review' | 'library' | 'add' | 'tags') => void;
  onSettingsClick: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange, onSettingsClick }) => {
  return (
    <nav className="navigation">
      <div className="nav-left">
        <button
          className={`nav-button ${currentView === 'review' ? 'active' : ''}`}
          onClick={() => onViewChange('review')}
        >
          Review
        </button>
        <button
          className={`nav-button ${currentView === 'library' ? 'active' : ''}`}
          onClick={() => onViewChange('library')}
        >
          Library
        </button>
        <button
          className={`nav-button ${currentView === 'tags' ? 'active' : ''}`}
          onClick={() => onViewChange('tags')}
        >
          Tags
        </button>
        <button
          className={`nav-button ${currentView === 'add' ? 'active' : ''}`}
          onClick={() => onViewChange('add')}
        >
          Add Word
        </button>
      </div>
      <div className="nav-right">
        <button
          className="nav-button settings-button"
          onClick={onSettingsClick}
          title="Settings"
        >
          Settings
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
