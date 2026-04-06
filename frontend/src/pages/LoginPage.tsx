import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/store/useAuthStore';

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:5000';

// SVG icons for OAuth providers
const GoogleIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const GitHubIcon = () => (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
);

export default function LoginPage() {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { setAuth } = useAuthStore();

    const loginMutation = useMutation({
        mutationFn: authApi.login,
        onSuccess: (data) => {
            if (data.success && data.data) setAuth(data.data.user, data.data.token);
        },
        onError: (err: any) => setError(err.response?.data?.error?.message || 'Invalid email or password'),
    });

    const registerMutation = useMutation({
        mutationFn: authApi.register,
        onSuccess: (data) => {
            if (data.success && data.data) setAuth(data.data.user, data.data.token);
        },
        onError: (err: any) => setError(err.response?.data?.error?.message || 'Registration failed'),
    });

    const isPending = loginMutation.isPending || registerMutation.isPending;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (mode === 'login') {
            loginMutation.mutate({ email: formData.email, password: formData.password });
        } else {
            registerMutation.mutate(formData);
        }
    };

    const switchMode = (m: 'login' | 'register') => {
        setMode(m);
        setError('');
        setFormData({ name: '', email: '', password: '' });
    };

    return (
        <div className="flex h-full w-full items-center justify-center bg-gray-950">
            {/* Background decoration */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-orange-500/5 blur-3xl" />
                <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-orange-500/5 blur-3xl" />
            </div>

            <div className="relative w-full max-w-sm px-4">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 shadow-lg shadow-orange-500/30">
                        <span className="text-xl font-black text-white">P</span>
                    </div>
                    <div className="text-center">
                        <h1 className="text-xl font-bold text-white">Postman</h1>
                        <p className="mt-0.5 text-sm text-gray-500">API development environment</p>
                    </div>
                </div>

                {/* Card */}
                <div className="rounded-xl border border-gray-800 bg-gray-900 shadow-2xl">
                    {/* Tab switcher */}
                    <div className="flex border-b border-gray-800">
                        {(['login', 'register'] as const).map((m) => (
                            <button
                                key={m}
                                onClick={() => switchMode(m)}
                                className={`flex-1 py-3 text-sm font-medium transition-colors capitalize ${mode === m
                                    ? 'text-orange-400 border-b-2 border-orange-500 -mb-px'
                                    : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                {m === 'login' ? 'Sign In' : 'Sign Up'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {/* Name field (register only) */}
                        {mode === 'register' && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="John Doe"
                                        required
                                        autoComplete="name"
                                        className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-4 text-sm text-gray-100 placeholder-gray-600 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="you@example.com"
                                    required
                                    autoComplete="email"
                                    className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-4 text-sm text-gray-100 placeholder-gray-600 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={mode === 'register' ? 'Min. 8 characters' : 'Enter your password'}
                                    required
                                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                    className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-10 text-sm text-gray-100 placeholder-gray-600 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-start gap-2 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2.5">
                                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                                <p className="text-xs text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isPending}
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>

                        {/* Divider */}
                        <div className="relative flex items-center gap-3 py-1">
                            <div className="flex-1 h-px bg-gray-800" />
                            <span className="text-xs text-gray-600">or continue with</span>
                            <div className="flex-1 h-px bg-gray-800" />
                        </div>

                        {/* OAuth buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => { window.location.href = `${BACKEND_URL}/api/auth/google`; }}
                                className="flex items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800 py-2.5 text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                            >
                                <GoogleIcon />
                                Google
                            </button>
                            <button
                                type="button"
                                onClick={() => { window.location.href = `${BACKEND_URL}/api/auth/github`; }}
                                className="flex items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800 py-2.5 text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                            >
                                <GitHubIcon />
                                GitHub
                            </button>
                        </div>
                    </form>
                </div>

                <p className="mt-6 text-center text-xs text-gray-600">
                    By continuing, you agree to our terms of service and privacy policy.
                </p>
            </div>
        </div>
    );
}
