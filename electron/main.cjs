const { app, BrowserWindow, ipcMain, Menu, nativeImage, Notification, session, shell, Tray } = require('electron');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const APP_PORT = 41731;
const MAX_TIMER_DELAY = 2_147_000_000;
const APP_ICON = path.join(__dirname, '..', 'assets', 'desktop', 'icon.png');
const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
};
const WEB_PREFERENCES = {
  preload: path.join(__dirname, 'preload.cjs'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
};
const schedules = new Map();
let mainWindow = null;
let staticServer = null;
let tray = null;
let quitting = false;
let appStartUrl = null;
const listWindows = new Set();
let scheduleFile = null;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

function showWindow() {
  if (!mainWindow) return;
  mainWindow.show();
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
}

function createWindow(startUrl) {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 760,
    minHeight: 600,
    show: false,
    backgroundColor: '#FFF7F4',
    title: 'Loopy Reminders',
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    icon: APP_ICON,
    webPreferences: WEB_PREFERENCES,
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const currentOrigin = new URL(mainWindow.webContents.getURL()).origin;
    if (new URL(url).origin === currentOrigin) return;
    event.preventDefault();
    if (url.startsWith('https://')) void shell.openExternal(url);
  });
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('close', (event) => {
    if (quitting) return;
    event.preventDefault();
    mainWindow.hide();
  });
  mainWindow.on('closed', () => { mainWindow = null; });
  void mainWindow.loadURL(startUrl);
}

function createListWindow(listId) {
  if (typeof listId !== 'string' || !appStartUrl) return;
  const window = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 620,
    minHeight: 480,
    backgroundColor: '#FFF7F4',
    title: 'Loopy Reminders',
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    icon: APP_ICON,
    webPreferences: WEB_PREFERENCES,
  });
  listWindows.add(window);
  window.on('closed', () => listWindows.delete(window));
  void window.loadURL(new URL(`/list/${encodeURIComponent(listId)}`, appStartUrl).toString());
}

function configureWebCompatibility() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Cross-Origin-Opener-Policy': ['same-origin'],
        'Cross-Origin-Embedder-Policy': ['credentialless'],
      },
    });
  });
}

function createTray() {
  const image = nativeImage.createFromPath(APP_ICON).resize({ width: 18, height: 18 });
  tray = new Tray(image);
  tray.setToolTip('Loopy Reminders');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open Loopy Reminders', click: showWindow },
    { type: 'separator' },
    { label: 'Quit', click: () => { quitting = true; app.quit(); } },
  ]));
  tray.on('click', showWindow);
}

function scheduleTimer(entry) {
  const remaining = entry.dueAt - Date.now();
  if (remaining <= 0) {
    schedules.delete(entry.id);
    persistSchedules();
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: entry.title,
        subtitle: 'Loopy Reminders',
        body: entry.body,
        sound: 'default',
        icon: APP_ICON,
      });
      notification.on('click', () => { showWindow(); mainWindow?.webContents.send('loopy:notification-clicked', entry.reminderId); });
      notification.show();
    } else {
      console.warn('Desktop notifications are unavailable; showing Loopy instead.');
    }
    // macOS can silently suppress notifications from unsigned local builds.
    // Always surface the due reminder in the app so it cannot be missed.
    showWindow();
    if (process.platform === 'darwin' && app.dock) app.dock.bounce('critical');
    return;
  }
  entry.timer = setTimeout(() => scheduleTimer(entry), Math.min(remaining, MAX_TIMER_DELAY));
}

function persistSchedules() {
  if (!scheduleFile) return;
  try {
    fs.writeFileSync(scheduleFile, JSON.stringify([...schedules.values()].map(({ timer, ...entry }) => entry)), 'utf8');
  } catch (error) { console.warn('Unable to persist reminder schedules:', error); }
}

function restoreSchedules() {
  if (!scheduleFile) return;
  try {
    const entries = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));
    if (!Array.isArray(entries)) return;
    for (const input of entries) {
      if (!input || typeof input.id !== 'string' || typeof input.dueAt !== 'number' || input.dueAt <= Date.now()) continue;
      const entry = { id: input.id, reminderId: String(input.reminderId), title: String(input.title), body: String(input.body), dueAt: input.dueAt, timer: null };
      schedules.set(entry.id, entry);
      scheduleTimer(entry);
    }
    persistSchedules();
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn('Unable to restore reminder schedules:', error);
  }
}

function registerIpc() {
  ipcMain.handle('loopy:lists:open-window', (_event, listId) => createListWindow(listId));
  ipcMain.handle('loopy:notifications:list', () => [...schedules.keys()]);
  ipcMain.handle('loopy:notifications:schedule', (_event, input) => {
    if (!input || typeof input.id !== 'string' || typeof input.dueAt !== 'number') throw new Error('Invalid notification request.');
    const previous = schedules.get(input.id);
    if (previous?.timer) clearTimeout(previous.timer);
    const entry = { id: input.id, reminderId: String(input.reminderId), title: String(input.title), body: String(input.body), dueAt: input.dueAt, timer: null };
    schedules.set(entry.id, entry);
    persistSchedules();
    scheduleTimer(entry);
    return entry.id;
  });
  ipcMain.handle('loopy:notifications:cancel', (_event, id) => {
    const entry = schedules.get(id);
    if (entry?.timer) clearTimeout(entry.timer);
    schedules.delete(id);
    persistSchedules();
  });
}

function contentType(filePath) {
  return CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function startStaticServer() {
  const root = path.resolve(__dirname, '..', 'dist-web');
  staticServer = http.createServer((request, response) => {
    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    response.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    let filePath = path.resolve(root, '.' + pathname);
    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end();
      return;
    }
    if (pathname === '/' || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) filePath = path.join(root, 'index.html');
    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end('Not found');
        return;
      }
      response.writeHead(200, { 'Content-Type': contentType(filePath), 'Cache-Control': filePath.endsWith('index.html') ? 'no-store' : 'public, max-age=31536000, immutable' });
      response.end(data);
    });
  });
  return new Promise((resolve, reject) => {
    staticServer.once('error', reject);
    staticServer.listen(APP_PORT, '127.0.0.1', () => resolve('http://127.0.0.1:' + APP_PORT));
  });
}

app.on('second-instance', showWindow);
app.on('before-quit', () => { quitting = true; });
app.on('window-all-closed', () => { if (process.platform === 'darwin' && quitting) app.quit(); });
app.on('activate', () => { if (mainWindow) showWindow(); });

app.whenReady().then(async () => {
  app.setAppUserModelId('com.yathinm.loopyreminders.desktop');
  configureWebCompatibility();
  registerIpc();
  const devArg = process.argv.find((value) => value.startsWith('--dev-url='));
  const startUrl = devArg ? devArg.slice('--dev-url='.length) : await startStaticServer();
  appStartUrl = startUrl;
  scheduleFile = path.join(app.getPath('userData'), 'reminder-schedules.json');
  restoreSchedules();
  createWindow(startUrl);
  createTray();
}).catch((error) => { console.error(error); app.quit(); });

app.on('quit', () => { staticServer?.close(); });
