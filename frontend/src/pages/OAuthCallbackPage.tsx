import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/features/auth/api';
import { Loader2 } from 'lucide-react';

export default function OAuthCallbackPage() {
    const { setAuth } = useAuthStore();

    useEffect(() => {
        // Token comes as query param: /oauth-callback?token=<jwt>
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (!token) {
            window.location.replace('/');
            return;
        }

        localStorage.setItem('token', token);

        authApi.getMe()
            .then((res) => {
                if (res.success && res.data) {
                    setAuth(res.data, token);
                    // Clean URL and go to root — App.tsx will render DashboardPage
                    window.history.replaceState({}, '', '/');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                } else {
                    localStorage.removeItem('token');
                    window.location.replace('/');
                }
            })
            .catch(() => {
                localStorage.removeItem('token');
                window.location.replace('/');
            });
    }, []);

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-gray-950">
            <div className="flex flex-col items-center gap-3 text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <p className="text-sm">Completing sign in...</p>
            </div>
        </div>
    );
}
