import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  fs: {
    readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:writeFile', filePath, content),
    exists: (filePath: string) => ipcRenderer.invoke('fs:exists', filePath),
    getStats: (filePath: string) => ipcRenderer.invoke('fs:getStats', filePath),
    getUserDataPath: () => ipcRenderer.invoke('fs:getUserDataPath'),
    listFiles: (dirPath?: string) => ipcRenderer.invoke('fs:listFiles', dirPath),
    selectFile: () => ipcRenderer.invoke('fs:selectFile'),
    selectProjectFolder: () => ipcRenderer.invoke('fs:selectProjectFolder'),
    createNewProject: () => ipcRenderer.invoke('fs:createNewProject'),
    getRecentProjects: () => ipcRenderer.invoke('fs:getRecentProjects'),
    exportProject: (projectPath: string) => ipcRenderer.invoke('fs:exportProject', projectPath),
    saveImage: (projectPath: string, imageData: string, fileName?: string) => ipcRenderer.invoke('fs:saveImage', projectPath, imageData, fileName),
    getImagePath: (projectPath: string, relativePath: string) => ipcRenderer.invoke('fs:getImagePath', projectPath, relativePath),
    // Logging-specific operations
    appendToFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:appendToFile', filePath, content),
    ensureDirectory: (dirPath: string) => ipcRenderer.invoke('fs:ensureDirectory', dirPath),
    fileExists: (filePath: string) => ipcRenderer.invoke('fs:fileExists', filePath),
  },
});

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: {
      fs: {
        readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
        writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
        exists: (filePath: string) => Promise<{ success: boolean; exists?: boolean; error?: string }>;
        getStats: (filePath: string) => Promise<{ success: boolean; mtime?: string; error?: string }>;
        getUserDataPath: () => Promise<{ success: boolean; path?: string }>;
        listFiles: (dirPath?: string) => Promise<{ success: boolean; files?: string[]; error?: string }>;
        selectFile: () => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
        selectProjectFolder: () => Promise<{ success: boolean; projectPath?: string; canceled?: boolean; error?: string }>;
        createNewProject: () => Promise<{ success: boolean; projectPath?: string; canceled?: boolean; error?: string }>;
        getRecentProjects: () => Promise<{ success: boolean; projects?: Array<{name: string; path: string; lastModified: string; wordCount: number}>; error?: string }>;
        exportProject: (projectPath: string) => Promise<{ success: boolean; exportPath?: string; canceled?: boolean; error?: string }>;
        saveImage: (projectPath: string, imageData: string, fileName?: string) => Promise<{ success: boolean; relativePath?: string; error?: string }>;
        getImagePath: (projectPath: string, relativePath: string) => Promise<{ success: boolean; dataUrl?: string; error?: string }>;
        // Logging-specific operations
        appendToFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
        ensureDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
        fileExists: (filePath: string) => Promise<{ success: boolean; exists?: boolean; error?: string }>;
      };
    };
  }
}

export {};
