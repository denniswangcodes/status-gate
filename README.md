# Monitor Dashboard — Setup Guide

A full-screen dashboard for your third monitor showing:
- **BTC/ETH** prices (CoinGecko API — free, no key needed)
- **Stocks** (Finnhub API — your key)
- **World Clocks** — Los Angeles, Taipei, India, New York (native Intl API, no key needed)
- **US News** (NewsAPI — your key)

---

## Quick Start

### 1. Install Node.js
Download from https://nodejs.org (LTS version)

### 2. Install dependencies
```
cd monitor-dashboard
npm install
```

### 3. Run the app
```
npm start
```

The app opens fullscreen on your **third monitor** (display index 2).  
If you only have 2 monitors, it uses the last one.

---

## Keyboard shortcuts
| Key | Action |
|-----|--------|
| `Escape` | Quit the app |
| `F5` | Reload / refresh all data |

---

## Editing your stock watchlist
Click the **EDIT** button in the Stocks panel corner.  
Enter up to 8 comma-separated tickers (e.g. `AAPL, NVDA, TSLA`).  
Your list is saved in localStorage and persists across restarts.

---

## Windows Auto-Start
The app uses `auto-launch` to register itself with Windows startup.
It will launch automatically when Windows starts.

To **disable** auto-start, open Task Manager → Startup Apps → Disable "MonitorDashboard".

---

## Sleep / Wake
- On **sleep**: the display hides (avoids stale data showing)
- On **wake**: waits 3 seconds for network, then refreshes all panels

---

## Build a standalone .exe
```
npm run build
```
Output goes to `/dist/`. Run the installer and it will auto-start on login.

---

## API Notes

| Service | API | Refresh |
|---------|-----|---------|
| Bitcoin/ETH | CoinGecko (free) | Every 60s |
| Stocks | Finnhub | Every 60s |
| US News | NewsAPI | Every 5min |
| Clocks | Native JS Intl | Every 1s |

### NewsAPI browser restriction
NewsAPI blocks browser requests in production (CORS policy).  
**Fix**: In `main.js`, add a simple Express proxy or use Electron's main process with `node-fetch`:

```js
// In main.js, add an IPC handler:
const { ipcMain } = require('electron');
const fetch = require('node-fetch');

ipcMain.handle('fetch-news', async () => {
  const r = await fetch(`https://newsapi.org/v2/top-headlines?country=us&pageSize=10&apiKey=ubN7MVSm99kJX54ayB2kKBnP7ZkZB8NVuPxdBUin`);
  return r.json();
});
```

Then in preload.js expose it via contextBridge, and call it from index.html.
This bypasses CORS completely since it runs in Node.
