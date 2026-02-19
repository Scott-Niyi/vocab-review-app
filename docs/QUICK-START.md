# Quick Start Guide

## ✅ File Persistence is Already Integrated!

Your vocabulary app now saves data to **actual JSON files** instead of browser localStorage. This means your data persists across browsers and survives cache clears.

## How to Run the App

### Option 1: Development Mode (Electron + Hot Reload)
```bash
cd vocab-review-app
npm run dev
```

This will:
1. Start Vite dev server on http://localhost:5173
2. Launch Electron app with hot reload
3. Save data to: `~/Library/Application Support/Electron/user-data/vocabulary.json`

### Option 2: Build and Run Production App
```bash
cd vocab-review-app
npm run build
```

This creates a standalone desktop app in `dist/` folder.

### Option 3: Browser Mode (Fallback)
```bash
cd vocab-review-app
npm run dev:vite
```

Open http://localhost:5173 in your browser. **Note**: This uses localStorage as fallback since Electron APIs aren't available in browser.

## Verify File Persistence

### Step 1: Run the Electron App
```bash
npm run dev
```

### Step 2: Add a Word
1. Click "Add Word" tab
2. Add any vocabulary word
3. Click "Add to Library"

### Step 3: Check the File
```bash
# On macOS
cat ~/Library/Application\ Support/Electron/user-data/vocabulary.json

# Or use this command to open the folder
open ~/Library/Application\ Support/Electron/user-data/
```

You should see your vocabulary data in JSON format!

### Step 4: Verify Persistence
1. Close the Electron app completely
2. Reopen it with `npm run dev`
3. Your word should still be there! ✅

## Where is My Data Stored?

### Electron App (Desktop)
- **macOS**: `~/Library/Application Support/Electron/user-data/vocabulary.json`
- **Windows**: `%APPDATA%\Electron\user-data\vocabulary.json`
- **Linux**: `~/.config/Electron/user-data/vocabulary.json`

**Note**: In development mode, it uses "Electron" as the app name. After building with `npm run build`, it will use "vocab-review-app" as the folder name.

### Browser Mode
Falls back to localStorage (browser-specific, not portable)

## Future Features (Coming Soon)

The Settings page will include:
- [ ] "Choose Data File" - Select which JSON file to load
- [ ] "Open Data Folder" - Quick access to your vocabulary files
- [ ] Export/Import buttons for manual backup
- [ ] Multiple vocabulary lists support

## Troubleshooting

### "Data not persisting"
- Make sure you're running in Electron mode (`npm run dev`), not browser mode
- Check the file location shown above
- Look for errors in the Electron console

### "Can't find the data file"
Run this to see where Electron stores data:
```bash
# In the Electron app console (DevTools)
window.electronAPI.fs.getUserDataPath()
```

### "Want to use a different location"
Currently, the app uses Electron's default user data directory. Custom file locations will be added in Settings soon!

## Technical Details

See [DATA-PERSISTENCE-GUIDE.md](./DATA-PERSISTENCE-GUIDE.md) for architecture details.
