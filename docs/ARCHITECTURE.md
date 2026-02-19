# Architecture Documentation

## Overview

The Vocabulary Review App follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────┐
│         UI Components               │
│  (React Components)                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         App.tsx                     │
│  (Application State & Logic)        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Service Layer                  │
│  - IDataStore (data operations)     │
│  - ILogger (logging & analytics)    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Storage Layer                  │
│  - LocalStorage (current)           │
│  - SQLite (future)                  │
│  - Cloud Sync (future)              │
└─────────────────────────────────────┘
```

## Service Layer

### IDataStore Interface

The `IDataStore` interface abstracts all data operations, allowing easy swapping of storage implementations.

**Current Implementation**: `LocalStorageStore`
- Uses browser localStorage
- Handles mock data merging
- Manages user ID counter (>1000 for user words)

**Future Implementations**:
- `SQLiteStore` - For desktop app with better-sqlite3
- `CloudStore` - For cloud sync with Firebase/Supabase
- `IndexedDBStore` - For PWA with larger storage

**Key Methods**:
```typescript
interface IDataStore {
  // Initialization
  initialize(): Promise<void>;
  
  // CRUD operations
  getVocabulary(): Promise<VocabularyEntry[]>;
  getWord(id: number): Promise<VocabularyEntry | null>;
  addWord(entry: Omit<VocabularyEntry, 'id'>): Promise<number>;
  updateWord(entry: VocabularyEntry): Promise<void>;
  deleteWord(id: number): Promise<void>;
  
  // Review operations
  recordReview(wordId: number, rating: 1 | 2 | 3 | 4 | 5): Promise<void>;
  getReviewQueue(limit?: number): Promise<VocabularyEntry[]>;
  
  // Data management
  exportData(): Promise<string>;
  importData(data: string): Promise<void>;
  clearAllData(): Promise<void>;
}
```

### ILogger Interface

The `ILogger` interface provides logging and analytics capabilities.

**Current Implementation**: `ConsoleLogger`
- Logs to browser console
- Supports log levels (DEBUG, INFO, WARN, ERROR)
- Optional analytics tracking

**Future Implementations**:
- `FileLogger` - Write logs to file (Electron)
- `SentryLogger` - Send errors to Sentry
- `PostHogLogger` - Privacy-first analytics

**Key Methods**:
```typescript
interface ILogger {
  // Logging
  error(message: string, error?: Error, context?: any): void;
  warn(message: string, context?: any): void;
  info(message: string, context?: any): void;
  debug(message: string, context?: any): void;
  
  // Analytics
  trackEvent(event: string, properties?: Record<string, any>): void;
  trackTiming(metric: string, duration: number): void;
}
```

## Service Container

The `ServiceContainer` class implements the Singleton pattern and provides dependency injection:

```typescript
// Initialize services at app startup
await initializeServices();

// Access services anywhere in the app
const dataStore = getDataStore();
const logger = getLogger();
```

## Data Flow

### Adding a Word

```
User Input (AddWord.tsx)
  ↓
App.tsx: handleWordAdded()
  ↓
DataStore: addWord()
  ↓
LocalStorage: save
  ↓
DataStore: getVocabulary()
  ↓
App.tsx: setVocabulary()
  ↓
UI Update
```

### Recording a Review

```
User Rating (WordCard.tsx)
  ↓
App.tsx: handleRate()
  ↓
DataStore: recordReview()
  ↓
Update familiarity score
  ↓
LocalStorage: save
  ↓
Logger: trackEvent('word_reviewed')
  ↓
UI Update
```

## Migration Path

### Phase 1: Current (localStorage)
- ✅ Service abstraction layer
- ✅ LocalStorageStore implementation
- ✅ Basic logging

### Phase 2: SQLite (Desktop)
- Create SQLiteStore implementation
- Use better-sqlite3 in Electron
- Migrate data from localStorage
- Keep localStorage as fallback

### Phase 3: Cloud Sync
- Create CloudStore implementation
- Implement sync logic
- Handle conflicts
- Offline-first approach

### Phase 4: Mobile Support
- React Native with expo-sqlite
- Or PWA with IndexedDB
- Share business logic
- Platform-specific UI adaptations

## Future Enhancements

### LLM Integration

Create `ILLMService` interface:

```typescript
interface ILLMService {
  generateIPA(word: string): Promise<string>;
  generateRespelling(word: string, ipa: string): Promise<string>;
  generateExamples(word: string, definition: string): Promise<string[]>;
  suggestDefinitions(word: string): Promise<string[]>;
}
```

Implementations:
- `OpenAIService` - Using OpenAI API
- `AnthropicService` - Using Claude API
- `LocalLLMService` - Using Ollama/llama.cpp

### Spaced Repetition Algorithm

Enhance `getReviewQueue()` to implement:
- SM-2 algorithm (SuperMemo)
- Or Anki's algorithm
- Consider review history
- Optimal scheduling

### Analytics & Monitoring

Track (privacy-respecting):
- Feature usage
- Performance metrics
- Error rates
- User engagement
- NO personal data or word content

### Error Handling

Implement:
- React Error Boundary
- Graceful degradation
- User-friendly error messages
- Automatic error reporting (opt-in)

## Testing Strategy

### Unit Tests
- Service implementations
- Data transformations
- Business logic

### Integration Tests
- Service layer interactions
- Data persistence
- Mock data merging

### E2E Tests
- User workflows
- Cross-component interactions
- Data consistency

## Performance Considerations

### Current
- localStorage is synchronous (blocking)
- No pagination (loads all words)
- No caching

### Future Optimizations
- Async storage (SQLite, IndexedDB)
- Pagination for large datasets
- Virtual scrolling in Library
- Memoization of expensive computations
- Service Worker for offline support

## Security Considerations

### Data Privacy
- All data stored locally by default
- Cloud sync opt-in only
- No telemetry without consent
- Clear data usage policy

### API Keys
- User-provided API keys for LLM
- Stored securely (Electron: keytar, Web: encrypted localStorage)
- Never logged or transmitted except to intended service

### Input Validation
- Sanitize user input
- Prevent XSS in rich text
- Validate imported data

## Deployment

### Desktop (Electron)
- Package with electron-builder
- Auto-update support
- Platform-specific installers

### Web (PWA)
- Service Worker for offline
- App manifest
- Installable

### Mobile (Future)
- React Native
- App Store / Play Store
- Or PWA with mobile optimizations

---

## Getting Started for Developers

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Run Electron app**:
   ```bash
   npm run electron:dev
   ```

## Adding a New Storage Implementation

1. Create new class implementing `IDataStore`
2. Implement all required methods
3. Add to service initialization in `services/index.ts`
4. Test with existing UI (should work without changes)

Example:
```typescript
export class SQLiteStore implements IDataStore {
  async initialize(): Promise<void> {
    // Setup SQLite connection
  }
  
  async getVocabulary(): Promise<VocabularyEntry[]> {
    // Query from SQLite
  }
  
  // ... implement other methods
}
```

## Contributing

See `DEVELOPMENT-LOG.md` for design principles and conventions.

Key principles:
- Keyboard-first design
- Add/Edit consistency
- Minimalist aesthetic
- Privacy-respecting
- Platform-agnostic business logic
