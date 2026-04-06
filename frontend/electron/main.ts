import { app, BrowserWindow, shell, ipcMain, protocol } from 'electron';
import * as path from 'path';
import { Menu } from 'electron';
import { setupIpcHandlers } from './ipc/handlers';

Menu.setApplicationMenu(null);

let mainWindow: BrowserWindow | null = null;

// Register custom protocol for OAuth callback
// The backend will redirect to: postmanlike://oauth-callback#token=<jwt>
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
