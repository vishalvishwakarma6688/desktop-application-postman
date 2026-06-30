import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    X, Folder, GitBranch, RefreshCw, ArrowUp, ArrowDown,
    Check, AlertTriangle, Terminal, LogOut, CheckCircle2
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { workspaceApi } from '@/features/workspace/api';
import toast from 'react-hot-toast';

interface Props {
    onClose: () => void;
}

export default function GitSyncPanel({ onClose }: Props) {
    const queryClient = useQueryClient();
    const { currentWorkspace, updateWorkspace } = useWorkspaceStore();

    const isDesktop = typeof window !== 'undefined' && !!window.electronAPI;

    const [loading, setLoading] = useState(false);
    const [localPath, setLocalPath] = useState<string | null>(currentWorkspace?.localDirectory || null);
    const [isGitRepo, setIsGitRepo] = useState(false);
    const [gitBranch, setGitBranch] = useState('main');
    const [remoteUrl, setRemoteUrl] = useState('');
    const [newRemoteUrl, setNewRemoteUrl] = useState('');
    const [showRemoteInput, setShowRemoteInput] = useState(false);
    const [modifiedFiles, setModifiedFiles] = useState<string[]>([]);
    const [commitMessage, setCommitMessage] = useState('');
    const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
    const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

    const addLog = (text: string) => {
        setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${text}`]);
    };

    const checkGitStatus = async (pathToCheck = localPath) => {
        if (!pathToCheck || !isDesktop) return;
        try {
            // Check if git is initialized
            const statusRes = await window.electronAPI.invoke('git:run', {
                dirPath: pathToCheck,
                args: ['status', '--porcelain']
            });

            if (!statusRes.success) {
                setIsGitRepo(false);
                setModifiedFiles([]);
                return;
            }

            setIsGitRepo(true);
            
            // Parse status output lines
            const lines = statusRes.stdout
                ? statusRes.stdout.split('\n').filter((l: string) => l.trim())
                : [];
            setModifiedFiles(lines);

            // Get active branch
            const branchRes = await window.electronAPI.invoke('git:run', {
                dirPath: pathToCheck,
                args: ['rev-parse', '--abbrev-ref', 'HEAD']
            });
            if (branchRes.success && branchRes.stdout) {
                setGitBranch(branchRes.stdout.trim());
            }

            // Get remote url
            const remoteRes = await window.electronAPI.invoke('git:run', {
                dirPath: pathToCheck,
                args: ['remote', 'get-url', 'origin']
            });
            if (remoteRes.success && remoteRes.stdout) {
                setRemoteUrl(remoteRes.stdout.trim());
                setNewRemoteUrl(remoteRes.stdout.trim());
            } else {
                setRemoteUrl('');
            }
        } catch (err: any) {
            console.error('Git status check failed:', err);
        }
    };

    useEffect(() => {
        if (localPath && isDesktop) {
            checkGitStatus();
        }
    }, [localPath]);

    const handleSelectDirectory = async () => {
        if (!isDesktop) {
            toast.error('Local folder linking is only available in the desktop application.');
            return;
        }
        setLoading(true);
        try {
            const res = await window.electronAPI.invoke('dialog:openDirectory');
            if (res.canceled || !res.filePaths?.[0]) {
                setLoading(false);
                return;
            }

            const path = res.filePaths[0];
            addLog(`Selected directory: ${path}`);

            // Save to database
            const updateRes = await workspaceApi.update(currentWorkspace!._id, { localDirectory: path });
            if (updateRes.success && updateRes.data) {
                updateWorkspace(updateRes.data);
                setLocalPath(path);
                toast.success('Workspace linked to local folder');
                
                // Trigger initial export of data to the selected folder
                await handleExportToDisk(path);
            } else {
                toast.error('Failed to link workspace directory');
            }
        } catch (err: any) {
            toast.error(err.message || 'Error choosing directory');
            addLog(`Error selecting directory: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleUnlinkDirectory = async () => {
        setLoading(true);
        try {
            const updateRes = await workspaceApi.update(currentWorkspace!._id, { localDirectory: null });
            if (updateRes.success && updateRes.data) {
                updateWorkspace(updateRes.data);
                setLocalPath(null);
                setIsGitRepo(false);
                setModifiedFiles([]);
                setRemoteUrl('');
                setConsoleLogs([]);
                toast.success('Workspace unlinked');
            }
        } catch (err: any) {
            toast.error('Failed to unlink directory');
        } finally {
            setLoading(false);
            setShowUnlinkConfirm(false);
        }
    };

    const handleExportToDisk = async (path = localPath) => {
        if (!path) return;
        setLoading(true);
        addLog('Syncing workspace data to disk...');
        try {
            const syncDataRes = await workspaceApi.getSyncData(currentWorkspace!._id);
            if (!syncDataRes.success || !syncDataRes.data) {
                throw new Error('Failed to retrieve sync data from backend');
            }

            const { collections, environments } = syncDataRes.data;

            // Strip database ids and fields that change frequently if desired,
            // or write as is so it maps cleanly on import.
            const fsRes = await window.electronAPI.invoke('fs:writeFiles', {
                dirPath: path,
                collections,
                environments
            });

            if (fsRes.success) {
                addLog('Successfully wrote workspace files to local directory.');
                toast.success('Workspace files saved to disk');
                await checkGitStatus(path);
            } else {
                throw new Error(fsRes.error || 'Failed to write files to disk');
            }
        } catch (err: any) {
            toast.error(`Export failed: ${err.message}`);
            addLog(`Export error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleImportFromDisk = async () => {
        if (!localPath) return;
        setLoading(true);
        addLog('Reading files from disk to import...');
        try {
            const fsRes = await window.electronAPI.invoke('fs:readFiles', { dirPath: localPath });
            if (!fsRes.success) {
                throw new Error(fsRes.error || 'Failed to read files from disk');
            }

            const { collections, environments } = fsRes;
            addLog(`Found ${collections.length} collections and ${environments.length} environments on disk.`);

            const syncRes = await workspaceApi.importSyncData(currentWorkspace!._id, {
                collections,
                environments
            });

            if (syncRes.success) {
                addLog('Database successfully updated to match local files!');
                toast.success('Database synced with disk changes');
                
                // Invalidate query caches to force Sidebar & Header to re-fetch
                queryClient.invalidateQueries({ queryKey: ['collections'] });
                queryClient.invalidateQueries({ queryKey: ['environments'] });
            } else {
                throw new Error(syncRes.error?.message || 'Sync failed');
            }
        } catch (err: any) {
            toast.error(`Import failed: ${err.message}`);
            addLog(`Import error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleInitGit = async () => {
        if (!localPath) return;
        setLoading(true);
        addLog('Initializing Git repository...');
        try {
            const res = await window.electronAPI.invoke('git:run', {
                dirPath: localPath,
                args: ['init']
            });

            if (res.success) {
                addLog(res.stdout || 'Git repository initialized.');
                toast.success('Git repository initialized');
                
                // Setup default branch rename if needed
                await window.electronAPI.invoke('git:run', {
                    dirPath: localPath,
                    args: ['branch', '-M', 'main']
                });
                
                await checkGitStatus();
            } else {
                throw new Error(res.error || res.stderr);
            }
        } catch (err: any) {
            toast.error(`Git Init failed: ${err.message}`);
            addLog(`Git Init error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCommit = async () => {
        if (!localPath || !commitMessage.trim()) return;
        setLoading(true);
        addLog('Staging files...');
        try {
            const addRes = await window.electronAPI.invoke('git:run', {
                dirPath: localPath,
                args: ['add', '.']
            });

            if (!addRes.success) {
                throw new Error(addRes.error || addRes.stderr);
            }

            addLog('Committing changes...');
            const commitRes = await window.electronAPI.invoke('git:run', {
                dirPath: localPath,
                args: ['commit', '-m', commitMessage]
            });

            if (commitRes.success) {
                addLog(commitRes.stdout);
                setCommitMessage('');
                toast.success('Changes committed successfully');
                await checkGitStatus();
            } else {
                throw new Error(commitRes.error || commitRes.stderr);
            }
        } catch (err: any) {
            toast.error(`Commit failed: ${err.message}`);
            addLog(`Commit error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePull = async () => {
        if (!localPath) return;
        setLoading(true);
        addLog(`Pulling changes from branch: ${gitBranch}...`);
        try {
            const res = await window.electronAPI.invoke('git:run', {
                dirPath: localPath,
                args: ['pull', 'origin', gitBranch]
            });

            addLog(res.stdout || '');
            if (res.stderr) addLog(res.stderr);

            if (res.success) {
                toast.success('Pulled updates from remote');
                // Automatically import the newly pulled JSON files to DB
                await handleImportFromDisk();
                await checkGitStatus();
            } else {
                throw new Error(res.error || res.stderr);
            }
        } catch (err: any) {
            toast.error(`Pull failed: ${err.message}`);
            addLog(`Pull error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePush = async () => {
        if (!localPath) return;
        setLoading(true);
        addLog(`Pushing changes to branch: ${gitBranch}...`);
        try {
            const res = await window.electronAPI.invoke('git:run', {
                dirPath: localPath,
                args: ['push', 'origin', gitBranch]
            });

            addLog(res.stdout || '');
            if (res.stderr) addLog(res.stderr);

            if (res.success) {
                toast.success('Pushed changes successfully!');
            } else {
                throw new Error(res.error || res.stderr);
            }
        } catch (err: any) {
            toast.error(`Push failed: ${err.message}`);
            addLog(`Push error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRemote = async () => {
        if (!localPath) return;
        setLoading(true);
        const logAction = remoteUrl ? 'Updating' : 'Adding';
        addLog(`${logAction} remote origin URL to: ${newRemoteUrl}`);
        
        try {
            const args = remoteUrl 
                ? ['remote', 'set-url', 'origin', newRemoteUrl.trim()]
                : ['remote', 'add', 'origin', newRemoteUrl.trim()];

            const res = await window.electronAPI.invoke('git:run', {
                dirPath: localPath,
                args
            });

            if (res.success) {
                toast.success('Remote origin saved');
                setShowRemoteInput(false);
                await checkGitStatus();
            } else {
                throw new Error(res.error || res.stderr);
            }
        } catch (err: any) {
            toast.error(`Failed to configure remote: ${err.message}`);
            addLog(`Remote configuration error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isDesktop) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

                {/* Modal */}
                <div className="relative z-10 flex h-[460px] w-[580px] max-w-[95vw] max-h-[90vh] rounded-xl border border-gray-800 bg-gray-900 shadow-2xl overflow-hidden flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3.5 shrink-0 bg-gray-950">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-orange-500/20 text-orange-400">
                                <GitBranch className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Git Repository Sync</span>
                        </div>
                        <button onClick={onClose} className="rounded p-1 hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6 bg-gradient-to-b from-gray-900 to-gray-950">
                        <div className="relative">
                            <div className="absolute -inset-2 rounded-full bg-orange-500/15 blur-lg animate-pulse"></div>
                            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                <Folder className="h-8 w-8" />
                            </div>
                        </div>

                        <div className="max-w-sm space-y-2.5">
                            <h3 className="text-base font-semibold text-gray-100">Desktop Application Required</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Local folder linking and Git syncing are local-first features. Web browsers are restricted from interacting with your computer's filesystem and git binaries directly.
                            </p>
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                Please download and launch the APIFlow Desktop Application to link local folders, save data to disk, and synchronize with Git.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={onClose}
                                className="rounded-lg bg-gray-800 px-5 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-700 hover:text-white transition-all"
                            >
                                Dismiss
                            </button>
                            <a
                                href="#download"
                                onClick={onClose}
                                className="rounded-lg bg-orange-500 px-5 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition-all shadow-md shadow-orange-500/10 flex items-center gap-1.5"
                            >
                                Download Desktop App
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-10 flex h-[620px] w-[920px] max-w-[95vw] max-h-[90vh] rounded-xl border border-gray-800 bg-gray-900 shadow-2xl overflow-hidden">
                
                {/* Left Panel: Link status & Config */}
                <div className="w-[340px] shrink-0 border-r border-gray-800 flex flex-col bg-gray-950 p-4">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-orange-500/20 text-orange-400">
                            <GitBranch className="h-4 w-4" />
                        </div>
                        <h2 className="text-sm font-semibold text-gray-100">Git Repository Sync</h2>
                    </div>

                    {!localPath ? (
                        <div className="flex-1 flex flex-col justify-center text-center space-y-4">
                            <Folder className="h-12 w-12 text-gray-700 mx-auto" />
                            <div>
                                <h3 className="text-sm font-medium text-gray-300">No folder linked</h3>
                                <p className="text-xs text-gray-500 mt-1.5 px-4 leading-relaxed">
                                    Link this workspace to a local folder to export your requests/collections as JSON files and track them with Git.
                                </p>
                            </div>
                            <button
                                onClick={handleSelectDirectory}
                                disabled={loading}
                                className="w-full mx-auto max-w-[200px] rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition-all shadow-md shadow-orange-500/10"
                            >
                                Link Local Folder
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col space-y-5">
                            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-3">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Local Directory</label>
                                <span className="text-xs font-mono text-gray-300 break-all select-all">{localPath}</span>
                                <div className="mt-3 flex gap-2">
                                    <button
                                        onClick={() => handleExportToDisk()}
                                        disabled={loading}
                                        className="flex-1 rounded bg-gray-800 px-2.5 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                                        title="Write backend data to files"
                                    >
                                        Save to Disk
                                    </button>
                                    <button
                                        onClick={handleImportFromDisk}
                                        disabled={loading}
                                        className="flex-1 rounded bg-gray-800 px-2.5 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                                        title="Load local files to backend"
                                    >
                                        Load from Disk
                                    </button>
                                </div>
                            </div>

                            {isGitRepo ? (
                                <div className="space-y-4">
                                    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">Repository Details</label>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400 border border-green-500/20">
                                                <CheckCircle2 className="h-3 w-3" /> Git Active
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-300 mb-2">
                                            <GitBranch className="h-3.5 w-3.5 text-orange-400" />
                                            <span>Branch:</span>
                                            <strong className="text-gray-100">{gitBranch}</strong>
                                        </div>
                                        <div className="text-xs text-gray-400 break-all">
                                            <span className="text-gray-500 block mb-0.5">Remote URL:</span>
                                            {remoteUrl ? (
                                                <span className="font-mono text-[11px]">{remoteUrl}</span>
                                            ) : (
                                                <span className="italic text-gray-600">No remote URL configured</span>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => setShowRemoteInput(!showRemoteInput)}
                                            className="mt-3 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
                                        >
                                            {remoteUrl ? 'Change Remote URL' : '+ Add Remote origin'}
                                        </button>

                                        {showRemoteInput && (
                                            <div className="mt-2 space-y-1.5 border-t border-gray-800 pt-2">
                                                <input
                                                    type="text"
                                                    value={newRemoteUrl}
                                                    onChange={(e) => setNewRemoteUrl(e.target.value)}
                                                    placeholder="https://github.com/user/repo.git"
                                                    className="w-full rounded border border-gray-850 bg-gray-900 px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:border-orange-500 focus:outline-none"
                                                />
                                                <div className="flex gap-2">
                                                    <button onClick={handleSaveRemote} className="flex-1 rounded bg-orange-500 px-2 py-1 text-xs font-semibold hover:bg-orange-600 transition-colors">Save</button>
                                                    <button onClick={() => setShowRemoteInput(false)} className="flex-1 rounded bg-gray-800 px-2 py-1 text-xs font-medium hover:bg-gray-700 transition-colors">Cancel</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Pull/Push Actions */}
                                    {remoteUrl && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={handlePull}
                                                disabled={loading}
                                                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                                            >
                                                <ArrowDown className="h-3.5 w-3.5 text-blue-400" /> Pull
                                            </button>
                                            <button
                                                onClick={handlePush}
                                                disabled={loading}
                                                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                                            >
                                                <ArrowUp className="h-3.5 w-3.5 text-green-400" /> Push
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 text-center">
                                    <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                                    <h4 className="text-xs font-semibold text-amber-400">Git Not Initialized</h4>
                                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                                        Files are exporting, but git version tracking is not active in this folder.
                                    </p>
                                    <button
                                        onClick={handleInitGit}
                                        disabled={loading}
                                        className="mt-3 w-full rounded bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 transition-colors"
                                    >
                                        Initialize Git
                                    </button>
                                </div>
                            )}

                            <div className="mt-auto border-t border-gray-850 pt-3 flex justify-between items-center text-xs">
                                <span className="text-gray-500">Unlink local syncing</span>
                                <button
                                    onClick={() => setShowUnlinkConfirm(true)}
                                    className="text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
                                >
                                    <LogOut className="h-3 w-3" /> Unlink
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Working Tree, Staging, Committing and Logs */}
                <div className="flex-1 flex flex-col bg-gray-900">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3 shrink-0 bg-gray-950">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Workspace Git Status</span>
                        <div className="flex items-center gap-2">
                            {localPath && (
                                <button
                                    onClick={() => checkGitStatus()}
                                    disabled={loading}
                                    className="rounded p-1 hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
                                    title="Refresh status"
                                >
                                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                            )}
                            <button onClick={onClose} className="rounded p-1 hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Git status working tree / staging area */}
                    <div className="flex-1 overflow-auto p-4 flex flex-col space-y-4">
                        {localPath && isGitRepo && (
                            <div className="flex-1 flex flex-col min-h-0">
                                <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                                    Changes ({modifiedFiles.length})
                                </h3>

                                <div className="flex-1 overflow-auto border border-gray-800 rounded-lg bg-gray-950 p-2.5 space-y-1">
                                    {modifiedFiles.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                            <Check className="h-8 w-8 text-green-500/60 mb-1" />
                                            <p className="text-xs">No modified files</p>
                                            <p className="text-[10px] text-gray-600 mt-0.5">Everything is staged or clean.</p>
                                        </div>
                                    ) : (
                                        modifiedFiles.map((file, idx) => {
                                            const status = file.slice(0, 2);
                                            const name = file.slice(2).trim();
                                            
                                            // Determine badge color
                                            let badgeColor = 'bg-gray-800 text-gray-400';
                                            if (status.includes('M')) badgeColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
                                            if (status.includes('A') || status.includes('?')) badgeColor = 'bg-green-500/10 text-green-400 border-green-500/20';
                                            if (status.includes('D')) badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';

                                            return (
                                                <div key={idx} className="flex items-center justify-between rounded p-1.5 hover:bg-gray-900 border border-transparent hover:border-gray-800 text-xs text-gray-300">
                                                    <span className="font-mono text-[11px] truncate flex-1 pr-3">{name}</span>
                                                    <span className={`px-2 py-0.5 text-[10px] font-medium border rounded-full ${badgeColor}`}>
                                                        {status.trim() === '??' ? 'Untracked' : status.trim() || 'Staged'}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {modifiedFiles.length > 0 && (
                                    <div className="mt-3 border border-gray-800 rounded-lg p-3 bg-gray-950 space-y-3 shrink-0">
                                        <input
                                            type="text"
                                            value={commitMessage}
                                            onChange={(e) => setCommitMessage(e.target.value)}
                                            placeholder="Commit message (e.g. Added login request)"
                                            className="w-full rounded border border-gray-850 bg-gray-900 px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:border-orange-500 focus:outline-none"
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                onClick={handleCommit}
                                                disabled={!commitMessage.trim() || loading}
                                                className="rounded bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Commit changes
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {!localPath && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-600">
                                <Folder className="h-12 w-12 mb-2" />
                                <p className="text-sm">Link your workspace directory to start Git versioning</p>
                            </div>
                        )}

                        {localPath && !isGitRepo && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
                                <GitBranch className="h-12 w-12 mb-2 text-gray-700" />
                                <p className="text-sm">Initialize Git repository from the left panel to begin</p>
                            </div>
                        )}

                        {/* Terminal log panel */}
                        <div className="h-44 border border-gray-800 rounded-lg flex flex-col bg-gray-950 shrink-0 overflow-hidden">
                            <div className="flex items-center justify-between border-b border-gray-800 px-3 py-1.5 shrink-0 bg-gray-900">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                                    <Terminal className="h-3 w-3 text-orange-400" /> Execution Logs
                                </span>
                                {consoleLogs.length > 0 && (
                                    <button
                                        onClick={() => setConsoleLogs([])}
                                        className="text-[10px] text-gray-600 hover:text-gray-400 font-semibold"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 p-3 overflow-auto font-mono text-[10px] text-gray-400 space-y-1 bg-gray-950 select-text">
                                {consoleLogs.length === 0 ? (
                                    <p className="text-gray-600 italic">No command logs yet.</p>
                                ) : (
                                    consoleLogs.map((log, idx) => (
                                        <p key={idx} className="break-all whitespace-pre-wrap leading-relaxed">{log}</p>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
            </div>

            {/* Unlink Confirmation Dialog */}
            {showUnlinkConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowUnlinkConfirm(false)} />

                    {/* Premium Modal Container */}
                    <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-2xl transition-all duration-300">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-5 py-4">
                            <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded bg-red-500/10 text-red-400">
                                    <LogOut className="h-4 w-4" />
                                </div>
                                <h2 className="text-sm font-semibold text-gray-200">Unlink Workspace Folder</h2>
                            </div>
                            <button
                                onClick={() => setShowUnlinkConfirm(false)}
                                className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4 text-left">
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Are you sure you want to unlink this local directory? Workspace files will remain on your local disk, but automatic synchronization and Git branch triggers will stop.
                            </p>
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setShowUnlinkConfirm(false)}
                                    className="rounded-lg border border-gray-700 bg-transparent px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUnlinkDirectory}
                                    disabled={loading}
                                    className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? 'Unlinking...' : 'Unlink Directory'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
