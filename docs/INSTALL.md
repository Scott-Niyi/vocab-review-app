# Installation Guide

## Quick Install (Recommended)

### macOS / Linux

```bash
cd vocab-review-app
./setup.sh
```

Or with auto-start:
```bash
./setup.sh --start
```

### Windows

Double-click `setup.bat` or run in Command Prompt:
```cmd
cd vocab-review-app
setup.bat
```

## Manual Installation

### 1. Prerequisites

- **Node.js 20+** (recommended)
  - Download from https://nodejs.org/
  - Verify: `node -v` should show v20.x.x or higher

- **npm 9+** (comes with Node.js)
  - Verify: `npm -v`

### 2. Install Dependencies

```bash
cd vocab-review-app
npm install
```

This installs:
- React & React DOM
- Electron
- Vite (build tool)
- TypeScript
- Testing libraries
- All other dependencies

### 3. Build Electron Code

```bash
npm run build:electron
```

### 4. Start the Application

```bash
npm run dev
```

This will:
1. Start Vite dev server on http://localhost:5173
2. Open Electron window automatically
3. Enable hot reload for development

## Troubleshooting

### Electron window doesn't open

**Solution 1**: Wait a few seconds for Vite to fully start

**Solution 2**: Rebuild and restart
```bash
npm run build:electron
npm run dev
```

**Solution 3**: Check if port 5173 is in use
```bash
# macOS/Linux
lsof -ti:5173 | xargs kill -9

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Permission denied on setup.sh

```bash
chmod +x setup.sh
./setup.sh
```

### npm install fails

**Clear cache and retry**:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors

```bash
npm run build:electron
```

### Port already in use

Change the port in `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 5174  // Change this
  }
})
```

Then update `package.json` scripts to use the new port.

## Useful Commands

```bash
# Development
npm run dev              # Start dev server + Electron
npm run dev:vite         # Start Vite only
npm run dev:electron     # Start Electron only
npm run reopen           # Reopen Electron window

# Building
npm run build            # Full production build
npm run build:vite       # Build React app only
npm run build:electron   # Compile TypeScript only

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:algorithm   # Test spaced repetition

# Maintenance
npm run clean            # Remove build artifacts
npm run clean:cache      # Clear Vite cache
npm run setup            # Reinstall everything
```

## Verifying Installation

After installation, you should see:

1. ✅ Electron window opens
2. ✅ "Select Project" screen appears
3. ✅ Can select `wordlist-imported-vocab-v3`
4. ✅ Review mode loads with words
5. ✅ Can navigate with keyboard shortcuts

## Data Location

Your vocabulary data is stored at:

- **macOS**: `~/Library/Application Support/Electron/user-data/`
- **Windows**: `%APPDATA%\Electron\user-data\`
- **Linux**: `~/.config/Electron/user-data/`

Or in project folders like `wordlist-imported-vocab-v3/`.

## Next Steps

1. Read [README.md](./README.md) for feature overview
2. Check [QUICK-START.md](./QUICK-START.md) for usage guide
3. See [IPA-INPUT-GUIDE.md](./IPA-INPUT-GUIDE.md) for IPA shortcuts
4. Configure AI features in [CLOUD-LLM-SETUP-GUIDE.md](./CLOUD-LLM-SETUP-GUIDE.md)

## Getting Help

- Check [README.md](./README.md) troubleshooting section
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- Open an issue on GitHub
