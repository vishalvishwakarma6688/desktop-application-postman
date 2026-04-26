import { contextBridge, ipcRenderer } from 'electron';

const SEND_CHANNELS = ['toMain', 'oauth:open', 'updater:start-download', 'updater:install'] as const;

const RECEIVE_CHANNELS = [
    'fromMain',
    'oauth:callback',
    'updater:log',
    'updater:update-available',
    'updater:download-progress',
    'updater:update-downloaded',
] as const;

const INVOKE_CHANNELS = ['dialog:openFile', 'app:getPath'] as const;

contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel: string, data?: unknown) => {
        if ((SEND_CHANNELS as readonly string[]).includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel: string, func: (...args: unknown[]) => void) => {
        if ((RECEIVE_CHANNELS as readonly string[]).includes(channel)) {
            ipcRenderer.on(channel, (_event, ...args) => func(...args));
        }
    },
    invoke: (channel: string, ...args: unknown[]) => {
        if ((INVOKE_CHANNELS as readonly string[]).includes(channel)) {
            return ipcRenderer.invoke(channel, ...args);
        }
    },
});

contextBridge.exposeInMainWorld('appInfo', {
    platform: process.platform,
    version: process.versions.electron,
});
