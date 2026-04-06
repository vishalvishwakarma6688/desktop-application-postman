import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Send, Clock, CheckCircle, XCircle, Copy, Check, X, Search } from 'lucide-react';

interface Props {
    response: any;
    isSending: boolean;
    onCancel?: () => void;
    testResults?: { name: string; passed: boolean; error?: string }[];
}

function getStatusColor(status: number) {
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 300 && status < 400) return 'text-yellow-400';
    return 'text-red-400';
}

export default function ResponsePanel({ response, isSending, onCancel, testResults = [] }: Props) {
    const [view, setView] = useState<'pretty' | 'raw' | 'headers' | 'tests'>('pretty');
    const [copied, setCopied] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const bodyRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Ctrl+F to open search
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f' && response && !response.error) {
                e.preventDefault();
                setSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
            }
            if (e.key === 'Escape') setSearchOpen(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [response]);

    const getBodyString = () => {
        if (!response?.data) return '';
        if (typeof response.data === 'string') return response.data;
        return JSON.stringify(response.data, null, 2);
    };

    const getRawString = () => {
        if (!response?.data) return '';
        if (typeof response.data === 'string') return response.data;
        return JSON.stringify(response.data);
    };

    const TRUNCATE_LIMIT = 200_000; // 200KB
    const rawFull = getRawString();
    const isTruncated = rawFull.length > TRUNCATE_LIMIT;
    const [showFull, setShowFull] = useState(false);

    const handleCopy = () => {
        const text = view === 'raw' ? rawFull : getBodyString();
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            toast.success('Response copied');
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const isJson = (data: any) => {
        if (typeof data === 'object' && data !== null) return true;
        try { JSON.parse(data); return true; } catch { return false; }
    };

    // Highlight search matches in text
    const highlightText = (text: string) => {
        if (!searchQuery.trim()) return text;
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        return text.split(regex).map((part, _idx) => {
            if (regex.test(part)) return `<mark class="bg-yellow-400/40 text-yellow-200 rounded-sm">${part}</mark>`;
            return part;
        }).join('');
    };

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-t border-gray-800 px-6 py-2 shrink-0 gap-4 bg-gray-900">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Response</span>
                    {response && !response.error && response.status && (
                        <div className="flex items-center gap-3 text-xs">
                            <span className={`flex items-center gap-1 font-bold ${getStatusColor(response.status)}`}>
                                {response.status >= 200 && response.status < 300
                                    ? <CheckCircle className="h-3.5 w-3.5" />
                                    : <XCircle className="h-3.5 w-3.5" />}
                                {response.status} {response.statusText}
                            </span>
                            {response.executionTime != null && (
                                <span className="flex items-center gap-1 text-gray-500">
                                    <Clock className="h-3.5 w-3.5" />{response.executionTime}ms
                                </span>
                            )}
                            {response.data != null && (
                                <span className="text-gray-500">{new Blob([getRawString()]).size} B</span>
                            )}
                        </div>
                    )}
                </div>

                {response && !response.error && (
                    <div className="flex items-center gap-2">
                        <div className="flex rounded border border-gray-700 overflow-hidden text-xs">
                            {(['pretty', 'raw', 'headers', 'tests'] as const).map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className={`px-3 py-1 capitalize transition-colors ${view === v ? 'bg-gray-700 text-gray-100' : 'text-gray-400 hover:bg-gray-800'}`}
                                >
                                    {v === 'tests' ? (
                                        <span className="flex items-center gap-1">
                                            Tests
                                            {testResults.length > 0 && (
                                                <span className={`rounded-full px-1 text-xs ${testResults.every(t => t.passed) ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {testResults.filter(t => t.passed).length}/{testResults.length}
                                                </span>
                                            )}
                                        </span>
                                    ) : v}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => { setSearchOpen(v => !v); setTimeout(() => searchInputRef.current?.focus(), 50); }}
                            className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs transition-colors ${searchOpen ? 'border-orange-500 text-orange-400 bg-orange-500/10' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}
                            title="Search response (Ctrl+F)"
                        >
                            <Search className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 rounded border border-gray-700 px-2.5 py-1 text-xs text-gray-400 hover:bg-gray-800 transition-colors"
                        >
                            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                )}
            </div>

            {/* Search bar */}
            {searchOpen && (
                <div className="flex items-center gap-2 border-b border-gray-800 bg-gray-900 px-4 py-2 shrink-0">
                    <Search className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search in response..."
                        className="flex-1 bg-transparent text-xs text-gray-200 placeholder-gray-600 focus:outline-none"
                    />
                    {searchQuery && (
                        <span className="text-xs text-gray-500 shrink-0">
                            {(getBodyString().match(new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length} matches
                        </span>
                    )}
                    <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="text-gray-600 hover:text-gray-400">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* Body */}
            <div ref={bodyRef} className="flex-1 overflow-auto p-4">
                {isTruncated && !showFull && (
                    <div className="mb-3 flex items-center justify-between rounded border border-yellow-800/50 bg-yellow-950/20 px-3 py-2">
                        <span className="text-xs text-yellow-400">Response is large ({(rawFull.length / 1024).toFixed(0)}KB). Showing first 200KB.</span>
                        <button onClick={() => setShowFull(true)} className="text-xs text-yellow-400 hover:text-yellow-300 underline">Show full</button>
                    </div>
                )}
                {isSending ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="flex flex-col items-center gap-4 text-gray-500">
                            <svg className="h-8 w-8 animate-spin text-orange-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span className="text-sm">Sending request...</span>
                            {onCancel && (
                                <button
                                    onClick={onCancel}
                                    className="flex items-center gap-1.5 rounded border border-red-800 bg-red-950/30 px-4 py-1.5 text-xs text-red-400 hover:bg-red-900/40 transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" /> Cancel Request
                                </button>
                            )}
                        </div>
                    </div>
                ) : response ? (
                    response.error ? (
                        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <XCircle className="h-4 w-4 text-red-400" />
                                <span className="text-sm font-medium text-red-400">Request Failed</span>
                            </div>
                            <p className="text-sm text-red-300 font-mono">{response.error}</p>
                        </div>
                    ) : view === 'tests' ? (
                        <div className="space-y-2">
                            {testResults.length === 0 ? (
                                <p className="text-xs text-gray-500 text-center py-4">No test results. Add tests in the Scripts tab.</p>
                            ) : testResults.map((t, i) => (
                                <div key={i} className={`flex items-start gap-2 rounded border px-3 py-2 ${t.passed ? 'border-green-900/50 bg-green-950/20' : 'border-red-900/50 bg-red-950/20'}`}>
                                    {t.passed
                                        ? <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />
                                        : <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                                    }
                                    <div>
                                        <p className={`text-xs font-medium ${t.passed ? 'text-green-300' : 'text-red-300'}`}>{t.name}</p>
                                        {t.error && <p className="text-xs text-red-400 font-mono mt-0.5">{t.error}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : view === 'headers' ? (
                        <div className="space-y-1">
                            <div className="grid grid-cols-2 gap-3 mb-2 px-1">
                                <span className="text-xs font-medium text-gray-500 uppercase">Header</span>
                                <span className="text-xs font-medium text-gray-500 uppercase">Value</span>
                            </div>
                            {Object.entries(response.headers || {}).map(([key, val]) => (
                                <div key={key} className="grid grid-cols-2 gap-3 rounded border border-gray-800 bg-gray-800/50 px-3 py-2">
                                    <span className="text-xs text-orange-300 font-mono truncate">{key}</span>
                                    <span className="text-xs text-gray-300 font-mono truncate">{String(val)}</span>
                                </div>
                            ))}
                        </div>
                    ) : view === 'raw' ? (
                        <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-all"
                            dangerouslySetInnerHTML={{ __html: searchQuery ? highlightText(getRawString()) : getRawString() }}
                        />
                    ) : (
                        isJson(response.data) ? (
                            <pre className="text-sm font-mono whitespace-pre-wrap break-all"
                                dangerouslySetInnerHTML={{
                                    __html: getBodyString().split('\n').map((line: string) => {
                                        let h = line
                                            .replace(/"([^"]+)":/g, '<span class="text-blue-400">"$1"</span>:')
                                            .replace(/: "([^"]*)"/g, ': <span class="text-green-400">"$1"</span>')
                                            .replace(/: (true|false)/g, ': <span class="text-yellow-400">$1</span>')
                                            .replace(/: (null)/g, ': <span class="text-gray-500">$1</span>')
                                            .replace(/: (-?\d+\.?\d*)/g, ': <span class="text-orange-400">$1</span>');
                                        if (searchQuery) {
                                            const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                            h = h.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="bg-yellow-400/40 text-yellow-200 rounded-sm">$1</mark>');
                                        }
                                        return h;
                                    }).join('\n')
                                }}
                            />
                        ) : (
                            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-all"
                                dangerouslySetInnerHTML={{ __html: searchQuery ? highlightText(getBodyString()) : getBodyString() }}
                            />
                        )
                    )
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-600">
                        <div className="text-center">
                            <Send className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Hit Send to get a response</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
