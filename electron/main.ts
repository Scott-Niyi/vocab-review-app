import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// Get user data directory
const USER_DATA_DIR = path.join(app.getPath('userData'), 'user-data');

// Ensure user data directory exists
if (!fs.existsSync(USER_DATA_DIR)) {
  fs.mkdirSync(USER_DATA_DIR, { recursive: true });
}

// IPC handlers for file system operations
ipcMain.handle('fs:readFile', async (_, filePath: string) => {
  try {
    // filePath is now an absolute path to the file
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, data: content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
  try {
    // filePath is now an absolute path to the file
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:exists', async (_, filePath: string) => {
  try {
    // filePath is now an absolute path to the file
    return { success: true, exists: fs.existsSync(filePath) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:getStats', async (_, filePath: string) => {
  try {
    // filePath is now an absolute path to the file
    const stats = fs.statSync(filePath);
    return { success: true, mtime: stats.mtime.toISOString() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:getUserDataPath', async () => {
  // Return the default user data directory (for backward compatibility)
  return { success: true, path: USER_DATA_DIR };
});

ipcMain.handle('fs:listFiles', async (_, dirPath?: string) => {
  try {
    const targetDir = dirPath || USER_DATA_DIR;
    const files = fs.readdirSync(targetDir);
    return { success: true, files };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:selectFile', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      defaultPath: USER_DATA_DIR
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const selectedPath = result.filePaths[0];
    const fileName = path.basename(selectedPath);
    
    return { success: true, filePath: fileName };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:selectProjectFolder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
      title: 'Select Vocabulary Project Folder',
      buttonLabel: 'Open Project'
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const projectPath = result.filePaths[0];
    
    // Check if vocabulary.json exists
    const vocabFile = path.join(projectPath, 'vocabulary.json');
    if (!fs.existsSync(vocabFile)) {
      return { success: false, error: 'Not a valid project folder (vocabulary.json not found)' };
    }

    // Save to recent projects
    saveRecentProject(projectPath);
    
    return { success: true, projectPath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:createNewProject', async () => {
  try {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: 'Create New Vocabulary Project',
      buttonLabel: 'Create Project',
      defaultPath: path.join(app.getPath('documents'), 'VocabProjects', 'My Vocabulary'),
      properties: ['createDirectory']
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    const projectPath = result.filePath;
    
    // Create project directory
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    // Create logs directory
    const logsDir = path.join(projectPath, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }

    // Create initial vocabulary.json with sample data
    const vocabFile = path.join(projectPath, 'vocabulary.json');
    const initialData = {
      vocabulary: [
        {
          id: 1,
          word: "bulk",
          ipa: "bʌlk",
          respelling: "BULK",
          definitions: [
            {
              partOfSpeech: "n.",
              text: "the mass or size of something large"
            }
          ],
          familiarityScore: 0,
          timesReviewed: 0,
          timesCorrect: 0
        },
        {
          id: 2,
          word: "intractable",
          ipa: "ɪnˈtræktəbəl",
          respelling: "in-TRAK-tuh-buhl",
          definitions: [
            {
              partOfSpeech: "adj.",
              text: "hard to control or deal with"
            }
          ],
          familiarityScore: 0,
          timesReviewed: 0,
          timesCorrect: 0
        },
        {
          id: 3,
          word: "tackle",
          ipa: "ˈtækəl",
          respelling: "TAK-uhl",
          definitions: [
            {
              partOfSpeech: "v.",
              text: "to deal with"
            }
          ],
          familiarityScore: 0,
          timesReviewed: 0,
          timesCorrect: 0
        }
      ],
      version: 4,
      lastModified: new Date().toISOString(),
      userIdCounter: 1000
    };
    fs.writeFileSync(vocabFile, JSON.stringify(initialData, null, 2));

    // Create config.json
    const configFile = path.join(projectPath, 'config.json');
    const config = {
      projectName: path.basename(projectPath),
      createdAt: new Date().toISOString(),
      lastOpened: new Date().toISOString()
    };
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));

    // Save to recent projects
    saveRecentProject(projectPath);
    
    return { success: true, projectPath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:getRecentProjects', async () => {
  try {
    const recentFile = path.join(app.getPath('userData'), 'recent-projects.json');
    
    if (!fs.existsSync(recentFile)) {
      return { success: true, projects: [] };
    }

    const data = JSON.parse(fs.readFileSync(recentFile, 'utf-8'));
    const projects = [];

    for (const projectPath of data.projects || []) {
      if (!fs.existsSync(projectPath)) continue;

      const vocabFile = path.join(projectPath, 'vocabulary.json');
      if (!fs.existsSync(vocabFile)) continue;

      try {
        const vocabData = JSON.parse(fs.readFileSync(vocabFile, 'utf-8'));
        const stats = fs.statSync(vocabFile);
        
        projects.push({
          name: path.basename(projectPath),
          path: projectPath,
          lastModified: stats.mtime.toISOString(),
          wordCount: vocabData.vocabulary?.length || 0
        });
      } catch (error) {
        console.error(`Failed to load project ${projectPath}:`, error);
      }
    }

    return { success: true, projects };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:saveImage', async (_, projectPath: string, imageData: string, fileName?: string) => {
  try {
    // imageData is base64 data URL (e.g., "data:image/png;base64,...")
    // Extract the base64 part
    const matches = imageData.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      return { success: false, error: 'Invalid image data format' };
    }

    const extension = matches[1];
    const base64Data = matches[2];
    
    // Generate filename if not provided
    const finalFileName = fileName || `image-${Date.now()}.${extension}`;
    
    // Create images directory if it doesn't exist
    const imagesDir = path.join(projectPath, 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Save image file
    const imagePath = path.join(imagesDir, finalFileName);
    fs.writeFileSync(imagePath, Buffer.from(base64Data, 'base64'));

    // Return relative path (images/filename.ext)
    return { success: true, relativePath: `images/${finalFileName}` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:getImagePath', async (_, projectPath: string, relativePath: string) => {
  try {
    // Convert relative path to absolute path
    const absolutePath = path.join(projectPath, relativePath);
    
    if (!fs.existsSync(absolutePath)) {
      return { success: false, error: 'Image file not found' };
    }

    // Read image and convert to base64 data URL
    const imageBuffer = fs.readFileSync(absolutePath);
    const extension = path.extname(relativePath).slice(1);
    const base64Data = imageBuffer.toString('base64');
    const dataUrl = `data:image/${extension};base64,${base64Data}`;

    return { success: true, dataUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Logging-specific IPC handlers
ipcMain.handle('fs:appendToFile', async (_, filePath: string, content: string) => {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Append content to file
    fs.appendFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:ensureDirectory', async (_, dirPath: string) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:fileExists', async (_, filePath: string) => {
  try {
    return { success: true, exists: fs.existsSync(filePath) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:exportProject', async (_, projectPath: string) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: 'Export Vocabulary Project',
      buttonLabel: 'Export',
      defaultPath: path.join(app.getPath('documents'), path.basename(projectPath) + '-export'),
      properties: ['createDirectory']
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    const exportPath = result.filePath;
    
    // Create export directory
    if (!fs.existsSync(exportPath)) {
      fs.mkdirSync(exportPath, { recursive: true });
    }

    // Copy vocabulary.json
    const vocabFile = path.join(projectPath, 'vocabulary.json');
    if (fs.existsSync(vocabFile)) {
      fs.copyFileSync(vocabFile, path.join(exportPath, 'vocabulary.json'));
    }

    // Copy config.json
    const configFile = path.join(projectPath, 'config.json');
    if (fs.existsSync(configFile)) {
      fs.copyFileSync(configFile, path.join(exportPath, 'config.json'));
    }
    
    // Copy images directory
    const imagesDir = path.join(projectPath, 'images');
    if (fs.existsSync(imagesDir)) {
      const exportImagesDir = path.join(exportPath, 'images');
      fs.mkdirSync(exportImagesDir, { recursive: true });
      
      const imageFiles = fs.readdirSync(imagesDir);
      for (const file of imageFiles) {
        fs.copyFileSync(
          path.join(imagesDir, file),
          path.join(exportImagesDir, file)
        );
      }
    }

    // Copy logs directory
    const logsDir = path.join(projectPath, 'logs');
    const exportLogsDir = path.join(exportPath, 'logs');
    if (fs.existsSync(logsDir)) {
      fs.mkdirSync(exportLogsDir, { recursive: true });
      const logFiles = fs.readdirSync(logsDir);
      for (const file of logFiles) {
        fs.copyFileSync(
          path.join(logsDir, file),
          path.join(exportLogsDir, file)
        );
      }
    } else {
      fs.mkdirSync(exportLogsDir, { recursive: true });
    }

    return { success: true, exportPath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

function saveRecentProject(projectPath: string) {
  try {
    const recentFile = path.join(app.getPath('userData'), 'recent-projects.json');
    let data = { projects: [] as string[] };

    if (fs.existsSync(recentFile)) {
      data = JSON.parse(fs.readFileSync(recentFile, 'utf-8'));
    }

    // Remove if already exists
    data.projects = data.projects.filter(p => p !== projectPath);
    
    // Add to front
    data.projects.unshift(projectPath);
    
    // Keep only last 10
    data.projects = data.projects.slice(0, 10);

    fs.writeFileSync(recentFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save recent project:', error);
  }
}

function createWindow() {
  // Ensure app is ready before creating window
  if (!app.isReady()) {
    console.error('Attempted to create window before app is ready');
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Disable sandbox to allow preload script
    },
  });

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    // In production, __dirname is dist-electron/electron/
    // We need to go up two levels to reach dist-react
    mainWindow.loadFile(path.join(__dirname, '../../dist-react/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && app.isReady()) {
    createWindow();
  }
});
