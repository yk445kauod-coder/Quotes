// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

// We expose a controlled API to the renderer process (our Next.js app)
contextBridge.exposeInMainWorld('electronAPI', {
  getSmartSuggestions: (args) => ipcRenderer.invoke('getSmartSuggestions', args),
  getItemDescriptionSuggestion: (args) => ipcRenderer.invoke('getItemDescriptionSuggestion', args),
});
