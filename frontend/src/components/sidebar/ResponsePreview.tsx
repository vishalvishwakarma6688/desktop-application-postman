import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Clock, FileText, Loader2 } from 'lucide-react';
import api from '@/services/api';
import { RequestHistory } from '@/types';

interface Props {
    requestId: string;
}

export default function ResponsePreview({ requestId }: Props) {
    const { data, isLoading } = useQuery({
        queryKey: ['request-history', requestId],
        queryFn: async () => {
            const response = await api.get(`/history/request/${requestId}`, {
                params: { limit: 1 }
            });
            return response.data;
        },
        staleTime: 30000, // Cache for 30 seconds
    });

    const history: RequestHistory[] = data?.data || [];
    const lastResponse = history[0];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            </div>
        );
    }

    if (!lastResponse) {
        return (
            <div className="p-4 text-center">
                <FileText className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No response history</p>
                <p className="text-[10px] text-gray-600 mt-1">Send a request to see preview</p>
            </div>
        );
    }

    const { response, requestSnapshot, executedAt, error } = lastResponse;
    const statusColor =
        error ? 'text-red-400' :
            response.status >= 200 && response.status < 300 ? 'text-emerald-400' :
                response.status >= 300 && response.status < 400 ? 'text-blue-400' :
                    response.status >= 400 && response.status < 500 ? 'text-amber-400' :
                        'text-red-400';

    const formatData = (data: any): string => {
        if (!data) return 'No content';
        if (typeof data === 'string') return data.slice(0, 150);
        try {
            return JSON.stringify(data, null, 2).slice(0, 150);
        } catch {
            return String(data).slice(0, 150);
        }
    };

    return (
        <div className="w-80 max-w-full">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/60">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {error ? (
                            <XCircle className="h-4 w-4 text-red-400" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        )}
                        <span className={`text-sm font-semibold ${statusColor}`}>
                            {error ? 'Failed' : `${response.status} ${response.statusText}`}
                        </span>
                    </div>
                    {response.executionTime && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Clock className="h-3 w-3" />
                            {response.executionTime}ms
                        </div>
                    )}
                </div>
                <p className="text-[10px] text-gray-500">
                    {new Date(executedAt).toLocaleString()}
                </p>
            </div>

            {/* Request Info */}
            <div className="px-4 py-2 border-b border-gray-700/50 bg-gray-900/40">
                <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">Request</p>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-orange-400">
                        {requestSnapshot.method}
                    </span>
                    <span className="text-[10px] text-gray-300 truncate">
                        {requestSnapshot.url}
                    </span>
                </div>
            </div>

            {/* Response Preview */}
            <div className="px-4 py-3 max-h-48 overflow-auto">
                {error ? (
                    <div className="space-y-2">
                        <p className="text-[10px] text-gray-600 uppercase tracking-wide">Error</p>
                        <div className="rounded bg-red-500/10 border border-red-500/20 px-2 py-1.5">
                            <p className="text-xs text-red-400 font-mono">{error.message}</p>
                            {error.code && (
                                <p className="text-[10px] text-red-500/70 mt-1">Code: {error.code}</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-[10px] text-gray-600 uppercase tracking-wide">Response Body</p>
                        <div className="rounded bg-gray-800/60 border border-gray-700 px-2 py-1.5">
                            <pre className="text-[10px] text-gray-300 font-mono whitespace-pre-wrap break-words">
                                {formatData(response.data)}
                            </pre>
                            {formatData(response.data).length >= 150 && (
                                <p className="text-[9px] text-gray-600 mt-1">...</p>
                            )}
                        </div>

                        {/* Headers Count */}
                        {response.headers && Object.keys(response.headers).length > 0 && (
                            <div className="pt-2">
                                <p className="text-[10px] text-gray-600">
                                    {Object.keys(response.headers).length} response headers
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-700/50 bg-gray-900/40">
                <p className="text-[9px] text-gray-600 text-center">
                    Hover to see last response • Click to open full details
                </p>
            </div>
        </div>
    );
}
