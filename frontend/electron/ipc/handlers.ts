import { ipcMain, dialog, app, safeStorage } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { startLanServer, stopLanServer } from '../lanServer.js';

const execAsync = promisify(exec);
import { registerMonitors, triggerImmediateSweep, MonitoredRequest } from '../healthMonitor.js';

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

    // Directory chooser handler
    ipcMain.handle('dialog:openDirectory', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory', 'createDirectory'],
        });
        return result;
    });

    // Get app path
    ipcMain.handle('app:getPath', async (event, name: string) => {
        return app.getPath(name as any);
    });

    // File writing handler for local workspace sync
    ipcMain.handle('fs:writeFiles', async (_, { dirPath, collections, environments }) => {
        try {
            const fs = await import('fs/promises');
            const path = await import('path');

            // Ensure directories exist
            await fs.mkdir(path.join(dirPath, 'collections'), { recursive: true });
            await fs.mkdir(path.join(dirPath, 'environments'), { recursive: true });

            // Write workspace.json
            await fs.writeFile(
                path.join(dirPath, 'workspace.json'),
                JSON.stringify({ syncedAt: new Date().toISOString() }, null, 4),
                'utf8'
            );

            // Write collections
            for (const col of collections) {
                // Sanitize filename to avoid weird OS paths
                const fileName = col.name.replace(/[^a-z0-9_-]/gi, '_') + '.json';
                await fs.writeFile(
                    path.join(dirPath, 'collections', fileName),
                    JSON.stringify(col, null, 4),
                    'utf8'
                );
            }

            // Write environments
            for (const env of environments) {
                const fileName = env.name.replace(/[^a-z0-9_-]/gi, '_') + '.json';
                await fs.writeFile(
                    path.join(dirPath, 'environments', fileName),
                    JSON.stringify(env, null, 4),
                    'utf8'
                );
            }

            // Write a default .gitignore if not present
            const gitignorePath = path.join(dirPath, '.gitignore');
            try {
                await fs.access(gitignorePath);
            } catch {
                // File doesn't exist, create it
                await fs.writeFile(gitignorePath, '.DS_Store\nnode_modules/\n*.log\n', 'utf8');
            }

            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    });

    // File reading handler for local workspace sync
    ipcMain.handle('fs:readFiles', async (_, { dirPath }) => {
        try {
            const fs = await import('fs/promises');
            const path = await import('path');

            const collections: any[] = [];
            const environments: any[] = [];

            // Read collections
            const collectionsDir = path.join(dirPath, 'collections');
            try {
                const files = await fs.readdir(collectionsDir);
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const content = await fs.readFile(path.join(collectionsDir, file), 'utf8');
                        collections.push(JSON.parse(content));
                    }
                }
            } catch {
                // collections directory may not exist yet
            }

            // Read environments
            const environmentsDir = path.join(dirPath, 'environments');
            try {
                const files = await fs.readdir(environmentsDir);
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const content = await fs.readFile(path.join(environmentsDir, file), 'utf8');
                        environments.push(JSON.parse(content));
                    }
                }
            } catch {
                // environments directory may not exist yet
            }

            return { success: true, collections, environments };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    });

    // Git command runner handler
    ipcMain.handle('git:run', async (_, { dirPath, args }) => {
        try {
            // Basic args validation to avoid arbitrary shell command injection beyond git
            const cleanArgs = args.filter((arg: string) => typeof arg === 'string');

            // Construct safe git command
            const command = ['git', ...cleanArgs].map(arg => `"${arg.replace(/"/g, '\\"')}"`).join(' ');

            console.log(`[GIT EXEC] Running inside ${dirPath}: ${command}`);
            const { stdout, stderr } = await execAsync(command, { cwd: dirPath });
            return { success: true, stdout, stderr };
        } catch (err: any) {
            return { success: false, error: err.message, stderr: err.stderr, stdout: err.stdout };
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Secure Vault Handlers (Electron safeStorage API)
    // ─────────────────────────────────────────────────────────────────────────

    // Check if OS-level encryption is available
    ipcMain.handle('vault:isAvailable', async () => {
        try {
            const available = safeStorage.isEncryptionAvailable();
            return { available };
        } catch {
            return { available: false };
        }
    });

    // Encrypt a plaintext value using OS keychain
    ipcMain.handle('vault:encrypt', async (_, { value }: { value: string }) => {
        try {
            if (!safeStorage.isEncryptionAvailable()) {
                return { success: false, error: 'OS encryption not available on this machine.' };
            }
            const buffer = safeStorage.encryptString(value);
            const encryptedValue = buffer.toString('base64');
            console.log('[VAULT] Encrypted a secret variable.');
            return { success: true, encryptedValue };
        } catch (err: any) {
            console.error('[VAULT] Encrypt failed:', err.message);
            return { success: false, error: err.message };
        }
    });

    // Decrypt a Base64 cipher blob back to plaintext
    ipcMain.handle('vault:decrypt', async (_, { encryptedValue }: { encryptedValue: string }) => {
        try {
            if (!safeStorage.isEncryptionAvailable()) {
                return { success: false, error: 'OS encryption not available on this machine.' };
            }
            const buffer = Buffer.from(encryptedValue, 'base64');
            const value = safeStorage.decryptString(buffer);
            return { success: true, value };
        } catch (err: any) {
            console.error('[VAULT] Decrypt failed:', err.message);
            return { success: false, error: err.message };
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Local LAN Share Handlers
    // ─────────────────────────────────────────────────────────────────────────

    // Start sharing the workspace
    ipcMain.handle('lan:start', async (_, { payload }: { payload: string }) => {
        try {
            // Generate a random 4-digit PIN
            const pin = Math.floor(1000 + Math.random() * 9000).toString();
            const { port, ip } = await startLanServer(payload, pin);
            return { success: true, ip, port, pin };
        } catch (err: any) {
            console.error('[LAN SHARE] Start failed:', err.message);
            return { success: false, error: err.message };
        }
    });

    // Stop sharing the workspace
    ipcMain.handle('lan:stop', async () => {
        try {
            stopLanServer();
            return { success: true };
        } catch (err: any) {
            console.error('[LAN SHARE] Stop failed:', err.message);
            return { success: false, error: err.message };
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Background Health Monitor Handlers
    // ─────────────────────────────────────────────────────────────────────────

    // Sync monitored requests list from renderer
    ipcMain.handle('health:register', async (_, { requests }: { requests: MonitoredRequest[] }) => {
        try {
            registerMonitors(requests);
            return { success: true };
        } catch (err: any) {
            console.error('[HEALTH MON] Register failed:', err.message);
            return { success: false, error: err.message };
        }
    });

    // Trigger an immediate manual health sweep
    ipcMain.handle('health:run-sweep', async () => {
        try {
            triggerImmediateSweep();
            return { success: true };
        } catch (err: any) {
            console.error('[HEALTH MON] Sweep failed:', err.message);
            return { success: false, error: err.message };
        }
    });
};
