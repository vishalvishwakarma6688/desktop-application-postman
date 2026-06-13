import { workspaceApi } from '@/features/workspace/api';

/**
 * Automatically exports the database state of the workspace collections and environments
 * to the linked local directory on disk.
 * 
 * @param workspaceId ID of the current workspace
 * @param localDirectory The local directory path on the user's filesystem
 */
export const triggerLocalSync = async (workspaceId?: string, localDirectory?: string) => {
    if (!workspaceId || !localDirectory) return;
    if (typeof window === 'undefined' || !window.electronAPI) {
        console.warn('[LOCAL SYNC] Electron API not available. Skipping local sync.');
        return;
    }
    try {
        const syncDataRes = await workspaceApi.getSyncData(workspaceId);
        if (syncDataRes.success && syncDataRes.data) {
            const { collections, environments } = syncDataRes.data;
            await window.electronAPI.invoke('fs:writeFiles', {
                dirPath: localDirectory,
                collections,
                environments
            });
            console.log('[LOCAL SYNC] Workspace files updated on local disk.');
        }
    } catch (err) {
        console.error('[LOCAL SYNC] Failed auto-syncing to local filesystem:', err);
    }
};
