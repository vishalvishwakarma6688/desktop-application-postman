import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Mail, Shield, MessageSquare, CheckCircle, Check, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { collaborationApi } from '@/features/collaboration/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InviteDialogProps {
    workspaceId: string;
    workspaceName: string;
    onClose: () => void;
}

export default function InviteDialog({ workspaceId, workspaceName, onClose }: InviteDialogProps) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'viewer' | 'editor' | 'admin'>('editor');
    const [message, setMessage] = useState('');
    const [emailError, setEmailError] = useState('');
    const [copied, setCopied] = useState(false);
    const [successData, setSuccessData] = useState<{
        emailSent: boolean;
        invitationUrl: string;
        message: string;
    } | null>(null);
    const queryClient = useQueryClient();

    const sendInvitationMutation = useMutation({
        mutationFn: () => collaborationApi.sendInvitation(workspaceId, { email, role, message }),
        onSuccess: (data: any) => {
            setSuccessData({
                emailSent: data.emailSent !== false,
                invitationUrl: data.invitationUrl || '',
                message: data.message || 'Invitation created successfully'
            });
            queryClient.invalidateQueries({ queryKey: ['collaboration', 'invitations', workspaceId] });
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || 'Failed to send invitation';
            toast.error(errorMessage);
            setEmailError(errorMessage);
        },
    });

    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleSend = () => {
        setEmailError('');

        if (!email.trim()) {
            setEmailError('Email is required');
            return;
        }

        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address');
            return;
        }

        sendInvitationMutation.mutate();
    };

    const handleCopyLink = () => {
        if (!successData?.invitationUrl) return;
        navigator.clipboard.writeText(successData.invitationUrl).then(() => {
            setCopied(true);
            toast.success('Invitation link copied');
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const roleDescriptions = {
        viewer: 'Can view requests and collections',
        editor: 'Can view and edit requests and collections',
        admin: 'Can manage workspace and its members',
    };

    if (successData) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900/95 border border-gray-800/80 rounded-2xl w-full max-w-md shadow-2xl p-8 flex flex-col items-center text-center backdrop-blur-md transform transition-all duration-300 scale-100">
                    
                    {successData.emailSent ? (
                        <>
                            {/* Checkmark Animation Container */}
                            <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 animate-pulse">
                                <CheckCircle className="h-8 w-8 stroke-[2.5]" />
                            </div>

                            <h3 className="text-xl font-bold text-gray-100 mb-2">Invitation Sent!</h3>
                            <p className="text-sm text-gray-400 leading-relaxed mb-6">
                                We have sent an email invite to <span className="text-orange-400 font-semibold">{email}</span> as an <span className="font-semibold text-gray-300 capitalize">{role}</span>.
                            </p>

                            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gray-800 to-transparent mb-6" />

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => {
                                        setSuccessData(null);
                                        setEmail('');
                                        setMessage('');
                                    }}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white border border-gray-800 hover:border-gray-700 bg-gray-900/50 hover:bg-gray-800/50 rounded-xl transition-all duration-200"
                                >
                                    Invite Another
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/20 active:scale-[0.98]"
                                >
                                    Done
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Error Warning Container */}
                            <div className="h-16 w-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mb-5">
                                <Mail className="h-8 w-8 stroke-[2]" />
                            </div>

                            <h3 className="text-xl font-bold text-gray-100 mb-2">Invitation Created</h3>
                            <p className="text-sm text-gray-400 leading-relaxed mb-4">
                                The invitation for <span className="text-orange-400 font-semibold">{email}</span> was created, but we couldn't send the email automatically.
                            </p>

                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-300 w-full text-left mb-6 leading-relaxed">
                                <span className="font-bold mr-1">⚠️ Note:</span> Please share the invitation link below with your collaborator manually.
                            </div>

                            <div className="w-full mb-6">
                                <label className="block text-xs font-semibold text-gray-500 uppercase text-left mb-2 tracking-wider">Invitation Link</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={successData.invitationUrl}
                                        className="flex-1 rounded-xl border border-gray-850 bg-gray-950 px-3.5 py-2.5 text-xs text-gray-300 font-mono focus:outline-none focus:border-gray-700"
                                    />
                                    <button
                                        onClick={handleCopyLink}
                                        className="rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-semibold text-white transition-all duration-200 flex items-center gap-1.5 shrink-0 active:scale-[0.98]"
                                    >
                                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gray-800 to-transparent mb-6" />

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => {
                                        setSuccessData(null);
                                        setEmail('');
                                        setMessage('');
                                    }}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white border border-gray-800 hover:border-gray-700 bg-gray-900/50 hover:bg-gray-800/50 rounded-xl transition-all duration-200"
                                >
                                    Invite Another
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/20 active:scale-[0.98]"
                                >
                                    Done
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-100">Invite Collaborator</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Share "{workspaceName}" with others</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-200 transition-colors p-1"
                        disabled={sendInvitationMutation.isPending}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-4">
                    {/* Email input */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setEmailError('');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && !sendInvitationMutation.isPending && handleSend()}
                            placeholder="colleague@example.com"
                            className={`w-full rounded border ${emailError ? 'border-red-500' : 'border-gray-600'
                                } bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30`}
                            disabled={sendInvitationMutation.isPending}
                            autoFocus
                        />
                        {emailError && (
                            <p className="mt-1 text-xs text-red-400">{emailError}</p>
                        )}
                    </div>

                    {/* Role selector */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                            <Shield className="h-4 w-4 text-gray-400" />
                            Role
                        </label>
                        <Select value={role} onValueChange={(v) => setRole(v as 'viewer' | 'editor' | 'admin')}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="viewer">
                                    <div>
                                        <div className="font-medium">Viewer</div>
                                        <div className="text-xs text-gray-400">Can view but not edit</div>
                                    </div>
                                </SelectItem>
                                <SelectItem value="editor">
                                    <div>
                                        <div className="font-medium">Editor</div>
                                        <div className="text-xs text-gray-400">Can view and edit</div>
                                    </div>
                                </SelectItem>
                                <SelectItem value="admin">
                                    <div>
                                        <div className="font-medium">Admin</div>
                                        <div className="text-xs text-gray-400">Can manage workspace</div>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="mt-1.5 text-xs text-gray-400">
                            {roleDescriptions[role]}
                        </p>
                    </div>

                    {/* Message (optional) */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                            <MessageSquare className="h-4 w-4 text-gray-400" />
                            Personal Message <span className="text-gray-500 font-normal">(optional)</span>
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Join me on this project!"
                            rows={3}
                            maxLength={500}
                            className="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 resize-none"
                            disabled={sendInvitationMutation.isPending}
                        />
                        <p className="mt-1 text-xs text-gray-500 text-right">
                            {message.length}/500
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                        disabled={sendInvitationMutation.isPending}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sendInvitationMutation.isPending || !email.trim()}
                        className="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {sendInvitationMutation.isPending ? (
                            <>
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Sending...
                            </>
                        ) : (
                            <>
                                <Mail className="h-4 w-4" />
                                Send Invitation
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Click outside to close */}
            <div className="fixed inset-0 -z-10" onClick={onClose} />
        </div>
    );
}
