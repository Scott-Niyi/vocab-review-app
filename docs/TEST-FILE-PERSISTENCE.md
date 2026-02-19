# Test File Persistence

Follow these steps to verify that your vocabulary data is being saved to an actual JSON file.

## Prerequisites

Make sure you have dependencies installed:
```bash
cd vocab-review-app
npm install
```

## Test Steps

### 1. Start the Electron App

```bash
npm run dev
```

This will:
- Start the Vite dev server
- Launch the Electron desktop app
- Enable file system persistence

### 2. Add a Test Word

In the app:
1. Click the "Add Word" tab
2. Fill in a simple word (e.g., "test")
3. Add at least one definition
4. Click "Add to Library"

### 3. Verify File Was Created

Open a new terminal and run:

```bash
# On macOS (development mode uses "Electron" as app name)
cat ~/Library/Application\ Support/Electron/user-data/vocabulary.json

# Or open the folder in Finder
open ~/Library/Application\ Support/Electron/user-data/
```

**Expected Result**: You should see a JSON file with your vocabulary data, including:
- Mock vocabulary (IDs 1-1000)
- Your test word (ID > 1000)
- Metadata (version, lastModified, userIdCounter)

### 4. Test Persistence Across Restarts

1. **Close the Electron app completely** (Cmd+Q or close window)
2. **Restart the app**: `npm run dev`
3. **Check the Library tab**: Your test word should still be there! ✅

### 5. Test Cross-Browser Persistence

The data is stored in a file, not in browser localStorage, so:

1. Open the vocabulary.json file location
2. Copy the file to a backup location
3. Close the app
4. Delete or modify the vocabulary.json file
5. Restart the app
6. Restore your backup file
7. Restart the app again

Your data should be restored from the file!

## Troubleshooting

### "File not found"

Check if you're running in Electron mode:
```bash
# Make sure you see both processes running:
# - vite dev server
# - electron app
npm run dev
```

If you only see the Vite server, the Electron app didn't start. Check for errors in the terminal.

### "Data not persisting"

1. Open the app's DevTools (View → Toggle Developer Tools)
2. Check the Console for errors
3. Run this in the console to verify Electron APIs are available:
```javascript
console.log('Electron API available:', !!window.electronAPI);
console.log('File system API:', window.electronAPI?.fs);
```

Expected output:
```
Electron API available: true
File system API: {readFile: ƒ, writeFile: ƒ, exists: ƒ, ...}
```

### "Still using localStorage"

If the app is running in browser mode (http://localhost:5173), it will fall back to localStorage. Make sure you're running the Electron app, not just the browser.

## Verify in Settings

1. Open the app
2. Click "Settings" in the navigation
3. Look at the "Data Storage" section
4. You should see:
   - ✅ "Your vocabulary data is stored in a JSON file..."
   - The file path displayed
   - Export/Import buttons

If you see "⚠️ Running in browser mode", you're not in Electron mode.

## Success Criteria

✅ File exists at the expected location
✅ File contains your vocabulary data in JSON format
✅ Data persists after closing and reopening the app
✅ Settings page shows the file path
✅ Export button downloads the JSON file
✅ Import button can restore data from a backup

## Next Steps

Once file persistence is verified, you can:
- Add more vocabulary words
- Review words (data updates automatically)
- Export backups regularly
- Share vocabulary files with others
- Migrate to different computers by copying the JSON file

## Future Enhancements

Coming soon:
- [ ] Choose custom data file location in Settings
- [ ] Multiple vocabulary lists (switch between files)
- [ ] Cloud sync support
- [ ] Automatic backups
