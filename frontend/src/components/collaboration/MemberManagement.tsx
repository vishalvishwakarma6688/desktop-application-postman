import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Trash2, Mail, Clock, CheckCircle, XCircle, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { collaborationApi, Invitation } from '@/features/collaboration/api';
import { Workspace } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MemberManagementProps {
    workspace: Workspace;
    onClose: () => void;
}

export default function MemberManagement({ workspace, onClose }: MemberManagementProps) {
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');

    const isOwner = workspace.owner._id === currentUser?._id;

    // Fetch invitations
    const { data: invitationsData, isLoading: loadingInvitations } = useQuery({
        queryKey: ['collaboration', 'invitations', workspace._id],
        queryFn: () => collaborationApi.getWorkspaceInvitations(workspace._id),
    });

    // Remove member mutation
    const removeMemberMutation = useMutation({
        mutationFn: (memberId: string) => collaborationApi.removeMember(workspace._id, memberId),
        onSuccess: () => {
            toast.success('Member removed');
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to remove member');
        },
    });

    // Update role mutation
    const updateRoleMutation = useMutation({
        mutationFn: ({ memberId, role }: { memberId: string; role: 'viewer' | 'editor' | 'admin' }) =>
            collaborationApi.updateMemberRole(workspace._id, memberId, role),
        onSuccess: () => {
            toast.success('Role updated');
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to update role');
        },
    });

    // Revoke invitation mutation
    const revokeInvitationMutation = useMutation({
        mutationFn: (invitationId: string) => collaborationApi.revokeInvitation(invitationId),
        onSuccess: () => {
            toast.success('Invitation revoked');
            queryClient.invalidateQueries({ queryKey: ['collaboration', 'invitations', workspace._id] });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to revoke invitation');
        },
    });

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                        <Clock className="h-3 w-3" /> Pending
                    </span>
                );
            case 'accepted':
                return (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                        <CheckCircle className="h-3 w-3" /> Accepted
                    </span>
                );
            case 'expired':
                return (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">
                        <XCircle className="h-3 w-3" /> Expired
                    </span>
                );
            case 'revoked':
                return (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                        <Ban className="h-3 w-3" /> Revoked
                    </span>
                );
            default:
                return null;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-3xl max-h-[80vh] shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-100">Manage Workspace</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{workspace.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-200 transition-colors p-1"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700 shrink-0">
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`px-5 py-3 text-sm font-medium transition-colors relative ${activeTab === 'members'
                            ? 'text-orange-400'
                            : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        Members ({workspace.members.length + 1})
                        {activeTab === 'members' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('invitations')}
                        className={`px-5 py-3 text-sm font-medium transition-colors relative ${activeTab === 'invitations'
                            ? 'text-orange-400'
                            : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        Invitations ({invitationsData?.invitations?.length || 0})
                        {activeTab === 'invitations' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-5">
                    {activeTab === 'members' ? (
                        <div className="space-y-3">
                            {/* Owner */}
                            <div className="flex items-center gap-3 p-3 rounded bg-gray-700/30 border border-gray-700">
                                <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center text-sm font-bold text-white">
                                    {workspace.owner.avatar ? (
                                        <img
                                            src={workspace.owner.avatar}
                                            alt={workspace.owner.name}
                                            className="h-full w-full rounded-full object-cover"
                                        />
                                    ) : (
                                        getInitials(workspace.owner.name)
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-200 truncate">
                                        {workspace.owner.name}
                                        {workspace.owner._id === currentUser?._id && (
                                            <span className="text-xs text-gray-500 ml-1">(You)</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">{workspace.owner.email}</p>
                                </div>
                                <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 font-medium shrink-0">
                                    Owner
                                </span>
                            </div>

                            {/* Members */}
                            {workspace.members.map((member) => (
                                <div
                                    key={member.user._id}
                                    className="flex items-center gap-3 p-3 rounded hover:bg-gray-700/30 border border-transparent hover:border-gray-700 transition-colors"
                                >
                                    <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center text-sm font-bold text-white">
                                        {member.user.avatar ? (
                                            <img
                                                src={member.user.avatar}
                                                alt={member.user.name}
                                                className="h-full w-full rounded-full object-cover"
                                            />
                                        ) : (
                                            getInitials(member.user.name)
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-200 truncate">
                                            {member.user.name}
                                            {member.user._id === currentUser?._id && (
                                                <span className="text-xs text-gray-500 ml-1">(You)</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate">{member.user.email}</p>
                                    </div>

                                    {/* Role selector (owner only) */}
                                    {isOwner && member.user._id !== currentUser?._id ? (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Select
                                                value={member.role}
                                                onValueChange={(role) =>
                                                    updateRoleMutation.mutate({
                                                        memberId: member.user._id,
                                                        role: role as 'viewer' | 'editor' | 'admin',
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="w-28 h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="viewer">Viewer</SelectItem>
                                                    <SelectItem value="editor">Editor</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <button
                                                onClick={() => removeMemberMutation.mutate(member.user._id)}
                                                disabled={removeMemberMutation.isPending}
                                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                                                title="Remove member"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className={`text-xs px-2 py-1 rounded shrink-0 ${member.role === 'admin'
                                            ? 'bg-purple-500/20 text-purple-400'
                                            : member.role === 'editor'
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : 'bg-gray-700 text-gray-400'
                                            }`}>
                                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {loadingInvitations ? (
                                <div className="text-center py-8 text-sm text-gray-400">Loading...</div>
                            ) : invitationsData?.invitations?.length === 0 ? (
                                <div className="text-center py-8">
                                    <Mail className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400">No invitations sent yet</p>
                                </div>
                            ) : (
                                invitationsData?.invitations.map((invitation: Invitation) => (
                                    <div
                                        key={invitation._id}
                                        className="flex items-start gap-3 p-3 rounded hover:bg-gray-700/30 border border-transparent hover:border-gray-700 transition-colors"
                                    >
                                        <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center text-white shrink-0">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-200 truncate">
                                                {invitation.invitedEmail}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {getStatusBadge(invitation.status)}
                                                <span className="text-xs text-gray-500">·</span>
                                                <span className="text-xs text-gray-500">
                                                    Sent {formatDate(invitation.createdAt)}
                                                </span>
                                                <span className="text-xs text-gray-500">·</span>
                                                <span className="text-xs text-gray-500">
                                                    Expires {formatDate(invitation.expiresAt)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Invited by {invitation.invitedBy.name} as {invitation.role}
                                            </p>
                                        </div>

                                        {invitation.status === 'pending' && (
                                            <button
                                                onClick={() => revokeInvitationMutation.mutate(invitation._id)}
                                                disabled={revokeInvitationMutation.isPending}
                                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 shrink-0"
                                                title="Revoke invitation"
                                            >
                                                <Ban className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end px-5 py-4 border-t border-gray-700 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Overlay */}
            <div className="fixed inset-0 -z-10" onClick={onClose} />
        </div>
    );
}
