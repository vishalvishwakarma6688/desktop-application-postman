import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Play, CheckCircle, XCircle, Clock, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { requestApi } from '@/features/requests/api';
import { Collection, Request } from '@/types';

interface Props { collection: Collection; onClose: () => void; }

interface RunResult {
    request: Request;
    status?: number;
    statusText?: string;
    executionTime?: number;
    error?: string;
    responseBody?: any;
    responseHeaders?: Record<string, string>;
    testResults?: { name: string; passed: boolean; error?: string }[];
}

const METHOD_COLORS: Record<string, string> = {
    GET: 'text-green-400', POST: 'text-yellow-400',
    PUT: 'text-blue-400', DELETE: 'text-red-400', PATCH: 'text-purple-400',
};

function getStatusColor(status: number) {
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 300 && status < 400) return 'text-yellow-400';
    return 'text-red-400';
}

type PreviewTab = 'body' | 'headers' | 'tests';

function ExpandedResult({ result }: { result: RunResult }) {
    const [tab, setTab] = useState<PreviewTab>('body');

    const bodyStr = result.responseBody != null
        ? (typeof result.responseBody === 'string'
            ? result.responseBody
            : JSON.stringify(result.responseBody, null, 2))
        : null;

    const headers = result.responseHeaders ? Object.entries(result.responseHeaders) : [];

    return (
        <div className="bg-gray-800/30 border-t border-gray-800">
            {/* Tab bar */}
            <div className="flex gap-1 px-5 pt-2">
                {(['body', 'headers', 'tests'] as PreviewTab[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-3 py-1 text-xs rounded-t capitalize transition-colors ${tab === t ? 'bg-gray-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {t}
                        {t === 'tests' && result.testResults && result.testResults.length > 0 && (
                            <span className="ml-1 text-gray-500">({result.testResults.length})</span>
                        )}
                        {t === 'headers' && headers.length > 0 && (
                            <span className="ml-1 text-gray-500">({headers.length})</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="px-5 pb-3 pt-2">
                {result.error && (
                    <p className="text-xs text-red-400 font-mono mb-2">{result.error}</p>
                )}

                {tab === 'body' && (
                    <div className="rounded bg-gray-900 border border-gray-700 p-3 max-h-48 overflow-auto">
                        {bodyStr ? (
                            <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-all">{bodyStr}</pre>
                        ) : (
                            <p className="text-xs text-gray-600 italic">No response body</p>
                        )}
                    </div>
                )}

                {tab === 'headers' && (
                    <div className="rounded bg-gray-900 border border-gray-700 p-3 max-h-48 overflow-auto">
                        {headers.length > 0 ? (
                            <table className="w-full text-xs">
                                <tbody>
                                    {headers.map(([k, v]) => (
                                        <tr key={k} className="border-b border-gray-800 last:border-0">
                                            <td className="py-1 pr-4 text-gray-400 font-medium w-1/3 align-top">{k}</td>
                                            <td className="py-1 text-gray-300 font-mono break-all">{v}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-xs text-gray-600 italic">No headers</p>
                        )}
                    </div>
                )}

                {tab === 'tests' && (
                    <div className="space-y-1">
                        {result.testResults && result.testResults.length > 0 ? (
                            result.testResults.map((t, ti) => (
                                <div key={ti} className={`flex items-center gap-2 text-xs ${t.passed ? 'text-green-400' : 'text-red-400'}`}>
                                    {t.passed ? <CheckCircle className="h-3 w-3 shrink-0" /> : <XCircle className="h-3 w-3 shrink-0" />}
                                    <span>{t.name}</span>
                                    {t.error && <span className="text-gray-500">— {t.error}</span>}
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-600 italic">No tests</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CollectionRunner({ collection, onClose }: Props) {
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState<RunResult[]>([]);
    const [currentIdx, setCurrentIdx] = useState(-1);
    const [delay, setDelay] = useState(0);
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
    const abortRef = { current: false };

    const { data } = useQuery({
        queryKey: ['requests', collection._id],
        queryFn: () => requestApi.getByCollection(collection._id),
    });

    const requests: Request[] = data?.data || [];

    const handleRun = async () => {
        if (requests.length === 0) return;
        setRunning(true);
        setResults([]);
        setCurrentIdx(0);
        abortRef.current = false;

        const runResults: RunResult[] = [];

        for (let i = 0; i < requests.length; i++) {
            if (abortRef.current) break;
            setCurrentIdx(i);

            try {
                const res = await requestApi.execute(requests[i]._id);
                const result = res.data?.result;
                runResults.push({
                    request: requests[i],
                    status: result?.status,
                    statusText: result?.statusText,
                    executionTime: result?.executionTime,
                    error: result?.error?.message,
                    responseBody: result?.data,
                    responseHeaders: result?.headers,
                    testResults: res.data?.testResults || [],
                });
            } catch (err: any) {
                runResults.push({
                    request: requests[i],
                    error: err?.response?.data?.error?.message || err.message || 'Request failed',
                });
            }

            setResults([...runResults]);

            if (delay > 0 && i < requests.length - 1) {
                await new Promise(r => setTimeout(r, delay));
            }
        }

        setCurrentIdx(-1);
        setRunning(false);
    };

    const handleStop = () => {
        abortRef.current = true;
        setRunning(false);
        setCurrentIdx(-1);
    };

    const passed = results.filter(r => !r.error && r.status && r.status < 400).length;
    const failed = results.filter(r => r.error || (r.status && r.status >= 400)).length;
    const totalTests = results.reduce((sum, r) => sum + (r.testResults?.length || 0), 0);
    const passedTests = results.reduce((sum, r) => sum + (r.testResults?.filter(t => t.passed).length || 0), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={!running ? onClose : undefined} />
            <div className="relative z-10 flex flex-col w-[700px] max-w-[95vw] h-[600px] max-h-[90vh] rounded-xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-100">Collection Runner</h2>
                        <p className="text-xs text-gray-500 mt-0.5">{collection.name} · {requests.length} requests</p>
                    </div>
                    <button onClick={onClose} disabled={running} className="rounded p-1 hover:bg-gray-800 text-gray-500 disabled:opacity-30 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500">Delay (ms)</label>
                        <input
                            type="number"
                            value={delay}
                            onChange={(e) => setDelay(Math.max(0, parseInt(e.target.value) || 0))}
                            disabled={running}
                            className="w-20 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-100 focus:border-orange-500 focus:outline-none disabled:opacity-50"
                        />
                    </div>
                    <div className="flex-1" />
                    {running ? (
                        <button
                            onClick={handleStop}
                            className="flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                        >
                            <X className="h-4 w-4" /> Stop
                        </button>
                    ) : (
                        <button
                            onClick={handleRun}
                            disabled={requests.length === 0}
                            className="flex items-center gap-2 rounded bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-40 transition-colors"
                        >
                            <Play className="h-4 w-4" /> Run All
                        </button>
                    )}
                </div>

                {/* Summary bar */}
                {results.length > 0 && (
                    <div className="flex items-center gap-6 px-5 py-2.5 bg-gray-800/50 border-b border-gray-800 shrink-0 text-xs">
                        <span className="text-gray-400">{results.length}/{requests.length} completed</span>
                        <span className="text-green-400 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" />{passed} passed</span>
                        <span className="text-red-400 flex items-center gap-1"><XCircle className="h-3.5 w-3.5" />{failed} failed</span>
                        {totalTests > 0 && (
                            <span className="text-gray-400">Tests: {passedTests}/{totalTests}</span>
                        )}
                        {results.length > 0 && (
                            <span className="text-gray-500">
                                Avg: {Math.round(results.filter(r => r.executionTime).reduce((s, r) => s + (r.executionTime || 0), 0) / results.filter(r => r.executionTime).length)}ms
                            </span>
                        )}
                    </div>
                )}

                {/* Request list */}
                <div className="flex-1 overflow-auto">
                    {requests.length === 0 && (
                        <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                            No requests in this collection
                        </div>
                    )}
                    {requests.map((req, i) => {
                        const result = results[i];
                        const isCurrent = running && currentIdx === i;
                        const isExpanded = expandedIdx === i;

                        return (
                            <div key={req._id} className="border-b border-gray-800">
                                <button
                                    onClick={() => result && setExpandedIdx(isExpanded ? null : i)}
                                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-800/50 transition-colors text-left"
                                >
                                    {/* Status icon */}
                                    <div className="shrink-0 w-5">
                                        {isCurrent && <Loader2 className="h-4 w-4 text-orange-400 animate-spin" />}
                                        {result && !result.error && result.status && result.status < 400 && <CheckCircle className="h-4 w-4 text-green-400" />}
                                        {result && (result.error || (result.status && result.status >= 400)) && <XCircle className="h-4 w-4 text-red-400" />}
                                        {!isCurrent && !result && <div className="h-4 w-4 rounded-full border border-gray-700" />}
                                    </div>

                                    <span className={`text-xs font-bold w-12 shrink-0 ${METHOD_COLORS[req.method] || 'text-gray-400'}`}>{req.method}</span>
                                    <span className="flex-1 text-sm text-gray-300 truncate">{req.name}</span>

                                    {result?.status && (
                                        <span className={`text-xs font-medium shrink-0 ${getStatusColor(result.status)}`}>{result.status}</span>
                                    )}
                                    {result?.executionTime != null && (
                                        <span className="text-xs text-gray-500 shrink-0 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />{result.executionTime}ms
                                        </span>
                                    )}
                                    {result?.testResults && result.testResults.length > 0 && (
                                        <span className={`text-xs shrink-0 ${result.testResults.every(t => t.passed) ? 'text-green-400' : 'text-red-400'}`}>
                                            {result.testResults.filter(t => t.passed).length}/{result.testResults.length} tests
                                        </span>
                                    )}
                                    {result && (isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-gray-600 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-600 shrink-0" />)}
                                </button>

                                {isExpanded && result && (
                                    <ExpandedResult result={result} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
