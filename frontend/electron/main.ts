import { app, BrowserWindow, shell, ipcMain, globalShortcut } from 'electron';
import pkg from 'electron-updater';
import * as path from 'path';
import { Menu } from 'electron';
import { fileURLToPath } from 'url';
import { setupIpcHandlers } from './ipc/handlers.js';

const { autoUpdater } = pkg;

// ES module polyfills for __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

Menu.setApplicationMenu(null);

// Configure auto-updater to use GitHub releases
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
// Point to GitHub releases for update checks
autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'vishalvishwakarma6688',
    repo: 'desktop-application-postman',
});

let mainWindow: BrowserWindow | null = null;

if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('postmanlike', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('postmanlike');
}

const handleOAuthCallback = (url: string) => {
    if (!mainWindow) return;
    mainWindow.webContents.send('oauth:callback', url);
    mainWindow.focus();
};

// Send a message to the renderer — safe to call any time
const sendToRenderer = (channel: string, ...args: any[]) => {
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
        mainWindow.webContents.send(channel, ...args);
    }
};

const setupAutoUpdater = () => {
    autoUpdater.on('checking-for-update', () => {
        console.log('[AutoUpdater] Checking for update...');
        sendToRenderer('updater:log', '[AutoUpdater] Checking for update...');
    });

    autoUpdater.on('update-available', (info) => {
        const msg = `[AutoUpdater] Update available: v${info.version}`;
        console.log(msg);
        sendToRenderer('updater:log', msg);
        // Ask the user if they want to download
        sendToRenderer('updater:update-available', { version: info.version });
    });

    autoUpdater.on('update-not-available', (info) => {
        const msg = `[AutoUpdater] App is up to date (v${info.version})`;
        console.log(msg);
        sendToRenderer('updater:log', msg);
    });

    autoUpdater.on('error', (err) => {
        const msg = `[AutoUpdater] Error: ${err?.message || err}`;
        console.error(msg);
        sendToRenderer('updater:log', msg);
    });

    autoUpdater.on('download-progress', (progressObj) => {
        const msg = `[AutoUpdater] Downloading: ${Math.round(progressObj.percent)}% (${Math.round(progressObj.bytesPerSecond / 1024)} KB/s)`;
        console.log(msg);
        sendToRenderer('updater:log', msg);
        sendToRenderer('updater:download-progress', { percent: Math.round(progressObj.percent) });
    });

    autoUpdater.on('update-downloaded', (info) => {
        const msg = `[AutoUpdater] Update v${info.version} downloaded — ready to install`;
        console.log(msg);
        sendToRenderer('updater:log', msg);
        sendToRenderer('updater:update-downloaded', { version: info.version });
    });

    // Wait 3 seconds after window is ready before checking — ensures renderer is listening
    setTimeout(() => {
        console.log('[AutoUpdater] Starting update check...');
        autoUpdater.checkForUpdates().catch((err) => {
            console.error('[AutoUpdater] checkForUpdates failed:', err?.message || err);
        });
    }, 3000);
};

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
        titleBarStyle: 'default',
        show: false,
    });

    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
        // For testing: Open DevTools in production builds too
        // Comment this line out for final release
        mainWindow.webContents.openDevTools();
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
        // Start updater only after window is fully shown and renderer is ready
        if (app.isPackaged) {
            setupAutoUpdater();
        }
    });

    mainWindow.on('closed', () => { mainWindow = null; });
};

app.whenReady().then(() => {
    setupIpcHandlers();

    ipcMain.on('oauth:open', (_event, url: string) => {
        shell.openExternal(url);
    });

    // Handle user clicking "Download Update" in the UI
    ipcMain.on('updater:start-download', () => {
        console.log('[AutoUpdater] User confirmed download — starting...');
        autoUpdater.downloadUpdate().catch((err) => {
            console.error('[AutoUpdater] Download failed:', err?.message || err);
            sendToRenderer('updater:log', `[AutoUpdater] Download failed: ${err?.message || err}`);
        });
    });

    // Handle user clicking "Install & Restart" in the UI
    ipcMain.on('updater:install', () => {
        console.log('[AutoUpdater] User confirmed install — restarting...');
        autoUpdater.quitAndInstall();
    });

    // Register global shortcut to toggle DevTools (F12 or Ctrl+Shift+I)
    globalShortcut.register('F12', () => {
        if (mainWindow) {
            if (mainWindow.webContents.isDevToolsOpened()) {
                mainWindow.webContents.closeDevTools();
            } else {
                mainWindow.webContents.openDevTools();
            }
        }
    });

    globalShortcut.register('CommandOrControl+Shift+I', () => {
        if (mainWindow) {
            if (mainWindow.webContents.isDevToolsOpened()) {
                mainWindow.webContents.closeDevTools();
            } else {
                mainWindow.webContents.openDevTools();
            }
        }
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            Menu.setApplicationMenu(null);
            createWindow();
        }
    });
});

// macOS: handle deep link when app is already running
app.on('open-url', (_event, url) => {
    handleOAuthCallback(url);
});

// Windows/Linux: handle deep link via second-instance
app.on('second-instance', (_event, commandLine) => {
    const url = commandLine.find(arg => arg.startsWith('postmanlike://'));
    if (url) handleOAuthCallback(url);
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }
});

// Make app single-instance so deep links work on Windows
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// Cleanup global shortcuts when app quits
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
