import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let activeWatcher: fs.FSWatcher | null = null;
let lastBranchName: string = '';

/**
 * Executes a git command to fetch the current active branch name
 */
async function getCurrentBranch(dirPath: string): Promise<string> {
    try {
        const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', {
            cwd: dirPath,
            timeout: 2000
        });
        return stdout.trim();
    } catch {
        return '';
    }
}

/**
 * Start watching the .git/HEAD file of the linked workspace directory
 */
export async function startGitBranchWatcher(
    dirPath: string,
    onBranchChanged: (branchName: string) => void
) {
    // 1. Clean up any existing watchers first
    stopGitBranchWatcher();

    if (!dirPath || !fs.existsSync(dirPath)) {
        return;
    }

    const gitDir = path.join(dirPath, '.git');
    const headPath = path.join(gitDir, 'HEAD');

    if (!fs.existsSync(gitDir) || !fs.existsSync(headPath)) {
        console.log(`[GIT WATCHER] Not a git repository: ${dirPath}`);
        return;
    }

    console.log(`[GIT WATCHER] Monitoring active branch at: ${headPath}`);

    // Trigger initial branch check immediately
    const initialBranch = await getCurrentBranch(dirPath);
    if (initialBranch) {
        lastBranchName = initialBranch;
        onBranchChanged(initialBranch);
    }

    try {
        // Watch the HEAD file for changes (checkout triggers write modifications)
        activeWatcher = fs.watch(headPath, async (event) => {
            if (event === 'change') {
                const currentBranch = await getCurrentBranch(dirPath);
                if (currentBranch && currentBranch !== lastBranchName) {
                    console.log(`[GIT WATCHER] Branch transitioned: ${lastBranchName} -> ${currentBranch}`);
                    lastBranchName = currentBranch;
                    onBranchChanged(currentBranch);
                }
            }
        });

        activeWatcher.on('error', (err) => {
            console.error('[GIT WATCHER] FSWatcher encountered error:', err.message);
            stopGitBranchWatcher();
        });

    } catch (err: any) {
        console.error('[GIT WATCHER] Failed to initialize watcher:', err.message);
    }
}

/**
 * Stop watching and cleanup active filesystem watchers
 */
export function stopGitBranchWatcher() {
    if (activeWatcher) {
        try {
            activeWatcher.close();
        } catch (err: any) {
            console.error('[GIT WATCHER] Error closing watcher:', err.message);
        }
        activeWatcher = null;
    }
    lastBranchName = '';
}
