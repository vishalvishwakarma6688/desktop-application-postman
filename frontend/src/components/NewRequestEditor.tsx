import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { requestApi } from '@/features/requests/api';
import { useTabStore } from '@/store/useTabStore';
import { Send } from 'lucide-react';
import { Request, KeyValue, RequestBody, RequestAuth } from '@/types';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import KeyValueEditor from './request/KeyValueEditor';
import BodyEditor from './request/BodyEditor';
import AuthEditor from './request/AuthEditor';
import { parseCurl, isCurlCommand } from '@/utils/curlParser';

interface Props {
    tabId: string;
    initialData: Partial<Request>;
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

const METHOD_COLORS: Record<Method, string> = {
    GET: 'text-green-400', POST: 'text-yellow-400',
    PUT: 'text-blue-400', DELETE: 'text-red-400', PATCH: 'text-purple-400',
};

const METHOD_BG: Record<string, string> = {
    GET: 'bg-green-500/10 text-green-400', POST: 'bg-yellow-500/10 text-yellow-400',
    PUT: 'bg-blue-500/10 text-blue-400', DELETE: 'bg-red-500/10 text-red-400',
    PATCH: 'bg-purple-500/10 text-purple-400',
};

const DEFAULT_KV: KeyValue[] = [{ key: '', value: '', enabled: true }];

export default function NewRequestEditor({ tabId, initialData }: Props) {
    const queryClient = useQueryClient();
    const { removeTab, addTab } = useTabStore();

    const [name, setName] = useState(initialData.name || 'New Request');
    const [method, setMethod] = useState<Method>((initialData.method as Method) || 'GET');
    const [url, setUrl] = useState(initialData.url === 'https://example.com' ? '' : (initialData.url || ''));
    const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params');
    const [queryParams, setQueryParams] = useState<KeyValue[]>(initialData.queryParams?.length ? initialData.queryParams : DEFAULT_KV);
    const [headers, setHeaders] = useState<KeyValue[]>(initialData.headers?.length ? initialData.headers : DEFAULT_KV);
    const [body, setBody] = useState<RequestBody>(initialData.body || { type: 'none', content: null });
    const [auth, setAuth] = useState<RequestAuth>(initialData.auth || { type: 'none' });

    // URL suggestions
    const [suggestions, setSuggestions] = useState<{ url: string; method: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchSuggestions = (q: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const data = await requestApi.getUrlSuggestions(q);
                setSuggestions(data);
            } catch {
                setSuggestions([]);
            }
        }, 200);
    };

    const handleUrlChange = (val: string) => {
        // Check if it's a cURL command
        if (isCurlCommand(val)) {
            const parsed = parseCurl(val);
            if (parsed) {
                // Extract query params from URL
                try {
                    const urlObj = new URL(parsed.url);
                    const params: KeyValue[] = [];
                    urlObj.searchParams.forEach((value, key) => {
                        params.push({ key, value, enabled: true });
                    });
                    if (params.length === 0) params.push({ key: '', value: '', enabled: true });

                    setMethod(parsed.method as Method);
                    setUrl(parsed.url);
                    setHeaders(parsed.headers);
                    setQueryParams(params);
                    setBody(parsed.body);
                    setAuth(parsed.auth);

                    toast.success('cURL command imported successfully');
                } catch {
                    setMethod(parsed.method as Method);
                    setUrl(parsed.url);
                    setHeaders(parsed.headers);
                    setBody(parsed.body);
                    setAuth(parsed.auth);

                    toast.success('cURL command imported successfully');
                }
                return;
            } else {
                toast.error('Failed to parse cURL command');
                return;
            }
        }

        setUrl(val);
        fetchSuggestions(val);
        setShowSuggestions(true);
    };

    const handleUrlFocus = () => {
        fetchSuggestions(url);
        setShowSuggestions(true);
    };

    const handleSuggestionPick = (s: { url: string; method: string }) => {
        setUrl(s.url);
        setMethod(s.method as Method);
        setShowSuggestions(false);
    };

    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    const createMutation = useMutation({
        mutationFn: requestApi.create,
        onSuccess: (response, variables) => {
            const collectionId = variables.collection as string;
            queryClient.setQueryData(['requests', collectionId], (old: any) => {
                const existing: Request[] = old?.data || [];
                return { success: true, data: [...existing, response.data] };
            });
            if (response.data) {
                removeTab(tabId);
                addTab({ id: response.data._id, type: 'request', title: response.data.name, request: response.data });
            }
        },
    });

    const handleSend = () => {
        if (!initialData.collection || !initialData.workspace) return;

        const finalUrl = url || 'https://example.com';

        // Block example.com URLs
        try {
            const urlObj = new URL(finalUrl);
            if (urlObj.hostname === 'example.com' || urlObj.hostname.endsWith('.example.com')) {
                toast.error('This is a dummy API. Please add your own API to test.');
                return;
            }
        } catch (e) {
            // Invalid URL, let the backend handle it
        }

        createMutation.mutate({
            name,
            method,
            url: finalUrl,
            collection: initialData.collection as string,
            workspace: initialData.workspace as string,
            headers: headers.filter(h => h.key),
            queryParams: queryParams.filter(q => q.key),
            body,
            auth,
        });
    };

    const tabBadge = (tab: string) => {
        if (tab === 'params') return queryParams.filter(p => p.key).length || null;
        if (tab === 'headers') return headers.filter(h => h.key).length || null;
        return null;
    };

    return (
        <div className="flex flex-1 flex-col overflow-hidden bg-gray-900">
            {/* Name bar */}
            <div className="border-b border-gray-800 px-6 py-3 shrink-0">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent text-base font-semibold text-gray-100 placeholder-gray-500 focus:outline-none"
                    placeholder="Request Name"
                />
            </div>

            {/* URL bar */}
            <div className="border-b border-gray-800 px-6 py-3 shrink-0">
                <div className="flex gap-2">
                    <Select value={method} onValueChange={(v) => setMethod(v as Method)}>
                        <SelectTrigger className={`w-28 font-bold border-gray-700 bg-gray-800 ${METHOD_COLORS[method]}`}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as Method[]).map(m => (
                                <SelectItem key={m} value={m} className={`font-bold ${METHOD_COLORS[m]}`}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            onPaste={(e) => {
                                const pastedText = e.clipboardData.getData('text');
                                if (isCurlCommand(pastedText)) {
                                    e.preventDefault();
                                    handleUrlChange(pastedText);
                                }
                            }}
                            onFocus={handleUrlFocus}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') { setShowSuggestions(false); handleSend(); }
                                if (e.key === 'Escape') setShowSuggestions(false);
                            }}
                            placeholder="https://api.example.com/endpoint"
                            className="w-full rounded border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                            autoComplete="off"
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <ul className="absolute z-50 top-full left-0 right-0 mt-0.5 max-h-52 overflow-auto rounded border border-gray-700 bg-gray-900 shadow-xl text-xs">
                                {suggestions.map((s, i) => (
                                    <li
                                        key={i}
                                        onMouseDown={() => handleSuggestionPick(s)}
                                        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-800"
                                    >
                                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-bold ${METHOD_BG[s.method] || 'text-gray-400'}`}>
                                            {s.method}
                                        </span>
                                        <span className="truncate text-gray-300 font-mono">{s.url}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={createMutation.isPending}
                        className="shrink-0 flex items-center gap-2 rounded bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
                    >
                        {createMutation.isPending ? (
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : <Send className="h-4 w-4" />}
                        {createMutation.isPending ? 'Saving...' : 'Send'}
                    </button>
                </div>
                {createMutation.isError && (
                    <p className="mt-2 text-xs text-red-400">Failed to save. Please try again.</p>
                )}
            </div>

            {/* Tab nav */}
            <div className="border-b border-gray-800 shrink-0">
                <div className="flex gap-1 px-6">
                    {(['params', 'headers', 'body', 'auth'] as const).map((tab) => {
                        const badge = tabBadge(tab);
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`relative px-3 py-2.5 text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'text-orange-500' : 'text-gray-400 hover:text-gray-300'}`}
                            >
                                {tab}
                                {badge ? <span className="ml-1.5 rounded-full bg-orange-500/20 px-1.5 py-0.5 text-xs text-orange-400">{badge}</span> : null}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-auto p-4">
                {activeTab === 'params' && (
                    <KeyValueEditor rows={queryParams} onChange={setQueryParams} placeholder="Parameter" />
                )}
                {activeTab === 'headers' && (
                    <KeyValueEditor rows={headers} onChange={setHeaders} placeholder="Header name" />
                )}
                {activeTab === 'body' && (
                    <BodyEditor body={body} onChange={setBody} />
                )}
                {activeTab === 'auth' && (
                    <AuthEditor auth={auth} onChange={setAuth} />
                )}
            </div>
        </div>
    );
}
