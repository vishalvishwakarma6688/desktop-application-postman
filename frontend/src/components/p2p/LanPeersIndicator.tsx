import { useState } from 'react';
import { useP2PStore, P2PPeer } from '@/store/useP2PStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useAuthStore } from '@/store/useAuthStore';
import { workspaceApi } from '@/features/workspace/api';
import { Wifi, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LanPeersIndicator() {
    const { peers } = useP2PStore();
    const { currentWorkspace } = useWorkspaceStore();
    const { user } = useAuthStore();
    const [draggingOver, setDraggingOver] = useState<string | null>(null);

    if (peers.length === 0) return null;

    const handleDragOver = (e: React.DragEvent, peerId: string) => {
        e.preventDefault();
        setDraggingOver(peerId);
    };

    const handleDragLeave = () => {
        setDraggingOver(null);
    };

    const handleDrop = async (e: React.DragEvent, peer: P2PPeer) => {
        e.preventDefault();
        setDraggingOver(null);

        const collectionId = e.dataTransfer.getData('text/plain');
        if (!collectionId) {
            return toast.error('No collection selected for sharing');
        }

        if (!currentWorkspace) {
            return toast.error('Please open a workspace first');
        }

        const shareToastId = toast.loading(`Preparing workspace data for ${peer.username}...`);

        try {
            // 1. Fetch current workspace data to share
            const res = await workspaceApi.getSyncData(currentWorkspace._id);
            if (!res.success || !res.data) {
                throw new Error(res.error?.message || 'Failed to fetch workspace data');
            }

            // 2. Sanitize variables for safety
            const sanitizedPayload = {
                ...res.data,
                environments: (res.data.environments || []).map((env: any) => ({
                    ...env,
                    variables: (env.variables || []).map((v: any) => {
                        if (v.isSecret) {
                            return {
                                ...v,
                                value: '',
                                encryptedValue: '',
                                note: 'Vault Secret — must be re-entered on new device'
                            };
                        }
                        return v;
                    })
                }))
            };

            const payloadString = JSON.stringify(sanitizedPayload);

            // 3. Spin up the local HTTP server in Electron
            if (!window.electronAPI) {
                throw new Error('LAN sharing requires the Desktop Application');
            }

            const shareRes = await window.electronAPI.invoke('lan:start', { payload: payloadString });
            if (!shareRes?.success) {
                throw new Error(shareRes?.error || 'Failed to start sharing server');
            }

            const { ip, port, pin } = shareRes;
            const shareUrl = `http://${ip}:${port}/share`;

            // 4. Send direct UDP unicast invite to the target peer
            const inviteRes = await window.electronAPI.invoke('p2p:send-invite', {
                targetIp: peer.ip,
                inviteData: {
                    senderName: user?.name || 'A teammate',
                    url: shareUrl,
                    pin: pin,
                    workspaceName: currentWorkspace.name
                }
            });

            if (inviteRes?.success) {
                toast.success(`Sent workspace invitation to ${peer.username}!`, { id: shareToastId });
            } else {
                throw new Error(inviteRes?.error || 'Failed to send network handshake');
            }

        } catch (err: any) {
            console.error('[P2P SHARE] Failed:', err);
            toast.error(err.message || 'Failed to share collection over P2P', { id: shareToastId });
            if (window.electronAPI) {
                window.electronAPI.invoke('lan:stop').catch(console.error);
            }
        }
    };

    return (
        <div className="flex items-center gap-2 px-1.5 py-0.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <Wifi className="h-3.5 w-3.5 animate-pulse" />
                <span className="hidden sm:inline">Nearby LAN:</span>
            </div>

            <div className="flex items-center -space-x-1.5">
                {peers.map((peer) => {
                    const initials = peer.username
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);

                    const isTargeted = draggingOver === peer.userId;

                    return (
                        <div
                            key={peer.userId}
                            onDragOver={(e) => handleDragOver(e, peer.userId)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, peer)}
                            className={`group relative h-7 w-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all duration-200 ${
                                isTargeted
                                    ? 'border-emerald-500 bg-emerald-950 text-emerald-100 scale-125 z-10 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                    : 'border-gray-800 bg-gray-900 text-gray-300 hover:border-gray-600 hover:scale-110 hover:z-10'
                            }`}
                        >
                            {initials}

                            {/* Unread/Online indicator */}
                            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-gray-950" />

                            {/* Drop guidance tooltip */}
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                                <div className="w-2 h-2 bg-gray-950 rotate-45 border-t border-l border-gray-800 -mb-1" />
                                <div className="bg-gray-950 border border-gray-800 text-gray-200 text-[10px] rounded px-2 py-1 shadow-xl whitespace-nowrap flex flex-col items-center gap-0.5">
                                    <span className="font-semibold">{peer.username}</span>
                                    <span className="text-[9px] text-gray-500">{peer.ip}</span>
                                    <span className="text-[9px] text-emerald-400 mt-1 flex items-center gap-1">
                                        Drop collection to share <ArrowRight className="h-2 w-2" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
