import { ipcMain, dialog } from 'electron';

export const setupIpcHandlers = () => {
    // File dialog handler
    ipcMain.handle('dialog:openFile', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] },
            ],
        });
        return result;
    });

    // Get app path
    ipcMain.handle('app:getPath', async (event, name: string) => {
        const { app } = require('electron');
        return app.getPath(name as any);
    });
};
