# Development Log

## Session: 2026-01-30

### Completed Features

#### 1. Natural Pronunciation (Respelling) Field
- Added `respelling` field to VocabularyEntry type
- Display format: `/IPA/ · RESPELLING` (e.g., `/bʌlk/ · BULK`)
- Only show pronunciation line if IPA or respelling exists (no empty `//`)
- Integrated into AddWord, EditModal, WordCard, and Library
- LLM Assistant placeholder for future AI generation

#### 2. IPA Input Component with Auto-completion
- Created `IPAInput` component with TIPA-style shortcuts
- Tab key to confirm IPA symbol insertion
- Floating suggestion popup with symbol preview
- Quick reference panel showing all available shortcuts
- Comprehensive documentation in `IPA-INPUT-GUIDE.md`

#### 3. RichTextInput Enhancements
- Keyboard shortcuts: Cmd/Ctrl+B (bold), Cmd/Ctrl+K (link)
- Bold insertion auto-selects placeholder text
- Preview toggle button with real-time formatting
- Link picker with ↑↓ navigation and Enter to confirm
- Clean, rounded button design with consistent sizing

#### 4. Variants Display Optimization
- Changed from separate boxes to inline display: `main-word | variant1 | variant2`
- Same font size, weight, and color as main word
- No italic styling - clean and equal presentation

#### 5. Definition-Specific Examples
- Two-level example hierarchy:
  - Definition-specific examples (nested under each definition)
  - Global examples (apply to all definitions)
- Both AddWord and EditModal support this structure

#### 6. Sub-Definitions (Derived Phrases)
- Support for phrases like "in bulk", "bulk up"
- Each sub-definition has:
  - Phrase input
  - Definition text (with RichTextInput support)
  - Optional examples
- Fully editable in both AddWord and EditModal
- Preserved during edit operations

#### 7. Review Mode Improvements
- Edit button in review mode (both clickable and E key)
- End Session button (both clickable and ESC key)
- Buttons placed above rating panel for visibility
- Word title remains centered
- Updated keyboard hints to include E key

#### 8. UI Polish
- Removed all emoji, replaced with text labels
- Rounded buttons with `border-radius: 4px`
- Consistent button sizing with `min-width: 50px`
- Softer hover effects
- Clean, minimalist aesthetic

### Design Principles Established

#### 1. Keyboard-First Design
- All actions must be accessible via keyboard
- Minimize mouse usage
- Always provide both keyboard shortcuts AND clickable buttons

#### 2. Dual Input Methods
- Every feature must support both keyboard and mouse
- Update hints/documentation when adding features
- Example: E key + Edit button, ESC key + End Session button

#### 3. Add/Edit Consistency
- AddWord and EditModal must have identical features
- Same UI structure and layout
- Same functionality and behavior
- **Rule**: All display features must be editable through Add or Edit modes

#### 4. Minimalist Theme
- Black/white/gray color palette only
- Thin borders (1px)
- Light font weights (200-300)
- No emoji in UI elements
- Clean, professional appearance

#### 5. Typography
- Examples are NOT italic
- Bold text preserved from LaTeX markup
- Hyperlinks inline in text
- Variants same style as main word (no italic, same size/color)
- Sub-phrases not italic

#### 6. Review Mode Behavior
- Definition hidden by default (Space/Tab to reveal)
- Session never auto-ends (user presses ESC manually)
- Progress shows "X words reviewed" (not "X/Y")
- Selected rating must be VERY obvious (3px border, scale, black background)

#### 7. Data Structure
- User-added words get ID > 1000
- Support word variants (multiple spellings)
- Support sub-definitions (derived phrases)
- Support definition-specific AND global examples
- Optional fields: don't show empty placeholders

#### 8. Technical
- Use localStorage for now (SQLite migration planned)
- Auto-merge mockData with user data based on MOCK_DATA_VERSION
- IPA input based on TIPA package shortcuts
- Natural respelling uses CAPS for stressed syllables

### Files Modified Today
- `src/types/vocabulary.ts` - Added respelling field
- `src/components/AddWord.tsx` - All new features
- `src/components/EditModal.tsx` - All new features
- `src/components/WordCard.tsx` - Edit button, pronunciation display
- `src/components/Library.tsx` - Pronunciation display, variants
- `src/components/RichTextInput.tsx` - Keyboard shortcuts, preview, link picker
- `src/components/IPAInput.tsx` - New component
- `src/data/mockData.ts` - Added respelling examples, incremented version to 4
- `src/App.css` - All styling updates
- `IPA-INPUT-GUIDE.md` - New documentation

### Known Issues / Future Work
- LLM Assistant integration (placeholders in place)
- SQLite database migration
- Cross-platform considerations
- iOS support
- Logging system
- Spaced repetition algorithm refinement

---

## Next Steps Discussion

### Architecture Concerns for Production

#### 1. Cross-Platform Support
**Current State**: Electron app (desktop only)

**Concerns**:
- Need to support iOS/mobile
- Consider React Native or web-based approach
- Electron is heavy for mobile

**Recommendations**:
- Keep React components platform-agnostic
- Abstract platform-specific code (file system, database)
- Consider Progressive Web App (PWA) for mobile
- Or React Native with shared business logic

#### 2. Database Strategy
**Current State**: localStorage with mockData merge

**Concerns**:
- localStorage has size limits (~5-10MB)
- No relational queries
- No sync across devices
- Performance issues with large datasets

**Recommendations**:
- **Desktop**: SQLite via better-sqlite3 (Electron)
- **Mobile**: SQLite via expo-sqlite (React Native) or IndexedDB (PWA)
- **Sync**: Consider cloud backend (Firebase, Supabase, or custom)
- **Migration path**: 
  1. Create data abstraction layer now
  2. Implement localStorage adapter
  3. Add SQLite adapter later
  4. Add cloud sync adapter eventually

#### 3. LLM Integration
**Current State**: Placeholder buttons

**Concerns**:
- API costs (OpenAI, Anthropic)
- Privacy (sending user data to external APIs)
- Offline functionality
- Rate limiting

**Recommendations**:
- **Architecture**: 
  - Create LLM service abstraction
  - Support multiple providers (OpenAI, Anthropic, local models)
  - Allow user to configure API keys
- **Features to implement**:
  - Generate IPA pronunciation
  - Generate natural respelling
  - Generate example sentences
  - Suggest definitions
- **Privacy**: 
  - User opt-in for cloud LLM
  - Option for local models (Ollama, llama.cpp)
  - Clear data usage policy

#### 4. Logging System
**Current State**: None

**Concerns**:
- No error tracking
- No usage analytics
- Hard to debug user issues
- No performance monitoring

**Recommendations**:
- **Error Logging**:
  - Implement error boundary in React
  - Log to file (desktop) or cloud service
  - Include stack traces, user actions, app state
- **Usage Analytics** (privacy-respecting):
  - Track feature usage (which buttons clicked)
  - Review session statistics
  - Performance metrics (load times, lag)
  - NO personal data or word content
- **Debug Logging**:
  - Development mode verbose logging
  - Production mode error-only
  - Log rotation to prevent disk fill
- **Tools to consider**:
  - Sentry (error tracking)
  - PostHog (privacy-first analytics)
  - Custom logging to local files

#### 5. Data Abstraction Layer Design

```typescript
// Proposed architecture

interface IDataStore {
  // Vocabulary operations
  getVocabulary(): Promise<VocabularyEntry[]>;
  getWord(id: number): Promise<VocabularyEntry | null>;
  addWord(entry: VocabularyEntry): Promise<number>;
  updateWord(entry: VocabularyEntry): Promise<void>;
  deleteWord(id: number): Promise<void>;
  
  // Review operations
  getReviewQueue(): Promise<VocabularyEntry[]>;
  recordReview(wordId: number, rating: number): Promise<void>;
  
  // Sync operations (future)
  sync(): Promise<void>;
  getLastSyncTime(): Promise<Date | null>;
}

// Implementations
class LocalStorageStore implements IDataStore { ... }
class SQLiteStore implements IDataStore { ... }
class CloudStore implements IDataStore { ... }
```

#### 6. LLM Service Abstraction

```typescript
interface ILLMService {
  generateIPA(word: string): Promise<string>;
  generateRespelling(word: string, ipa: string): Promise<string>;
  generateExamples(word: string, definition: string): Promise<string[]>;
  suggestDefinitions(word: string): Promise<string[]>;
}

// Implementations
class OpenAIService implements ILLMService { ... }
class AnthropicService implements ILLMService { ... }
class LocalLLMService implements ILLMService { ... }
```

#### 7. Logging Service

```typescript
interface ILogger {
  error(message: string, error: Error, context?: any): void;
  warn(message: string, context?: any): void;
  info(message: string, context?: any): void;
  debug(message: string, context?: any): void;
  
  // Analytics
  trackEvent(event: string, properties?: any): void;
  trackTiming(metric: string, duration: number): void;
}

// Implementations
class ConsoleLogger implements ILogger { ... }
class FileLogger implements ILogger { ... }
class SentryLogger implements ILogger { ... }
```

### Immediate Next Steps

1. **Create data abstraction layer**
   - Define interfaces
   - Implement localStorage adapter
   - Refactor App.tsx to use abstraction

2. **Add basic error logging**
   - React error boundary
   - Console logging in development
   - File logging in production

3. **Plan LLM integration**
   - Design API interface
   - Create mock implementation for testing
   - Add settings UI for API keys

4. **Consider mobile strategy**
   - Evaluate PWA vs React Native
   - Test current UI on mobile browsers
   - Plan responsive design improvements

Would you like me to start implementing any of these architectural improvements?
