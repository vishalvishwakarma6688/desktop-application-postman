import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import CommandPalette from './components/CommandPalette';
import { useTabStore } from './store/useTabStore';
import { requestApi } from './features/requests/api';
import { authApi } from './features/auth/api';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

function App() {
    const { isAuthenticated, token, setAuth, logout, isLoading, setLoading } = useAuthStore();
    const { tabs, activeTabId, updateTab } = useTabStore();
    const [pathname, setPathname] = useState(window.location.pathname);
    const [showPalette, setShowPalette] = useState(false);

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
        <QueryClientProvider client={queryClient}>
            <div className="h-screen w-screen overflow-hidden bg-gray-900 text-gray-100">
                {pathname === '/oauth-callback'
                    ? <OAuthCallbackPage />
                    : isAuthenticated ? <DashboardPage /> : <LoginPage />
                }
                {showPalette && isAuthenticated && <CommandPalette onClose={() => setShowPalette(false)} />}
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
        </QueryClientProvider>
    );
}

export default App;
