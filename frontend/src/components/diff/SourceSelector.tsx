import { useState, useEffect } from 'react';
import { Clock, FileText, X } from 'lucide-react';
import type { ApiResponseData, ComparisonSource } from '../../types/diff';
import type { RequestHistory } from '../../types';
import { historyApi } from '../../features/history/api';

interface SourceSelectorProps {
    currentResponse: ApiResponseData;
    onSourceSelected: (source: ComparisonSource) => void;
    onClose: () => void;
}

export function SourceSelector({
    currentResponse,
    onSourceSelected,
    onClose,
}: SourceSelectorProps) {
    const [activeTab, setActiveTab] = useState<'history' | 'manual'>('history');
    const [history, setHistory] = useState<RequestHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [manualInput, setManualInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await historyApi.getAll(20);
            if (response.success && response.data) {
                // Filter out the current response
                const filtered = response.data.filter(
                    h => h._id !== currentResponse.id
                );
                setHistory(filtered);
            }
        } catch (e) {
            console.error('Failed to load history:', e);
            setError('Failed to load response history');
        } finally {
            setLoading(false);
        }
    };

    const handleHistorySelect = (historyEntry: RequestHistory) => {
        const source: ComparisonSource = {
            type: 'history',
            id: historyEntry._id,
            label: `${historyEntry.requestSnapshot.method} ${historyEntry.requestSnapshot.url} - ${new Date(historyEntry.executedAt).toLocaleString()}`,
            data: {
                id: historyEntry._id,
                requestId: typeof historyEntry.request === 'string' ? historyEntry.request : historyEntry.request._id,
                timestamp: new Date(historyEntry.executedAt).getTime(),
                status: historyEntry.response.status,
                statusText: historyEntry.response.statusText,
                headers: historyEntry.response.headers || {},
                body: historyEntry.response.data,
                contentType: 'application/json',
                duration: historyEntry.response.executionTime,
            },
        };
        onSourceSelected(source);
    };

    const handleManualSubmit = () => {
        setError(null);

        if (!manualInput.trim()) {
            setError('Please enter response data');
            return;
        }

        try {
            const parsed = JSON.parse(manualInput);
            const source: ComparisonSource = {
                type: 'manual',
                label: 'Manual Input',
                data: {
                    id: `manual-${Date.now()}`,
                    timestamp: Date.now(),
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    body: parsed,
                    contentType: 'application/json',
                    duration: 0,
                },
            };
            onSourceSelected(source);
        } catch (e) {
            setError('Invalid JSON format');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 className="text-lg font-semibold text-white">Select Comparison Source</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-800 rounded transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800">
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'history'
                                ? 'text-orange-400 border-b-2 border-orange-400'
                                : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        <Clock className="h-4 w-4 inline mr-2" />
                        Response History
                    </button>
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'manual'
                                ? 'text-orange-400 border-b-2 border-orange-400'
                                : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        <FileText className="h-4 w-4 inline mr-2" />
                        Manual Input
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                    {activeTab === 'history' && (
                        <div>
                            {loading && (
                                <div className="text-center py-8 text-gray-400">
                                    Loading history...
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 rounded p-3 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {!loading && history.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    No response history available
                                </div>
                            )}

                            {!loading && history.length > 0 && (
                                <div className="space-y-2">
                                    {history.map(entry => (
                                        <button
                                            key={entry._id}
                                            onClick={() => handleHistorySelect(entry)}
                                            className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded transition-colors"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-white">
                                                    {entry.requestSnapshot.method} {entry.requestSnapshot.url}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(entry.response.status)}`}>
                                                    {entry.response.status}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {new Date(entry.executedAt).toLocaleString()} • {entry.response.executionTime}ms
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'manual' && (
                        <div>
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Paste JSON Response
                                </label>
                                <textarea
                                    value={manualInput}
                                    onChange={(e) => setManualInput(e.target.value)}
                                    placeholder='{"key": "value"}'
                                    className="w-full h-64 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            {error && (
                                <div className="mb-3 bg-red-500/10 border border-red-500/50 rounded p-3 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleManualSubmit}
                                className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded font-medium transition-colors"
                            >
                                Compare with Manual Input
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function getStatusColor(status: number): string {
    if (status >= 200 && status < 300) {
        return 'bg-green-500/20 text-green-400';
    }
    if (status >= 300 && status < 400) {
        return 'bg-blue-500/20 text-blue-400';
    }
    if (status >= 400 && status < 500) {
        return 'bg-yellow-500/20 text-yellow-400';
    }
    if (status >= 500) {
        return 'bg-red-500/20 text-red-400';
    }
    return 'bg-gray-500/20 text-gray-400';
}
