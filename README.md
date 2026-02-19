# Vocabulary Review System

An intelligent vocabulary learning application with spaced repetition algorithm, built with Electron, React, and TypeScript.

## ✨ Features

### 🧠 Smart Learning
- **Spaced Repetition Algorithm** - Words you struggle with appear more frequently
- **1-5 Rating System** - Accurate progress tracking (Don't know → Master)
- **Session History** - Track your daily review progress with detailed logs
- **Familiarity Scoring** - Visual feedback on your mastery level

### ⌨️ Keyboard-First Design
- **Review Mode**: `1-5` for direct rating, `Space/Tab` to reveal, `E` to edit, `ESC` to end
- **Navigation**: `← →` or `[ ]` to browse reviewed words, `Backspace` to go back
- **IPA Input**: Type shortcuts like `A` + `Tab` → `ɑ`, `S` + `Tab` → `ʃ`
- **Rich Text**: `Cmd/Ctrl+B` for bold, `Cmd/Ctrl+K` for hyperlinks

### 🔗 Advanced Features
- **Hyperlink Navigation** - Jump between related words with `[[word|text]]` syntax
- **Navigation Stack** - Browser-like back/forward through word jumps
- **Sub-definitions** - Support for phrases like "in bulk", "bulk up"
- **Definition-level Examples** - Examples tied to specific meanings

### 🖼️ Rich Content
- **Image Support** - Add visual aids to vocabulary entries
- **IPA Pronunciation** - Full International Phonetic Alphabet support
- **Respelling** - Natural pronunciation guides (e.g., "BULK")
- **Multiple Variants** - Track alternative spellings

### 🤖 AI-Powered (Optional)
- **Auto-generate IPA** - Convert words to phonetic notation
- **Generate Definitions** - AI-suggested meanings
- **Create Examples** - Context-aware example sentences
- **Smart Respelling** - Natural pronunciation from IPA

### 💾 Data Management
- **True File Persistence** - JSON files, not browser storage
- **Project Folders** - Organize vocabulary by topic/course
- **Import/Export** - Easy backup and sharing
- **LaTeX Converter** - Import from LaTeX wordlists
- **Cross-platform** - Works on macOS, Windows, Linux

### 📚 Three Modes
1. **Review** - Spaced repetition learning sessions
2. **Library** - Browse and edit your vocabulary
3. **Add Word** - Quick entry with AI assistance

## 🚀 Quick Start

### One-Command Setup

```bash
# Clone and setup
git clone <your-repo-url>
cd vocab-review-app
npm install
npm run dev
```

That's it! The app will open automatically.

### What Happens
1. ✅ Installs all dependencies (React, Electron, TypeScript, etc.)
2. ✅ Compiles TypeScript code
3. ✅ Starts Vite dev server (http://localhost:5173)
4. ✅ Opens Electron window

### First Time Setup
1. **Select a Project** - Choose `wordlist-imported-vocab-v3` to try sample data
2. **Start Reviewing** - Press `Space` to reveal definitions, `1-5` to rate
3. **Explore** - Try Library mode to browse, Add Word to create entries

## 📖 User Manual

### Review Mode

**Starting a Session**
- Click "Review" or press `Cmd/Ctrl+R`
- Words are selected based on spaced repetition algorithm
- Unfamiliar words appear more frequently

**Rating Words**
- `1` - Don't know (will appear very soon)
- `2` - Barely (appears soon)
- `3` - Familiar (moderate interval)
- `4` - Know well (longer interval)
- `5` - Master (longest interval)

**Navigation**
- `Space` or `Tab` - Reveal definition
- `1-5` - Direct rating
- `↑ ↓` or `j k` - Select rating
- `Enter` - Confirm selection
- `← →` or `[ ]` - Browse reviewed words
- `Backspace` - Go back
- `E` - Edit current word
- `w s` - Scroll word card
- `ESC` - End session

**Hyperlinks**
- Click underlined words to jump to their definitions
- Use `Backspace` or `←` to return
- Navigation stack tracks your jumps

### Library Mode

**Browsing**
- Search bar filters by word or definition
- Click any word to view details
- Edit button opens full editor

**Editing**
- Modify word, pronunciation, definitions
- Add/remove examples and images
- Create hyperlinks with `Cmd/Ctrl+K`
- Changes save automatically

### Add Word Mode

**Manual Entry**
- Fill in word, pronunciation, definitions
- Add examples with rich text formatting
- Upload images for visual learning

**AI Assistance** (requires API key)
- Generate IPA pronunciation
- Auto-create respelling
- Suggest definitions
- Generate example sentences

**Rich Text Formatting**
- `**bold**` for emphasis
- `[[target|display]]` for hyperlinks
- Preview shows formatted result

### Settings

**Project Management**
- Switch between vocabulary projects
- Create new projects
- Import/export data

**AI Configuration**
- Add OpenAI API key
- Enable/disable AI features
- Test connection

**Data Location**
- View where files are stored
- Access vocabulary.json directly
- Backup recommendations

## 🛠️ Development

### Prerequisites
- Node.js 20+ (recommended)
- npm 9+ or yarn

### Installation
```bash
npm install
```

### Development Mode
```bash
npm run dev
```

### Building
```bash
npm run build        # Build for production
npm run build:electron  # Compile Electron code only
```

### Testing
```bash
npm test                    # Run all tests
npm run test:algorithm      # Test spaced repetition
npm run test:watch          # Watch mode
```

### Reopen Electron Window
If you close the window but dev server is still running:
```bash
./reopen-electron.sh
# or
VITE_DEV_SERVER_URL=http://localhost:5173 npx electron .
```

## 📁 Project Structure

```
vocab-review-app/
├── electron/              # Electron main process
│   ├── main.ts           # IPC handlers, file operations
│   └── preload.ts        # Secure API exposure
├── src/
│   ├── components/       # React UI components
│   │   ├── WordCard.tsx  # Review interface
│   │   ├── Library.tsx   # Browse mode
│   │   ├── AddWord.tsx   # Entry form
│   │   └── EditModal.tsx # Edit interface
│   ├── services/         # Business logic
│   │   ├── FileSystemStore.ts    # File persistence
│   │   ├── LocalStorageStore.ts  # Browser fallback
│   │   └── OpenAIService.ts      # AI integration
│   ├── utils/
│   │   └── spacedRepetition.ts   # SR algorithm
│   └── types/
│       └── vocabulary.ts         # TypeScript types
├── default/              # Default vocabulary project
├── user-data/           # User projects (gitignored)
└── [project-name]/      # Custom vocabulary projects
    ├── vocabulary.json  # Word data
    ├── config.json      # Project settings
    ├── images/          # Word images
    └── logs/            # Review history
```

## 📚 Documentation

- [QUICK-START.md](./docs/QUICK-START.md) - Detailed getting started
- [IPA-INPUT-GUIDE.md](./docs/IPA-INPUT-GUIDE.md) - IPA shortcuts reference
- [CLOUD-LLM-SETUP-GUIDE.md](./docs/CLOUD-LLM-SETUP-GUIDE.md) - AI setup guide
- [DATA-FORMAT-SPECIFICATION.md](./docs/DATA-FORMAT-SPECIFICATION.md) - JSON schema
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System design
- [SPACED-REPETITION-IMPLEMENTATION.md](./docs/SPACED-REPETITION-IMPLEMENTATION.md) - Algorithm details

## 🔧 Troubleshooting

**Electron window doesn't open**
```bash
npm run build:electron
npm run dev
```

**Port 5173 already in use**
```bash
# Kill the process using the port
lsof -ti:5173 | xargs kill -9
npm run dev
```

**Data not persisting**
- Check Settings → Data Storage for file location
- Verify write permissions
- See [TEST-FILE-PERSISTENCE.md](./docs/TEST-FILE-PERSISTENCE.md)

**AI features not working**
- Add API key in Settings
- Check internet connection
- Verify API key validity
- See [CLOUD-LLM-SETUP-GUIDE.md](./docs/CLOUD-LLM-SETUP-GUIDE.md)

## 🔄 Importing LaTeX Wordlists

```bash
# Use the converter script
python3 latex_to_vocab_converter_v3.py

# Follow prompts to:
# 1. Select LaTeX file
# 2. Choose output folder name
# 3. Converter handles images automatically
```

See [QUICK-START-CONVERTER-V3.md](../QUICK-START-CONVERTER-V3.md) for details.

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

ISC

## 🙏 Acknowledgments

- Spaced repetition algorithm inspired by SuperMemo
- IPA input system based on TIPA LaTeX package
- UI design influenced by minimalist learning tools
