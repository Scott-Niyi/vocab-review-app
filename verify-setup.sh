#!/bin/bash

# Verification script for vocab-review-app file persistence setup
# This script checks if the app is properly configured for file system storage

echo "🔍 Verifying Vocab Review App Setup..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the vocab-review-app directory."
    exit 1
fi

echo "✅ Found package.json"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found. Running npm install..."
    npm install
else
    echo "✅ node_modules exists"
fi

# Check if Electron is installed
if [ ! -d "node_modules/electron" ]; then
    echo "❌ Electron not installed. Please run: npm install"
    exit 1
fi

echo "✅ Electron is installed"

# Check if TypeScript files are compiled
if [ ! -d "dist-electron" ]; then
    echo "⚠️  Electron files not compiled. Building..."
    npm run build:electron
else
    echo "✅ Electron files compiled"
fi

# Check if FileSystemStore exists
if [ ! -f "src/services/FileSystemStore.ts" ]; then
    echo "❌ FileSystemStore.ts not found!"
    exit 1
fi

echo "✅ FileSystemStore.ts exists"

# Check if services/index.ts uses FileSystemStore
if grep -q "FileSystemStore" "src/services/index.ts"; then
    echo "✅ services/index.ts imports FileSystemStore"
else
    echo "❌ services/index.ts does not import FileSystemStore!"
    echo "   This means the app is still using LocalStorageStore."
    exit 1
fi

# Check if Electron main.ts has IPC handlers
if grep -q "fs:readFile" "electron/main.ts"; then
    echo "✅ Electron IPC handlers configured"
else
    echo "❌ Electron IPC handlers not found in main.ts!"
    exit 1
fi

# Check if preload.ts exposes file system APIs
if grep -q "electronAPI" "electron/preload.ts"; then
    echo "✅ Electron preload script configured"
else
    echo "❌ Electron preload script not properly configured!"
    exit 1
fi

echo ""
echo "🎉 All checks passed! File persistence is properly configured."
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Add a test word in the app"
echo "3. Check the file location:"
echo "   macOS: ~/Library/Application Support/Electron/user-data/vocabulary.json"
echo "   Windows: %APPDATA%\\Electron\\user-data\\vocabulary.json"
echo "   Linux: ~/.config/Electron/user-data/vocabulary.json"
echo ""
echo "See TEST-FILE-PERSISTENCE.md for detailed testing instructions."
