import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { requestApi } from '@/features/requests/api';
import { useTabStore } from '@/store/useTabStore';
import { Request } from '@/types';
import { FileText, Edit, Trash2, Check, X, Copy, MoreVertical, Clock, Eye } from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';
import ResponsePreview from './ResponsePreview';

interface Props {
    request: Request;
    collectionId: string;
    onOpen: () => void;
    onDelete: () => void;
    getMethodColor: (m: string) => string;
    isActive?: boolean;
}

export default function RequestItem({ request, collectionId, onOpen, onDelete, getMethodColor, isActive }: Props) {
    const queryClient = useQueryClient();
    const { updateTab, tabs } = useTabStore();
    const [renaming, setRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(request.name);

    // Get response time and determine color
    const responseTime = request.monitorSettings?.lastResponseTime;
    const getResponseTimeColor = (time: number | undefined) => {
        if (!time) return 'text-gray-500';
        if (time < 300) return 'text-emerald-400';
        if (time < 1000) return 'text-amber-400';
        return 'text-red-400';
    };
    const getResponseTimeBg = (time: number | undefined) => {
        if (!time) return 'bg-gray-800/50';
        if (time < 300) return 'bg-emerald-500/10';
        if (time < 1000) return 'bg-amber-500/10';
        return 'bg-red-500/10';
    };

    const formatResponseTime = (time: number | undefined) => {
        if (!time) return null;
        if (time < 1000) return `${time}ms`;
        return `${(time / 1000).toFixed(2)}s`;
    };

    const renameMutation = useMutation({
        mutationFn: (name: string) => requestApi.update(request._id, { name }),
        onSuccess: (response, name) => {
            const updatedName = response.data?.name || name;
            queryClient.setQueryData(['requests', collectionId], (old: any) => {
                if (!old?.data) return old;
                return { ...old, data: old.data.map((r: Request) => r._id === request._id ? { ...r, name: updatedName } : r) };
            });
            const openTab = tabs.find(t => t.id === request._id);
            if (openTab && response.data) {
                updateTab(request._id, { title: updatedName, request: response.data });
            }
            setRenaming(false);
        },
    });

    const handleRenameSubmit = () => {
        if (renameValue.trim() && renameValue !== request.name) {
            renameMutation.mutate(renameValue.trim());
        } else {
            setRenaming(false);
        }
    };

    if (renaming) {
        return (
            <div className="flex items-center gap-1 px-2 py-1">
                <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit();
                        if (e.key === 'Escape') { setRenaming(false); setRenameValue(request.name); }
                    }}
                    className="flex-1 min-w-0 rounded border border-orange-500 bg-gray-700 px-2 py-0.5 text-xs text-gray-100 focus:outline-none"
                />
                <button onClick={handleRenameSubmit} className="shrink-0 rounded p-1 hover:bg-gray-600 text-green-400">
                    <Check className="h-3 w-3" />
                </button>
                <button onClick={() => { setRenaming(false); setRenameValue(request.name); }} className="shrink-0 rounded p-1 hover:bg-gray-600 text-gray-400">
                    <X className="h-3 w-3" />
                </button>
            </div>
        );
    }

    return (
        <HoverCard openDelay={400} closeDelay={100}>
            <HoverCardTrigger asChild>
                <div className={`group/req flex items-center rounded transition-colors ${isActive ? 'bg-gray-700 border-l-2 border-orange-500' : 'hover:bg-gray-700'}`}>
                    <button onClick={onOpen} className="flex flex-1 items-center gap-2 px-2 py-1.5 text-left min-w-0">
                        <span className={`text-xs font-bold shrink-0 ${getMethodColor(request.method)} w-11`}>
                            {request.method}
                        </span>
                        <span className={`truncate text-xs flex items-center gap-1.5 flex-1 min-w-0 ${isActive ? 'text-white' : 'text-gray-300 group-hover/req:text-white'}`}>
                            {request.monitorSettings?.isMonitored && (
                                <span
                                    title={`Health: ${request.monitorSettings.lastStatus || 'awaiting check'}`}
                                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${request.monitorSettings.lastStatus === 'healthy'
                                        ? 'bg-emerald-400'
                                        : request.monitorSettings.lastStatus === 'unhealthy'
                                            ? 'bg-red-500 animate-pulse'
                                            : 'bg-amber-400 animate-pulse'
                                        }`}
                                />
                            )}
                            <span className="truncate">{request.name}</span>
                            <span title="Hover to preview response">
                                <Eye className="h-3 w-3 opacity-0 group-hover/req:opacity-50 transition-opacity" />
                            </span>
                        </span>

                        {/* Response Time Badge */}
                        {responseTime !== undefined && (
                            <span
                                className={`shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${getResponseTimeBg(responseTime)} ${getResponseTimeColor(responseTime)} opacity-0 group-hover/req:opacity-100 transition-opacity`}
                                title={`Response time: ${formatResponseTime(responseTime)}`}
                            >
                                <Clock className="h-2.5 w-2.5" />
                                {formatResponseTime(responseTime)}
                            </span>
                        )}
                    </button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="shrink-0 rounded p-1 mr-1 opacity-0 group-hover/req:opacity-100 hover:bg-gray-600 transition-all">
                                <MoreVertical className="h-3 w-3 text-gray-400" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={onOpen} className="cursor-pointer">
                                <FileText className="mr-2 h-4 w-4" /><span>Open</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setRenaming(true); setRenameValue(request.name); }} className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" /><span>Rename</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={async () => {
                                    try {
                                        const res = await requestApi.duplicate(request._id);
                                        if (res.data) {
                                            queryClient.setQueryData(['requests', collectionId], (old: any) => {
                                                const existing = old?.data || [];
                                                return { success: true, data: [...existing, res.data] };
                                            });
                                            toast.success('✓ Request duplicated successfully');
                                        }
                                    } catch { toast.error('Failed to duplicate request'); }
                                }}
                                className="cursor-pointer"
                            >
                                <Copy className="mr-2 h-4 w-4" /><span>Duplicate</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-red-400 focus:text-red-400">
                                <Trash2 className="mr-2 h-4 w-4" /><span>Delete</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </HoverCardTrigger>
            <HoverCardContent
                side="right"
                align="start"
                className="w-auto p-0 border-gray-700 bg-gray-800/95 backdrop-blur-sm shadow-xl"
                sideOffset={8}
            >
                <ResponsePreview requestId={request._id} />
            </HoverCardContent>
        </HoverCard>
    );
}
