// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

// We are not exposing any APIs to the renderer process in this basic setup.
// This file is here as a placeholder for future use if needed.
contextBridge.exposeInMainWorld('electronAPI', {
  // Example function:
  // myApiFunction: () => ipcRenderer.invoke('my-api-channel'),
});
