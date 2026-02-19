import React, { useState, useRef, useEffect } from 'react';

interface TagFilterProps {
  tags: string[];
  tagCounts: Map<string, number>;
  activeTag: string | null;
  onTagSelect: (tag: string | null) => void;
}

/**
 * TagFilter component for filtering vocabulary by tags
 * Displays as a dropdown menu to save space when there are many tags
 */
export const TagFilter: React.FC<TagFilterProps> = ({
  tags,
  tagCounts,
  activeTag,
  onTagSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleTagClick = (tag: string) => {
    if (activeTag === tag) {
      // Deselect if clicking active tag
      onTagSelect(null);
    } else {
      // Select tag
      onTagSelect(tag);
    }
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    onTagSelect(null);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  if (tags.length === 0) {
    return (
      <div className="tag-filter-dropdown">
        <button className="tag-filter-button disabled" disabled>
          <span className="tag-filter-icon">#</span>
          <span>No tags available</span>
        </button>
      </div>
    );
  }

  const displayText = activeTag 
    ? `${activeTag} (${tagCounts.get(activeTag) || 0})`
    : 'Filter by Tag';

  return (
    <div className="tag-filter-dropdown" ref={dropdownRef}>
      <button 
        className={`tag-filter-button ${isOpen ? 'open' : ''} ${activeTag ? 'active' : ''}`}
        onClick={toggleDropdown}
      >
        <span className="tag-filter-icon">#</span>
        <span className="tag-filter-text">{displayText}</span>
        <span className="tag-filter-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="tag-filter-menu">
          <div className="tag-filter-menu-header">
            <span className="tag-filter-menu-title">Filter by Tag</span>
            {activeTag && (
              <button className="tag-filter-clear" onClick={handleClearFilter}>
                Clear
              </button>
            )}
          </div>
          <div className="tag-filter-menu-list">
            <div 
              className={`tag-filter-menu-item ${!activeTag ? 'selected' : ''}`}
              onClick={() => handleClearFilter()}
            >
              <span className="tag-filter-menu-item-name">All Words</span>
              <span className="tag-filter-menu-item-count">
                {Array.from(tagCounts.values()).reduce((a, b) => a + b, 0)}
              </span>
            </div>
            <div className="tag-filter-menu-divider"></div>
            {tags.map(tag => (
              <div
                key={tag}
                className={`tag-filter-menu-item ${activeTag === tag ? 'selected' : ''}`}
                onClick={() => handleTagClick(tag)}
              >
                <span className="tag-filter-menu-item-name"># {tag}</span>
                <span className="tag-filter-menu-item-count">{tagCounts.get(tag) || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
