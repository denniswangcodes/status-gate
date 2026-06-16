const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  fetchNews:      (apiKey) => ipcRenderer.invoke('fetch-news', apiKey),
  fetchCryptoCMC: (apiKey) => ipcRenderer.invoke('fetch-crypto-cmc', apiKey),
  openNewsLink:   (url)    => ipcRenderer.invoke('open-news-link', url)
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('[Monitor Dashboard] Renderer ready');
});
