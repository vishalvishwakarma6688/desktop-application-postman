import { useState } from 'react';
import { ChevronRight, Folder, Plus, MoreVertical, Edit, Trash2, Check, X, File } from 'lucide-react';
import { Collection, Request, Folder as FolderType } from '@/types';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import RequestItem from './RequestItem';
import toast from 'react-hot-toast';
import { generateObjectId } from '@/utils/objectId';

interface Props {
    folder: FolderType;
    collection: Collection;
    allRequests: Request[];
    expandedFolders: Set<string>;
    onToggleFolder: (folderId: string) => void;
    onNewRequest: (folderId: string | null) => void;
    onOpenRequest: (r: Request) => void;
    onDeleteRequest: (id: string) => void;
    onUpdateFolders: (nextFolders: FolderType[]) => void;
    getMethodColor: (m: string) => string;
    activeTabId: string | null;
}

export default function FolderNode({
    folder, collection, allRequests, expandedFolders, onToggleFolder, onNewRequest, onOpenRequest, onDeleteRequest, onUpdateFolders, getMethodColor, activeTabId
}: Props) {
    const [renaming, setRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(folder.name);
    const [showNewSubFolderInput, setShowNewSubFolderInput] = useState(false);
    const [newSubFolderName, setNewSubFolderName] = useState('');
    const isExpanded = expandedFolders.has(folder._id);

    const subFolders = (collection.folders || []).filter(f => f.parentFolder === folder._id);
    const folderRequests = allRequests.filter(r => r.folder === folder._id);

    const handleRenameSubmit = () => {
        if (!renameValue.trim()) return;
        const nextFolders = (collection.folders || []).map(f =>
            f._id === folder._id ? { ...f, name: renameValue.trim() } : f
        );
        onUpdateFolders(nextFolders);
        setRenaming(false);
        toast.success('Folder renamed');
    };

    const handleCreateSubFolder = () => {
        setShowNewSubFolderInput(true);
        setNewSubFolderName('');
    };

    const handleCreateSubFolderSubmit = () => {
        if (!newSubFolderName.trim()) return;

        const newSubFolder: FolderType = {
            _id: generateObjectId(),
            name: newSubFolderName.trim(),
            parentFolder: folder._id
        };

        const nextFolders = [...(collection.folders || []), newSubFolder];
        onUpdateFolders(nextFolders);
        setShowNewSubFolderInput(false);
        setNewSubFolderName('');
        toast.success('Sub-folder created');
    };

    const handleDeleteFolder = () => {
        if (!confirm(`Are you sure you want to delete folder "${folder.name}"? This will also remove any nested requests and sub-folders.`)) return;

        // Recursive collect all folder IDs to delete
        const collectFolderIds = (fid: string): string[] => {
            const ids = [fid];
            const subs = (collection.folders || []).filter(f => f.parentFolder === fid);
            subs.forEach(sub => {
                ids.push(...collectFolderIds(sub._id));
            });
            return ids;
        };

        const targetFolderIds = collectFolderIds(folder._id);

        // Delete nested requests in DB
        const requestsToDelete = allRequests.filter(r => r.folder && targetFolderIds.includes(r.folder));
        requestsToDelete.forEach(r => onDeleteRequest(r._id));

        // Filter out folders
        const nextFolders = (collection.folders || []).filter(f => !targetFolderIds.includes(f._id));
        onUpdateFolders(nextFolders);
        toast.success('Folder deleted');
    };

    return (
        <div className="select-none">
            {/* Folder Header */}
            <div className="group flex items-center justify-between rounded px-2 py-1 hover:bg-gray-800/60 transition-colors">
                {renaming ? (
                    <div className="flex flex-1 items-center gap-1 min-w-0">
                        <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameSubmit();
                                if (e.key === 'Escape') { setRenaming(false); setRenameValue(folder.name); }
                            }}
                            className="flex-1 min-w-0 rounded border border-orange-500 bg-gray-700 px-2 py-0.5 text-xs text-gray-105 focus:outline-none"
                        />
                        <button onClick={handleRenameSubmit} className="shrink-0 rounded p-1 hover:bg-gray-600 text-green-400">
                            <Check className="h-3 w-3" />
                        </button>
                        <button onClick={() => { setRenaming(false); setRenameValue(folder.name); }} className="shrink-0 rounded p-1 hover:bg-gray-600 text-gray-400">
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ) : (
                    <>
                        <button 
                            onClick={() => onToggleFolder(folder._id)} 
                            className="flex flex-1 items-center gap-1.5 text-left min-w-0"
                        >
                            <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform text-gray-500 ${isExpanded ? 'rotate-90' : ''}`} />
                            <Folder className={`h-4 w-4 shrink-0 ${isExpanded ? 'text-orange-400' : 'text-gray-400'}`} />
                            <span className="text-xs font-semibold text-gray-300 truncate">{folder.name}</span>
                        </button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="shrink-0 rounded p-1 hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-3 w-3 text-gray-400" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 bg-gray-900 border-gray-800 text-gray-350">
                                <DropdownMenuItem onClick={() => onNewRequest(folder._id)} className="cursor-pointer hover:bg-gray-800 text-xs">
                                    <Plus className="mr-2 h-3.5 w-3.5" /> Add Request
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleCreateSubFolder} className="cursor-pointer hover:bg-gray-800 text-xs">
                                    <Folder className="mr-2 h-3.5 w-3.5" /> Add Sub-Folder
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="border-gray-800" />
                                <DropdownMenuItem onClick={() => { setRenaming(true); setRenameValue(folder.name); }} className="cursor-pointer hover:bg-gray-800 text-xs">
                                    <Edit className="mr-2 h-3.5 w-3.5" /> Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDeleteFolder} className="cursor-pointer text-red-400 focus:text-red-400 hover:bg-gray-800 text-xs">
                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                )}
            </div>

            {/* Folder Contents */}
            {isExpanded && (
                <div className="ml-3 pl-2.5 border-l border-gray-800/80 mt-0.5 space-y-0.5">
                    {showNewSubFolderInput && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800/40 rounded mt-0.5">
                            <Folder className="h-4 w-4 shrink-0 text-orange-400" />
                            <input
                                autoFocus
                                placeholder="Sub-folder name..."
                                value={newSubFolderName}
                                onChange={(e) => setNewSubFolderName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateSubFolderSubmit();
                                    if (e.key === 'Escape') { setShowNewSubFolderInput(false); setNewSubFolderName(''); }
                                }}
                                className="flex-1 min-w-0 rounded border border-orange-500 bg-gray-700 px-2 py-0.5 text-xs text-gray-105 focus:outline-none"
                            />
                            <button onClick={handleCreateSubFolderSubmit} className="shrink-0 rounded p-1 hover:bg-gray-600 text-green-400">
                                <Check className="h-3 w-3" />
                            </button>
                            <button onClick={() => { setShowNewSubFolderInput(false); setNewSubFolderName(''); }} className="shrink-0 rounded p-1 hover:bg-gray-600 text-gray-400">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                    {/* Render Subfolders */}
                    {subFolders.map(sub => (
                        <FolderNode
                            key={sub._id}
                            folder={sub}
                            collection={collection}
                            allRequests={allRequests}
                            expandedFolders={expandedFolders}
                            onToggleFolder={onToggleFolder}
                            onNewRequest={onNewRequest}
                            onOpenRequest={onOpenRequest}
                            onDeleteRequest={onDeleteRequest}
                            onUpdateFolders={onUpdateFolders}
                            getMethodColor={getMethodColor}
                            activeTabId={activeTabId}
                        />
                    ))}

                    {/* Render Requests */}
                    {folderRequests.map(request => (
                        <RequestItem
                            key={request._id}
                            request={request}
                            collectionId={collection._id}
                            onOpen={() => onOpenRequest(request)}
                            onDelete={() => onDeleteRequest(request._id)}
                            getMethodColor={getMethodColor}
                            isActive={request._id === activeTabId}
                        />
                    ))}

                    {/* Empty Folder placeholder */}
                    {subFolders.length === 0 && folderRequests.length === 0 && !showNewSubFolderInput && (
                        <div className="text-[10px] text-gray-600 italic py-1 px-2 flex items-center gap-1.5 select-none">
                            <File className="h-3 w-3 opacity-40" /> Empty folder
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
