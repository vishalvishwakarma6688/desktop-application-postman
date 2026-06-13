import { useEffect, useState } from 'react';
import { X, ShieldAlert, Share2, Copy, Check, Radio } from 'lucide-react';
import { workspaceApi } from '@/features/workspace/api';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

interface Props {
    workspaceId: string;
    workspaceName: string;
    onClose: () => void;
}

export default function LanShareModal({ workspaceId, workspaceName, onClose }: Props) {
    const [loading, setLoading] = useState(true);
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedPin, setCopiedPin] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [shareDetails, setShareDetails] = useState<{ ip: string; port: number; pin: string } | null>(null);

    useEffect(() => {
        let isMounted = true;

        const startShare = async () => {
            try {
                // 1. Fetch current workspace data to share
                const res = await workspaceApi.getSyncData(workspaceId);
                if (!res.success || !res.data) {
                    throw new Error(res.error?.message || 'Failed to fetch workspace data');
                }

                // 2. Sanitize payload: strip machine-specific vault encrypted values
                const sanitizedPayload = {
                    ...res.data,
                    environments: (res.data.environments || []).map((env: any) => ({
                        ...env,
                        variables: (env.variables || []).map((v: any) => {
                            if (v.isSecret) {
                                return {
                                    ...v,
                                    value: '',
                                    encryptedValue: '', // Reset machine-specific encrypted cipher
                                    note: 'Vault Secret — must be re-entered on new device'
                                };
                            }
                            return v;
                        })
                    }))
                };

                const payloadString = JSON.stringify(sanitizedPayload);

                // 3. Start local HTTP Server in Electron
                if (window.electronAPI) {
                    const shareRes = await window.electronAPI.invoke('lan:start', { payload: payloadString });
                    if (shareRes?.success && isMounted) {
                        const { ip, port, pin } = shareRes;
                        setShareDetails({ ip, port, pin });

                        // 4. Generate QR Code
                        const shareUrl = `http://${ip}:${port}/share?pin=${pin}`;
                        const qrDataUrl = await QRCode.toDataURL(shareUrl, {
                            width: 180,
                            margin: 1,
                            color: {
                                dark: '#0f172a', // Slate 900
                                light: '#f8fafc', // Slate 50
                            }
                        });
                        setQrCodeUrl(qrDataUrl);
                        setLoading(false);
                    } else {
                        throw new Error(shareRes?.error || 'Failed to initialize server');
                    }
                } else {
                    throw new Error('LAN sharing requires the Desktop Application');
                }
            } catch (err: any) {
                console.error('[LAN SHARE] Error initializing share:', err);
                toast.error(err.message || 'Failed to start LAN sharing');
                if (isMounted) onClose();
            }
        };

        startShare();

        return () => {
            isMounted = false;
            // Clean up: stop HTTP server when modal closes
            if (window.electronAPI) {
                window.electronAPI.invoke('lan:stop').catch(console.error);
            }
        };
    }, [workspaceId, onClose]);

    const handleCopyUrl = () => {
        if (!shareDetails) return;
        const shareUrl = `http://${shareDetails.ip}:${shareDetails.port}/share?pin=${shareDetails.pin}`;
        navigator.clipboard.writeText(shareUrl);
        setCopiedUrl(true);
        toast.success('Share link copied!');
        setTimeout(() => setCopiedUrl(false), 2000);
    };

    const handleCopyPin = () => {
        if (!shareDetails) return;
        navigator.clipboard.writeText(shareDetails.pin);
        setCopiedPin(true);
        toast.success('PIN copied!');
        setTimeout(() => setCopiedPin(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with backdrop-blur */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Premium Glassmorphic Container */}
            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl transition-all duration-300">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-orange-500/10 text-orange-400">
                            <Share2 className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-200">Share Workspace</h2>
                            <p className="text-[10px] text-gray-500 font-medium truncate max-w-[220px]">
                                {workspaceName}
                            </p>
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
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                            <p className="mt-4 text-xs text-gray-400 font-medium">Initializing local LAN server...</p>
                        </div>
                    ) : (
                        <div className="space-y-6 flex flex-col items-center text-center">
                            {/* Live broadcast indicator */}
                            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 animate-pulse">
                                <Radio className="h-3.5 w-3.5" />
                                Sharing Live on LAN
                            </div>

                            {/* QR Code Container */}
                            <div className="relative flex flex-col items-center p-3 rounded-lg bg-white shadow-lg border border-gray-200 transition-transform duration-200 hover:scale-105">
                                {qrCodeUrl ? (
                                    <img src={qrCodeUrl} alt="LAN Sharing QR Code" className="w-[180px] h-[180px] select-none" />
                                ) : (
                                    <div className="w-[180px] h-[180px] flex items-center justify-center bg-gray-100 rounded text-gray-400 text-xs">
                                        Generating QR Code...
                                    </div>
                                )}
                            </div>

                            <p className="text-xs text-gray-400 max-w-[280px]">
                                Scan the QR code or use the connection details below on another device running APIFlow.
                            </p>

                            {/* Access Credentials Grid */}
                            <div className="w-full space-y-2 border-t border-b border-gray-800 py-4">
                                {/* PIN Display */}
                                <div className="flex items-center justify-between rounded bg-gray-950 p-2.5 border border-gray-800">
                                    <div className="text-left">
                                        <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Access PIN</span>
                                        <span className="text-lg font-bold text-orange-400 font-mono tracking-widest">
                                            {shareDetails?.pin}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleCopyPin}
                                        className="rounded bg-gray-800 p-1.5 text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
                                        title="Copy PIN"
                                    >
                                        {copiedPin ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                </div>

                                {/* URL Display */}
                                <div className="flex items-center justify-between rounded bg-gray-950 p-2.5 border border-gray-800">
                                    <div className="text-left overflow-hidden mr-2">
                                        <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Sharing URL</span>
                                        <span className="text-xs font-medium text-gray-300 font-mono truncate block">
                                            http://{shareDetails?.ip}:{shareDetails?.port}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleCopyUrl}
                                        className="rounded bg-gray-800 p-1.5 text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors shrink-0"
                                        title="Copy URL"
                                    >
                                        {copiedUrl ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Vault Warn Banner */}
                            <div className="flex gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-left">
                                <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">Security Warning</span>
                                    <p className="text-[10px] text-amber-400/70 leading-normal">
                                        Vault variables are not synchronized over the network to protect credentials. 
                                        Only standard variables will be transmitted.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
