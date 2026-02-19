import { useState, useEffect } from 'react';
import WordCard from './components/WordCard';
import Navigation from './components/Navigation';
import Library from './components/Library';
import AddWord from './components/AddWord';
import Tags from './components/Tags';
import EditModal from './components/EditModal';
import Settings from './components/Settings';
import VocabularySelector from './components/VocabularySelector';
import { VocabularyEntry } from './types/vocabulary';
import { getDataStore, getLogger, updateLoggerForProject } from './services';
import './App.css';

interface ReviewedWord {
  entry: VocabularyEntry;
  rating: number;
}

type ViewMode = 'review' | 'library' | 'add' | 'tags';

function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('review');
  const [sessionActive, setSessionActive] = useState(true);
  const [reviewedWords, setReviewedWords] = useState<ReviewedWord[]>([]);
  const [editingWord, setEditingWord] = useState<VocabularyEntry | null>(null);
  const [vocabulary, setVocabulary] = useState<VocabularyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedProjectPath, setSelectedProjectPath] = useState<string | null>(null);
  const [isElectron, setIsElectron] = useState<boolean | null>(null); // null = checking, true/false = checked
  
  // 新增：复习队列状态
  const [reviewQueue, setReviewQueue] = useState<VocabularyEntry[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [navigationStack, setNavigationStack] = useState<number[]>([]); // 导航栈，记录跳转历史
  const [showQueuePreview, setShowQueuePreview] = useState(false);

  let dataStore, logger;
  try {
    dataStore = getDataStore();
    logger = getLogger();
  } catch (error) {
    console.error('Failed to get services:', error);
    // Set error state instead of early return
    dataStore = null as any;
    logger = null as any;
  }

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  
  // Check if we're in Electron
  useEffect(() => {
    const checkElectron = typeof window !== 'undefined' && !!(window as any).electronAPI?.fs;
    setIsElectron(checkElectron);
  }, []);

  // Load vocabulary when project is selected
  useEffect(() => {
    if (!selectedProjectPath || !dataStore) {
      setLoading(false);
      return;
    }

    const loadVocabulary = async () => {
      setLoading(true);
      try {
        // Update logger for the new project path (enables file logging)
        await updateLoggerForProject(selectedProjectPath);
        
        // Get updated services
        const updatedDataStore = getDataStore();
        const updatedLogger = getLogger();
        
        // Set the project path in the store
        if ('setProjectPath' in updatedDataStore) {
          await (updatedDataStore as any).setProjectPath(selectedProjectPath);
        }

        const vocab = await updatedDataStore.getVocabulary();
        setVocabulary(vocab);
        
        // 加载初始复习队列
        const queue = await updatedDataStore.getReviewQueue(20);
        setReviewQueue(queue);
        setQueueIndex(0);
        
        updatedLogger.trackEvent('review_queue_generated', {
          wordCount: queue.length,
          selectionCriteria: 'spaced_repetition_algorithm'
        });
        
        updatedLogger.info('Vocabulary loaded', { count: vocab.length, project: selectedProjectPath });
        updatedLogger.trackEvent('project_opened', {
          projectPath: selectedProjectPath
        });
        
        // Load and apply font size setting
        if ('getConfig' in updatedDataStore) {
          const config = await (updatedDataStore as any).getConfig();
          const fontSize = config.contentFontSize ?? 1.0;
          document.documentElement.style.setProperty('--content-font-size-multiplier', fontSize.toString());
        }
      } catch (error) {
        logger.error('Failed to load vocabulary', error as Error);
      } finally {
        setLoading(false);
      }
    };

    loadVocabulary();
    
    // Cleanup: log project close when component unmounts or project changes
    return () => {
      if (selectedProjectPath) {
        logger.trackEvent('project_closed', {
          projectPath: selectedProjectPath
        });
      }
    };
  }, [selectedProjectPath, dataStore]);

  // If not in Electron mode, auto-select default
  useEffect(() => {
    if (!selectedProjectPath && isElectron === false) {
      setSelectedProjectPath('default');
    }
  }, [selectedProjectPath, isElectron]);

  // Keyboard shortcuts for view switching
  useEffect(() => {
    if (!dataStore || !logger) return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or if modal is open
      const target = e.target as HTMLElement;
      const isInInput = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.isContentEditable;
      
      // Don't handle shortcuts if modal is open
      if (editingWord || showSettings) {
        return;
      }
      
      // Cmd/Ctrl + Arrow keys: Navigate between views (but not when typing in inputs)
      if ((e.metaKey || e.ctrlKey) && !isInInput) {
        const views: ViewMode[] = ['review', 'library', 'tags', 'add'];
        const currentIndex = views.indexOf(currentView);
        
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const nextView = views[(currentIndex + 1) % views.length];
          setCurrentView(nextView);
          setEditingWord(null); // Clear editing state when switching views
          logger.trackEvent('view_switch', { view: nextView, method: 'keyboard_arrow' });
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const prevView = views[(currentIndex - 1 + views.length) % views.length];
          setCurrentView(prevView);
          setEditingWord(null); // Clear editing state when switching views
          logger.trackEvent('view_switch', { view: prevView, method: 'keyboard_arrow' });
        }
      }
      
      // View switching shortcuts (work everywhere except in inputs/modals)
      if ((e.metaKey || e.ctrlKey) && e.key === 'r' && !isInInput) {
        e.preventDefault();
        setCurrentView('review');
        setEditingWord(null); // Clear editing state when switching views
        logger.trackEvent('view_switch', { view: 'review', method: 'keyboard' });
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'l' && !isInInput) {
        e.preventDefault();
        setCurrentView('library');
        setEditingWord(null); // Clear editing state when switching views
        logger.trackEvent('view_switch', { view: 'library', method: 'keyboard' });
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !isInInput) {
        e.preventDefault();
        setCurrentView('add');
        setEditingWord(null); // Clear editing state when switching views
        logger.trackEvent('view_switch', { view: 'add', method: 'keyboard' });
      } else if ((e.metaKey || e.ctrlKey) && e.key === 't' && !isInInput) {
        e.preventDefault();
        setCurrentView('tags');
        setEditingWord(null); // Clear editing state when switching views
        logger.trackEvent('view_switch', { view: 'tags', method: 'keyboard' });
      }
      
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentView, sessionActive, editingWord, showSettings, dataStore, logger]);

  // NOW WE CAN DO CONDITIONAL RETURNS AFTER ALL HOOKS

  const handleProjectSelect = (projectPath: string) => {
    localStorage.setItem('vocab_project_path', projectPath);
    setSelectedProjectPath(projectPath);
  };

  // 从复习队列获取当前单词
  const currentWord = reviewQueue[queueIndex];

  // Handle service initialization failure
  if (!dataStore || !logger) {
    return (
      <div className="app-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <p style={{ color: '#ff4444', fontSize: '1rem' }}>Failed to initialize services. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  // Show loading while checking Electron environment
  if (isElectron === null) {
    return (
      <div className="app-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <p style={{ color: '#999', fontSize: '1rem' }}>Initializing...</p>
        </div>
      </div>
    );
  }

  // Show vocabulary selector if no project is selected AND in Electron mode
  if (!selectedProjectPath && isElectron) {
    return <VocabularySelector onSelect={handleProjectSelect} />;
  }

  const handleRate = async (rating: 1 | 2 | 3 | 4 | 5) => {
    try {
      const currentWord = reviewQueue[queueIndex];
      if (!currentWord) return;
      
      // Record this review
      setReviewedWords([...reviewedWords, { entry: currentWord, rating }]);
      
      // Update in data store
      await dataStore.recordReview(currentWord.id, rating);
      
      // 记录今日复习日志
      const today = new Date().toISOString().split('T')[0];
      logger.info(`[${today}] Reviewed word: ${currentWord.word}`, { 
        wordId: currentWord.id, 
        rating,
        date: today 
      });
      
      // Reload vocabulary to get updated stats
      const updatedVocab = await dataStore.getVocabulary();
      setVocabulary(updatedVocab);
      
      logger.trackEvent('word_reviewed', { wordId: currentWord.id, rating, date: today });
      
      // 清空导航栈（评分后继续顺序浏览，不保留跳转历史）
      setNavigationStack([]);
      
      // Move to next word in queue
      const nextIndex = queueIndex + 1;
      
      if (nextIndex >= reviewQueue.length) {
        // Queue ended, reload new queue
        const newQueue = await dataStore.getReviewQueue(20);
        if (newQueue.length === 0) {
          // 如果新队列为空，结束会话
          setSessionActive(false);
          logger.info('Session ended: no more words in queue');
        } else {
          setReviewQueue(newQueue);
          setQueueIndex(0);
          logger.trackEvent('review_queue_generated', {
            wordCount: newQueue.length,
            selectionCriteria: 'spaced_repetition_algorithm'
          });
        }
      } else {
        setQueueIndex(nextIndex);
      }
    } catch (error) {
      logger.error('Failed to record review', error as Error, { wordId: currentWord?.id });
    }
  };

  const handleNavigateToWord = (wordId: number) => {
    // 在复习队列中查找目标单词
    const targetIndex = reviewQueue.findIndex(w => w.id === wordId);
    
    if (targetIndex !== -1) {
      // 单词已在队列中，直接跳转
      setNavigationStack([...navigationStack, queueIndex]);
      setQueueIndex(targetIndex);
      logger.trackEvent('navigate_to_word', { wordId, fromIndex: queueIndex, toIndex: targetIndex });
    } else {
      // 单词不在队列中，需要添加
      const targetWord = vocabulary.find(w => w.id === wordId);
      if (targetWord) {
        // 在当前位置后插入新单词（而不是添加到末尾）
        // 这样可以保持导航栈的索引有效
        const newQueue = [
          ...reviewQueue.slice(0, queueIndex + 1),
          targetWord,
          ...reviewQueue.slice(queueIndex + 1)
        ];
        const newIndex = queueIndex + 1;
        
        setNavigationStack([...navigationStack, queueIndex]);
        setReviewQueue(newQueue);
        setQueueIndex(newIndex);
        logger.trackEvent('navigate_to_word', { wordId, addedToQueue: true, insertedAt: newIndex });
      } else {
        logger.warn('Target word not found in vocabulary', { wordId });
      }
    }
  };

  const handleBack = () => {
    if (navigationStack.length > 0) {
      // 从导航栈弹出上一个位置（处理hyperlink跳转的返回）
      const newStack = [...navigationStack];
      const previousIndex = newStack.pop()!;
      setNavigationStack(newStack);
      setQueueIndex(previousIndex);
      logger.trackEvent('navigate_back', { toIndex: previousIndex, viaStack: true });
    } else if (queueIndex > 0) {
      // 如果没有导航栈，就简单地后退一个（正常的顺序后退）
      setQueueIndex(queueIndex - 1);
      logger.trackEvent('navigate_back', { viaStack: false });
    }
  };

  const handleForward = () => {
    // 修复：应该检查是否在队列范围内，而不是reviewedWords
    if (queueIndex < reviewQueue.length - 1) {
      setQueueIndex(queueIndex + 1);
      logger.trackEvent('navigate_forward');
    }
  };

  const handleEndSession = () => {
    setSessionActive(false);
    logger.trackEvent('session_ended', { wordsReviewed: reviewedWords.length });
  };

  const handleRestart = async () => {
    try {
      // 重新加载复习队列
      const queue = await dataStore.getReviewQueue(20);
      setReviewQueue(queue);
      setQueueIndex(0);
      setSessionActive(true);
      setReviewedWords([]);
      setNavigationStack([]);
      logger.trackEvent('session_started', { queueSize: queue.length });
      logger.trackEvent('review_queue_generated', {
        wordCount: queue.length,
        selectionCriteria: 'spaced_repetition_algorithm'
      });
    } catch (error) {
      logger.error('Failed to start session', error as Error);
    }
  };

  const handleLibraryRate = async (wordId: number, rating: 1 | 2 | 3 | 4 | 5) => {
    try {
      // Update in data store
      await dataStore.recordReview(wordId, rating);
      
      // 记录今日复习日志
      const today = new Date().toISOString().split('T')[0];
      const word = vocabulary.find(w => w.id === wordId);
      if (word) {
        logger.info(`[${today}] Reviewed word in library: ${word.word}`, { 
          wordId, 
          rating,
          date: today 
        });
      }
      
      // Reload vocabulary to get updated stats
      const updatedVocab = await dataStore.getVocabulary();
      setVocabulary(updatedVocab);
      
      logger.trackEvent('word_reviewed_library', { wordId, rating, date: today });
    } catch (error) {
      logger.error('Failed to record library review', error as Error, { wordId });
    }
  };

  const handleEditWord = (word: VocabularyEntry) => {
    setEditingWord(word);
    logger.trackEvent('edit_word', { wordId: word.id, method: 'button' });
  };

  const handleSaveEdit = async (updatedEntry: VocabularyEntry) => {
    try {
      await dataStore.updateWord(updatedEntry);
      
      // 重新加载完整的vocabulary数组（确保包含所有最新数据）
      const updatedVocab = await dataStore.getVocabulary();
      setVocabulary(updatedVocab);
      
      // 从最新的vocabulary中找到更新后的单词，更新reviewQueue
      const latestWord = updatedVocab.find((w: VocabularyEntry) => w.id === updatedEntry.id);
      if (latestWord) {
        const updatedQueue = reviewQueue.map(word => 
          word.id === updatedEntry.id ? latestWord : word
        );
        setReviewQueue(updatedQueue);
      }
      
      setEditingWord(null);
      logger.info('Word updated', { wordId: updatedEntry.id });
      logger.trackEvent('word_updated', { wordId: updatedEntry.id });
    } catch (error) {
      logger.error('Failed to update word', error as Error, { wordId: updatedEntry.id });
    }
  };

  const handleWordAdded = async (word: Omit<VocabularyEntry, 'id'>) => {
    try {
      const newId = await dataStore.addWord(word);
      const updatedVocab = await dataStore.getVocabulary();
      setVocabulary(updatedVocab);
      setCurrentView('library');
      logger.info('Word added', { wordId: newId });
      logger.trackEvent('word_added', { wordId: newId });
    } catch (error) {
      logger.error('Failed to add word', error as Error);
    }
  };

  const handleNavigateToExisting = (word: VocabularyEntry) => {
    setCurrentView('library');
    logger.trackEvent('navigate_to_existing', { wordId: word.id });
  };

  const handleDeleteWord = async (wordId: number) => {
    try {
      await dataStore.deleteWord(wordId);
      const updatedVocab = await dataStore.getVocabulary();
      setVocabulary(updatedVocab);
      
      // 从复习队列中移除该单词
      const updatedQueue = reviewQueue.filter(word => word.id !== wordId);
      setReviewQueue(updatedQueue);
      
      // 如果当前正在复习这个单词，跳到下一个
      if (currentWord?.id === wordId && queueIndex < updatedQueue.length) {
        // 保持当前索引，因为删除后数组会自动前移
      } else if (queueIndex >= updatedQueue.length && updatedQueue.length > 0) {
        setQueueIndex(updatedQueue.length - 1);
      }
      
      logger.info('Word deleted', { wordId });
      logger.trackEvent('word_deleted', { wordId });
    } catch (error) {
      logger.error('Failed to delete word', error as Error, { wordId });
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <p style={{ color: '#999', fontSize: '1rem' }}>Loading vocabulary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navigation 
        currentView={currentView} 
        onViewChange={(view) => {
          setCurrentView(view);
          setEditingWord(null); // Clear editing state when switching views
          logger.trackEvent('view_switch', { view, method: 'click' });
        }}
        onSettingsClick={() => setShowSettings(true)}
      />

      {currentView === 'review' && !sessionActive && (
        <div className="summary-container">
          <div className="summary-card">
            <div className="summary-icon"></div>
            <h1 className="summary-title">Session Complete</h1>
            <p className="summary-subtitle">Review summary</p>

            <div className="summary-stats">
              <div className="summary-stat">
                <p className="summary-stat-label">Words Reviewed</p>
                <p className="summary-stat-value">{reviewedWords.length}</p>
              </div>
              <div className="summary-stat">
                <p className="summary-stat-label">Average Rating</p>
                <p className="summary-stat-value">
                  {reviewedWords.length > 0
                    ? (reviewedWords.reduce((sum, w) => sum + w.rating, 0) / reviewedWords.length).toFixed(1)
                    : 0}
                </p>
              </div>
            </div>

            <div className="summary-ratings">
              <h3 className="summary-ratings-title">Words in this session</h3>
              {reviewedWords.map((item, idx) => (
                <div key={idx} className="rating-row">
                  <span className="rating-row-word">{item.entry.word}</span>
                  <div className="rating-row-score">
                    <span className="rating-value">{item.rating}/5</span>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleRestart} className="restart-button">
              Start New Session
            </button>
          </div>
        </div>
      )}

      {currentView === 'review' && sessionActive && currentWord && (
        <WordCard
          entry={currentWord}
          onRate={handleRate}
          onNavigateToWord={handleNavigateToWord}
          onBack={handleBack}
          onForward={handleForward}
          onEndSession={handleEndSession}
          onEdit={() => setEditingWord(currentWord)}
          canGoBack={navigationStack.length > 0 || queueIndex > 0}
          canGoForward={queueIndex < reviewQueue.length - 1}
          wordsReviewed={reviewedWords.length}
          currentIndex={queueIndex}
          totalInSession={Math.max(reviewedWords.length + 1, queueIndex + 1)}
          projectPath={selectedProjectPath || ''}
          vocabulary={vocabulary}
          reviewQueue={reviewQueue}
          showQueuePreview={showQueuePreview}
          onToggleQueuePreview={() => setShowQueuePreview(!showQueuePreview)}
        />
      )}

      {currentView === 'review' && sessionActive && !currentWord && (
        <div className="app-container">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '1rem' }}>
            <p style={{ color: '#999', fontSize: '1.2rem' }}>No vocabulary words yet</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Add some words to start reviewing</p>
            <button 
              onClick={() => setCurrentView('add')}
              style={{ 
                padding: '0.75rem 1.5rem', 
                fontSize: '1rem', 
                background: '#000', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Word
            </button>
          </div>
        </div>
      )}

      <div style={{ display: currentView === 'library' ? 'block' : 'none' }}>
        <Library 
          vocabulary={vocabulary} 
          onEditWord={handleEditWord} 
          onRateWord={handleLibraryRate}
          onDeleteWord={handleDeleteWord}
          projectPath={selectedProjectPath || ''} 
        />
      </div>

      <div style={{ display: currentView === 'tags' ? 'block' : 'none' }}>
        <Tags
          vocabulary={vocabulary}
          onWordClick={handleEditWord}
          onEditWord={handleEditWord}
          onRateWord={handleLibraryRate}
          onDeleteWord={handleDeleteWord}
          projectPath={selectedProjectPath || ''}
        />
      </div>

      <div style={{ display: currentView === 'add' ? 'block' : 'none' }}>
        <AddWord
          vocabulary={vocabulary}
          onWordAdded={handleWordAdded}
          onNavigateToExisting={handleNavigateToExisting}
          projectPath={selectedProjectPath || ''}
        />
      </div>

      {editingWord && (
        <EditModal
          entry={editingWord}
          vocabulary={vocabulary}
          onSave={handleSaveEdit}
          onClose={() => setEditingWord(null)}
          projectPath={selectedProjectPath || ''}
        />
      )}

      {showSettings && (
        <Settings 
          onClose={() => setShowSettings(false)}
          onProjectSwitch={(newProjectPath) => {
            setSelectedProjectPath(newProjectPath);
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
