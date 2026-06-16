import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Users, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { collaborationApi, InvitationDetails } from '@/features/collaboration/api';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

interface InviteAcceptPageProps {
    token: string;
}

export default function InviteAcceptPage({ token }: InviteAcceptPageProps) {
    const { isAuthenticated } = useAuthStore();
    const [accepting, setAccepting] = useState(false);

    // Fetch invitation details
    const { data: details, isLoading, error } = useQuery<InvitationDetails>({
        queryKey: ['invitation-details', token],
        queryFn: () => collaborationApi.getInvitationDetails(token),
        retry: false,
    });

    const navigateToHome = () => {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    const handleAccept = async () => {
        setAccepting(true);
        try {
            const res = await collaborationApi.acceptInvitation(token);
            toast.success(`Successfully joined workspace: ${res.workspace?.name || 'Shared Workspace'}`);
            navigateToHome();
        } catch (err: any) {
            const errMsg = err.response?.data?.message || 'Failed to accept invitation';
            toast.error(errMsg);
        } finally {
            setAccepting(false);
        }
    };

    const handleSignInRedirect = () => {
        localStorage.setItem('pending_invite_token', token);
        navigateToHome();
    };

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-950">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
                    <p className="text-sm text-gray-400">Verifying invitation...</p>
                </div>
            </div>
        );
    }

    if (error || !details || !details.isValid) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-950 p-4">
                <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center shadow-2xl">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-20 w-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/5">
                        <AlertCircle className="h-10 w-10" />
                    </div>
                    <div className="mt-8 space-y-4">
                        <h2 className="text-xl font-bold text-white">Invalid Invitation</h2>
                        <p className="text-sm text-gray-400">
                            {(!details || details.status === 'expired') 
                                ? 'This invitation has expired. Please ask the sender to invite you again.'
                                : (details?.status === 'revoked')
                                ? 'This invitation was revoked by the workspace administrator.'
                                : 'This invitation link is invalid or has already been accepted.'
                            }
                        </p>
                        <button
                            onClick={navigateToHome}
                            className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition-colors mt-2"
                        >
                            Go to App
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-950 p-4">
            {/* Background glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-orange-500/5 blur-3xl" />
                <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-orange-500/5 blur-3xl" />
            </div>

            <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                {/* Header Graphic */}
                <div className="h-28 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-b border-gray-800/80 flex items-center justify-center">
                    <div className="h-14 w-14 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner">
                        <Users className="h-7 w-7" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    <div className="text-center">
                        <h2 className="text-lg font-bold text-white">Workspace Invitation</h2>
                        <p className="text-xs text-gray-500 mt-1">Join your team and collaborate on APIs</p>
                    </div>

                    {/* Invitation Card Info */}
                    <div className="bg-gray-950/40 border border-gray-800/80 rounded-xl p-4 space-y-3.5">
                        <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                                {details.invitedBy.name[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-gray-500">Invited By</p>
                                <p className="text-sm font-semibold text-gray-200 truncate">{details.invitedBy.name}</p>
                                <p className="text-[10px] text-gray-500 truncate">{details.invitedBy.email}</p>
                            </div>
                        </div>

                        <div className="h-px bg-gray-800/60" />

                        <div>
                            <p className="text-xs text-gray-500">Workspace to Join</p>
                            <p className="text-base font-bold text-orange-400 mt-0.5">{details.workspace.name}</p>
                        </div>

                        <div className="h-px bg-gray-800/60" />

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500">Offered Role</p>
                                <p className="text-sm font-semibold text-gray-200 capitalize mt-0.5 flex items-center gap-1.5">
                                    <Shield className="h-3.5 w-3.5 text-orange-500" />
                                    {details.role}
                                </p>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-bold uppercase tracking-wider animate-pulse-slow">
                                Active
                            </span>
                        </div>

                        {details.message && (
                            <>
                                <div className="h-px bg-gray-800/60" />
                                <div>
                                    <p className="text-xs text-gray-500">Personal Message</p>
                                    <p className="text-xs text-gray-400 italic bg-gray-900/50 p-2.5 rounded-lg border border-gray-800/30 mt-1 leading-relaxed">
                                        "{details.message}"
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-2">
                        {isAuthenticated ? (
                            <>
                                <button
                                    onClick={handleAccept}
                                    disabled={accepting}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/10 transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {accepting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Joining...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4" />
                                            Accept Invitation
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={navigateToHome}
                                    disabled={accepting}
                                    className="w-full py-2.5 bg-gray-800/60 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl text-sm font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleSignInRedirect}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/10 transition-all active:scale-[0.98]"
                                >
                                    Sign In to Accept
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                                <p className="text-[10px] text-gray-500 text-center leading-relaxed mt-2">
                                    You will be redirected back here automatically to join the workspace once you sign in.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
