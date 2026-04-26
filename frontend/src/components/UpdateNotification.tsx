import { useEffect, useState } from 'react';
import { Download, RefreshCw, X, CheckCircle } from 'lucide-react';

type UpdateState = 'idle' | 'available' | 'downloading' | 'downloaded';

interface UpdateInfo {
    version: string;
}

export default function UpdateNotification() {
    const [state, setState] = useState<UpdateState>('idle');
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [progress, setProgress] = useState(0);
    const [dismissed, setDismissed] = useState(false);

    const electronAPI = (window as any).electronAPI;

    useEffect(() => {
        if (!electronAPI?.receive) return;

        // Log all updater messages to DevTools console
        electronAPI.receive('updater:log', (msg: string) => {
            console.log('%c' + msg, 'color: #f97316; font-weight: bold;');
        });

        // Update is available — show prompt
        electronAPI.receive('updater:update-available', (info: UpdateInfo) => {
            console.log('%c[AutoUpdater] Update available: v' + info.version, 'color: #22c55e; font-weight: bold;');
            setUpdateInfo(info);
            setState('available');
            setDismissed(false);
        });

        // Download progress
        electronAPI.receive('updater:download-progress', (data: { percent: number }) => {
            setProgress(data.percent);
            setState('downloading');
        });

        // Download complete — prompt to install
        electronAPI.receive('updater:update-downloaded', (info: UpdateInfo) => {
            console.log('%c[AutoUpdater] Ready to install v' + info.version, 'color: #22c55e; font-weight: bold;');
            setUpdateInfo(info);
            setState('downloaded');
            setProgress(100);
        });
    }, []);

    const handleDownload = () => {
        setState('downloading');
        setProgress(0);
        electronAPI?.send('updater:start-download');
    };

    const handleInstall = () => {
        electronAPI?.send('updater:install');
    };

    const handleDismiss = () => {
        setDismissed(true);
    };

    if (dismissed || state === 'idle') return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 w-80 rounded-xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-950">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-sm font-semibold text-gray-200">
                        {state === 'available' && 'Update Available'}
                        {state === 'downloading' && 'Downloading Update'}
                        {state === 'downloaded' && 'Ready to Install'}
                    </span>
                </div>
                {state !== 'downloading' && (
                    <button
                        onClick={handleDismiss}
                        className="text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Body */}
            <div className="px-4 py-3">
                {state === 'available' && (
                    <>
                        <p className="text-sm text-gray-300 mb-1">
                            Version <span className="font-semibold text-orange-400">v{updateInfo?.version}</span> is available.
                        </p>
                        <p className="text-xs text-gray-500 mb-4">
                            Would you like to download and install the update?
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleDownload}
                                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                Download
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="flex-1 rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
                            >
                                Later
                            </button>
                        </div>
                    </>
                )}

                {state === 'downloading' && (
                    <>
                        <p className="text-sm text-gray-300 mb-3">
                            Downloading <span className="font-semibold text-orange-400">v{updateInfo?.version}</span>...
                        </p>
                        <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                            <div
                                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 text-right">{progress}%</p>
                    </>
                )}

                {state === 'downloaded' && (
                    <>
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                            <p className="text-sm text-gray-300">
                                <span className="font-semibold text-green-400">v{updateInfo?.version}</span> is ready to install.
                            </p>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">
                            The app will restart to apply the update.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleInstall}
                                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Restart & Install
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="flex-1 rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
                            >
                                Later
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
