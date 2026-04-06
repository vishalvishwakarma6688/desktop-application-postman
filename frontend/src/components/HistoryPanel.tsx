import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Trash2, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { historyApi } from '@/features/history/api';
import { useTabStore } from '@/store/useTabStore';
import { requestApi } from '@/features/requests/api';
import { RequestHistory } from '@/types';
import toast from 'react-hot-toast';

interface Props { onClose: () => void; }

const METHOD_COLORS: Record<string, string> = {
    GET: 'text-green-400', POST: 'text-yellow-400',
    PUT: 'text-blue-400', DELETE: 'text-red-400', PATCH: 'text-purple-400',
};

function getStatusColor(status: number) {
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 300 && status < 400) return 'text-yellow-400';
    return 'text-red-400';
}

function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function HistoryPanel({ onClose }: Props) {
    const queryClient = useQueryClient();
    const { addTab } = useTabStore();
    const [selected, setSelected] = useState<RequestHistory | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['history'],
        queryFn: () => historyApi.getAll(100),
    });

    const deleteMutation = useMutation({
        mutationFn: historyApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['history'] });
            if (selected) setSelected(null);
        },
    });

    const clearMutation = useMutation({
        mutationFn: historyApi.clearAll,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['history'] });
            setSelected(null);
            toast.success('History cleared');
        },
    });

    const history: RequestHistory[] = data?.data || [];

    const handleRerun = async (item: RequestHistory) => {
        if (!item.request?._id) return;
        try {
            const res = await requestApi.getById(item.request._id as string);
            if (res.data) {
                addTab({ id: res.data._id, type: 'request', title: res.data.name, request: res.data });
                onClose();
            }
        } catch {
            toast.error('Request no longer exists');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative z-10 flex h-[600px] w-[900px] max-w-[95vw] max-h-[90vh] rounded-lg border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden">

                {/* Left: history list */}
                <div className="w-72 shrink-0 border-r border-gray-700 flex flex-col bg-gray-800">
                    <div className="flex items-center justify-between px-3 py-3 border-b border-gray-700">
                        <span className="text-xs font-semibold uppercase text-gray-400">Request History</span>
                        <div className="flex items-center gap-1">
                            {history.length > 0 && (
                                <button
                                    onClick={() => clearMutation.mutate()}
                                    disabled={clearMutation.isPending}
                                    className="rounded p-1 hover:bg-gray-700 text-gray-500 hover:text-red-400 transition-colors"
                                    title="Clear all history"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                            <button onClick={onClose} className="rounded p-1 hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {isLoading && (
                            <div className="space-y-2 p-3">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-12 rounded bg-gray-700/50 animate-pulse" />
                                ))}
                            </div>
                        )}
                        {!isLoading && history.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                <Clock className="h-10 w-10 text-gray-600 mb-2" />
                                <p className="text-sm text-gray-500">No history yet</p>
                                <p className="text-xs text-gray-600 mt-1">Executed requests will appear here</p>
                            </div>
                        )}
                        {history.map((item) => {
                            const method = item.requestSnapshot?.method || (item.request as any)?.method;
                            const url = item.requestSnapshot?.url || (item.request as any)?.url || '';
                            const status = item.response?.status;
                            const isSelected = selected?._id === item._id;

                            return (
                                <div
                                    key={item._id}
                                    onClick={() => setSelected(item)}
                                    className={`group flex items-start gap-2 px-3 py-2.5 cursor-pointer border-b border-gray-700/50 transition-colors ${isSelected ? 'bg-gray-700' : 'hover:bg-gray-700/60'}`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={`text-xs font-bold shrink-0 ${METHOD_COLORS[method] || 'text-gray-400'}`}>{method}</span>
                                            {status && (
                                                <span className={`text-xs font-medium ${getStatusColor(status)}`}>{status}</span>
                                            )}
                                            {item.error && <XCircle className="h-3 w-3 text-red-400 shrink-0" />}
                                        </div>
                                        <p className="text-xs text-gray-400 truncate">{url.replace(/^https?:\/\//, '')}</p>
                                        <p className="text-xs text-gray-600 mt-0.5">{timeAgo(item.executedAt)}</p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(item._id); }}
                                        className="opacity-0 group-hover:opacity-100 shrink-0 rounded p-0.5 hover:bg-gray-600 text-gray-600 hover:text-red-400 transition-colors mt-1"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: detail */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {selected ? (
                        <>
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className={`text-xs font-bold ${METHOD_COLORS[selected.requestSnapshot?.method] || 'text-gray-400'}`}>
                                        {selected.requestSnapshot?.method}
                                    </span>
                                    <span className="text-sm text-gray-300 truncate">{selected.requestSnapshot?.url}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {selected.response?.executionTime != null && (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />{selected.response.executionTime}ms
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handleRerun(selected)}
                                        className="flex items-center gap-1.5 rounded border border-gray-700 px-2.5 py-1 text-xs text-gray-400 hover:bg-gray-800 hover:text-orange-400 transition-colors"
                                        title="Open request"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" /> Open
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto p-4 space-y-4">
                                {/* Status */}
                                {selected.response && (
                                    <div className="flex items-center gap-3">
                                        {selected.response.status >= 200 && selected.response.status < 300
                                            ? <CheckCircle className="h-4 w-4 text-green-400" />
                                            : <XCircle className="h-4 w-4 text-red-400" />
                                        }
                                        <span className={`text-sm font-bold ${getStatusColor(selected.response.status)}`}>
                                            {selected.response.status} {selected.response.statusText}
                                        </span>
                                        <span className="text-xs text-gray-500">{new Date(selected.executedAt).toLocaleString()}</span>
                                    </div>
                                )}
                                {selected.error && (
                                    <div className="rounded border border-red-900/50 bg-red-950/20 p-3">
                                        <p className="text-xs text-red-400 font-mono">{selected.error.message}</p>
                                    </div>
                                )}

                                {/* Request headers */}
                                {selected.requestSnapshot?.headers?.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Request Headers</p>
                                        <div className="space-y-1">
                                            {selected.requestSnapshot.headers.filter((h: any) => h.key).map((h: any, i: number) => (
                                                <div key={i} className="grid grid-cols-2 gap-2 text-xs">
                                                    <span className="text-orange-300 font-mono truncate">{h.key}</span>
                                                    <span className="text-gray-400 font-mono truncate">{h.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Response body */}
                                {selected.response?.data != null && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Response Body</p>
                                        <pre className="rounded border border-gray-800 bg-gray-800/50 p-3 text-xs text-gray-300 font-mono whitespace-pre-wrap break-all max-h-64 overflow-auto">
                                            {typeof selected.response.data === 'string'
                                                ? selected.response.data
                                                : JSON.stringify(selected.response.data, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-1 items-center justify-center text-gray-600">
                            <div className="text-center">
                                <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Select a history entry to view details</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
