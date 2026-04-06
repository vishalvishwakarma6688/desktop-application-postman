import { useRef, useState, useEffect } from 'react';
import { X, Plus, AlertTriangle } from 'lucide-react';
import { useTabStore } from '@/store/useTabStore';
import { requestApi } from '@/features/requests/api';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { collectionApi } from '@/features/collections/api';
import { useQuery } from '@tanstack/react-query';

const METHOD_COLORS: Record<string, string> = {
    GET: 'text-green-400',
    POST: 'text-yellow-400',
    PUT: 'text-blue-400',
    DELETE: 'text-red-400',
    PATCH: 'text-purple-400',
};

const METHOD_DOT: Record<string, string> = {
    GET: 'bg-green-400',
    POST: 'bg-yellow-400',
    PUT: 'bg-blue-400',
    DELETE: 'bg-red-400',
    PATCH: 'bg-purple-400',
};

export default function TabBar() {
    const { tabs, activeTabId, setActiveTab, removeTab, updateTab, addTab } = useTabStore();
    const { currentWorkspace } = useWorkspaceStore();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [confirmingClose, setConfirmingClose] = useState<string | null>(null);
    const [showNewTabPicker, setShowNewTabPicker] = useState(false);

    const { data: collectionsData } = useQuery({
        queryKey: ['collections', currentWorkspace?._id],
        queryFn: () => collectionApi.getByWorkspace(currentWorkspace!._id),
        enabled: !!currentWorkspace && showNewTabPicker,
    });

    const method = (tab: (typeof tabs)[0]) =>
        tab.request?.method || tab.unsavedRequest?.method;

    // Ctrl+W global close
    useEffect(() => {
        const handler = (e: Event) => {
            const tabId = (e as CustomEvent).detail;
            const tab = tabs.find(t => t.id === tabId);
            if (tab?.isDirty) setConfirmingClose(tabId);
            else removeTab(tabId);
        };
        window.addEventListener('kiro:close-tab', handler);
        return () => window.removeEventListener('kiro:close-tab', handler);
    }, [tabs, removeTab]);

    // Ctrl+T — open new tab picker
    useEffect(() => {
        const handler = () => setShowNewTabPicker(v => !v);
        window.addEventListener('kiro:new-tab', handler);
        return () => window.removeEventListener('kiro:new-tab', handler);
    }, []);

    // Middle-click to close
    const handleMouseDown = (e: React.MouseEvent, tabId: string) => {
        if (e.button === 1) {
            e.preventDefault();
            const tab = tabs.find(t => t.id === tabId);
            if (tab?.isDirty) {
                setConfirmingClose(tabId);
            } else {
                removeTab(tabId);
            }
        }
    };

    const handleCloseClick = (e: React.MouseEvent, tabId: string) => {
        e.stopPropagation();
        const tab = tabs.find(t => t.id === tabId);
        if (tab?.isDirty) {
            setConfirmingClose(tabId);
        } else {
            removeTab(tabId);
        }
    };

    const handleSaveAndClose = async (e: React.MouseEvent, tab: (typeof tabs)[0]) => {
        e.stopPropagation();
        const req = tab.request;
        if (req) {
            try {
                const res = await requestApi.update(req._id, {
                    url: req.url, method: req.method,
                    headers: req.headers, queryParams: req.queryParams,
                    body: req.body, auth: req.auth, scripts: req.scripts,
                });
                if (res.data) updateTab(tab.id, { request: res.data, isDirty: false });
            } catch { /* ignore */ }
        }
        removeTab(tab.id);
        setConfirmingClose(null);
    };

    const handleDiscardAndClose = (e: React.MouseEvent, tabId: string) => {
        e.stopPropagation();
        removeTab(tabId);
        setConfirmingClose(null);
    };

    const handleNewTab = (collectionId: string, workspaceId: string) => {
        const tabId = `new-${Date.now()}`;
        addTab({
            id: tabId,
            type: 'new-request',
            title: 'New Request',
            unsavedRequest: {
                method: 'GET',
                url: '',
                collection: collectionId,
                workspace: workspaceId,
                headers: [],
                queryParams: [],
                body: { type: 'none', content: null },
                auth: { type: 'none' },
            },
        });
        setShowNewTabPicker(false);
    };

    return (
        <div className="flex h-9 items-stretch border-b border-gray-800 bg-gray-950 shrink-0">
            {/* Scrollable tab list */}
            <div
                ref={scrollRef}
                className="flex flex-1 items-stretch overflow-x-auto"
                style={{ scrollbarWidth: 'none' }}
            >
                {tabs.map((tab) => {
                    const isActive = tab.id === activeTabId;
                    const m = method(tab);

                    return (
                        <div
                            key={tab.id}
                            onMouseDown={(e) => handleMouseDown(e, tab.id)}
                            onClick={() => setActiveTab(tab.id)}
                            className={`group relative flex items-center gap-1.5 border-r border-gray-800 px-3 cursor-pointer transition-colors shrink-0 max-w-[180px] min-w-[100px] ${isActive
                                ? 'bg-gray-900 text-gray-100'
                                : 'bg-gray-950 text-gray-500 hover:bg-gray-900 hover:text-gray-300'
                                }`}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
                            )}

                            {/* Method dot */}
                            {m && (
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${METHOD_DOT[m] || 'bg-gray-500'}`} />
                            )}

                            {/* Method label */}
                            {m && (
                                <span className={`text-xs font-bold shrink-0 ${METHOD_COLORS[m] || 'text-gray-400'}`}>
                                    {m}
                                </span>
                            )}

                            {/* Title */}
                            <span className="flex-1 truncate text-xs">
                                {tab.title}
                            </span>

                            {/* Dirty indicator */}
                            {tab.isDirty && (
                                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0 group-hover:hidden" />
                            )}

                            {/* Close button */}
                            <button
                                onClick={(e) => handleCloseClick(e, tab.id)}
                                className={`shrink-0 rounded p-0.5 transition-colors hover:bg-gray-700 hover:text-red-400 ${tab.isDirty
                                    ? 'opacity-0 group-hover:opacity-100'
                                    : 'opacity-0 group-hover:opacity-100'
                                    }`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* New tab button */}
            <div className="relative">
                <button
                    onClick={() => setShowNewTabPicker(v => !v)}
                    className="flex items-center justify-center w-9 h-full shrink-0 border-l border-gray-800 text-gray-600 hover:bg-gray-800 hover:text-gray-300 transition-colors"
                    title="New tab"
                >
                    <Plus className="h-4 w-4" />
                </button>

                {showNewTabPicker && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowNewTabPicker(false)} />
                        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded border border-gray-700 bg-gray-900 shadow-xl">
                            <div className="px-3 py-2 text-xs font-semibold uppercase text-gray-500 border-b border-gray-800">
                                Pick a collection
                            </div>
                            {!currentWorkspace ? (
                                <p className="px-3 py-2 text-xs text-gray-600">No workspace selected</p>
                            ) : !collectionsData?.data?.length ? (
                                <p className="px-3 py-2 text-xs text-gray-600">No collections yet</p>
                            ) : (
                                collectionsData.data.map((col: any) => (
                                    <button
                                        key={col._id}
                                        onClick={() => handleNewTab(col._id, currentWorkspace._id)}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                                    >
                                        <span className="truncate">{col.name}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Unsaved changes confirmation */}
            {confirmingClose && (() => {
                const tab = tabs.find(t => t.id === confirmingClose);
                if (!tab) return null;
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmingClose(null)} />
                        <div className="relative z-10 w-80 rounded-lg border border-gray-700 bg-gray-900 p-5 shadow-2xl">
                            <div className="flex items-center gap-3 mb-3">
                                <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />
                                <p className="text-sm font-semibold text-gray-100">Unsaved changes</p>
                            </div>
                            <p className="text-xs text-gray-400 mb-4">
                                <span className="text-gray-200 font-medium">"{tab.title}"</span> has unsaved changes. Save before closing?
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => handleSaveAndClose(e, tab)}
                                    className="flex-1 rounded bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 transition-colors"
                                >
                                    Save & Close
                                </button>
                                <button
                                    onClick={(e) => handleDiscardAndClose(e, confirmingClose)}
                                    className="flex-1 rounded bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-600 transition-colors"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={() => setConfirmingClose(null)}
                                    className="rounded bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
