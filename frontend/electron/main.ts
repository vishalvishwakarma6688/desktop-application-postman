import { app, BrowserWindow, shell, ipcMain, protocol } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import { Menu } from 'electron';
import { fileURLToPath } from 'url';
import { setupIpcHandlers } from './ipc/handlers.js';

// ES module polyfills for __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

Menu.setApplicationMenu(null);

let mainWindow: BrowserWindow | null = null;

autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
});

autoUpdater.on('update-available', () => {
    console.log('Update available');
});

autoUpdater.on('update-not-available', () => {
    console.log('No updates');
});

autoUpdater.on('error', (err) => {
    console.error('Update error:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
    console.log(`Downloading: ${progressObj.percent}%`);
});

autoUpdater.on('update-downloaded', () => {
    console.log('Update downloaded');
    autoUpdater.quitAndInstall();
});


if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('postmanlike', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('postmanlike');
}

const handleOAuthCallback = (url: string) => {
    if (!mainWindow) return;
    // Forward the deep-link URL to the renderer so it can extract the token
    mainWindow.webContents.send('oauth:callback', url);
    mainWindow.focus();
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
    }

    mainWindow.once('ready-to-show', () => mainWindow?.show());
    mainWindow.on('closed', () => { mainWindow = null; });
};

app.whenReady().then(() => {
    setupIpcHandlers();

    // IPC: open OAuth URL in real system browser
    ipcMain.on('oauth:open', (_event, url: string) => {
        shell.openExternal(url);
    });

    createWindow();

    if (app.isPackaged) {
        autoUpdater.checkForUpdatesAndNotify();
    }

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
