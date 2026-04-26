import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { collectionApi } from '@/features/collections/api';
import { requestApi } from '@/features/requests/api';
import { workspaceApi } from '@/features/workspace/api';
import { useTabStore } from '@/store/useTabStore';
import { Collection, Request } from '@/types';
import { Plus, Folder, Upload, Search, X, FileJson, Terminal } from 'lucide-react';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import CollectionItem from '@/components/sidebar/CollectionItem';
import { parseCurl, isCurlCommand } from '@/utils/curlParser';

export default function Sidebar() {
    const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspaceStore();
    const { addTab } = useTabStore();
    const queryClient = useQueryClient();

    const [showNewWorkspace, setShowNewWorkspace] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [showNewCollection, setShowNewCollection] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
    const [importError, setImportError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showImportMenu, setShowImportMenu] = useState(false);
    const [showPasteDialog, setShowPasteDialog] = useState(false);
    const [pasteContent, setPasteContent] = useState('');
    const importInputRef = useRef<HTMLInputElement>(null);
    const importMenuRef = useRef<HTMLDivElement>(null);

    const { data: collectionsData } = useQuery({
        queryKey: ['collections', currentWorkspace?._id],
        queryFn: () => collectionApi.getByWorkspace(currentWorkspace!._id),
        enabled: !!currentWorkspace,
    });

    const createWorkspaceMutation = useMutation({
        mutationFn: workspaceApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
            setShowNewWorkspace(false);
            setNewWorkspaceName('');
        },
    });

    const createCollectionMutation = useMutation({
        mutationFn: collectionApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collections'] });
            setShowNewCollection(false);
            setNewCollectionName('');
            toast.success('Collection created');
        },
    });

    const createRequestMutation = useMutation({
        mutationFn: requestApi.create,
        onSuccess: (response, variables) => {
            const collectionId = variables.collection as string;
            queryClient.setQueryData(['requests', collectionId], (old: any) => {
                const existing: Request[] = old?.data || [];
                return { success: true, data: [...existing, response.data] };
            });
            if (response.data) {
                addTab({
                    id: response.data._id,
                    type: 'request',
                    title: response.data.name,
                    request: response.data,
                });
                toast.success('Request created');
            }
        },
    });

    const toggleCollection = (collectionId: string) => {
        setExpandedCollections(prev => {
            const next = new Set(prev);
            next.has(collectionId) ? next.delete(collectionId) : next.add(collectionId);
            return next;
        });
    };

    const handleCreateWorkspace = () => {
        if (newWorkspaceName.trim()) createWorkspaceMutation.mutate({ name: newWorkspaceName });
    };

    const handleCreateCollection = () => {
        if (newCollectionName.trim() && currentWorkspace) {
            createCollectionMutation.mutate({ name: newCollectionName, workspace: currentWorkspace._id });
        }
    };

    const handleNewRequest = (collectionId: string) => {
        if (!currentWorkspace) return;
        setExpandedCollections(prev => new Set([...prev, collectionId]));
        createRequestMutation.mutate({
            name: 'New Request',
            method: 'GET',
            url: 'https://example.com',
            collection: collectionId,
            workspace: currentWorkspace._id,
            headers: [],
            queryParams: [],
            body: { type: 'none', content: null },
            auth: { type: 'none' },
        });
    };

    const handleOpenRequest = (request: Request) => {
        addTab({ id: request._id, type: 'request', title: request.name, request });
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setImportError(null);
        setShowImportMenu(false);
        const file = e.target.files?.[0];
        if (!file || !currentWorkspace) return;
        try {
            const text = await file.text();
            const json = JSON.parse(text);
            await importPostmanCollection(json, file.name);
        } catch (err: any) {
            setImportError(err.message || 'Invalid JSON file');
            toast.error(err.message || 'Import failed');
        } finally {
            if (importInputRef.current) importInputRef.current.value = '';
        }
    };

    const handlePasteImport = async () => {
        if (!pasteContent.trim() || !currentWorkspace) return;
        setImportError(null);

        try {
            // Check if it's a cURL command
            if (isCurlCommand(pasteContent)) {
                const parsed = parseCurl(pasteContent);
                if (!parsed) {
                    throw new Error('Failed to parse cURL command');
                }

                // Create a new collection for the cURL import
                const colRes = await collectionApi.create({
                    name: 'Imported from cURL',
                    workspace: currentWorkspace._id
                });
                const collection = colRes.data;
                if (!collection) throw new Error('Failed to create collection');

                // Create the request
                await requestApi.create({
                    name: 'Imported Request',
                    method: parsed.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
                    url: parsed.url,
                    collection: collection._id,
                    workspace: currentWorkspace._id,
                    headers: parsed.headers,
                    queryParams: [],
                    body: parsed.body,
                    auth: parsed.auth,
                });

                queryClient.invalidateQueries({ queryKey: ['collections'] });
                queryClient.invalidateQueries({ queryKey: ['requests'] });
                setExpandedCollections(prev => new Set([...prev, collection._id]));
                toast.success('cURL imported successfully');
            } else {
                // Try to parse as JSON
                const json = JSON.parse(pasteContent);
                await importPostmanCollection(json, 'Pasted Collection');
            }

            setShowPasteDialog(false);
            setPasteContent('');
        } catch (err: any) {
            setImportError(err.message || 'Invalid content');
            toast.error(err.message || 'Import failed');
        }
    };

    const importPostmanCollection = async (json: any, fileName: string) => {
        if (!currentWorkspace) return;

        const info = json.info || {};
        const collectionName = info.name || fileName.replace(/\.json$/, '');
        const items: any[] = json.item || [];

        const colRes = await collectionApi.create({ name: collectionName, workspace: currentWorkspace._id });
        const collection = colRes.data;
        if (!collection) throw new Error('Failed to create collection');

        const flatRequests: any[] = [];
        const flatten = (arr: any[]) => {
            arr.forEach(item => {
                if (item.item) flatten(item.item);
                else flatRequests.push(item);
            });
        };
        flatten(items);

        for (const item of flatRequests) {
            const req = item.request || {};
            const method = (req.method || 'GET').toUpperCase();
            const rawUrl = typeof req.url === 'string' ? req.url : (req.url?.raw || '');
            const headers = (req.header || []).map((h: any) => ({ key: h.key, value: h.value, enabled: !h.disabled }));
            const queryParams = (req.url?.query || []).map((q: any) => ({ key: q.key, value: q.value, enabled: !q.disabled }));
            let body: { type: 'none' | 'json' | 'raw' | 'form-data'; content: any } = { type: 'none', content: null };
            if (req.body?.mode === 'raw') {
                const lang = req.body?.options?.raw?.language || 'text';
                body = { type: lang === 'json' ? 'json' : 'raw', content: req.body.raw || '' };
            } else if (req.body?.mode === 'formdata') {
                body = { type: 'form-data', content: (req.body.formdata || []).map((f: any) => ({ key: f.key, value: f.value, enabled: !f.disabled })) };
            }
            await requestApi.create({
                name: item.name || 'Imported Request',
                method, url: rawUrl, collection: collection._id,
                workspace: currentWorkspace._id,
                headers, queryParams, body, auth: { type: 'none' },
            });
        }

        queryClient.invalidateQueries({ queryKey: ['collections'] });
        queryClient.invalidateQueries({ queryKey: ['requests'] });
        setExpandedCollections(prev => new Set([...prev, collection._id]));
        toast.success(`Imported "${collectionName}"`);
    };

    const getMethodColor = (method: string) => {
        const colors: Record<string, string> = {
            GET: 'text-green-400', POST: 'text-yellow-400',
            PUT: 'text-blue-400', DELETE: 'text-red-400', PATCH: 'text-purple-400',
        };
        return colors[method] || 'text-gray-400';
    };

    // Close import menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (importMenuRef.current && !importMenuRef.current.contains(event.target as Node)) {
                setShowImportMenu(false);
            }
        };

        if (showImportMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showImportMenu]);

    return (
        <div className="flex h-full flex-col bg-gray-800">
            {/* Workspace Selector */}
            <div className="border-b border-gray-700 p-3">
                <label className="mb-1.5 block text-xs font-medium text-gray-400 uppercase">Workspace - Testing</label>
                <Select
                    value={currentWorkspace?._id || ''}
                    onValueChange={(value) => {
                        const workspace = workspaces.find((w) => w._id === value);
                        setCurrentWorkspace(workspace || null);
                    }}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Workspace" />
                    </SelectTrigger>
                    <SelectContent>
                        {workspaces.map((workspace) => (
                            <SelectItem key={workspace._id} value={workspace._id}>{workspace.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {showNewWorkspace ? (
                    <div className="mt-2 space-y-2">
                        <input
                            type="text" value={newWorkspaceName}
                            onChange={(e) => setNewWorkspaceName(e.target.value)}
                            placeholder="Workspace name"
                            className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1.5 text-sm focus:border-orange-500 focus:outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button onClick={handleCreateWorkspace} className="flex-1 rounded bg-orange-500 px-2 py-1 text-xs font-medium hover:bg-orange-600 transition-colors">Create</button>
                            <button onClick={() => { setShowNewWorkspace(false); setNewWorkspaceName(''); }} className="flex-1 rounded bg-gray-600 px-2 py-1 text-xs font-medium hover:bg-gray-500 transition-colors">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setShowNewWorkspace(true)} className="mt-2 w-full rounded border border-dashed border-gray-600 px-2 py-1.5 text-xs text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors">
                        + New Workspace
                    </button>
                )}
            </div>

            {/* Collections */}
            <div className="flex-1 overflow-auto">
                {currentWorkspace ? (
                    <div className="p-3">
                        <div className="mb-2 flex items-center justify-between">
                            <h3 className="text-xs font-semibold uppercase text-gray-400">Collections</h3>
                            <div className="flex items-center gap-1">
                                <div className="relative" ref={importMenuRef}>
                                    <button
                                        onClick={() => setShowImportMenu(!showImportMenu)}
                                        className="rounded p-1 hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-200"
                                        title="Import"
                                    >
                                        <Upload className="h-3.5 w-3.5" />
                                    </button>

                                    {showImportMenu && (
                                        <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-700 bg-gray-800 shadow-xl z-50">
                                            <button
                                                onClick={() => {
                                                    setShowImportMenu(false);
                                                    setShowPasteDialog(true);
                                                }}
                                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors rounded-t-lg"
                                            >
                                                <Terminal className="h-4 w-4" />
                                                <span>Paste cURL/JSON</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowImportMenu(false);
                                                    importInputRef.current?.click();
                                                }}
                                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors rounded-b-lg"
                                            >
                                                <FileJson className="h-4 w-4" />
                                                <span>Upload from Device</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setShowNewCollection(true)} className="rounded p-1 hover:bg-gray-700 transition-colors" title="New Collection">
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                            <input
                                ref={importInputRef}
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={handleImportFile}
                            />
                        </div>

                        {importError && (
                            <p className="mb-2 rounded border border-red-800 bg-red-950/30 px-2 py-1 text-xs text-red-400">{importError}</p>
                        )}

                        {/* Search input */}
                        <div className="relative mb-2">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search collections..."
                                className="w-full rounded border border-gray-700 bg-gray-900 pl-7 pr-7 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {showNewCollection && (
                            <div className="mb-3 space-y-2 rounded border border-gray-600 p-2">
                                <input
                                    type="text" value={newCollectionName}
                                    onChange={(e) => setNewCollectionName(e.target.value)}
                                    placeholder="Collection name"
                                    className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1.5 text-sm focus:border-orange-500 focus:outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleCreateCollection} className="flex-1 rounded bg-orange-500 px-2 py-1 text-xs font-medium hover:bg-orange-600 transition-colors">Create</button>
                                    <button onClick={() => { setShowNewCollection(false); setNewCollectionName(''); }} className="flex-1 rounded bg-gray-600 px-2 py-1 text-xs font-medium hover:bg-gray-500 transition-colors">Cancel</button>
                                </div>
                            </div>
                        )}

                        {collectionsData?.data && collectionsData.data.length > 0 ? (
                            <div className="space-y-1">
                                {collectionsData.data
                                    .filter((col: Collection) => !searchQuery || col.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map((collection: Collection) => (
                                        <CollectionItem
                                            key={collection._id}
                                            collection={collection}
                                            isExpanded={expandedCollections.has(collection._id) || (!!searchQuery && collection.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                                            onToggle={() => toggleCollection(collection._id)}
                                            onNewRequest={() => handleNewRequest(collection._id)}
                                            onOpenRequest={handleOpenRequest}
                                            getMethodColor={getMethodColor}
                                            searchQuery={searchQuery}
                                        />
                                    ))}
                            </div>
                        ) : (
                            !showNewCollection && (
                                <div className="text-center py-8">
                                    <Folder className="h-12 w-12 mx-auto text-gray-600 mb-2" />
                                    <p className="text-sm text-gray-500 mb-3">No collections yet</p>
                                    <button onClick={() => setShowNewCollection(true)} className="text-xs text-orange-400 hover:text-orange-300 transition-colors">+ Create Collection</button>
                                </div>
                            )
                        )}
                    </div>
                ) : (
                    <div className="p-4 text-center text-sm text-gray-500">Select a workspace to view collections</div>
                )}
            </div>

            {/* Paste Dialog Modal */}
            {showPasteDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl mx-4 shadow-2xl">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-200">Import cURL or JSON</h3>
                            <button
                                onClick={() => {
                                    setShowPasteDialog(false);
                                    setPasteContent('');
                                    setImportError(null);
                                }}
                                className="text-gray-400 hover:text-gray-200 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-4">
                            <textarea
                                value={pasteContent}
                                onChange={(e) => setPasteContent(e.target.value)}
                                placeholder="Paste your cURL command or Postman JSON here..."
                                className="w-full h-64 rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 font-mono resize-none"
                                autoFocus
                            />

                            {importError && (
                                <p className="mt-2 text-xs text-red-400">{importError}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-700">
                            <button
                                onClick={() => {
                                    setShowPasteDialog(false);
                                    setPasteContent('');
                                    setImportError(null);
                                }}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePasteImport}
                                disabled={!pasteContent.trim()}
                                className="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Import
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
