import React, { useState } from 'react';
import { TagChip } from './TagChip';
import { TagManager } from '../services/TagManager';

interface TagSelectorProps {
  selectedTags: string[];
  availableTags: string[];
  onTagsChange: (tags: string[]) => void;
}

/**
 * TagSelector component for selecting and creating tags
 * Allows users to select from existing tags or create new ones
 */
export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  availableTags,
  onTagsChange
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      // Remove tag
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      // Add tag
      onTagsChange([...selectedTags, tag]);
    }
    setError(null);
  };

  const handleCreateTag = () => {
    const normalizedTag = TagManager.normalizeTag(inputValue);
    
    // Validate tag
    const validationError = TagManager.validateTag(normalizedTag);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check for duplicate
    if (selectedTags.includes(normalizedTag)) {
      setError('Tag already selected');
      return;
    }

    // Add tag
    onTagsChange([...selectedTags, normalizedTag]);
    setInputValue('');
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateTag();
    }
  };

  // Get unselected available tags
  const unselectedTags = availableTags.filter(tag => !selectedTags.includes(tag));

  return (
    <div className="tag-selector">
      {/* Selected Tags Section */}
      {selectedTags.length > 0 && (
        <div className="selected-tags">
          <div className="form-sublabel">Selected Tags</div>
          <div className="tag-chips">
            {selectedTags.map(tag => (
              <TagChip
                key={tag}
                tag={tag}
                selected={true}
                onToggle={() => handleToggleTag(tag)}
                removable={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available Tags Section */}
      {unselectedTags.length > 0 && (
        <div className="available-tags">
          <div className="form-sublabel">Available Tags</div>
          <div className="tag-chips">
            {unselectedTags.map(tag => (
              <TagChip
                key={tag}
                tag={tag}
                selected={false}
                onToggle={() => handleToggleTag(tag)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create New Tag Section */}
      <div className="tag-input-group">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Create new tag..."
          maxLength={50}
        />
        <button
          className="add-tag-button"
          onClick={handleCreateTag}
          disabled={!inputValue.trim()}
        >
          Add Tag
        </button>
      </div>

      {error && <div className="tag-error">{error}</div>}
    </div>
  );
};
