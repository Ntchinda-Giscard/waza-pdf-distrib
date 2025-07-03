// electron/main.js - This is the "brain" of your desktop app
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  // Create the browser window that will display your Next.js app
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Security settings - prevents direct Node.js access from web content
      nodeIntegration: false,
      contextIsolation: true,
      // This connects our preload script that acts as a safe bridge
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load your Next.js development server
  // In production, you'd load a built version instead
  mainWindow.loadURL('http://localhost:3000');
  
  // Open DevTools in development (optional)
  // mainWindow.webContents.openDevTools();
}

// This is the heart of our folder picker functionality
// It listens for requests from the frontend and opens the native folder dialog
ipcMain.handle('open-folder-picker', async () => {
  try {
    // showOpenDialog opens the native file/folder picker
    // Think of this as calling the operating system's built-in folder selector
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'], // Only allow folder selection, not files
      title: 'Select a Folder',
      buttonLabel: 'Choose This Folder'
    });

    // The dialog returns an object with information about what the user selected
    if (result.canceled) {
      // User clicked "Cancel" or pressed Escape
      return { 
        success: false, 
        path: null, 
        message: 'User canceled folder selection' 
      };
    }

    // User selected a folder - filePaths[0] contains the absolute path
    const selectedPath = result.filePaths[0];
    console.log('Main process: User selected folder:', selectedPath);
    
    return { 
      success: true, 
      path: selectedPath,
      message: 'Folder selected successfully'
    };
    
  } catch (error) {
    // Handle any errors that might occur
    console.error('Main process: Error opening folder picker:', error);
    return { 
      success: false, 
      path: null, 
      error: error.message 
    };
  }
});

// Standard Electron app lifecycle management
app.whenReady().then(() => {
  createWindow();

  // On macOS, re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});