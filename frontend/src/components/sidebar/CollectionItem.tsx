import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { collectionApi } from '@/features/collections/api';
import { requestApi } from '@/features/requests/api';
import { useTabStore } from '@/store/useTabStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { Collection, Request } from '@/types';
import { ChevronRight, Folder, Plus, MoreVertical, Edit, Trash2, Check, X, Download, Play, Loader2 } from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CollectionRunner from '@/components/CollectionRunner';
import FolderNode from './FolderNode';
import RequestItem from './RequestItem';
import { Folder as FolderType } from '@/types';
import { triggerLocalSync } from '@/utils/localSync';
import { generateObjectId } from '@/utils/objectId';

interface Props {
    collection: Collection;
    isExpanded: boolean;
    onToggle: () => void;
    onNewRequest: (folderId: string | null) => void;
    onOpenRequest: (r: Request) => void;
    getMethodColor: (m: string) => string;
    searchQuery?: string;
    isCreatingRequest?: boolean;
}

export default function CollectionItem({
    collection, isExpanded, onToggle, onNewRequest, onOpenRequest, getMethodColor, searchQuery, isCreatingRequest = false,
}: Props) {
    const queryClient = useQueryClient();
    const { activeTabId } = useTabStore();
    const { currentWorkspace } = useWorkspaceStore();
    const [renaming, setRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(collection.name);
    const [showRunner, setShowRunner] = useState(false);
    const [showNewFolderInput, setShowNewFolderInput] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            next.has(folderId) ? next.delete(folderId) : next.add(folderId);
            return next;
        });
    };

    const { data, isLoading } = useQuery({
        queryKey: ['requests', collection._id],
        queryFn: () => requestApi.getByCollection(collection._id),
        staleTime: 0,
    });

    const renameMutation = useMutation({
        mutationFn: (name: string) => collectionApi.update(collection._id, { name }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collections'] });
            setRenaming(false);
            // Auto-sync to local directory if linked
            triggerLocalSync(currentWorkspace?._id, currentWorkspace?.localDirectory);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => collectionApi.delete(collection._id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collections'] });
            // Auto-sync to local directory if linked
            triggerLocalSync(currentWorkspace?._id, currentWorkspace?.localDirectory);
        },
    });

    const deleteRequestMutation = useMutation({
        mutationFn: (id: string) => requestApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requests', collection._id] });
            // Auto-sync to local directory if linked
            triggerLocalSync(currentWorkspace?._id, currentWorkspace?.localDirectory);
        },
    });

    const updateFoldersMutation = useMutation({
        mutationFn: (folders: FolderType[]) => collectionApi.update(collection._id, { folders }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collections'] });
        },
    });

    const handleCreateFolder = () => {
        setShowNewFolderInput(true);
        setNewFolderName('');
    };

    const handleCreateFolderSubmit = () => {
        if (!newFolderName.trim()) return;

        const newFolder: FolderType = {
            _id: generateObjectId(),
            name: newFolderName.trim(),
            parentFolder: null
        };

        const nextFolders = [...(collection.folders || []), newFolder];
        updateFoldersMutation.mutate(nextFolders);
        setShowNewFolderInput(false);
        setNewFolderName('');
        toast.success('Folder created');
    };

    const handleUpdateFolders = (nextFolders: FolderType[]) => {
        updateFoldersMutation.mutate(nextFolders);
    };

    const handleRenameSubmit = () => {
        if (renameValue.trim() && renameValue !== collection.name) {
            renameMutation.mutate(renameValue.trim());
        } else {
            setRenaming(false);
        }
    };

    const requests: Request[] = data?.data || [];
    const filteredRequests = searchQuery
        ? requests.filter(r =>
            r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.method.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : requests;

    const topLevelFolders = (collection.folders || []).filter(f => !f.parentFolder);
    const topLevelRequests = filteredRequests.filter(r => !r.folder);

    return (
        <div className="rounded">
            <div
                draggable={true}
                onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', collection._id);
                    e.dataTransfer.effectAllowed = 'copy';
                }}
                className="group flex items-center justify-between rounded px-2 py-1.5 hover:bg-gray-700 cursor-grab active:cursor-grabbing transition-colors"
            >
                {renaming ? (
                    <div className="flex flex-1 items-center gap-1 min-w-0">
                        <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameSubmit();
                                if (e.key === 'Escape') { setRenaming(false); setRenameValue(collection.name); }
                            }}
                            className="flex-1 min-w-0 rounded border border-orange-500 bg-gray-700 px-2 py-0.5 text-sm text-gray-100 focus:outline-none"
                        />
                        <button onClick={handleRenameSubmit} className="shrink-0 rounded p-1 hover:bg-gray-600 text-green-400">
                            <Check className="h-3 w-3" />
                        </button>
                        <button onClick={() => { setRenaming(false); setRenameValue(collection.name); }} className="shrink-0 rounded p-1 hover:bg-gray-600 text-gray-400">
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ) : (
                    <>
                        <button onClick={onToggle} className="flex flex-1 items-center gap-2 text-left min-w-0">
                            <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            <Folder className="h-4 w-4 shrink-0 text-orange-400" />
                            <span className="text-sm font-medium truncate">{collection.name}</span>
                        </button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="shrink-0 rounded p-1 hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100">
                                    <MoreVertical className="h-3 w-3" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-gray-900 border-gray-805 text-gray-300">
                                <DropdownMenuItem onClick={() => onNewRequest(null)} className="cursor-pointer hover:bg-gray-800 text-xs">
                                    <Plus className="mr-2 h-4 w-4" /><span>Add Request</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleCreateFolder} className="cursor-pointer hover:bg-gray-800 text-xs">
                                    <Folder className="mr-2 h-4 w-4 text-orange-400" /><span>Add Folder</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setShowRunner(true)} className="cursor-pointer hover:bg-gray-800 text-xs">
                                    <Play className="mr-2 h-4 w-4" /><span>Run Collection</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="border-gray-800" />
                                <DropdownMenuItem onClick={() => { setRenaming(true); setRenameValue(collection.name); }} className="cursor-pointer">
                                    <Edit className="mr-2 h-4 w-4" /><span>Rename</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={async () => {
                                        try {
                                            const data = await collectionApi.exportCollection(collection._id);
                                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `${collection.name.replace(/[^a-z0-9]/gi, '_')}.json`;
                                            a.click();
                                            URL.revokeObjectURL(url);
                                            toast.success('Collection exported');
                                        } catch { toast.error('Export failed'); }
                                    }}
                                    className="cursor-pointer"
                                >
                                    <Download className="mr-2 h-4 w-4" /><span>Export</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => deleteMutation.mutate()} className="cursor-pointer text-red-400 focus:text-red-400">
                                    <Trash2 className="mr-2 h-4 w-4" /><span>Delete</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                )}
            </div>

            {isExpanded && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-700 pl-2">
                    {isLoading ? (
                        <div className="space-y-1.5 py-1.5 animate-pulse">
                            {[1, 2].map((n) => (
                                <div key={n} className="flex items-center gap-2 px-2 py-1">
                                    <div className="h-3 w-6 rounded bg-gray-700/60 shrink-0" />
                                    <div className="h-3 flex-1 rounded bg-gray-700/60" />
                                </div>
                            ))}
                        </div>
                    ) : (topLevelFolders.length > 0 || topLevelRequests.length > 0 || showNewFolderInput) ? (
                        <>
                            {showNewFolderInput && (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800/40 rounded mt-0.5">
                                    <Folder className="h-4 w-4 shrink-0 text-orange-400" />
                                    <input
                                        autoFocus
                                        placeholder="Folder name..."
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleCreateFolderSubmit();
                                            if (e.key === 'Escape') { setShowNewFolderInput(false); setNewFolderName(''); }
                                        }}
                                        className="flex-1 min-w-0 rounded border border-orange-500 bg-gray-700 px-2 py-0.5 text-xs text-gray-100 focus:outline-none"
                                    />
                                    <button onClick={handleCreateFolderSubmit} className="shrink-0 rounded p-1 hover:bg-gray-600 text-green-400">
                                        <Check className="h-3 w-3" />
                                    </button>
                                    <button onClick={() => { setShowNewFolderInput(false); setNewFolderName(''); }} className="shrink-0 rounded p-1 hover:bg-gray-600 text-gray-400">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                            {/* Render folders tree */}
                            {topLevelFolders.map((folder) => (
                                <FolderNode
                                    key={folder._id}
                                    folder={folder}
                                    collection={collection}
                                    allRequests={requests}
                                    expandedFolders={expandedFolders}
                                    onToggleFolder={toggleFolder}
                                    onNewRequest={onNewRequest}
                                    onOpenRequest={onOpenRequest}
                                    onDeleteRequest={(id) => deleteRequestMutation.mutate(id)}
                                    onUpdateFolders={handleUpdateFolders}
                                    getMethodColor={getMethodColor}
                                    activeTabId={activeTabId}
                                />
                            ))}

                            {/* Render top-level requests */}
                            {topLevelRequests.map((request) => (
                                <RequestItem
                                    key={request._id}
                                    request={request}
                                    collectionId={collection._id}
                                    onOpen={() => onOpenRequest(request)}
                                    onDelete={() => deleteRequestMutation.mutate(request._id)}
                                    getMethodColor={getMethodColor}
                                    isActive={request._id === activeTabId}
                                />
                            ))}

                            {isCreatingRequest && (
                                <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-800/40 border border-dashed border-gray-700/50 animate-pulse mt-0.5">
                                    <span className="text-[9px] font-bold text-gray-500 uppercase shrink-0">GET</span>
                                    <span className="text-xs text-gray-500 truncate font-medium">Creating request...</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="px-2 py-2 text-center">
                            <p className="text-xs text-gray-500 mb-1.5">{searchQuery ? 'No matching items' : 'No requests or folders yet'}</p>
                            {!searchQuery && (
                                <div className="flex flex-col gap-1.5 max-w-[120px] mx-auto">
                                    <button 
                                        disabled={isCreatingRequest}
                                        onClick={() => onNewRequest(null)} 
                                        className="text-xs text-orange-400 hover:text-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                                    >
                                        {isCreatingRequest ? (
                                            <>
                                                <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                                                <span>Adding...</span>
                                            </>
                                        ) : (
                                            '+ Add Request'
                                        )}
                                    </button>
                                    <button 
                                        onClick={handleCreateFolder} 
                                        className="text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center justify-center gap-1"
                                    >
                                        + Add Folder
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {showRunner && <CollectionRunner collection={collection} onClose={() => setShowRunner(false)} />}
        </div>
    );
}
