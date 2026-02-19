import React from 'react';

interface TagChipProps {
  tag: string;
  selected?: boolean;
  onToggle?: () => void;
  removable?: boolean;
  count?: number;
}

/**
 * TagChip component for displaying and interacting with tags
 * Can be used in both selection and display contexts
 */
export const TagChip: React.FC<TagChipProps> = ({
  tag,
  selected = false,
  onToggle,
  removable = false,
  count
}) => {
  const handleClick = () => {
    if (onToggle) {
      onToggle();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggle) {
      onToggle();
    }
  };

  return (
    <div
      className={`tag-chip ${selected ? 'selected' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <span className="tag-chip-text">{tag}</span>
      {count !== undefined && (
        <span className="tag-chip-count">{count}</span>
      )}
      {removable && selected && (
        <button
          className="tag-chip-remove"
          onClick={handleRemove}
          aria-label={`Remove ${tag} tag`}
        >
          ×
        </button>
      )}
    </div>
  );
};
