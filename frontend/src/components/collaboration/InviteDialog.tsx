import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Mail, Shield, MessageSquare } from 'lucide-react';
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
    const queryClient = useQueryClient();

    const sendInvitationMutation = useMutation({
        mutationFn: () => collaborationApi.sendInvitation(workspaceId, { email, role, message }),
        onSuccess: () => {
            toast.success(`Invitation sent to ${email}`);
            queryClient.invalidateQueries({ queryKey: ['collaboration', 'invitations', workspaceId] });
            onClose();
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

    const roleDescriptions = {
        viewer: 'Can view requests and collections',
        editor: 'Can view and edit requests and collections',
        admin: 'Can manage workspace and its members',
    };

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
