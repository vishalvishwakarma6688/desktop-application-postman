import { contextBridge, ipcRenderer } from 'electron';

const SEND_CHANNELS = ['toMain', 'oauth:open', 'updater:start-download', 'updater:install'] as const;

const RECEIVE_CHANNELS = [
    'fromMain',
    'oauth:callback',
    'updater:log',
    'updater:update-available',
    'updater:download-progress',
    'updater:update-downloaded',
    'health:status-change',
    'p2p:peers-updated',
    'p2p:share-prompt',
    'stress:metrics-tick',
    'stress:complete',
    'git:branch-changed',
] as const;

const INVOKE_CHANNELS = [
    'dialog:openFile',
    'app:getPath',
    'dialog:openDirectory',
    'fs:writeFiles',
    'fs:readFiles',
    'git:run',
    'vault:isAvailable',
    'vault:encrypt',
    'vault:decrypt',
    'lan:start',
    'lan:stop',
    'health:register',
    'health:run-sweep',
    'p2p:start',
    'p2p:stop',
    'p2p:send-invite',
    'stress:start',
    'stress:stop',
    'git:watch-branch',
    'git:unwatch-branch',
] as const;

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
    removeListener: (channel: string) => {
        if ((RECEIVE_CHANNELS as readonly string[]).includes(channel)) {
            ipcRenderer.removeAllListeners(channel);
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

console.log('[APIFlow Preload] Preload script loaded and electronAPI exposed.');
