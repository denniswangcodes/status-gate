const { app, BrowserWindow, powerMonitor, ipcMain } = require('electron');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// ── Auto-start on Windows login ──────────────────────────────────────────────
const AutoLaunch = require('auto-launch');
const dashLauncher = new AutoLaunch({ name: 'MonitorDashboard', path: app.getPath('exe') });
dashLauncher.isEnabled().then(en => { if (!en) dashLauncher.enable(); });

let win;

function getTargetDisplay() {
  const { screen } = require('electron');
  const displays = screen.getAllDisplays();
  // Use the third monitor (index 2) if available, else last one
  return displays[2] || displays[displays.length - 1];
}

function createWindow() {
  const { screen } = require('electron');
  const target = getTargetDisplay();
  const { x, y, width, height } = target.bounds;

  win = new BrowserWindow({
    x, y,
    width, height,
    frame: false,
    fullscreen: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));

  // ── Sleep / Wake handling ──────────────────────────────────────────────────
  powerMonitor.on('suspend', () => {
    if (win && !win.isDestroyed()) {
      win.webContents.executeJavaScript('document.body.style.visibility="hidden"');
    }
  });

  powerMonitor.on('resume', () => {
    setTimeout(() => {
      if (win && !win.isDestroyed()) {
        win.webContents.executeJavaScript(`
          document.body.style.visibility="visible";
          fetchCrypto && fetchCrypto();
          fetchStocks && fetchStocks();
          fetchNews   && fetchNews();
          updateClocks && updateClocks();
        `);
      }
    }, 3000); // short delay for network to reconnect after wake
  });

  // ── Keyboard: Escape to quit, F5 to reload ────────────────────────────────
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape') app.quit();
    if (input.key === 'F5') win.reload();
  });
}

// ── News fetch via main process (bypasses CORS) ───────────────────────────
ipcMain.handle('fetch-news', (event, apiKey) => {
  return new Promise((resolve, reject) => {
    const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&country=us&language=en&size=5`;
    https.get(url, { headers: { 'User-Agent': 'MonitorDashboard/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e.message); }
      });
    }).on('error', e => reject(e.message));
  });
});

// ── CoinMarketCap fetch via main process (bypasses CORS) ─────────────────────
ipcMain.handle('fetch-crypto-cmc', (event, apiKey) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'pro-api.coinmarketcap.com',
      path: '/v1/cryptocurrency/quotes/latest?symbol=BTC,ETH,DOGE&convert=USD',
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json',
        'User-Agent': 'MonitorDashboard/1.0'
      }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e.message); }
      });
    }).on('error', e => reject(e.message));
  });
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
