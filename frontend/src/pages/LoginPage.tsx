import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/store/useAuthStore';
import logo from "../../public/datacourier.png"

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
    const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
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

    const forgotPasswordMutation = useMutation({
        mutationFn: authApi.forgotPassword,
        onSuccess: (data) => {
            setSuccessMessage(data.data?.message || data.message || 'If a matching account exists, a password reset link has been sent.');
        },
        onError: (err: any) => setError(err.response?.data?.error?.message || 'Failed to request password reset'),
    });

    const isPending = loginMutation.isPending || registerMutation.isPending || forgotPasswordMutation.isPending;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (mode === 'login') {
            loginMutation.mutate({ email: formData.email, password: formData.password });
        } else {
            registerMutation.mutate(formData);
        }
    };

    const handleForgotSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        forgotPasswordMutation.mutate(formData.email);
    };

    const switchMode = (m: 'login' | 'register' | 'forgot') => {
        setMode(m);
        setError('');
        setSuccessMessage('');
        setFormData({ name: '', email: '', password: '' });
    };

    return (
        <div className="flex h-full w-full items-center justify-center bg-gray-950 relative overflow-hidden select-none">
            {/* Ambient Background Lights */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-orange-500/5 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-rose-500/5 blur-[120px] animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none" />
            </div>

            <div className="relative w-full max-w-sm px-4">
                {/* Logo and Branding */}
                <div className="mb-6 flex flex-col items-center gap-2">
                    <img src={logo} alt="DataCourier Logo" className="h-14 w-auto object-contain hover:scale-105 transition-transform duration-300" />
                    <div className="text-center">
                        <p className="text-xs text-gray-400 font-medium">Collaborative API Testing & Development Platform</p>
                    </div>
                </div>

                {/* Card Container */}
                <div className="rounded-2xl border border-gray-800/80 bg-gray-900/40 shadow-2xl backdrop-blur-md p-6">
                    {mode !== 'forgot' ? (
                        <>
                            {/* Tab Switcher (Pill-style) */}
                            <div className="flex p-1 bg-gray-950/80 border border-gray-800/50 rounded-xl mb-5">
                                {(['login', 'register'] as const).map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => switchMode(m)}
                                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all capitalize ${
                                            mode === m
                                                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/10'
                                                : 'text-gray-400 hover:text-gray-200'
                                        }`}
                                    >
                                        {m === 'login' ? 'Sign In' : 'Create Account'}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name field (register only) */}
                                {mode === 'register' && (
                                    <div className="space-y-1.5 animate-fade-in">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="John Doe"
                                                required
                                                autoComplete="name"
                                                className="w-full rounded-xl border border-gray-800 bg-gray-950/60 py-2.5 pl-11 pr-4 text-sm text-gray-100 placeholder-gray-600 transition-all hover:border-gray-700/80 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="you@example.com"
                                            required
                                            autoComplete="email"
                                            className="w-full rounded-xl border border-gray-800 bg-gray-950/60 py-2.5 pl-11 pr-4 text-sm text-gray-100 placeholder-gray-600 transition-all hover:border-gray-700/80 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Password
                                        </label>
                                        {mode === 'login' && (
                                            <button
                                                type="button"
                                                onClick={() => switchMode('forgot')}
                                                className="text-xs font-medium text-orange-400 hover:text-orange-350 transition-colors"
                                            >
                                                Forgot password?
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder={mode === 'register' ? 'Min. 8 characters' : 'Enter your password'}
                                            required
                                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                            className="w-full rounded-xl border border-gray-800 bg-gray-950/60 py-2.5 pl-11 pr-11 text-sm text-gray-100 placeholder-gray-600 transition-all hover:border-gray-700/80 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(v => !v)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="flex items-start gap-2.5 rounded-xl border border-red-900/30 bg-red-950/20 px-3.5 py-3">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                                        <p className="text-xs text-red-400 leading-normal">{error}</p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25 transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
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
                                    <div className="flex-1 h-px bg-gray-800/80" />
                                    <span className="text-xs text-gray-600 font-medium">or continue with</span>
                                    <div className="flex-1 h-px bg-gray-800/80" />
                                </div>

                                {/* OAuth Buttons */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { window.location.href = `${BACKEND_URL}/api/auth/google`; }}
                                        className="flex items-center justify-center gap-2 rounded-xl border border-gray-800 bg-gray-900/50 hover:bg-gray-800/50 hover:border-gray-700 text-gray-300 hover:text-white py-2.5 text-xs font-semibold transition-all duration-200"
                                    >
                                        <GoogleIcon />
                                        Google
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { window.location.href = `${BACKEND_URL}/api/auth/github`; }}
                                        className="flex items-center justify-center gap-2 rounded-xl border border-gray-800 bg-gray-900/50 hover:bg-gray-800/50 hover:border-gray-700 text-gray-300 hover:text-white py-2.5 text-xs font-semibold transition-all duration-200"
                                    >
                                        <GitHubIcon />
                                        GitHub
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-base font-bold text-gray-200 text-center mb-1">Forgot Password</h3>
                            <p className="text-xs text-gray-400 text-center leading-relaxed mb-4">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>

                            {successMessage ? (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="flex items-start gap-2.5 rounded-xl border border-emerald-900/30 bg-emerald-950/20 px-3.5 py-3">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                                        <p className="text-xs text-green-400 leading-normal text-left">{successMessage}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => switchMode('login')}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-800 bg-gray-900/50 hover:bg-gray-800/50 text-gray-300 hover:text-white py-2.5 text-xs font-semibold transition-all duration-200"
                                    >
                                        Back to Sign In
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleForgotSubmit} className="space-y-4">
                                    {/* Email */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="you@example.com"
                                                required
                                                className="w-full rounded-xl border border-gray-800 bg-gray-950/60 py-2.5 pl-11 pr-4 text-sm text-gray-100 placeholder-gray-600 transition-all hover:border-gray-700/80 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                                            />
                                        </div>
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <div className="flex items-start gap-2.5 rounded-xl border border-red-900/30 bg-red-950/20 px-3.5 py-3">
                                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                                            <p className="text-xs text-red-400 leading-normal">{error}</p>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isPending}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25 transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                Send Reset Link
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => switchMode('login')}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-800 bg-gray-900/50 hover:bg-gray-800/50 text-gray-300 hover:text-white py-2.5 text-xs font-semibold transition-all duration-200"
                                    >
                                        Back to Sign In
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>

                <p className="mt-6 text-center text-xs text-gray-600 font-medium leading-relaxed">
                    By continuing, you agree to our terms of service and privacy policy.
                </p>
            </div>
        </div>
    );
}
