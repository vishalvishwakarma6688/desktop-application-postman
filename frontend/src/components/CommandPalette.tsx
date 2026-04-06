import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, FileText, Folder, Globe, History, X } from 'lucide-react';
import { useTabStore } from '@/store/useTabStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useRequestStore } from '@/store/useRequestStore';
import { collectionApi } from '@/features/collections/api';
import { requestApi } from '@/features/requests/api';
import { environmentApi } from '@/features/environments/api';
import { historyApi } from '@/features/history/api';
import { Collection, Request, Environment } from '@/types';

interface Props { onClose: () => void; }

type ResultItem =
    | { type: 'request'; data: Request; collectionName: string }
    | { type: 'collection'; data: Collection }
    | { type: 'environment'; data: Environment }
    | { type: 'history'; data: any };

const METHOD_COLORS: Record<string, string> = {
    GET: 'text-green-400', POST: 'text-yellow-400',
    PUT: 'text-blue-400', DELETE: 'text-red-400', PATCH: 'text-purple-400',
};

export default function CommandPalette({ onClose }: Props) {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const { addTab } = useTabStore();
    const { currentWorkspace } = useWorkspaceStore();
    const { setActiveEnvironment } = useRequestStore();

    const { data: collectionsData } = useQuery({
        queryKey: ['collections', currentWorkspace?._id],
        queryFn: () => collectionApi.getByWorkspace(currentWorkspace!._id),
        enabled: !!currentWorkspace,
    });

    const { data: envsData } = useQuery({
        queryKey: ['environments', currentWorkspace?._id],
        queryFn: () => environmentApi.getByWorkspace(currentWorkspace!._id),
        enabled: !!currentWorkspace,
    });

    const { data: historyData } = useQuery({
        queryKey: ['history'],
        queryFn: () => historyApi.getAll(20),
    });

    // Fetch all requests for all collections
    const collections: Collection[] = collectionsData?.data || [];
    const allRequestQueries = useQuery({
        queryKey: ['all-requests', collections.map(c => c._id).join(',')],
        queryFn: async () => {
            const results = await Promise.all(
                collections.map(c => requestApi.getByCollection(c._id))
            );
            return results.flatMap((r, i) =>
                (r.data || []).map(req => ({ ...req, _collectionName: collections[i].name }))
            );
        },
        enabled: collections.length > 0,
    });

    const results = useMemo((): ResultItem[] => {
        const q = query.toLowerCase().trim();
        const items: ResultItem[] = [];

        if (!q) {
            // Show recent history when no query
            (historyData?.data || []).slice(0, 8).forEach(h => {
                items.push({ type: 'history', data: h });
            });
            return items;
        }

        // Requests
        (allRequestQueries.data || []).forEach((req: any) => {
            if (req.name.toLowerCase().includes(q) || req.url.toLowerCase().includes(q) || req.method.toLowerCase().includes(q)) {
                items.push({ type: 'request', data: req, collectionName: req._collectionName });
            }
        });

        // Collections
        collections.forEach(c => {
            if (c.name.toLowerCase().includes(q)) {
                items.push({ type: 'collection', data: c });
            }
        });

        // Environments
        (envsData?.data || []).forEach((e: Environment) => {
            if (e.name.toLowerCase().includes(q)) {
                items.push({ type: 'environment', data: e });
            }
        });

        return items.slice(0, 20);
    }, [query, allRequestQueries.data, collections, envsData?.data, historyData?.data]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        setSelected(0);
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
        if (e.key === 'Enter') { e.preventDefault(); handleSelect(results[selected]); }
        if (e.key === 'Escape') onClose();
    };

    const handleSelect = (item: ResultItem | undefined) => {
        if (!item) return;
        if (item.type === 'request') {
            addTab({ id: item.data._id, type: 'request', title: item.data.name, request: item.data });
            onClose();
        } else if (item.type === 'history') {
            const snap = item.data.requestSnapshot;
            if (snap) {
                // Open as a view-only tab showing the history
            }
            onClose();
        } else if (item.type === 'environment') {
            setActiveEnvironment(item.data);
            onClose();
        } else {
            onClose();
        }
    };

    // Scroll selected into view
    useEffect(() => {
        const el = listRef.current?.children[selected] as HTMLElement;
        el?.scrollIntoView({ block: 'nearest' });
    }, [selected]);

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative z-10 w-full max-w-xl rounded-xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden">
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
                    <Search className="h-4 w-4 text-gray-500 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search requests, collections, environments..."
                        className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="text-gray-600 hover:text-gray-400">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    <kbd className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">Esc</kbd>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-80 overflow-auto py-1">
                    {results.length === 0 && (
                        <p className="px-4 py-6 text-center text-sm text-gray-600">
                            {query ? 'No results found' : 'Start typing to search...'}
                        </p>
                    )}
                    {!query && results.length > 0 && (
                        <p className="px-4 py-1.5 text-xs text-gray-600 uppercase tracking-wider">Recent</p>
                    )}
                    {results.map((item, i) => (
                        <button
                            key={i}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelected(i)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selected ? 'bg-gray-800' : 'hover:bg-gray-800/50'}`}
                        >
                            {item.type === 'request' && (
                                <>
                                    <FileText className="h-4 w-4 text-gray-500 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold shrink-0 ${METHOD_COLORS[item.data.method] || 'text-gray-400'}`}>{item.data.method}</span>
                                            <span className="text-sm text-gray-200 truncate">{item.data.name}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{item.collectionName} · {item.data.url}</p>
                                    </div>
                                </>
                            )}
                            {item.type === 'collection' && (
                                <>
                                    <Folder className="h-4 w-4 text-orange-400 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm text-gray-200">{item.data.name}</span>
                                        <p className="text-xs text-gray-500">Collection</p>
                                    </div>
                                </>
                            )}
                            {item.type === 'environment' && (
                                <>
                                    <Globe className="h-4 w-4 text-blue-400 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm text-gray-200">{item.data.name}</span>
                                        <p className="text-xs text-gray-500">Environment · click to activate</p>
                                    </div>
                                </>
                            )}
                            {item.type === 'history' && (
                                <>
                                    <History className="h-4 w-4 text-gray-500 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold shrink-0 ${METHOD_COLORS[item.data.requestSnapshot?.method] || 'text-gray-400'}`}>
                                                {item.data.requestSnapshot?.method}
                                            </span>
                                            <span className="text-sm text-gray-300 truncate">{item.data.requestSnapshot?.url?.replace(/^https?:\/\//, '')}</span>
                                        </div>
                                        <p className="text-xs text-gray-600">
                                            {item.data.response?.status && <span className="mr-2">{item.data.response.status}</span>}
                                            Recent
                                        </p>
                                    </div>
                                </>
                            )}
                        </button>
                    ))}
                </div>

                {/* Footer hints */}
                <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-800 text-xs text-gray-600">
                    <span><kbd className="bg-gray-800 px-1 rounded">↑↓</kbd> navigate</span>
                    <span><kbd className="bg-gray-800 px-1 rounded">Enter</kbd> open</span>
                    <span><kbd className="bg-gray-800 px-1 rounded">Esc</kbd> close</span>
                </div>
            </div>
        </div>
    );
}
