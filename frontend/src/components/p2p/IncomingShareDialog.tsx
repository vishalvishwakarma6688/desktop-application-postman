import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useP2PStore } from '@/store/useP2PStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { workspaceApi } from '@/features/workspace/api';
import { ShieldCheck, Download, X, PlusCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

type ImportDestination = 'active' | 'new';

export default function IncomingShareDialog() {
    const queryClient = useQueryClient();
    const { incomingShare, setIncomingShare } = useP2PStore();
    const { currentWorkspace } = useWorkspaceStore();

    const [loading, setLoading] = useState(false);
    const [destination, setDestination] = useState<ImportDestination>('active');

    if (!incomingShare) return null;

    const handleDecline = () => {
        setIncomingShare(null);
        toast.success('Share invitation declined');
    };

    const handleAccept = async () => {
        setLoading(true);
        const importToastId = toast.loading(`Connecting to ${incomingShare.senderName}...`);

        try {
            // 1. Fetch workspace data from host local server
            const fullUrl = `${incomingShare.url}?pin=${incomingShare.pin}`;
            const response = await axios.get(fullUrl, { timeout: 8000 });

            if (!response.data || !response.data.workspace) {
                throw new Error('Invalid collection share payload format');
            }

            const { workspace, collections, environments } = response.data;
            let targetWorkspaceId = '';

            // 2. Determine target workspace
            if (destination === 'active' && currentWorkspace) {
                targetWorkspaceId = currentWorkspace._id;
            } else {
                // Create a new workspace for the shared content
                const newWorkspaceName = `${workspace.name} (Shared)`;
                const createRes = await workspaceApi.create({ name: newWorkspaceName });
                if (!createRes.success || !createRes.data) {
                    throw new Error(createRes.error?.message || 'Failed to create new workspace');
                }
                targetWorkspaceId = createRes.data._id;
                queryClient.invalidateQueries({ queryKey: ['workspaces'] });
            }

            // 3. Import the collections and environments
            const importRes = await workspaceApi.importSyncData(targetWorkspaceId, {
                collections: collections || [],
                environments: environments || []
            });

            if (!importRes.success) {
                throw new Error(importRes.error?.message || 'Failed to import collection components');
            }

            // 4. Success notifications & refresh
            toast.success(`Successfully imported shared workspace from ${incomingShare.senderName}!`, { id: importToastId });
            queryClient.invalidateQueries({ queryKey: ['collections', targetWorkspaceId] });
            queryClient.invalidateQueries({ queryKey: ['environments', targetWorkspaceId] });

            setIncomingShare(null);

        } catch (err: any) {
            console.error('[P2P IMPORT] Connection failed:', err);
            const msg = err.response?.data?.error || err.message || 'Failed to connect to sender local network';
            toast.error(msg, { id: importToastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-gray-950/40">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-emerald-400" />
                        <span className="text-sm font-semibold text-gray-100">Incoming LAN Share</span>
                    </div>
                    {!loading && (
                        <button
                            onClick={handleDecline}
                            className="text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    <div className="mb-4">
                        <p className="text-sm text-gray-300 leading-relaxed">
                            <span className="font-semibold text-white">{incomingShare.senderName}</span> is sharing a workspace on your local network:
                        </p>
                        <div className="mt-3 p-3.5 rounded-xl border border-gray-800/80 bg-gray-950/60 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Workspace Name</span>
                                <span className="text-sm font-bold text-emerald-400 mt-0.5">{incomingShare.workspaceName}</span>
                            </div>
                            <span className="text-[10px] font-mono rounded bg-emerald-950 border border-emerald-900/50 text-emerald-400 px-2 py-0.5">
                                PIN: {incomingShare.pin}
                            </span>
                        </div>
                    </div>

                    {/* Import Destination Selector */}
                    <div className="space-y-2 mt-5">
                        <label className="text-xs font-semibold text-gray-400">Import Destination</label>
                        
                        <div className="grid grid-cols-2 gap-2.5">
                            {currentWorkspace && (
                                <button
                                    onClick={() => setDestination('active')}
                                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                                        destination === 'active'
                                            ? 'border-emerald-500 bg-emerald-950/20 text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                                            : 'border-gray-800 bg-gray-950/30 text-gray-400 hover:border-gray-700'
                                    }`}
                                >
                                    <span className="text-xs font-bold flex items-center gap-1">
                                        <PlusCircle className="h-3.5 w-3.5" /> Active Workspace
                                    </span>
                                    <span className="text-[10px] text-gray-500 mt-1 line-clamp-1">
                                        Merge inside: {currentWorkspace.name}
                                    </span>
                                </button>
                            )}

                            <button
                                onClick={() => setDestination('new')}
                                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                                    destination === 'new'
                                        ? 'border-emerald-500 bg-emerald-950/20 text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                                        : 'border-gray-800 bg-gray-950/30 text-gray-400 hover:border-gray-700'
                                } ${!currentWorkspace ? 'col-span-2' : ''}`}
                            >
                                <span className="text-xs font-bold flex items-center gap-1">
                                    <ArrowRight className="h-3.5 w-3.5" /> New Workspace
                               Full Shared Copy
                                </span>
                                <span className="text-[10px] text-gray-500 mt-1">
                                    Create new workspace copy
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-800/80 bg-gray-950/40">
                    <button
                        onClick={handleDecline}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-gray-800/40 transition-all disabled:opacity-50"
                    >
                        Decline
                    </button>
                    <button
                        onClick={handleAccept}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <Download className="h-4 w-4" />
                        Accept & Import
                    </button>
                </div>
            </div>
        </div>
    );
}
