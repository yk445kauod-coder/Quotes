const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { getSmartSuggestions } = require('../src/ai/flows/smart-suggestion-tool');
const { getItemDescriptionSuggestion } = require('../src/ai/flows/item-description-suggestion-flow');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const loadURL = isDev
    ? 'http://localhost:9003'
    : `file://${path.join(__dirname, '../out/index.html')}`;

  win.loadURL(loadURL);

  if (isDev) {
    win.webContents.openDevTools();
  }
}

// Handle IPC calls from the renderer process
ipcMain.handle('getSmartSuggestions', async (event, args) => {
  return await getSmartSuggestions(args);
});

ipcMain.handle('getItemDescriptionSuggestion', async (event, args) => {
  return await getItemDescriptionSuggestion(args);
});


app.whenReady().then(() => {
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
