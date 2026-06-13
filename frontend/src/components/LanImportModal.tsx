import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, Network, ArrowRight, ShieldCheck } from 'lucide-react';
import { workspaceApi } from '@/features/workspace/api';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import toast from 'react-hot-toast';
import axios from 'axios';

interface Props {
    onClose: () => void;
}

type ImportDestination = 'active' | 'new';

export default function LanImportModal({ onClose }: Props) {
    const queryClient = useQueryClient();
    const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();

    const [connectUrl, setConnectUrl] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchedData, setFetchedData] = useState<any | null>(null);
    const [importDest, setImportDest] = useState<ImportDestination>('active');

    // Handle fetching the workspace share from the LAN host
    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!connectUrl.trim()) {
            return toast.error('Please enter the URL or IP Address');
        }
        if (!pin.trim()) {
            return toast.error('Please enter the 4-digit PIN');
        }

        setLoading(true);

        try {
            // Normalize input URL
            let normalized = connectUrl.trim();
            if (!/^https?:\/\//i.test(normalized)) {
                normalized = `http://${normalized}`;
            }

            // Ensure we are targeting the /share endpoint
            const urlObj = new URL(normalized);
            if (urlObj.pathname === '/') {
                urlObj.pathname = '/share';
            }
            urlObj.searchParams.set('pin', pin.trim());

            console.log('[LAN IMPORT] Connecting to:', urlObj.toString());

            const response = await axios.get(urlObj.toString(), { timeout: 8000 });
            if (response.data && response.data.workspace) {
                setFetchedData(response.data);
                toast.success('Successfully connected to host!');
            } else {
                throw new Error('Invalid workspace share format');
            }
        } catch (err: any) {
            console.error('[LAN IMPORT] Connection failed:', err);
            const msg = err.response?.data?.error || err.message || 'Failed to connect to LAN host';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // Handle importing the fetched payload into the destination workspace
    const handleImport = async () => {
        if (!fetchedData) return;
        setLoading(true);

        try {
            const { workspace, collections, environments } = fetchedData;
            let targetWorkspaceId = '';

            if (importDest === 'active' && currentWorkspace) {
                targetWorkspaceId = currentWorkspace._id;
            } else {
                // Create a new workspace
                const newWorkspaceName = `${workspace.name} (LAN Shared)`;
                const createRes = await workspaceApi.create({ name: newWorkspaceName });
                if (!createRes.success || !createRes.data) {
                    throw new Error(createRes.error?.message || 'Failed to create new workspace');
                }
                targetWorkspaceId = createRes.data._id;
                // Invalidate query to refresh workspaces list
                queryClient.invalidateQueries({ queryKey: ['workspaces'] });
            }

            // Import the sync data payload into the selected workspace
            const importRes = await workspaceApi.importSyncData(targetWorkspaceId, {
                collections: collections || [],
                environments: environments || []
            });

            if (!importRes.success) {
                throw new Error(importRes.error?.message || 'Failed to import workspace components');
            }

            toast.success(`Imported ${collections?.length || 0} collections and ${environments?.length || 0} environments successfully!`);

            // If a new workspace was created, switch to it automatically
            if (importDest === 'new') {
                const updatedList = await workspaceApi.getAll();
                const matched = updatedList.data?.find(w => w._id === targetWorkspaceId);
                if (matched) setCurrentWorkspace(matched);
            }

            // Invalidate state to refresh sidebar / UI
            queryClient.invalidateQueries({ queryKey: ['collections', targetWorkspaceId] });
            queryClient.invalidateQueries({ queryKey: ['environments', targetWorkspaceId] });

            onClose();
        } catch (err: any) {
            console.error('[LAN IMPORT] Import failed:', err);
            toast.error(err.message || 'Failed to import shared data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with backdrop-blur */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Premium Container */}
            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl transition-all duration-300">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-orange-500/10 text-orange-400">
                            <Network className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-200">Import from LAN Share</h2>
                            <p className="text-[10px] text-gray-500 font-medium">Fetch offline workspace configs</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {!fetchedData ? (
                        /* Step 1: Connect to LAN Host */
                        <form onSubmit={handleConnect} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Host URL or IP Address
                                </label>
                                <input
                                    type="text"
                                    value={connectUrl}
                                    onChange={(e) => setConnectUrl(e.target.value)}
                                    placeholder="e.g. 192.168.1.52:54832"
                                    className="w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:border-orange-500 focus:outline-none"
                                    disabled={loading}
                                    autoFocus
                                />
                                <span className="block text-[9.5px] text-gray-500 leading-normal">
                                    The Sender's network address (as displayed in their Share dialog).
                                </span>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Access PIN
                                </label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    placeholder="e.g. 3842"
                                    className="w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:border-orange-500 focus:outline-none font-mono tracking-widest"
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-1.5 rounded bg-orange-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />
                                        Connecting to Host...
                                    </>
                                ) : (
                                    <>
                                        Connect & Fetch Workspace
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        /* Step 2: Configure Import Settings & Import */
                        <div className="space-y-5">
                            {/* Summary Card */}
                            <div className="rounded-lg bg-gray-950 p-4 border border-gray-800 space-y-2">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                                    Fetched Workspace Details
                                </span>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-200">
                                        {fetchedData.workspace?.name}
                                    </h3>
                                    <span className="text-[10.5px] font-medium text-emerald-400 flex items-center gap-1">
                                        <ShieldCheck className="h-3.5 w-3.5" /> Valid Payload
                                    </span>
                                </div>
                                <div className="flex gap-4 pt-1.5 text-xs text-gray-400 font-medium">
                                    <span>Collections: <strong className="text-gray-200">{fetchedData.collections?.length || 0}</strong></span>
                                    <span>Environments: <strong className="text-gray-200">{fetchedData.environments?.length || 0}</strong></span>
                                </div>
                            </div>

                            {/* Destination Option Selector */}
                            <div className="space-y-2.5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Import Destination
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setImportDest('active')}
                                        disabled={!currentWorkspace}
                                        className={`rounded-lg border p-3 text-left transition-all ${
                                            importDest === 'active'
                                                ? 'border-orange-500 bg-orange-500/5 text-orange-400'
                                                : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700'
                                        } disabled:opacity-40`}
                                    >
                                        <span className="block text-xs font-bold">Current Workspace</span>
                                        <span className="block text-[10px] text-gray-500 mt-1 truncate">
                                            Merge into {currentWorkspace?.name || 'Active'}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setImportDest('new')}
                                        className={`rounded-lg border p-3 text-left transition-all ${
                                            importDest === 'new'
                                                ? 'border-orange-500 bg-orange-500/5 text-orange-400'
                                                : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700'
                                        }`}
                                    >
                                        <span className="block text-xs font-bold">New Workspace</span>
                                        <span className="block text-[10px] text-gray-500 mt-1">
                                            Create isolated workspace
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Import Button */}
                            <button
                                type="button"
                                onClick={handleImport}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-1.5 rounded bg-orange-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />
                                        Importing Workspace Components...
                                    </>
                                ) : (
                                    <>
                                        Start Import
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
