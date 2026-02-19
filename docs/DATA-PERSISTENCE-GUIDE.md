# Data Persistence Guide

## Overview

The vocabulary app now uses **true file system storage** for data persistence, ensuring your vocabulary data is saved permanently and accessible across different browsers.

## Storage Location

### Electron App (Desktop)
When running as an Electron desktop app, your vocabulary data is stored in:
```
~/Library/Application Support/vocab-review-app/user-data/vocabulary.json
```
(macOS path shown; Windows/Linux paths will vary)

### Browser Mode (Development)
When running in a browser (development mode), the app falls back to localStorage for compatibility.

## How It Works

1. **File System Store**: The app uses `FileSystemStore` which communicates with Electron's main process via IPC (Inter-Process Communication)
2. **Automatic Saving**: Every time you add, edit, or review a word, the data is automatically saved to the JSON file
3. **Mock Data Merging**: The app includes built-in vocabulary examples (mock data) that are automatically merged with your personal vocabulary
4. **Version Control**: Data versioning ensures smooth upgrades when new mock data is added

## Data Structure

The `vocabulary.json` file contains:
```json
{
  "vocabulary": [...],
  "version": 4,
  "lastModified": "2026-01-31T...",
  "userIdCounter": 1001
}
```

- **vocabulary**: Array of all vocabulary entries (mock + user-added)
- **version**: Mock data version for automatic merging
- **lastModified**: Timestamp of last save
- **userIdCounter**: Next available ID for user-added words (starts at 1000)

## Benefits

✅ **True Persistence**: Data survives browser restarts, cache clears, and system reboots
✅ **Cross-Browser**: Your data is stored in a file, not tied to a specific browser
✅ **Portable**: You can backup, share, or migrate your vocabulary.json file
✅ **Future-Proof**: Easy to migrate to cloud storage or SQLite in the future

## Future Features

- [ ] Custom data file location (choose where to save your vocabulary)
- [ ] "Open Data Folder" button in Settings
- [ ] Export/Import functionality for sharing vocabulary lists
- [ ] Cloud sync support

## Technical Details

### Architecture
- **IDataStore Interface**: Abstract interface for data operations
- **FileSystemStore**: Implementation using Electron IPC
- **LocalStorageStore**: Fallback for browser mode
- **Service Container**: Dependency injection for easy swapping

### Electron IPC APIs
The app exposes these file system operations:
- `fs:readFile` - Read vocabulary data
- `fs:writeFile` - Save vocabulary data
- `fs:exists` - Check if file exists
- `fs:getStats` - Get file modification time
- `fs:getUserDataPath` - Get storage directory path

## Migration from localStorage

If you were using the app before this update, your data from localStorage will be automatically migrated to the file system on first launch.
