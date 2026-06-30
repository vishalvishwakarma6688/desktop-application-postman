import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
// Test auto-bump trigger v2
import { Settings, Bell, ChevronDown, LogOut, Globe, History, GitBranch, Share2, X, Info, CheckCircle2, AlertTriangle, XCircle, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useRequestStore } from '@/store/useRequestStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useGitBranchStore } from '@/store/useGitBranchStore';
import { environmentApi } from '@/features/environments/api';
import EnvironmentPanel from './EnvironmentPanel';
import HistoryPanel from './HistoryPanel';
import SettingsPanel from './SettingsPanel';
import GitSyncPanel from './GitSyncPanel';
import LanShareModal from './LanShareModal';
import CollaboratorsAvatars from './collaboration/CollaboratorsAvatars';
import CollaboratorsPanel from './collaboration/CollaboratorsPanel';
import LanPeersIndicator from './p2p/LanPeersIndicator';
import toast from 'react-hot-toast';

function formatTime(date: Date) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
}

export default function AppHeader() {
    const { user, logout } = useAuthStore();
    const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspaceStore();
    const { activeEnvironment, setActiveEnvironment } = useRequestStore();
    const { activeBranch, branchMappings, setBranchMapping, removeBranchMapping } = useGitBranchStore();

    const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
    const [showEnvMenu, setShowEnvMenu] = useState(false);
    const [showBranchMenu, setShowBranchMenu] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);
    const [showEnvPanel, setShowEnvPanel] = useState(false);
    const [showHistoryPanel, setShowHistoryPanel] = useState(false);
    const [showSettingsPanel, setShowSettingsPanel] = useState(false);
    const [showGitPanel, setShowGitPanel] = useState(false);
    const [showLanSharePanel, setShowLanSharePanel] = useState(false);
    const [showCollaboratorsPanel, setShowCollaboratorsPanel] = useState(false);
    const [showNotificationMenu, setShowNotificationMenu] = useState(false);

    const { notifications, markAsRead, markAllAsRead, clearNotification, clearAll } = useNotificationStore();
    const unreadCount = notifications.filter(n => !n.read).length;

    const { data: envsData } = useQuery({
        queryKey: ['environments', currentWorkspace?._id],
        queryFn: () => environmentApi.getByWorkspace(currentWorkspace!._id),
        enabled: !!currentWorkspace,
    });

    const environments = envsData?.data || [];
    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : user?.email?.[0]?.toUpperCase() || 'U';

    return (
        <div className="flex h-10 items-center gap-1 border-b border-gray-800 bg-gray-950 px-3 shrink-0 select-none">
            {/* App logo */}
            <div className="flex items-center gap-2 mr-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-orange-500 text-[9px] font-bold text-white leading-none">DC</div>
            </div>

            {/* Workspace switcher */}
            <div className="relative">
                <button
                    onClick={() => { setShowWorkspaceMenu(v => !v); setShowEnvMenu(false); setShowUserMenu(false); }}
                    className="flex items-center gap-1.5 rounded px-2.5 py-1 text-sm font-medium text-gray-200 hover:bg-gray-800 transition-colors"
                >
                    {currentWorkspace?.name || 'Select Workspace'}
                    <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                </button>
                {showWorkspaceMenu && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded border border-gray-700 bg-gray-900 shadow-xl">
                        <div className="px-3 py-2 text-xs font-semibold uppercase text-gray-500 border-b border-gray-800">Workspaces</div>
                        {workspaces.map(ws => (
                            <button
                                key={ws._id}
                                onClick={() => { setCurrentWorkspace(ws); setShowWorkspaceMenu(false); }}
                                className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-800 ${currentWorkspace?._id === ws._id ? 'text-orange-400' : 'text-gray-300'}`}
                            >
                                <div className="h-5 w-5 rounded bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
                                    {ws.name[0]?.toUpperCase()}
                                </div>
                                <span className="truncate">{ws.name}</span>
                                {currentWorkspace?._id === ws._id && <span className="ml-auto text-xs text-orange-400">✓</span>}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-gray-700 mx-1" />

            {/* Environment selector */}
            <div className="relative">
                <button
                    onClick={() => { setShowEnvMenu(v => !v); setShowWorkspaceMenu(false); setShowUserMenu(false); }}
                    className="flex items-center gap-1.5 rounded px-2.5 py-1 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
                >
                    <Globe className="h-3.5 w-3.5" />
                    <span className="max-w-[120px] truncate">{activeEnvironment?.name || 'No Environment'}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-600" />
                </button>
                {showEnvMenu && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded border border-gray-700 bg-gray-900 shadow-xl">
                        <div className="px-3 py-2 text-xs font-semibold uppercase text-gray-500 border-b border-gray-800">Environment</div>
                        <button
                            onClick={() => { setActiveEnvironment(null); setShowEnvMenu(false); }}
                            className={`flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-gray-800 ${!activeEnvironment ? 'text-orange-400' : 'text-gray-400'}`}
                        >
                            No Environment
                            {!activeEnvironment && <span className="ml-auto text-xs">✓</span>}
                        </button>
                        {environments.map(env => (
                            <button
                                key={env._id}
                                onClick={() => { setActiveEnvironment(env); setShowEnvMenu(false); }}
                                className={`flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-gray-800 ${activeEnvironment?._id === env._id ? 'text-orange-400' : 'text-gray-300'}`}
                            >
                                <span className="truncate">{env.name}</span>
                                {activeEnvironment?._id === env._id && <span className="ml-auto text-xs">✓</span>}
                            </button>
                        ))}
                        {environments.length === 0 && (
                            <div className="px-3 py-2 text-xs text-gray-600">No environments yet</div>
                        )}
                        <div className="border-t border-gray-800 mt-1">
                            <button
                                onClick={() => { setShowEnvMenu(false); setShowEnvPanel(true); }}
                                className="flex w-full items-center px-3 py-2 text-xs text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
                            >
                                Manage Environments
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {/* Git Branch Indicator */}
            {currentWorkspace?.localDirectory && (
                <>
                    <div className="h-4 w-px bg-gray-700 mx-1" />
                    <div className="relative">
                        <button
                            onClick={() => { setShowBranchMenu(v => !v); setShowEnvMenu(false); setShowWorkspaceMenu(false); setShowUserMenu(false); }}
                            className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-semibold border transition-all ${
                                activeBranch && branchMappings[activeBranch] 
                                    ? 'text-orange-400 bg-orange-500/5 border-orange-500/10 hover:bg-orange-500/10' 
                                    : 'text-gray-400 border-transparent hover:bg-gray-800 hover:text-gray-200'
                            }`}
                            title={activeBranch ? `Active Git Branch: ${activeBranch}` : 'Git repository inactive'}
                        >
                            <GitBranch className="h-3.5 w-3.5" />
                            <span className="max-w-[100px] truncate">{activeBranch || 'Git Inactive'}</span>
                            {activeBranch ? (
                                branchMappings[activeBranch] ? (
                                    <span className="text-[9px] text-orange-500/80 px-1 py-0.2 rounded bg-orange-500/10 border border-orange-500/20 font-bold uppercase tracking-wider scale-95 shrink-0">Linked</span>
                                ) : (
                                    <ChevronDown className="h-3.5 w-3.5 text-gray-600" />
                                )
                            ) : null}
                        </button>

                        {showBranchMenu && (
                            <div className="absolute left-0 top-full z-50 mt-1 w-60 rounded-lg border border-gray-750 bg-gray-900 p-3 shadow-xl space-y-3">
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">Active Git Branch</div>
                                    <div className="text-xs font-mono text-gray-205 font-bold truncate">{activeBranch || 'Not a Git Repository'}</div>
                                </div>

                                {activeBranch ? (
                                    <div className="border-t border-gray-800 pt-2.5 space-y-1.5">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">Auto-Switch Target</label>
                                        <select
                                            value={branchMappings[activeBranch] || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val) {
                                                    setBranchMapping(activeBranch, val);
                                                    const env = environments.find(envObj => envObj._id === val);
                                                    if (env) {
                                                        setActiveEnvironment(env);
                                                        toast.success(`Linked branch '${activeBranch}' to environment '${env.name}'.`);
                                                    }
                                                } else {
                                                    removeBranchMapping(activeBranch);
                                                    toast.success(`Removed link for branch '${activeBranch}'.`);
                                                }
                                                setShowBranchMenu(false);
                                            }}
                                            className="w-full rounded border border-gray-750 bg-gray-850 px-2 py-1.5 text-xs text-gray-200 focus:border-orange-500 focus:outline-none"
                                        >
                                            <option value="">None (Don't auto-switch)</option>
                                            {environments.map(env => (
                                                <option key={env._id} value={env._id}>
                                                    {env.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="border-t border-gray-800 pt-2 text-[10px] text-gray-400">
                                        Open the Git Sync panel (click the Git icon on the right side of the header) and click **"Initialize Git"** to activate branch sync.
                                    </div>
                                )}

                                <div className="text-[9px] text-gray-550 leading-relaxed bg-gray-950/20 p-2 rounded border border-gray-850">
                                    APIFlow watches your local Git directory and switches environment credentials automatically when you checkout a branch.
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right side actions */}
            <div className="flex items-center gap-1">
                {/* Lan Peers */}
                <LanPeersIndicator />

                {/* Collaborators */}
                <CollaboratorsAvatars onOpenPanel={() => setShowCollaboratorsPanel(true)} />

                {/* Divider */}
                {currentWorkspace && <div className="h-4 w-px bg-gray-700 mx-1" />}

                {currentWorkspace && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowLanSharePanel(true)}
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
                            title="Share Workspace over LAN"
                        >
                            <Share2 className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setShowGitPanel(true)}
                            className={`rounded p-1.5 transition-colors ${currentWorkspace.localDirectory ? 'text-orange-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'}`}
                            title={currentWorkspace.localDirectory ? 'Git Synced to Folder' : 'Link to Git Repository'}
                        >
                            <GitBranch className="h-4 w-4" />
                        </button>
                    </div>
                )}
                <button className="rounded p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors" title="Settings" onClick={() => setShowSettingsPanel(true)}>
                    <Settings className="h-4 w-4" />
                </button>                <button
                    onClick={() => setShowHistoryPanel(true)}
                    className="rounded p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
                    title="Request History"
                >
                    <History className="h-4 w-4" />
                </button>
                {/* Notifications dropdown trigger */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowNotificationMenu(v => !v);
                            setShowWorkspaceMenu(false);
                            setShowEnvMenu(false);
                            setShowUserMenu(false);
                        }}
                        className={`relative rounded p-1.5 transition-colors ${showNotificationMenu ? 'bg-gray-800 text-gray-200' : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'}`}
                        title="Notifications"
                    >
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                            <span className="absolute right-0.5 top-0.5 flex h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                        )}
                    </button>
                    {showNotificationMenu && (
                        <div className="absolute right-0 top-full z-50 mt-1.5 w-80 rounded-xl border border-gray-850 bg-gray-900 shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-4 py-3">
                                <span className="text-xs font-bold text-gray-200">Notifications</span>
                                <div className="flex items-center gap-2">
                                    {notifications.length > 0 && (
                                        <>
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-[10px] font-semibold text-orange-400 hover:text-orange-300 transition-colors"
                                            >
                                                Mark all as read
                                            </button>
                                            <span className="text-gray-700 text-xs">|</span>
                                            <button
                                                onClick={clearAll}
                                                className="text-[10px] font-semibold text-gray-500 hover:text-gray-350 transition-colors"
                                            >
                                                Clear all
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Notifications list */}
                            <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-800/60">
                                {notifications.length > 0 ? (
                                    notifications.map((n) => {
                                        let Icon = Info;
                                        let iconColor = 'text-blue-400';
                                        if (n.type === 'success') { Icon = CheckCircle2; iconColor = 'text-green-400'; }
                                        else if (n.type === 'warning') { Icon = AlertTriangle; iconColor = 'text-yellow-500'; }
                                        else if (n.type === 'error') { Icon = XCircle; iconColor = 'text-red-400'; }

                                        return (
                                            <div
                                                key={n.id}
                                                onClick={() => markAsRead(n.id)}
                                                className={`group flex items-start gap-2.5 p-3 hover:bg-gray-850 cursor-pointer transition-colors ${!n.read ? 'bg-orange-500/[0.02]' : ''}`}
                                            >
                                                <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${iconColor}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <p className={`text-xs font-semibold truncate ${!n.read ? 'text-gray-150' : 'text-gray-400'}`}>
                                                            {n.title}
                                                        </p>
                                                        {!n.read && (
                                                            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5 break-words">
                                                        {n.message}
                                                    </p>
                                                    <p className="text-[9px] text-gray-500 mt-1">
                                                        {formatTime(n.timestamp)}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        clearNotification(n.id);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-800 hover:text-red-400 text-gray-500 transition-all"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                                        <Bell className="h-8 w-8 text-gray-700 mb-2" />
                                        <p className="text-xs text-gray-400 font-medium">All caught up!</p>
                                        <p className="text-[10px] text-gray-600 mt-0.5">No notifications at the moment</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="h-4 w-px bg-gray-700 mx-1" />

                {/* User avatar */}
                <div className="relative">
                    <button
                        onClick={() => { setShowUserMenu(v => !v); setShowWorkspaceMenu(false); setShowEnvMenu(false); }}
                        className="flex items-center gap-2 rounded px-2 py-1 hover:bg-gray-800 transition-colors"
                    >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                            {initials}
                        </div>
                        <span className="text-xs text-gray-400 max-w-[100px] truncate hidden sm:block">{user?.name || user?.email}</span>
                        <ChevronDown className="h-3 w-3 text-gray-600" />
                    </button>
                    {showUserMenu && (
                        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded border border-gray-700 bg-gray-900 shadow-xl">
                            <div className="px-3 py-2.5 border-b border-gray-800">
                                <p className="text-sm font-medium text-gray-200 truncate">{user?.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                            <button
                                onClick={() => { setShowSignoutConfirm(true); setShowUserMenu(false); }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-800 transition-colors"
                            >
                                <LogOut className="h-4 w-4" /> Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Click outside to close menus */}
            {(showWorkspaceMenu || showEnvMenu || showUserMenu || showNotificationMenu) && (
                <div className="fixed inset-0 z-40" onClick={() => { setShowWorkspaceMenu(false); setShowEnvMenu(false); setShowUserMenu(false); setShowNotificationMenu(false); }} />
            )}

            {/* Environment Panel Modal */}
            {showEnvPanel && <EnvironmentPanel onClose={() => setShowEnvPanel(false)} />}
            {showHistoryPanel && <HistoryPanel onClose={() => setShowHistoryPanel(false)} />}
            {showSettingsPanel && <SettingsPanel onClose={() => setShowSettingsPanel(false)} />}
            {showGitPanel && <GitSyncPanel onClose={() => setShowGitPanel(false)} />}
            {showLanSharePanel && (
                <LanShareModal
                    workspaceId={currentWorkspace!._id}
                    workspaceName={currentWorkspace!.name}
                    onClose={() => setShowLanSharePanel(false)}
                />
            )}
            {showCollaboratorsPanel && (
                <CollaboratorsPanel onClose={() => setShowCollaboratorsPanel(false)} />
            )}
            {showSignoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSignoutConfirm(false)} />

                    {/* Premium Modal Container */}
                    <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-2xl transition-all duration-300">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-5 py-4">
                            <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded bg-red-500/10 text-red-400">
                                    <LogOut className="h-4 w-4" />
                                </div>
                                <h2 className="text-sm font-semibold text-gray-200">Confirm Sign Out</h2>
                            </div>
                            <button
                                onClick={() => setShowSignoutConfirm(false)}
                                className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4 text-left">
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Are you sure you want to sign out of your DataCourier account? Any unsaved local workspace configurations might not be synchronized.
                            </p>
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setShowSignoutConfirm(false)}
                                    className="rounded-lg border border-gray-700 bg-transparent px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        logout();
                                        setShowSignoutConfirm(false);
                                    }}
                                    className="rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-semibold text-white transition-all transform active:scale-95 shadow-md hover:shadow-red-500/15"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
