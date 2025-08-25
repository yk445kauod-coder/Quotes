
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config();

// AI Imports
const { getSmartSuggestions, SmartSuggestionInputSchema } = require('../src/ai/flows/smart-suggestion-tool');
const { getItemDescriptionSuggestion, ItemDescriptionInputSchema } = require('../src/ai/flows/item-description-suggestion-flow');


const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const startUrl = isDev
    ? 'http://localhost:9003' // Dev server URL
    : `file://${path.join(__dirname, '../out/index.html')}`; // Production build path

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  // Handle Smart Suggestions IPC call
  ipcMain.handle('getSmartSuggestions', async (event, details) => {
    try {
      const validatedDetails = SmartSuggestionInputSchema.parse(details);
      return await getSmartSuggestions(validatedDetails);
    } catch (error) {
      console.error('AI suggestion error:', error);
      // It's better to throw the error so the client can handle it
      throw error;
    }
  });

  // Handle Item Description Suggestion IPC call
  ipcMain.handle('getItemDescriptionSuggestion', async (event, context) => {
    try {
        const validatedContext = ItemDescriptionInputSchema.parse(context);
        return await getItemDescriptionSuggestion(validatedContext);
    } catch (error) {
        console.error('AI item description error:', error);
        throw error;
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
