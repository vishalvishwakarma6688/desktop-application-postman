import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Trash2, Check, Lock, Unlock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { environmentApi } from '@/features/environments/api';
import { useRequestStore } from '@/store/useRequestStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { Environment, EnvironmentVariable } from '@/types';
import { encryptVaultValue, decryptVaultValue, isVaultAvailable } from '@/utils/vaultUtils';
import toast from 'react-hot-toast';

interface Props {
    onClose: () => void;
}

// ─── Vault row component ──────────────────────────────────────────────────────

interface VarRowProps {
    variable: EnvironmentVariable;
    index: number;
    onChange: (index: number, field: keyof EnvironmentVariable, value: string | boolean) => void;
}

function VarRow({ variable, index, onChange }: VarRowProps) {
    const [revealed, setRevealed] = useState(false);
    const [revealedValue, setRevealedValue] = useState('');
    const [localValue, setLocalValue] = useState(variable.value || '');
    const [isRevealing, setIsRevealing] = useState(false);
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const handleReveal = async () => {
        if (revealed) {
            setRevealed(false);
            setRevealedValue('');
            if (hideTimer) clearTimeout(hideTimer);
            return;
        }
        if (!variable.encryptedValue) return;
        setIsRevealing(true);
        const plaintext = await decryptVaultValue(variable.encryptedValue);
        setIsRevealing(false);
        if (plaintext !== null) {
            setRevealedValue(plaintext);
            setRevealed(true);
            // Auto-hide after 10 seconds
            hideTimer = setTimeout(() => {
                setRevealed(false);
                setRevealedValue('');
            }, 10000);
        } else {
            toast.error('Failed to decrypt vault secret');
        }
    };

    const handleToggleSecret = () => {
        const nowSecret = !variable.isSecret;
        onChange(index, 'isSecret', nowSecret);
        // When toggling to non-secret, clear encryptedValue
        if (!nowSecret) {
            onChange(index, 'encryptedValue', '');
        }
    };

    const isSecret = !!variable.isSecret;
    const hasEncryptedValue = !!variable.encryptedValue;

    return (
        <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-1 items-center group">
            {/* Enable toggle */}
            <input
                type="checkbox"
                checked={variable.enabled}
                onChange={(e) => onChange(index, 'enabled', e.target.checked)}
                className="w-4 h-4 accent-orange-500"
            />

            {/* Key */}
            <div className="relative">
                <input
                    type="text"
                    value={variable.key}
                    onChange={(e) => onChange(index, 'key', e.target.value)}
                    placeholder="Variable name"
                    className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-gray-100 placeholder-gray-600 focus:border-orange-500 focus:outline-none pr-16"
                />
                {isSecret && (
                    <span
                        title="Vault Secret — value is OS-encrypted"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 tracking-wide"
                    >
                        <ShieldCheck className="h-2.5 w-2.5" /> VAULT
                    </span>
                )}
            </div>

            {/* Value */}
            {isSecret ? (
                <div className="relative">
                    {hasEncryptedValue ? (
                        // Encrypted state: show masked dots + reveal/hide button
                        <div className="flex items-center gap-1">
                            <div className="flex-1 rounded border border-amber-500/30 bg-gray-800 px-2 py-1.5 text-xs text-amber-400/60 font-mono tracking-widest select-none">
                                {revealed ? revealedValue : '••••••••'}
                            </div>
                            <button
                                type="button"
                                onClick={handleReveal}
                                disabled={isRevealing}
                                className="shrink-0 rounded p-1 text-gray-500 hover:text-amber-400 hover:bg-gray-700 transition-colors"
                                title={revealed ? 'Hide secret' : 'Reveal secret (10s)'}
                            >
                                {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                        </div>
                    ) : (
                        // New secret: let user type the value (will be encrypted on save)
                        <input
                            type="password"
                            value={localValue}
                            onChange={(e) => {
                                setLocalValue(e.target.value);
                                onChange(index, 'value', e.target.value);
                            }}
                            placeholder="Enter secret value (encrypted on save)"
                            className="w-full rounded border border-amber-500/30 bg-gray-800 px-2 py-1.5 text-xs text-amber-400 placeholder-amber-900 focus:border-amber-500 focus:outline-none"
                        />
                    )}
                </div>
            ) : (
                // Plain variable
                <input
                    type="text"
                    value={variable.value}
                    onChange={(e) => onChange(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-gray-100 placeholder-gray-600 focus:border-orange-500 focus:outline-none"
                />
            )}

            {/* Vault toggle */}
            <button
                type="button"
                onClick={handleToggleSecret}
                title={isSecret ? 'Remove vault protection' : 'Mark as vault secret'}
                className={`rounded p-1.5 transition-colors ${
                    isSecret
                        ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                        : 'text-gray-600 hover:text-amber-400 hover:bg-gray-700'
                }`}
            >
                {isSecret ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            </button>
        </div>
    );
}

// ─── EnvironmentPanel ─────────────────────────────────────────────────────────

export default function EnvironmentPanel({ onClose }: Props) {
    const queryClient = useQueryClient();
    const { currentWorkspace } = useWorkspaceStore();
    const { activeEnvironment, setActiveEnvironment } = useRequestStore();

    const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
    const [newEnvName, setNewEnvName] = useState('');
    const [showNewEnv, setShowNewEnv] = useState(false);
    const [editedVars, setEditedVars] = useState<EnvironmentVariable[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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

    const handleVarChange = useCallback((index: number, field: keyof EnvironmentVariable, value: string | boolean) => {
        setEditedVars(prev => {
            const updated = prev.map((v, i) => i === index ? { ...v, [field]: value } : v);
            // Auto-add a new empty row if the last row has content
            const last = updated[updated.length - 1];
            if (last?.key || last?.value) updated.push({ key: '', value: '', enabled: true });
            return updated;
        });
        setIsDirty(true);
    }, []);

    const handleSaveVars = async () => {
        if (!selectedEnvId) return;
        setIsSaving(true);

        const vaultAvailable = await isVaultAvailable();
        const cleaned = editedVars.filter(v => v.key.trim());

        // Encrypt any new secret variables that don't yet have an encryptedValue
        const processedVars: EnvironmentVariable[] = [];
        for (const v of cleaned) {
            if (v.isSecret && v.value && !v.encryptedValue) {
                if (!vaultAvailable) {
                    toast.error(`Cannot encrypt "${v.key}": OS encryption not available. Variable saved as plain text.`);
                    processedVars.push({ ...v, isSecret: false, value: v.value });
                    continue;
                }
                const encrypted = await encryptVaultValue(v.value);
                if (encrypted) {
                    processedVars.push({ ...v, value: '', encryptedValue: encrypted });
                } else {
                    toast.error(`Failed to encrypt "${v.key}". Saved as plain text.`);
                    processedVars.push({ ...v, isSecret: false, value: v.value });
                }
            } else {
                processedVars.push(v);
            }
        }

        updateEnvMutation.mutate({ id: selectedEnvId, variables: processedVars });

        // Reflect the encrypted state in the local edit state
        setEditedVars([...processedVars, { key: '', value: '', enabled: true }]);
        setIsSaving(false);
    };

    const secretCount = editedVars.filter(v => v.key && v.isSecret).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />

            {/* Panel */}
            <div className="relative z-10 flex h-[600px] w-[900px] max-w-[95vw] max-h-[90vh] rounded-lg border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden">
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
                                    {/* Show vault indicator if env has secret vars */}
                                    {(env.variables || []).some(v => v.isSecret) && (
                                        <span title="Contains vault secrets">
                                            <ShieldCheck className="h-3 w-3 text-amber-500/60" />
                                        </span>
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
                            {secretCount > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                                    <ShieldCheck className="h-3 w-3" />
                                    {secretCount} Vault Secret{secretCount > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        <button onClick={onClose} className="rounded p-1 hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {selectedEnv ? (
                        <>
                            {/* Column headers */}
                            <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-1 mb-1 px-4 pt-3">
                                <span className="w-4" />
                                <span className="text-xs font-medium text-gray-500 uppercase">Key</span>
                                <span className="text-xs font-medium text-gray-500 uppercase">Value</span>
                                <span className="w-7 text-[10px] text-gray-600 text-center">Vault</span>
                            </div>

                            {/* Variable table */}
                            <div className="flex-1 overflow-auto px-4 pb-2">
                                <div className="space-y-1">
                                    {editedVars.map((v, i) => (
                                        <VarRow
                                            key={i}
                                            variable={v}
                                            index={i}
                                            onChange={handleVarChange}
                                        />
                                    ))}
                                </div>

                                {/* Vault info banner */}
                                {secretCount > 0 && (
                                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
                                        <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-amber-400/80 leading-relaxed">
                                            Vault secrets are encrypted using your OS keychain and <strong>never stored as plain text</strong> in the database. 
                                            Click the <Eye className="inline h-3 w-3 mx-0.5" /> icon to temporarily reveal a secret (auto-hides after 10s).
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-700 shrink-0">
                                {isDirty && <span className="text-xs text-gray-500 mr-auto">Unsaved changes</span>}
                                <button
                                    onClick={handleSaveVars}
                                    disabled={!isDirty || isSaving || updateEnvMutation.isPending}
                                    className="flex items-center gap-1.5 rounded bg-orange-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Check className="h-3.5 w-3.5" />
                                    {isSaving || updateEnvMutation.isPending ? 'Saving...' : 'Save'}
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
