# Testing Startup Fix

## What was fixed:
- Removed auto-loading of last project from localStorage in FileSystemStore constructor
- App now ALWAYS shows VocabularySelector on startup
- User must explicitly choose which project to open every time

## How to test:

1. **Close the app completely** (if it's running)
2. **Reopen the app**
3. **Expected behavior**: You should see the VocabularySelector screen with:
   - "Create New Project" button
   - "Open Existing Project" button
   - List of recent projects (if any)
4. **You should NOT see**: The app loading directly into the last project

## What changed:

### FileSystemStore.ts (line 28)
**Before:**
```typescript
this.projectPath = projectPath || localStorage.getItem(CONFIG_KEY) || '';
```

**After:**
```typescript
// DO NOT auto-load from localStorage - user must explicitly select project
this.projectPath = projectPath || '';
```

### App.tsx (lines 43-48)
Already commented out (from previous session):
```typescript
// 不再自动加载上次的项目，每次启动都让用户选择
// useEffect(() => {
//   const savedProject = localStorage.getItem('vocab_project_path');
//   if (savedProject) {
//     setSelectedProjectPath(savedProject);
//   }
// }, []);
```

## Result:
✅ App will ALWAYS show project selector on startup
✅ No auto-loading from localStorage
✅ User has full control over which project to open
