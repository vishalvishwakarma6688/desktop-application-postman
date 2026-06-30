import { useEffect, useRef, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import InviteAcceptPage from './pages/InviteAcceptPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import CommandPalette from './components/CommandPalette';
import UpdateNotification from './components/UpdateNotification';
import { useTabStore } from './store/useTabStore';
import { requestApi } from './features/requests/api';
import { authApi } from './features/auth/api';
import { useCollaboration } from './hooks/useCollaboration';
import { useP2PStore } from './store/useP2PStore';
import IncomingShareDialog from './components/p2p/IncomingShareDialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from './store/useWorkspaceStore';
import { useRequestStore } from './store/useRequestStore';
import { useGitBranchStore } from './store/useGitBranchStore';
import { environmentApi } from './features/environments/api';



function App() {
    const queryClient = useQueryClient();
    const { isAuthenticated, token, setAuth, logout, isLoading, setLoading } = useAuthStore();
    const { tabs, activeTabId, updateTab } = useTabStore();
    const [pathname, setPathname] = useState(window.location.pathname);
    const [showPalette, setShowPalette] = useState(false);

    // Initialize collaboration (connects to WebSocket when authenticated)
    useCollaboration();

    const { user } = useAuthStore();
    const { setPeers, setIncomingShare, reset: resetP2P } = useP2PStore();

    // Initialize Local P2P Auto-Discovery
    useEffect(() => {
        if (!isAuthenticated || !user || !window.electronAPI) return;

        // Start discovery in Main process
        window.electronAPI.invoke('p2p:start', {
            userId: user._id,
            username: user.name
        }).catch(console.error);

        // Register P2P listeners
        window.electronAPI.receive('p2p:peers-updated', (peers: any) => {
            setPeers(peers);
        });

        window.electronAPI.receive('p2p:share-prompt', (inviteData: any) => {
            setIncomingShare(inviteData);
        });

        return () => {
            // Clean up: stop P2P discovery
            window.electronAPI.invoke('p2p:stop').catch(console.error);
            resetP2P();
        };
    }, [isAuthenticated, user]);

    const { currentWorkspace } = useWorkspaceStore();
    const { setActiveEnvironment } = useRequestStore();
    const { setActiveBranch, setBranchMapping, loadMappings, reset: resetGitBranch } = useGitBranchStore();

    // Fetch environments for matching fallback
    const { data: envsData } = useQuery({
        queryKey: ['environments', currentWorkspace?._id],
        queryFn: () => environmentApi.getByWorkspace(currentWorkspace!._id),
        enabled: !!currentWorkspace && !!window.electronAPI,
    });
    const environments = envsData?.data || [];

    const envsRef = useRef({ environments, setActiveEnvironment, setBranchMapping, setActiveBranch });
    useEffect(() => {
        envsRef.current = { environments, setActiveEnvironment, setBranchMapping, setActiveBranch };
    }, [environments, setActiveEnvironment, setBranchMapping, setActiveBranch]);

    // Watch git branch when workspace changes
    useEffect(() => {
        if (!isAuthenticated || !currentWorkspace || !window.electronAPI) return;

        // 1. Load mappings for this workspace
        loadMappings(currentWorkspace._id);

        // 2. Start branch watcher
        if (currentWorkspace.localDirectory) {
            window.electronAPI.invoke('git:watch-branch', { dirPath: currentWorkspace.localDirectory }).catch(console.error);
        } else {
            window.electronAPI.invoke('git:unwatch-branch').catch(console.error);
        }

        // 3. Register branch changed event
        window.electronAPI.receive('git:branch-changed', (branchName: string) => {
            const currentMappings = useGitBranchStore.getState().branchMappings;
            const mappedEnvId = currentMappings[branchName];
            const { environments: latestEnvs, setActiveEnvironment: setEnv, setBranchMapping: setMap, setActiveBranch: setBranch } = envsRef.current;

            setBranch(branchName);

            if (mappedEnvId) {
                // If there is an explicit mapping, find and switch
                const targetEnv = latestEnvs.find((e: any) => e._id === mappedEnvId);
                if (targetEnv) {
                    setEnv(targetEnv);
                    toast.success(`Git Branch switched to '${branchName}'. Switched environment to '${targetEnv.name}'.`);
                }
            } else {
                // Name-based match fallback
                const targetEnv = latestEnvs.find((e: any) => e.name.toLowerCase() === branchName.toLowerCase());
                if (targetEnv) {
                    setEnv(targetEnv);
                    setMap(branchName, targetEnv._id);
                    toast.success(`Git Branch switched to '${branchName}'. Auto-linked environment '${targetEnv.name}'.`);
                }
            }
        });

        return () => {
            if (window.electronAPI) {
                window.electronAPI.invoke('git:unwatch-branch').catch(console.error);
                window.electronAPI.removeListener('git:branch-changed');
            }
            resetGitBranch();
        };
    }, [isAuthenticated, currentWorkspace?._id, currentWorkspace?.localDirectory, loadMappings, resetGitBranch]);

    // Fetch user data on app initialization if token exists but user object is missing
    useEffect(() => {
        const fetchUserData = async () => {
            if (token) {
                try {
                    const response = await authApi.getMe();
                    if (response.success && response.data) {
                        setAuth(response.data, token);
                    } else {
                        // Token is invalid, logout
                        logout();
                    }
                } catch (error) {
                    console.error('Failed to fetch user data:', error);
                    // Token is invalid, logout
                    logout();
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []); // Run only once on mount

    useEffect(() => {
        const onPop = () => setPathname(window.location.pathname);
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);

    // Handle pending invitations after login/registration
    useEffect(() => {
        if (isAuthenticated) {
            const pendingInviteToken = localStorage.getItem('pending_invite_token');
            if (pendingInviteToken) {
                localStorage.removeItem('pending_invite_token');
                
                import('./features/collaboration/api').then(({ collaborationApi }) => {
                    collaborationApi.acceptInvitation(pendingInviteToken)
                        .then((res) => {
                            toast.success(`Successfully joined workspace: ${res.workspace?.name || 'Shared Workspace'}`);
                            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
                        })
                        .catch((err) => {
                            const errMsg = err.response?.data?.message || 'Failed to accept invitation';
                            toast.error(errMsg);
                        });
                });
            }
        }
    }, [isAuthenticated]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const ctrl = e.ctrlKey || e.metaKey;
            if (!ctrl) return;

            const activeTab = tabs.find(t => t.id === activeTabId);
            const req = activeTab?.request;

            // Ctrl+S — save active request
            if (e.key === 's' && req) {
                e.preventDefault();
                requestApi.update(req._id, {
                    url: req.url, method: req.method,
                    headers: req.headers, queryParams: req.queryParams,
                    body: req.body, auth: req.auth,
                }).then((res) => {
                    if (res.data) updateTab(activeTab!.id, { request: res.data, isDirty: false });
                });
            }

            // Ctrl+Enter — trigger send (dispatch custom event picked up by RequestEditor)
            if (e.key === 'Enter' && req) {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('kiro:send'));
            }

            // Ctrl+W — close active tab
            if (e.key === 'w' && activeTab) {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('kiro:close-tab', { detail: activeTab.id }));
            }

            // Ctrl+P — command palette
            if (e.key === 'p') {
                e.preventDefault();
                setShowPalette(v => !v);
            }

            // Ctrl+T — new tab (dispatched to TabBar)
            if (e.key === 't') {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('kiro:new-tab'));
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [tabs, activeTabId, updateTab]);

    // Show loading state while fetching user data
    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-gray-100">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
                    <p className="text-sm text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen overflow-hidden bg-gray-900 text-gray-100">
            {pathname === '/oauth-callback'
                ? <OAuthCallbackPage />
                : pathname.startsWith('/invite/')
                    ? <InviteAcceptPage token={pathname.split('/invite/')[1]} />
                    : isAuthenticated ? <DashboardPage /> : <LoginPage />
            }
            {showPalette && isAuthenticated && <CommandPalette onClose={() => setShowPalette(false)} />}
            {/* Update notification popup — shown when a new version is available */}
            <UpdateNotification />
            <IncomingShareDialog />
            <Toaster
                position="bottom-center"
                toastOptions={{
                    style: {
                        background: '#1f2937',
                        color: '#f3f4f6',
                        border: '1px solid #374151',
                        fontSize: '13px',
                    },
                }}
            />
        </div>
    );
}

export default App;
