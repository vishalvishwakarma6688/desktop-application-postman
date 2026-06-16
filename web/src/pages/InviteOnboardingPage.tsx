import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Shield, Users, ArrowRight, Loader2, AlertCircle, CheckCircle, Lock, User, Download } from 'lucide-react';

interface InvitationDetails {
    workspace: {
        name: string;
    };
    invitedBy: {
        name: string;
        email: string;
        avatar?: string;
    };
    role: string;
    status: string;
    expiresAt: string;
    isValid: boolean;
    message?: string;
}

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

export default function InviteOnboardingPage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [details, setDetails] = useState<InvitationDetails | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(true);
    const [detailsError, setDetailsError] = useState('');

    // Form states
    const [mode, setMode] = useState<'register' | 'login'>('register');
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Accept flow states
    const [onboardingStep, setOnboardingStep] = useState<'form' | 'success'>('form');

    // Fetch invitation details on load
    useEffect(() => {
        if (!token) return;

        const fetchDetails = async () => {
            console.log(`[INVITE DEBUG] Starting fetch for token: ${token} at URL: ${API_URL}/collaboration/invitations/${token}`);
            try {
                const res = await fetch(`${API_URL}/collaboration/invitations/${token}`);
                console.log(`[INVITE DEBUG] Response status: ${res.status} (${res.statusText})`);
                
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    console.error('[INVITE DEBUG] Failed to retrieve invitation. Backend error:', data);
                    throw new Error(data.message || `Invitation not found or expired (Status: ${res.status}).`);
                }
                
                const data = await res.json();
                console.log('[INVITE DEBUG] Invitation verified successfully:', data);
                setDetails(data);
            } catch (err: any) {
                console.error('[INVITE DEBUG] Fetch error occurred:', err);
                setDetailsError(err.message || 'Failed to fetch invitation details.');
            } finally {
                setLoadingDetails(false);
            }
        };

        fetchDetails();
    }, [token]);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setSubmitting(true);

        const authEndpoint = mode === 'register' ? '/auth/register' : '/auth/login';
        const authPayload = mode === 'register' 
            ? formData 
            : { email: formData.email, password: formData.password };

        console.log(`[INVITE DEBUG] Submitting form. Mode: ${mode}, Endpoint: ${authEndpoint}`);
        console.log(`[INVITE DEBUG] Auth payload email: ${authPayload.email}`);

        try {
            // Step 1: Register or Login to get JWT token
            const authRes = await fetch(`${API_URL}${authEndpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(authPayload)
            });

            console.log(`[INVITE DEBUG] Auth Response Status: ${authRes.status} (${authRes.statusText})`);
            const authData = await authRes.json();
            console.log('[INVITE DEBUG] Auth Response Data:', authData);

            if (!authRes.ok) {
                throw new Error(authData.message || authData.error?.message || 'Authentication failed.');
            }

            const jwtToken = authData.data?.token;
            if (!jwtToken) {
                throw new Error('Authentication succeeded but no token was returned.');
            }

            console.log('[INVITE DEBUG] Auth token retrieved successfully. Proceeding to accept invitation...');

            // Step 2: Accept invitation using the retrieved token
            console.log(`[INVITE DEBUG] Sending POST request to accept invitation: ${API_URL}/collaboration/invitations/${token}/accept`);
            const acceptRes = await fetch(`${API_URL}/collaboration/invitations/${token}/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                }
            });

            console.log(`[INVITE DEBUG] Accept Invitation Response Status: ${acceptRes.status} (${acceptRes.statusText})`);
            const acceptData = await acceptRes.json();
            console.log('[INVITE DEBUG] Accept Invitation Response Data:', acceptData);

            if (!acceptRes.ok) {
                throw new Error(acceptData.message || 'Failed to accept workspace invitation.');
            }

            console.log('[INVITE DEBUG] Invitation accepted successfully!');
            // Success state
            setOnboardingStep('success');
        } catch (err: any) {
            console.error('[INVITE DEBUG] Onboarding form submission failed:', err);
            setFormError(err.message || 'Onboarding failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingDetails) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-200">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
                    <p className="text-sm text-gray-400">Verifying invitation token...</p>
                </div>
            </div>
        );
    }

    if (detailsError || !details || !details.isValid) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
                <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center shadow-2xl">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-16 w-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <div className="mt-8 space-y-4">
                        <h2 className="text-xl font-bold text-white">Invalid Invitation</h2>
                        <p className="text-sm text-gray-400">
                            {detailsError || 
                             (!details || details.status === 'expired' 
                                 ? 'This invitation link has expired. Please ask the sender to send a new invite.'
                                 : 'This invitation is invalid or has already been accepted.'
                             )
                            }
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition-colors mt-2"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (onboardingStep === 'success') {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
                <div className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl space-y-6 text-center animate-fade-in">
                    <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                        <CheckCircle className="h-9 w-9" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white">Joined Workspace Successfully!</h2>
                        <p className="text-sm text-gray-400">
                            You are now a collaborator of <strong className="text-orange-400">{details.workspace.name}</strong>.
                        </p>
                    </div>

                    <div className="bg-gray-950/50 border border-gray-800/60 rounded-xl p-5 text-left space-y-3.5 max-w-md mx-auto">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Next Steps to Start</h3>
                        <div className="flex gap-3">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-xs font-bold text-orange-400 mt-0.5">1</div>
                            <p className="text-xs text-gray-300 leading-relaxed">Download the native DataCourier desktop client using the links below.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-xs font-bold text-orange-400 mt-0.5">2</div>
                            <p className="text-xs text-gray-300 leading-relaxed">Launch the application and log in using the email credentials you just registered.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-xs font-bold text-orange-400 mt-0.5">3</div>
                            <p className="text-xs text-gray-300 leading-relaxed">Select <strong className="text-orange-400">{details.workspace.name}</strong> from the header switcher to begin collaborating.</p>
                        </div>
                    </div>

                    {/* Desktop download links */}
                    <div className="space-y-4 pt-4 border-t border-gray-800">
                        <p className="text-xs text-gray-500">Choose your desktop platform installer:</p>
                        <div className="grid grid-cols-3 gap-3">
                            <a 
                                href="https://github.com/vishalvishwakarma6688/desktop-application-postman/releases" 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.08] text-gray-300 hover:text-white transition-all text-xs font-semibold"
                            >
                                <span>Windows (.exe)</span>
                            </a>
                            <a 
                                href="https://github.com/vishalvishwakarma6688/desktop-application-postman/releases" 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.08] text-gray-300 hover:text-white transition-all text-xs font-semibold"
                            >
                                <span>macOS (.dmg)</span>
                            </a>
                            <a 
                                href="https://github.com/vishalvishwakarma6688/desktop-application-postman/releases" 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.08] text-gray-300 hover:text-white transition-all text-xs font-semibold"
                            >
                                <span>Linux (.AppImage)</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-16">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-orange-500/5 blur-3xl" />
                <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-orange-500/5 blur-3xl" />
            </div>

            <div className="relative w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 animate-fade-in">
                {/* Left Column: Invitation Card details */}
                <div className="p-8 border-b md:border-b-0 md:border-r border-gray-800 bg-gray-950/40 flex flex-col justify-between space-y-8">
                    <div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 mb-6">
                            <Users className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-black text-white leading-tight">You've Been Invited to Collaborate!</h2>
                        <p className="text-sm text-gray-400 mt-2">
                            Join workspace <strong className="text-orange-400">{details.workspace.name}</strong> to build, monitor, and test requests collectively.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3 bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl">
                            <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
                                {details.invitedBy.name[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-gray-500">Invited By</p>
                                <p className="text-xs font-semibold text-gray-200 truncate">{details.invitedBy.name}</p>
                                <p className="text-[10px] text-gray-500 truncate">{details.invitedBy.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl text-xs">
                            <div>
                                <p className="text-[10px] text-gray-500">Offered Access Role</p>
                                <p className="font-semibold text-gray-200 capitalize flex items-center gap-1.5 mt-0.5">
                                    <Shield className="h-3.5 w-3.5 text-orange-500" />
                                    {details.role}
                                </p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-bold uppercase tracking-wider text-[9px]">
                                Active Invite
                            </span>
                        </div>

                        {details.message && (
                            <div className="bg-orange-500/5 border border-orange-500/10 p-3 rounded-xl">
                                <p className="text-[10px] text-orange-400 font-semibold mb-1">Personal Message:</p>
                                <p className="text-xs text-gray-400 italic">"{details.message}"</p>
                            </div>
                        )}
                    </div>

                    <div className="text-[10px] text-gray-500">
                        This invitation is secure, verified, and expires automatically on {new Date(details.expiresAt).toLocaleDateString()}.
                    </div>
                </div>

                {/* Right Column: Register/Login Onboarding form */}
                <div className="p-8 flex flex-col justify-center">
                    {/* Tab Switcher */}
                    <div className="flex bg-gray-950 p-1.5 rounded-xl border border-gray-800 mb-6 shrink-0">
                        <button
                            onClick={() => { setMode('register'); setFormError(''); }}
                            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                                mode === 'register' 
                                    ? 'bg-orange-500 text-white shadow' 
                                    : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            Create Account
                        </button>
                        <button
                            onClick={() => { setMode('login'); setFormError(''); }}
                            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                                mode === 'login' 
                                    ? 'bg-orange-500 text-white shadow' 
                                    : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            Log In
                        </button>
                    </div>

                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        {mode === 'register' && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
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
                                        className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-10 pr-4 text-sm text-gray-100 placeholder-gray-600 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
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
                                    className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-10 pr-4 text-sm text-gray-100 placeholder-gray-600 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={mode === 'register' ? 'Min. 8 characters' : 'Enter password'}
                                    required
                                    className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-10 pr-4 text-sm text-gray-100 placeholder-gray-600 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                                />
                            </div>
                        </div>

                        {formError && (
                            <div className="flex items-start gap-2 rounded-lg border border-red-900/30 bg-red-950/20 px-3 py-2">
                                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-red-400 leading-normal">{formError}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    {mode === 'register' ? 'Create Account & Accept' : 'Sign In & Accept'}
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
