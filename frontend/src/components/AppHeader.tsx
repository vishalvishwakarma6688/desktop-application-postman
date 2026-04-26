import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings, Bell, ChevronDown, LogOut, Globe, History } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useRequestStore } from '@/store/useRequestStore';
import { environmentApi } from '@/features/environments/api';
import EnvironmentPanel from './EnvironmentPanel';
import HistoryPanel from './HistoryPanel';
import SettingsPanel from './SettingsPanel';

export default function AppHeader() {
    const { user, logout } = useAuthStore();
    const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspaceStore();
    const { activeEnvironment, setActiveEnvironment } = useRequestStore();

    const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
    const [showEnvMenu, setShowEnvMenu] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showEnvPanel, setShowEnvPanel] = useState(false);
    const [showHistoryPanel, setShowHistoryPanel] = useState(false);
    const [showSettingsPanel, setShowSettingsPanel] = useState(false);

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
                <div className="flex h-6 w-6 items-center justify-center rounded bg-orange-500 text-xs font-bold text-white">P</div>
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

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right side actions */}
            <div className="flex items-center gap-1">
                <button className="rounded p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors" title="Settings" onClick={() => setShowSettingsPanel(true)}>
                    <Settings className="h-4 w-4" />
                </button>                <button
                    onClick={() => setShowHistoryPanel(true)}
                    className="rounded p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
                    title="Request History"
                >
                    <History className="h-4 w-4" />
                </button>
                <button className="rounded p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors" title="Notifications">
                    <Bell className="h-4 w-4" />
                </button>

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
                                onClick={logout}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-800 transition-colors"
                            >
                                <LogOut className="h-4 w-4" /> Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Click outside to close menus */}
            {(showWorkspaceMenu || showEnvMenu || showUserMenu) && (
                <div className="fixed inset-0 z-40" onClick={() => { setShowWorkspaceMenu(false); setShowEnvMenu(false); setShowUserMenu(false); }} />
            )}

            {/* Environment Panel Modal */}
            {showEnvPanel && <EnvironmentPanel onClose={() => setShowEnvPanel(false)} />}
            {showHistoryPanel && <HistoryPanel onClose={() => setShowHistoryPanel(false)} />}
            {showSettingsPanel && <SettingsPanel onClose={() => setShowSettingsPanel(false)} />}
        </div>
    );
}
