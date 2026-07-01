import { useState, useEffect } from 'react';
import { FileText, Edit3, Save, X, BookOpen, Sparkles } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { requestApi } from '@/features/requests/api';
import toast from 'react-hot-toast';
import { Request } from '@/types';
import { useTabStore } from '@/store/useTabStore';
import { useCollaborationStore } from '@/store/useCollaborationStore';
import { collaborationService } from '@/services/collaborationService';

interface Props {
    request: Request;
}

export default function NotesPanel({ request }: Props) {
    const [value, setValue] = useState(request.notes || '');
    const [isEditing, setIsEditing] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const { activeUsers } = useCollaborationStore();
    const notesFocusedUser = Array.from(activeUsers.values()).find(u => u.focusedField === 'notes');
    const queryClient = useQueryClient();
    const { tabs, activeTabId, updateTab } = useTabStore();

    console.log('🎨 [NOTES PANEL] Rendered with request:', {
        id: request._id,
        name: request.name,
        notes: request.notes,
        notesLength: request.notes?.length || 0,
        localValue: value,
        localValueLength: value.length
    });

    useEffect(() => {
        console.log('🔄 [NOTES PANEL] useEffect triggered', {
            requestId: request._id,
            requestNotes: request.notes,
            currentValue: value,
            isEditing
        });

        setValue(request.notes || '');
        setHasChanges(false);
        setIsEditing(false);

        console.log('✅ [NOTES PANEL] State updated to:', request.notes || '(empty)');
    }, [request._id, request.notes]);

    const saveMutation = useMutation({
        mutationFn: (notes: string) => {
            console.log('💾 [NOTES PANEL] Saving notes:', {
                requestId: request._id,
                notesLength: notes.length,
                notes: notes.substring(0, 100) + (notes.length > 100 ? '...' : '')
            });
            return requestApi.update(request._id, { notes });
        },
        onSuccess: (response) => {
            console.log('✅ [NOTES PANEL] Save successful:', {
                success: response.success,
                hasData: !!response.data,
                returnedNotes: response.data?.notes,
                returnedNotesLength: response.data?.notes?.length || 0
            });

            if (response.data) {
                // 1. Update the active tab with the new request data (CRITICAL FOR IMMEDIATE UI UPDATE!)
                const activeTab = tabs.find(t => t.id === activeTabId);
                if (activeTab && activeTab.type === 'request') {
                    console.log('🔄 [NOTES PANEL] Updating active tab with new notes');
                    updateTab(activeTab.id, { request: response.data });
                }

                // 2. Invalidate and refetch the requests for this collection
                console.log('🔄 [NOTES PANEL] Invalidating queries for collection:', request.collection);
                queryClient.invalidateQueries({ queryKey: ['requests', request.collection] });

                // Also update the cache optimistically
                queryClient.setQueryData(['requests', request.collection], (old: any) => {
                    console.log('📦 [NOTES PANEL] Updating cache. Old data:', {
                        hasOld: !!old,
                        hasOldData: !!old?.data,
                        oldDataLength: old?.data?.length || 0
                    });

                    if (!old?.data) return old;

                    const updated = {
                        ...old,
                        data: old.data.map((r: Request) => {
                            if (r._id === request._id) {
                                console.log('📝 [NOTES PANEL] Updating request in cache:', {
                                    id: r._id,
                                    oldNotes: r.notes,
                                    newNotes: response.data?.notes
                                });
                                return { ...r, notes: response.data?.notes };
                            }
                            return r;
                        }),
                    };

                    console.log('✅ [NOTES PANEL] Cache updated');
                    return updated;
                });

                toast.success('Notes saved successfully');
                setHasChanges(false);
                setIsEditing(false);
            }
        },
        onError: (error) => {
            console.error('❌ [NOTES PANEL] Save failed:', error);
            toast.error('Failed to save notes');
        },
    });

    const handleSave = () => {
        saveMutation.mutate(value);
    };

    const handleCancel = () => {
        setValue(request.notes || '');
        setHasChanges(false);
        setIsEditing(false);
    };

    const handleChange = (newValue: string) => {
        setValue(newValue);
        setHasChanges(newValue !== (request.notes || ''));
    };

    // Enhanced markdown renderer with better styling
    const renderMarkdown = (text: string) => {
        if (!text) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-gray-800/50 p-4 mb-4">
                        <FileText className="h-8 w-8 text-gray-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-1">No notes yet</h3>
                    <p className="text-xs text-gray-600 mb-4 max-w-xs">
                        Document this request with usage examples, parameters, or any helpful information
                    </p>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium hover:bg-orange-500/20 transition-colors"
                    >
                        <Edit3 className="h-4 w-4" />
                        Add Notes
                    </button>
                </div>
            );
        }

        return (
            <div className="prose prose-invert prose-sm max-w-none">
                {text.split('\n').map((line, i) => {
                    // Headers with gradient
                    if (line.startsWith('# ')) {
                        return (
                            <h1 key={i} className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mt-6 mb-3 first:mt-0">
                                {line.slice(2)}
                            </h1>
                        );
                    }
                    if (line.startsWith('## ')) {
                        return (
                            <h2 key={i} className="text-lg font-semibold text-white mt-5 mb-2 flex items-center gap-2">
                                <span className="h-1 w-1 rounded-full bg-orange-500" />
                                {line.slice(3)}
                            </h2>
                        );
                    }
                    if (line.startsWith('### ')) {
                        return (
                            <h3 key={i} className="text-base font-medium text-gray-200 mt-4 mb-2">
                                {line.slice(4)}
                            </h3>
                        );
                    }

                    // Code blocks (inline)
                    if (line.includes('`')) {
                        const parts = line.split('`');
                        return (
                            <p key={i} className="text-gray-300 mb-3 leading-relaxed">
                                {parts.map((part, j) =>
                                    j % 2 === 0 ? (
                                        part
                                    ) : (
                                        <code
                                            key={j}
                                            className="bg-gray-800/80 border border-gray-700/50 text-orange-400 px-2 py-0.5 rounded text-xs font-mono"
                                        >
                                            {part}
                                        </code>
                                    )
                                )}
                            </p>
                        );
                    }

                    // Lists with custom bullets
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                        return (
                            <li key={i} className="text-gray-300 ml-4 mb-2 flex items-start gap-2">
                                <span className="text-orange-500 mt-1.5">▸</span>
                                <span>{line.slice(2)}</span>
                            </li>
                        );
                    }

                    // Bold text
                    if (line.includes('**')) {
                        const parts = line.split('**');
                        return (
                            <p key={i} className="text-gray-300 mb-3 leading-relaxed">
                                {parts.map((part, j) =>
                                    j % 2 === 0 ? (
                                        part
                                    ) : (
                                        <strong key={j} className="font-semibold text-white">
                                            {part}
                                        </strong>
                                    )
                                )}
                            </p>
                        );
                    }

                    // Blockquote
                    if (line.startsWith('> ')) {
                        return (
                            <div key={i} className="border-l-2 border-orange-500 pl-4 py-2 my-3 bg-orange-500/5">
                                <p className="text-gray-400 text-sm italic">{line.slice(2)}</p>
                            </div>
                        );
                    }

                    // Regular paragraph
                    return line ? (
                        <p key={i} className="text-gray-300 mb-3 leading-relaxed">
                            {line}
                        </p>
                    ) : (
                        <br key={i} />
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-gray-900">
            {/* Enhanced Header */}
            <div className="px-4 py-3 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800/50 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <BookOpen className="h-4 w-4 text-orange-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">Request Documentation</h3>
                            <p className="text-[10px] text-gray-500">Add notes, examples & usage instructions</p>
                        </div>
                    </div>
                    {!isEditing && value && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                            title="Edit notes"
                        >
                            <Edit3 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto">
                {isEditing ? (
                    <div className="p-4 space-y-3 relative">
                        <textarea
                            value={value}
                            onChange={(e) => handleChange(e.target.value)}
                            placeholder="# Getting Started&#10;&#10;Document this API endpoint with usage instructions, examples, or any helpful notes...&#10;&#10;## Markdown Supported&#10;- **Bold text** with double asterisks&#10;- `Inline code` with backticks&#10;- Lists with dashes&#10;- > Blockquotes&#10;&#10;## Example&#10;This endpoint requires authentication. Use Bearer token in headers."
                            onFocus={() => collaborationService.sendFocusField('notes')}
                            onBlur={() => collaborationService.sendFocusField(null)}
                            className="w-full min-h-[400px] bg-gray-950 border rounded-xl px-4 py-3 text-sm text-gray-300 font-mono focus:outline-none resize-none placeholder:text-gray-600 transition-all duration-200"
                            style={{
                                borderColor: notesFocusedUser ? notesFocusedUser.color : '#374151',
                                boxShadow: notesFocusedUser ? `0 0 0 2px ${notesFocusedUser.color}22` : undefined
                            }}
                            autoFocus
                        />
                        {notesFocusedUser && (
                            <div 
                                className="absolute right-7 bottom-16 flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold text-white pointer-events-none select-none transition-all duration-200 animate-pulse"
                                style={{ backgroundColor: notesFocusedUser.color }}
                            >
                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                <span>{notesFocusedUser.userName} editing</span>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-2">
                            <div className="text-xs text-gray-600 flex items-center gap-2">
                                <Sparkles className="h-3 w-3" />
                                <span>Markdown: # Headers, **bold**, `code`, - lists, &gt; quotes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCancel}
                                    disabled={saveMutation.isPending}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    <X className="h-4 w-4" />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!hasChanges || saveMutation.isPending}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="h-4 w-4" />
                                    {saveMutation.isPending ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>

                        {/* Character Count */}
                        <div className="text-xs text-gray-600 text-right">
                            {value.length} characters
                        </div>
                    </div>
                ) : (
                    <div className="p-6">{renderMarkdown(value)}</div>
                )}
            </div>
        </div>
    );
}
