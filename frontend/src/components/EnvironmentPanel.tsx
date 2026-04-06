import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Trash2, Check } from 'lucide-react';
import { environmentApi } from '@/features/environments/api';
import { useRequestStore } from '@/store/useRequestStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { Environment, EnvironmentVariable } from '@/types';

interface Props {
    onClose: () => void;
}

export default function EnvironmentPanel({ onClose }: Props) {
    const queryClient = useQueryClient();
    const { currentWorkspace } = useWorkspaceStore();
    const { activeEnvironment, setActiveEnvironment } = useRequestStore();

    const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
    const [newEnvName, setNewEnvName] = useState('');
    const [showNewEnv, setShowNewEnv] = useState(false);
    const [editedVars, setEditedVars] = useState<EnvironmentVariable[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    const { data: envsData } = useQuery({
        queryKey: ['environments', currentWorkspace?._id],
        queryFn: () => environmentApi.getByWorkspace(currentWorkspace!._id),
        enabled: !!currentWorkspace,
    });

    const environments: Environment[] = envsData?.data || [];
    const selectedEnv = environments.find(e => e._id === selectedEnvId) || null;

    const handleSelectEnv = (env: Environment) => {
        setSelectedEnvId(env._id);
        const vars = env.variables?.length
            ? [...env.variables, { key: '', value: '', enabled: true }]
            : [{ key: '', value: '', enabled: true }];
        setEditedVars(vars);
        setIsDirty(false);
    };

    const createEnvMutation = useMutation({
        mutationFn: (name: string) =>
            environmentApi.create({ name, workspace: currentWorkspace!._id, variables: [] }),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['environments', currentWorkspace?._id] });
            setShowNewEnv(false);
            setNewEnvName('');
            if (res.data) handleSelectEnv(res.data);
        },
    });

    const updateEnvMutation = useMutation({
        mutationFn: ({ id, variables }: { id: string; variables: EnvironmentVariable[] }) =>
            environmentApi.update(id, { variables }),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['environments', currentWorkspace?._id] });
            if (res.data && activeEnvironment?._id === res.data._id) {
                setActiveEnvironment(res.data);
            }
            setIsDirty(false);
        },
    });

    const deleteEnvMutation = useMutation({
        mutationFn: (id: string) => environmentApi.delete(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['environments', currentWorkspace?._id] });
            if (activeEnvironment?._id === id) setActiveEnvironment(null);
            if (selectedEnvId === id) { setSelectedEnvId(null); setEditedVars([]); }
        },
    });

    const handleVarChange = (index: number, field: keyof EnvironmentVariable, value: string | boolean) => {
        const updated = editedVars.map((v, i) => i === index ? { ...v, [field]: value } : v);
        // Auto-add row if last row has content
        const last = updated[updated.length - 1];
        if (last?.key || last?.value) updated.push({ key: '', value: '', enabled: true });
        setEditedVars(updated);
        setIsDirty(true);
    };

    const handleSaveVars = () => {
        if (!selectedEnvId) return;
        const cleaned = editedVars.filter(v => v.key.trim());
        updateEnvMutation.mutate({ id: selectedEnvId, variables: cleaned });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />

            {/* Panel */}
            <div className="relative z-10 flex h-[600px] w-[860px] max-w-[95vw] max-h-[90vh] rounded-lg border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden">
                {/* Left: env list */}
                <div className="w-56 shrink-0 border-r border-gray-700 flex flex-col bg-gray-800">
                    <div className="flex items-center justify-between px-3 py-3 border-b border-gray-700">
                        <span className="text-xs font-semibold uppercase text-gray-400">Environments</span>
                        <button
                            onClick={() => setShowNewEnv(true)}
                            className="rounded p-1 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                            title="New Environment"
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {showNewEnv && (
                        <div className="p-2 border-b border-gray-700 space-y-1.5">
                            <input
                                autoFocus
                                type="text"
                                value={newEnvName}
                                onChange={(e) => setNewEnvName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newEnvName.trim()) createEnvMutation.mutate(newEnvName.trim());
                                    if (e.key === 'Escape') { setShowNewEnv(false); setNewEnvName(''); }
                                }}
                                placeholder="Environment name"
                                className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-xs text-gray-100 focus:border-orange-500 focus:outline-none"
                            />
                            <div className="flex gap-1">
                                <button
                                    onClick={() => newEnvName.trim() && createEnvMutation.mutate(newEnvName.trim())}
                                    className="flex-1 rounded bg-orange-500 px-2 py-1 text-xs font-medium hover:bg-orange-600 transition-colors"
                                >Create</button>
                                <button
                                    onClick={() => { setShowNewEnv(false); setNewEnvName(''); }}
                                    className="flex-1 rounded bg-gray-600 px-2 py-1 text-xs font-medium hover:bg-gray-500 transition-colors"
                                >Cancel</button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-auto py-1">
                        {environments.length === 0 && !showNewEnv && (
                            <p className="px-3 py-4 text-xs text-gray-500 text-center">No environments yet</p>
                        )}
                        {environments.map(env => (
                            <div
                                key={env._id}
                                className={`group flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${selectedEnvId === env._id ? 'bg-gray-700 text-gray-100' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
                                onClick={() => handleSelectEnv(env)}
                            >
                                <span className="text-xs truncate flex-1">{env.name}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                    {activeEnvironment?._id === env._id && (
                                        <span className="text-orange-400 text-xs">✓</span>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteEnvMutation.mutate(env._id); }}
                                        className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-gray-600 text-red-400 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: variable editor */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-semibold text-gray-200">
                                {selectedEnv ? selectedEnv.name : 'Manage Environments'}
                            </h2>
                            {selectedEnv && (
                                <button
                                    onClick={() => setActiveEnvironment(activeEnvironment?._id === selectedEnv._id ? null : selectedEnv)}
                                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${activeEnvironment?._id === selectedEnv._id ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-gray-600 text-gray-400 hover:border-orange-500 hover:text-orange-400'}`}
                                >
                                    {activeEnvironment?._id === selectedEnv._id ? 'Active' : 'Set Active'}
                                </button>
                            )}
                        </div>
                        <button onClick={onClose} className="rounded p-1 hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {selectedEnv ? (
                        <>
                            {/* Variable table */}
                            <div className="flex-1 overflow-auto p-4">
                                <div className="grid grid-cols-[auto_1fr_1fr] gap-1 mb-1 px-1">
                                    <span className="w-8" />
                                    <span className="text-xs font-medium text-gray-500 uppercase">Key</span>
                                    <span className="text-xs font-medium text-gray-500 uppercase">Value</span>
                                </div>
                                <div className="space-y-1">
                                    {editedVars.map((v, i) => (
                                        <div key={i} className="grid grid-cols-[auto_1fr_1fr] gap-1 items-center">
                                            <input
                                                type="checkbox"
                                                checked={v.enabled}
                                                onChange={(e) => handleVarChange(i, 'enabled', e.target.checked)}
                                                className="w-4 h-4 accent-orange-500"
                                            />
                                            <input
                                                type="text"
                                                value={v.key}
                                                onChange={(e) => handleVarChange(i, 'key', e.target.value)}
                                                placeholder="Variable name"
                                                className="rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-gray-100 placeholder-gray-600 focus:border-orange-500 focus:outline-none"
                                            />
                                            <input
                                                type="text"
                                                value={v.value}
                                                onChange={(e) => handleVarChange(i, 'value', e.target.value)}
                                                placeholder="Value"
                                                className="rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-gray-100 placeholder-gray-600 focus:border-orange-500 focus:outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-700 shrink-0">
                                {isDirty && <span className="text-xs text-gray-500 mr-auto">Unsaved changes</span>}
                                <button
                                    onClick={handleSaveVars}
                                    disabled={!isDirty || updateEnvMutation.isPending}
                                    className="flex items-center gap-1.5 rounded bg-orange-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Check className="h-3.5 w-3.5" />
                                    {updateEnvMutation.isPending ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-1 items-center justify-center text-gray-600">
                            <div className="text-center">
                                <p className="text-sm">Select an environment to edit its variables</p>
                                <p className="text-xs mt-1 text-gray-700">or create a new one with the + button</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
