
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSmartSuggestions: (details) => ipcRenderer.invoke('getSmartSuggestions', details),
  getItemDescriptionSuggestion: (context) => ipcRenderer.invoke('getItemDescriptionSuggestion', context),
});
