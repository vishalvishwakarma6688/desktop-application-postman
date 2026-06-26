import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('Password reset token is missing. Please check your email link.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error?.message || 'Failed to reset password.');
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden select-none">
            {/* Ambient Background Lights */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-orange-500/5 blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-rose-500/5 blur-[120px] animate-pulse-slow" />
            </div>

            <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:border-gray-700/50">
                {/* Logo Section */}
                <div className="mb-8 flex flex-col items-center gap-2">
                    <img src="/datacourier.png" alt="DataCourier Logo" className="h-14 w-auto object-contain hover:scale-105 transition-transform duration-300" />
                    <h2 className="text-xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">Reset Your Password</h2>
                    <p className="text-xs text-gray-400 font-medium text-center">Set a new secure password for your DataCourier account</p>
                </div>

                {/* No Token Warning */}
                {!token && !success && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold">Missing Reset Token</p>
                            <p className="text-xs text-red-400/80 mt-1">This link appears to be invalid. Please request a new password reset from the desktop application.</p>
                        </div>
                    </div>
                )}

                {success ? (
                    <div className="text-center space-y-6 py-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-2 animate-bounce">
                            <CheckCircle className="h-8 w-8" />
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-white">Password Updated!</h3>
                            <p className="text-sm text-gray-400 px-4 leading-relaxed">
                                Your password has been successfully updated. You can now close this browser window and log in to the desktop app.
                            </p>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={() => navigate('/')}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-orange-500/25 active:scale-[0.98]"
                            >
                                Go to Home
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3 animate-shake">
                                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                <span className="text-xs font-medium leading-relaxed">{error}</span>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">New Password</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                    <Lock className="h-4 w-4" />
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    disabled={!token || loading}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-950/60 border border-gray-800 focus:border-orange-500/50 rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <button
                                    type="button"
                                    disabled={!token || loading}
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Confirm New Password</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                    <Lock className="h-4 w-4" />
                                </span>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    disabled={!token || loading}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-gray-950/60 border border-gray-800 focus:border-orange-500/50 rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <button
                                    type="button"
                                    disabled={!token || loading}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!token || loading}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-orange-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none mt-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Updating password...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>
                )}

                <div className="mt-8 pt-6 border-t border-gray-800 text-center">
                    <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
