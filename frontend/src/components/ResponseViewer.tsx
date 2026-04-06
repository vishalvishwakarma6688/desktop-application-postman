import { useState } from 'react';

interface ResponseViewerProps {
    response: any;
}

export default function ResponseViewer({ response }: ResponseViewerProps) {
    const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'cookies'>('body');
    const [bodyView, setBodyView] = useState<'pretty' | 'raw'>('pretty');

    if (!response) {
        return (
            <div className="flex h-full items-center justify-center bg-gray-900 text-gray-500">
                <div className="text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-4 text-sm">Response will appear here</p>
                    <p className="mt-1 text-xs text-gray-600">Send a request to see the response</p>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: number) => {
        if (status >= 200 && status < 300) return 'text-green-400 bg-green-900/20';
        if (status >= 300 && status < 400) return 'text-yellow-400 bg-yellow-900/20';
        if (status >= 400 && status < 500) return 'text-orange-400 bg-orange-900/20';
        return 'text-red-400 bg-red-900/20';
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getResponseSize = () => {
        try {
            const size = new Blob([JSON.stringify(response.data)]).size;
            return formatBytes(size);
        } catch {
            return 'N/A';
        }
    };

    return (
        <div className="flex h-full flex-col bg-gray-900">
            {/* Response Header */}
            <div className="border-b border-gray-700 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-400">Status:</span>
                            <span className={`rounded px-2 py-1 text-sm font-bold ${getStatusColor(response.status)}`}>
                                {response.status} {response.statusText}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-400">Time:</span>
                            <span className="rounded bg-gray-800 px-2 py-1 text-sm font-semibold text-green-400">
                                {response.executionTime}ms
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-400">Size:</span>
                            <span className="rounded bg-gray-800 px-2 py-1 text-sm font-semibold text-blue-400">
                                {getResponseSize()}
                            </span>
                        </div>
                    </div>

                    {activeTab === 'body' && (
                        <div className="flex gap-1 rounded bg-gray-800 p-1">
                            <button
                                onClick={() => setBodyView('pretty')}
                                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${bodyView === 'pretty'
                                        ? 'bg-gray-700 text-white'
                                        : 'text-gray-400 hover:text-gray-300'
                                    }`}
                            >
                                Pretty
                            </button>
                            <button
                                onClick={() => setBodyView('raw')}
                                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${bodyView === 'raw'
                                        ? 'bg-gray-700 text-white'
                                        : 'text-gray-400 hover:text-gray-300'
                                    }`}
                            >
                                Raw
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-700 bg-gray-850">
                <div className="flex gap-1 px-4">
                    {(['body', 'headers', 'cookies'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${activeTab === tab
                                    ? 'border-b-2 border-orange-500 text-orange-500'
                                    : 'text-gray-400 hover:text-gray-300'
                                }`}
                        >
                            {tab}
                            {tab === 'headers' && response.headers && (
                                <span className="ml-1.5 rounded-full bg-gray-700 px-1.5 py-0.5 text-xs">
                                    {Object.keys(response.headers).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto">
                {activeTab === 'body' && (
                    <div className="h-full">
                        {response.error ? (
                            <div className="p-4">
                                <div className="rounded-lg border border-red-800 bg-red-900/20 p-4">
                                    <div className="flex items-start gap-3">
                                        <svg className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-red-400">Error</h3>
                                            <p className="mt-2 text-sm text-red-300">{response.error.message}</p>
                                            {response.error.code && (
                                                <p className="mt-1 text-xs text-red-400">Code: {response.error.code}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <pre className="h-full overflow-auto p-4 font-mono text-sm text-gray-300">
                                {bodyView === 'pretty'
                                    ? typeof response.data === 'string'
                                        ? response.data
                                        : JSON.stringify(response.data, null, 2)
                                    : typeof response.data === 'string'
                                        ? response.data
                                        : JSON.stringify(response.data)}
                            </pre>
                        )}
                    </div>
                )}

                {activeTab === 'headers' && (
                    <div className="p-4">
                        {response.headers && Object.keys(response.headers).length > 0 ? (
                            <div className="space-y-1">
                                {Object.entries(response.headers).map(([key, value]) => (
                                    <div
                                        key={key}
                                        className="grid grid-cols-3 gap-4 rounded border border-gray-700 bg-gray-800 p-3 text-sm"
                                    >
                                        <span className="font-semibold text-orange-400">{key}</span>
                                        <span className="col-span-2 text-gray-300 break-all">{String(value)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <svg className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm">No headers</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'cookies' && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <svg className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm">No cookies</p>
                    </div>
                )}
            </div>
        </div>
    );
}
