import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel: string, data: any) => {
        const validChannels = ['toMain', 'oauth:open'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel: string, func: (...args: any[]) => void) => {
        const validChannels = ['fromMain', 'oauth:callback', 'updater:log'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (_event, ...args) => func(...args));
        }
    },
    invoke: (channel: string, ...args: any[]) => {
        const validChannels = ['dialog:openFile', 'app:getPath'];
        if (validChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, ...args);
        }
    },
});

contextBridge.exposeInMainWorld('appInfo', {
    platform: process.platform,
    version: process.versions.electron,
});
