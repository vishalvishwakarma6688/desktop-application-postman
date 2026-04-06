import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { collectionApi } from '@/features/collections/api';
import { requestApi } from '@/features/requests/api';
import { useTabStore } from '@/store/useTabStore';
import { Collection, Request } from '@/types';
import { ChevronRight, Folder, Plus, MoreVertical, Edit, Trash2, Check, X, Download, Play } from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CollectionRunner from '@/components/CollectionRunner';
import RequestItem from './RequestItem';

interface Props {
    collection: Collection;
    isExpanded: boolean;
    onToggle: () => void;
    onNewRequest: () => void;
    onOpenRequest: (r: Request) => void;
    getMethodColor: (m: string) => string;
    searchQuery?: string;
}

export default function CollectionItem({
    collection, isExpanded, onToggle, onNewRequest, onOpenRequest, getMethodColor, searchQuery,
}: Props) {
    const queryClient = useQueryClient();
    const { activeTabId } = useTabStore();
    const [renaming, setRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(collection.name);
    const [showRunner, setShowRunner] = useState(false);

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
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => collectionApi.delete(collection._id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collections'] });
        },
    });

    const deleteRequestMutation = useMutation({
        mutationFn: (id: string) => requestApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requests', collection._id] });
        },
    });

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

    return (
        <div className="rounded">
            <div className="group flex items-center justify-between rounded px-2 py-1.5 hover:bg-gray-700 transition-colors">
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
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={onNewRequest} className="cursor-pointer">
                                    <Plus className="mr-2 h-4 w-4" /><span>Add Request</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setShowRunner(true)} className="cursor-pointer">
                                    <Play className="mr-2 h-4 w-4" /><span>Run Collection</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
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
                        <p className="px-2 py-2 text-xs text-gray-500">Loading...</p>
                    ) : filteredRequests.length > 0 ? (
                        filteredRequests.map((request) => (
                            <RequestItem
                                key={request._id}
                                request={request}
                                collectionId={collection._id}
                                onOpen={() => onOpenRequest(request)}
                                onDelete={() => deleteRequestMutation.mutate(request._id)}
                                getMethodColor={getMethodColor}
                                isActive={request._id === activeTabId}
                            />
                        ))
                    ) : (
                        <div className="px-2 py-2 text-center">
                            <p className="text-xs text-gray-500 mb-1.5">{searchQuery ? 'No matching requests' : 'No requests yet'}</p>
                            {!searchQuery && (
                                <button onClick={onNewRequest} className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
                                    + Add Request
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {showRunner && <CollectionRunner collection={collection} onClose={() => setShowRunner(false)} />}
        </div>
    );
}
