import { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { requestApi } from '@/features/requests/api';
import { useTabStore } from '@/store/useTabStore';
import { useRequestStore } from '@/store/useRequestStore';
import { Send, Save, X, Pencil, Code, Cookie, Settings } from 'lucide-react';
import { KeyValue, RequestBody, RequestAuth } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import KeyValueEditor from './request/KeyValueEditor';
import BodyEditor from './request/BodyEditor';
import AuthEditor from './request/AuthEditor';
import ResponsePanel from './request/ResponsePanel';
import ScriptEditor from './request/ScriptEditor';
import RightSidebar from './RightSidebar';
import { parseCurl, isCurlCommand } from '@/utils/curlParser';

const METHOD_COLORS: Record<string, string> = {
    GET: 'text-green-400', POST: 'text-yellow-400',
    PUT: 'text-blue-400', DELETE: 'text-red-400', PATCH: 'text-purple-400',
};
const DEFAULT_KV: KeyValue[] = [{ key: '', value: '', enabled: true }];

export default function RequestEditor() {
    const queryClient = useQueryClient();
    const { tabs, activeTabId, updateTab } = useTabStore();
    const { activeEnvironment } = useRequestStore();
    const activeTab = tabs.find(t => t.id === activeTabId);
    const activeRequest = activeTab?.request;

    const [currentTab, setCurrentTab] = useState<'params' | 'headers' | 'body' | 'auth' | 'scripts'>('params');
    const [response, setResponse] = useState<any>(null);
    const [testResults, setTestResults] = useState<{ name: string; passed: boolean; error?: string }[]>([]);
    const [isCancelled, setIsCancelled] = useState(false);
    const [requestPanelHeight, setRequestPanelHeight] = useState(200);
    const [urlSuggestions, setUrlSuggestions] = useState<{ url: string; method: string }[]>([]);
    const [showUrlSuggestions, setShowUrlSuggestions] = useState(false);
    const [showRightSidebar, setShowRightSidebar] = useState(false);
    const [rightSidebarTab, setRightSidebarTab] = useState<'code' | 'cookies' | 'settings'>('code');
    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState('');
    const urlSuggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const cancelledRef = useRef(false);

    const handleDragStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
        const onMove = (ev: MouseEvent) => {
            if (!isDragging.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            setRequestPanelHeight(Math.min(Math.max(ev.clientY - rect.top, 80), rect.height * 0.75));
        };
        const onUp = () => {
            isDragging.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, []);

    const saveMutation = useMutation({
        mutationFn: (data: { id: string; updates: any }) => requestApi.update(data.id, data.updates),
        onSuccess: (res) => {
            if (res.data && activeTab) {
                updateTab(activeTab.id, { request: res.data, isDirty: false });
                toast.success('Request saved');
                const collectionId = typeof res.data.collection === 'string'
                    ? res.data.collection : (res.data.collection as any)?._id;
                if (collectionId) {
                    queryClient.setQueryData(['requests', collectionId], (old: any) => {
                        if (!old?.data) return old;
                        return { ...old, data: old.data.map((r: any) => r._id === res.data!._id ? res.data : r) };
                    });
                }
            }
        },
        onError: () => {
            toast.error('Failed to save request');
        },
    });

    const executeMutation = useMutation({
        mutationFn: (id: string) => requestApi.execute(id, activeEnvironment?._id),
        onSuccess: (data) => {
            if (cancelledRef.current) return;
            if (data.success && data.data) {
                setResponse(data.data.result);
                setTestResults(data.data.testResults || []);
            } else {
                setResponse({ error: data.error?.message || 'Request failed' });
                setTestResults([]);
            }
        },
        onError: (err: any) => {
            if (cancelledRef.current) return;
            setResponse({
                error: err?.response?.data?.error?.message
                    || err?.message
                    || 'Network error — could not reach the server',
            });
            setTestResults([]);
        },
    });

    const handleSend = () => {
        if (!activeRequest) return;

        // Block example.com URLs
        try {
            const url = new URL(activeRequest.url);
            if (url.hostname === 'example.com' || url.hostname.endsWith('.example.com')) {
                toast.error('This is a dummy API. Please add your own API to test.');
                return;
            }
        } catch (e) {
            // Invalid URL, let the backend handle it
        }

        cancelledRef.current = false;
        setIsCancelled(false);
        setResponse(null);
        saveMutation.mutate(
            {
                id: activeRequest._id,
                updates: {
                    url: activeRequest.url, method: activeRequest.method,
                    headers: activeRequest.headers, queryParams: activeRequest.queryParams,
                    body: activeRequest.body, auth: activeRequest.auth,
                    scripts: activeRequest.scripts,
                },
            },
            {
                onSuccess: () => executeMutation.mutate(activeRequest._id),
                onError: () => executeMutation.mutate(activeRequest._id),
            }
        );
    };

    const handleCancel = () => {
        cancelledRef.current = true;
        setIsCancelled(true);
        setResponse({ error: 'Request cancelled by user' });
    };

    const patch = (updates: Record<string, any>) => {
        if (!activeTab || !activeRequest) return;
        updateTab(activeTab.id, { request: { ...activeRequest, ...updates }, isDirty: true });
    };

    // Keep URL and queryParams in sync
    const handleUrlChange = (newUrl: string) => {
        // Check if it's a cURL command
        if (isCurlCommand(newUrl)) {
            const parsed = parseCurl(newUrl);
            if (parsed) {
                // Extract query params from URL
                try {
                    const urlObj = new URL(parsed.url);
                    const params: KeyValue[] = [];
                    urlObj.searchParams.forEach((value, key) => {
                        params.push({ key, value, enabled: true });
                    });
                    if (params.length === 0) params.push({ key: '', value: '', enabled: true });

                    patch({
                        method: parsed.method,
                        url: parsed.url,
                        headers: parsed.headers,
                        queryParams: params,
                        body: parsed.body,
                        auth: parsed.auth
                    });

                    toast.success('cURL command imported successfully');
                } catch {
                    patch({
                        method: parsed.method,
                        url: parsed.url,
                        headers: parsed.headers,
                        body: parsed.body,
                        auth: parsed.auth
                    });
                    toast.success('cURL command imported successfully');
                }
                return;
            } else {
                toast.error('Failed to parse cURL command');
                return;
            }
        }

        // Fetch URL suggestions debounced
        if (urlSuggestTimer.current) clearTimeout(urlSuggestTimer.current);
        urlSuggestTimer.current = setTimeout(async () => {
            if (newUrl.trim().length > 2) {
                const suggestions = await requestApi.getUrlSuggestions(newUrl);
                setUrlSuggestions(suggestions);
                setShowUrlSuggestions(suggestions.length > 0);
            } else {
                setUrlSuggestions([]);
                setShowUrlSuggestions(false);
            }
        }, 200);

        try {
            const urlObj = new URL(newUrl);
            const params: KeyValue[] = [];
            urlObj.searchParams.forEach((value, key) => {
                params.push({ key, value, enabled: true });
            });
            if (params.length === 0) params.push({ key: '', value: '', enabled: true });
            patch({ url: newUrl, queryParams: params });
        } catch {
            patch({ url: newUrl });
        }
    };

    const handleParamsChange = (rows: KeyValue[]) => {
        if (!activeRequest) return;
        try {
            const base = activeRequest.url.split('?')[0];
            const urlObj = new URL(base || 'http://placeholder');
            rows.filter(r => r.enabled && r.key).forEach(r => urlObj.searchParams.append(r.key, r.value));
            const qs = urlObj.searchParams.toString();
            const newUrl = base + (qs ? `?${qs}` : '');
            patch({ queryParams: rows, url: newUrl });
        } catch {
            patch({ queryParams: rows });
        }
    };

    const isSending = !isCancelled && (saveMutation.isPending || executeMutation.isPending);

    // Listen for global Ctrl+Enter shortcut
    useEffect(() => {
        const handler = () => { if (!isSending) handleSend(); };
        window.addEventListener('kiro:send', handler);
        return () => window.removeEventListener('kiro:send', handler);
    }, [isSending, activeRequest]);

    // Inline name save mutation
    const saveNameMutation = useMutation({
        mutationFn: (name: string) => requestApi.update(activeRequest!._id, { name }),
        onSuccess: (res) => {
            if (res.data && activeTab) {
                updateTab(activeTab.id, { title: res.data.name, request: res.data });

                // Update the requests cache for the sidebar
                const collectionId = typeof res.data.collection === 'string'
                    ? res.data.collection : (res.data.collection as any)?._id;
                if (collectionId) {
                    queryClient.setQueryData(['requests', collectionId], (old: any) => {
                        if (!old?.data) return old;
                        return {
                            ...old,
                            data: old.data.map((r: any) => r._id === res.data!._id ? res.data : r)
                        };
                    });
                }
            }
            setIsEditingName(false);
        },
    });

    const handleNameSave = () => {
        const trimmed = editNameValue.trim();
        if (!trimmed || !activeRequest) { setIsEditingName(false); return; }
        if (trimmed === activeRequest.name) { setIsEditingName(false); return; }
        saveNameMutation.mutate(trimmed);
    };

    // Detect {{variables}} in URL
    const detectedVars = activeRequest
        ? [...new Set([...(activeRequest.url.matchAll(/\{\{(\w+)\}\}/g))].map(m => m[1]))]
        : [];

    const envVarMap: Record<string, string> = {};
    if (activeEnvironment?.variables) {
        activeEnvironment.variables.filter(v => v.enabled).forEach(v => { envVarMap[v.key] = v.value; });
    }

    if (!activeRequest) return null;

    const queryParams = activeRequest.queryParams?.length ? activeRequest.queryParams : DEFAULT_KV;
    const headers = activeRequest.headers?.length ? activeRequest.headers : DEFAULT_KV;

    return (
        <>
            <div className="flex flex-1 overflow-hidden bg-gray-900">
                {/* Main Editor */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Name bar */}
                    <div className="border-b border-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded bg-gray-800 shrink-0 ${METHOD_COLORS[activeRequest.method] || 'text-gray-400'}`}>
                                {activeRequest.method}
                            </span>
                            {isEditingName ? (
                                <input
                                    autoFocus
                                    value={editNameValue}
                                    onChange={(e) => setEditNameValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleNameSave();
                                        if (e.key === 'Escape') setIsEditingName(false);
                                    }}
                                    onBlur={handleNameSave}
                                    className="rounded border border-orange-500 bg-gray-800 px-2 py-0.5 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-orange-500/30 min-w-0 w-64"
                                />
                            ) : (
                                <button
                                    className="group/name flex items-center gap-1.5 min-w-0"
                                    onClick={() => { setEditNameValue(activeRequest.name); setIsEditingName(true); }}
                                    title="Click to rename"
                                >
                                    <h2 className="text-sm font-semibold text-gray-200 truncate">{activeRequest.name}</h2>
                                    <Pencil className="h-3 w-3 text-gray-600 opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0" />
                                </button>
                            )}
                        </div>
                        {activeTab?.isDirty && !isSending && (
                            <button
                                onClick={() => saveMutation.mutate({ id: activeRequest._id, updates: { url: activeRequest.url, method: activeRequest.method, headers: activeRequest.headers, queryParams: activeRequest.queryParams, body: activeRequest.body, auth: activeRequest.auth, scripts: activeRequest.scripts } })}
                                className="shrink-0 flex items-center gap-1.5 rounded bg-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-600 transition-colors"
                            >
                                <Save className="h-3.5 w-3.5" /> Save
                            </button>
                        )}
                    </div>

                    {/* URL bar */}
                    <div className="border-b border-gray-800 px-6 py-3 shrink-0">
                        <div className="flex gap-2">
                            <Select value={activeRequest.method} onValueChange={(v) => patch({ method: v })}>
                                <SelectTrigger className={`w-28 font-bold border-gray-700 bg-gray-800 ${METHOD_COLORS[activeRequest.method] || 'text-gray-400'}`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => (
                                        <SelectItem key={m} value={m} className={`font-bold ${METHOD_COLORS[m]}`}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={activeRequest.url}
                                    onChange={(e) => handleUrlChange(e.target.value)}
                                    onPaste={(e) => {
                                        const pastedText = e.clipboardData.getData('text');
                                        if (isCurlCommand(pastedText)) {
                                            e.preventDefault();
                                            handleUrlChange(pastedText);
                                        }
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSend()}
                                    onFocus={async () => {
                                        const suggestions = await requestApi.getUrlSuggestions('');
                                        setUrlSuggestions(suggestions);
                                        setShowUrlSuggestions(suggestions.length > 0);
                                    }}
                                    onBlur={() => setTimeout(() => setShowUrlSuggestions(false), 150)}
                                    placeholder="https://api.example.com/endpoint"
                                    className="w-full rounded border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                                    autoComplete="off"
                                />
                                {showUrlSuggestions && (
                                    <ul className="absolute z-50 top-full left-0 mt-0.5 w-full max-h-52 overflow-auto rounded border border-gray-700 bg-gray-900 shadow-xl">
                                        {urlSuggestions.map((s, i) => (
                                            <li
                                                key={i}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleUrlChange(s.url);
                                                    setShowUrlSuggestions(false);
                                                }}
                                                className="flex items-center gap-3 cursor-pointer px-3 py-2 hover:bg-gray-800 border-b border-gray-800 last:border-0"
                                            >
                                                <span className={`text-xs font-bold w-12 shrink-0 ${METHOD_COLORS[s.method] || 'text-gray-400'}`}>{s.method}</span>
                                                <span className="text-xs text-gray-300 truncate">{s.url}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {isSending ? (
                                <button
                                    onClick={handleCancel}
                                    className="shrink-0 flex items-center gap-2 rounded bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                                >
                                    <X className="h-4 w-4" /> Cancel
                                </button>
                            ) : (
                                <button
                                    onClick={handleSend}
                                    className="shrink-0 flex items-center gap-2 rounded bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
                                >
                                    <Send className="h-4 w-4" /> Send
                                </button>
                            )}
                        </div>
                        {/* Variable indicator */}
                        {detectedVars.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                                <span className="text-xs text-gray-500">Variables:</span>
                                {detectedVars.map(v => (
                                    <span
                                        key={v}
                                        title={envVarMap[v] !== undefined ? `Resolved: ${envVarMap[v]}` : 'Not set in active environment'}
                                        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-mono border ${envVarMap[v] !== undefined ? 'border-orange-500/40 bg-orange-500/10 text-orange-400' : 'border-gray-600 bg-gray-800 text-gray-400'}`}
                                    >
                                        {`{{${v}}}`}
                                        {envVarMap[v] !== undefined && (
                                            <span className="text-gray-500">→ {envVarMap[v]}</span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* cURL + shortcuts hint */}
                    <div className="border-b border-gray-800 px-6 py-1.5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span><kbd className="font-mono bg-gray-800 px-1 rounded">Ctrl+Enter</kbd> Send</span>
                            <span><kbd className="font-mono bg-gray-800 px-1 rounded">Ctrl+S</kbd> Save</span>
                        </div>
                    </div>

                    {/* Tab nav */}
                    <div className="border-b border-gray-800 shrink-0">
                        <div className="flex gap-1 px-6">
                            {(['params', 'headers', 'body', 'auth', 'scripts'] as const).map((tab) => {
                                const badge = tab === 'params'
                                    ? (activeRequest.queryParams?.filter(p => p.key).length || null)
                                    : tab === 'headers'
                                        ? (activeRequest.headers?.filter(h => h.key).length || null)
                                        : null;
                                return (
                                    <button key={tab} onClick={() => setCurrentTab(tab)}
                                        className={`relative px-3 py-2.5 text-sm font-medium capitalize transition-colors ${currentTab === tab ? 'text-orange-500' : 'text-gray-400 hover:text-gray-300'}`}
                                    >
                                        {tab}
                                        {badge ? <span className="ml-1.5 rounded-full bg-orange-500/20 px-1.5 py-0.5 text-xs text-orange-400">{badge}</span> : null}
                                        {currentTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Resizable split */}
                    <div ref={containerRef} className="flex flex-1 flex-col overflow-hidden">
                        <div style={{ height: requestPanelHeight }} className="overflow-auto p-4 shrink-0">
                            {currentTab === 'params' && <KeyValueEditor rows={queryParams} onChange={handleParamsChange} placeholder="Parameter" />}
                            {currentTab === 'headers' && <KeyValueEditor rows={headers} onChange={(r) => patch({ headers: r })} placeholder="Header name" />}
                            {currentTab === 'body' && <BodyEditor body={activeRequest.body || { type: 'none', content: null }} onChange={(b: RequestBody) => patch({ body: b })} />}
                            {currentTab === 'auth' && <AuthEditor auth={activeRequest.auth || { type: 'none' }} onChange={(a: RequestAuth) => patch({ auth: a })} />}
                            {currentTab === 'scripts' && <ScriptEditor scripts={activeRequest.scripts || {}} onChange={(s) => patch({ scripts: s })} />}
                        </div>

                        {/* Drag handle */}
                        <div onMouseDown={handleDragStart} className="group relative h-2 shrink-0 cursor-row-resize bg-gray-800 hover:bg-orange-500/20 transition-colors">
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
                                <div className="h-0.5 w-10 rounded-full bg-gray-600 group-hover:bg-orange-400 transition-colors" />
                            </div>
                        </div>

                        <ResponsePanel response={response} isSending={isSending} onCancel={handleCancel} testResults={testResults} />
                    </div>
                </div>

                {/* Vertical Icon Sidebar */}
                <div className="flex flex-col border-l border-gray-800 bg-gray-900 shrink-0">
                    <button
                        onClick={() => {
                            setRightSidebarTab('code');
                            setShowRightSidebar(!showRightSidebar || rightSidebarTab !== 'code');
                        }}
                        className={`p-3 border-b border-gray-800 transition-colors ${showRightSidebar && rightSidebarTab === 'code'
                            ? 'bg-gray-800 text-blue-500'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                            }`}
                        title="Code Snippet"
                    >
                        <Code className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => {
                            setRightSidebarTab('cookies');
                            setShowRightSidebar(!showRightSidebar || rightSidebarTab !== 'cookies');
                        }}
                        className={`p-3 border-b border-gray-800 transition-colors ${showRightSidebar && rightSidebarTab === 'cookies'
                            ? 'bg-gray-800 text-blue-500'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                            }`}
                        title="Cookies"
                    >
                        <Cookie className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => {
                            setRightSidebarTab('settings');
                            setShowRightSidebar(!showRightSidebar || rightSidebarTab !== 'settings');
                        }}
                        className={`p-3 border-b border-gray-800 transition-colors ${showRightSidebar && rightSidebarTab === 'settings'
                            ? 'bg-gray-800 text-blue-500'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                            }`}
                        title="Settings"
                    >
                        <Settings className="h-5 w-5" />
                    </button>
                </div>

                {/* Right Sidebar */}
                <RightSidebar
                    isOpen={showRightSidebar}
                    onClose={() => setShowRightSidebar(false)}
                    activeTab={rightSidebarTab}
                    request={activeRequest}
                />
            </div>
        </>
    );
}
