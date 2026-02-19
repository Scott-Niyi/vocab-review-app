# Project Folder Structure Implementation

## Overview
The vocabulary app now uses a project-based folder structure instead of single files. Each vocabulary project is a folder containing all related data.

## Project Structure
```
~/Documents/VocabProjects/
├── my-gre-words/
│   ├── vocabulary.json      # Word data
│   ├── logs/                # Future: activity logs
│   └── config.json          # Project metadata
├── spanish-vocab/
│   ├── vocabulary.json
│   ├── logs/
│   └── config.json
```

## Features Implemented

### 1. Project Selection on Startup
- When you launch the app, you see a project selector
- Options:
  - **Create New Project**: Opens a save dialog to create a new project folder
  - **Open Existing Project**: Opens a folder picker to select an existing project
  - **Recent Projects**: Shows list of recently opened projects with metadata

### 2. Project Creation
- Click "Create New Project"
- Choose location and name for your project folder
- App automatically creates:
  - `vocabulary.json` with initial empty data
  - `logs/` directory for future logging
  - `config.json` with project metadata

### 3. Project Opening
- Click "Open Existing Project"
- Select a folder containing `vocabulary.json`
- App validates the folder structure
- Loads the vocabulary data

### 4. Recent Projects
- App remembers last 10 opened projects
- Shows project name, word count, and last modified date
- Click any recent project to open it instantly

### 5. Project Switching
- Open Settings (gear icon)
- Click "Switch Project" button
- Returns to project selector
- Current data is automatically saved

## Technical Implementation

### FileSystemStore Changes
- Changed from single file path to project folder path
- Methods updated:
  - `setProjectPath(projectPath)` - Set current project folder
  - `getProjectPath()` - Get current project folder
  - `getProjectDirectory()` - Get full path to project directory
- All file operations now use absolute paths: `${projectPath}/vocabulary.json`

### Electron IPC Handlers
New IPC methods added:
- `fs:selectProjectFolder` - Opens folder picker dialog
- `fs:createNewProject` - Opens save dialog and creates project structure
- `fs:getRecentProjects` - Returns list of recent projects with metadata

### File Operations
- All file operations now accept absolute paths
- No longer relative to USER_DATA_DIR
- Projects can be anywhere on the file system

### Recent Projects Storage
- Stored in: `~/Library/Application Support/Electron/recent-projects.json`
- Format:
```json
{
  "projects": [
    "/Users/username/Documents/VocabProjects/my-gre-words",
    "/Users/username/Documents/VocabProjects/spanish-vocab"
  ]
}
```

## User Experience

### First Launch
1. App shows project selector
2. User creates or opens a project
3. Project path saved to localStorage
4. App loads vocabulary data

### Subsequent Launches
1. App checks localStorage for last project
2. If found, loads that project automatically
3. If not found, shows project selector

### Switching Projects
1. Open Settings
2. Click "Switch Project"
3. Confirms save of current data
4. Clears localStorage
5. Reloads app to show project selector

## Browser Mode Fallback
- If running in browser (not Electron), shows warning
- Offers "Continue with Default" option
- Falls back to localStorage for data storage

## Next Steps (Future Enhancements)
1. Implement logging to `logs/` directory
2. Add project settings in `config.json`
3. Add project export/import functionality
4. Add project templates
5. Add project statistics dashboard
