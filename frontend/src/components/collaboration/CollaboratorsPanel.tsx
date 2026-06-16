import { useState } from 'react';
import { X, UserPlus, Trash2 } from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useCollaborationStore } from '@/store/useCollaborationStore';
import { useAuthStore } from '@/store/useAuthStore';
import InviteDialog from './InviteDialog';
import MemberManagement from './MemberManagement';

interface CollaboratorsPanelProps {
    onClose: () => void;
}

export default function CollaboratorsPanel({ onClose }: CollaboratorsPanelProps) {
    const { currentWorkspace } = useWorkspaceStore();
    const { activeUsers } = useCollaborationStore();
    const { user: currentUser } = useAuthStore();
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [showMemberManagement, setShowMemberManagement] = useState(false);

    if (!currentWorkspace) return null;

    // Convert Map to array
    const users = Array.from(activeUsers.values());

    // Check if current user is owner or admin
    const isOwner = currentWorkspace.owner._id === currentUser?._id;
    const currentMember = currentWorkspace.members.find(m => m.user._id === currentUser?._id);
    const isAdmin = currentMember?.role === 'admin';
    const canManage = isOwner || isAdmin;

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // const getRoleIcon = (role: string) => {
    //     switch (role) {
    //         case 'admin':
    //             return <Crown className="h-3.5 w-3.5 text-yellow-500" />;
    //         case 'editor':
    //             return <Edit className="h-3.5 w-3.5 text-blue-500" />;
    //         case 'viewer':
    //             return <Eye className="h-3.5 w-3.5 text-gray-500" />;
    //         default:
    //             return null;
    //     }
    // };

    const getRoleLabel = (role: string) => {
        return role.charAt(0).toUpperCase() + role.slice(1);
    };

    // Get all workspace members (including offline ones)
    const allMembers = [
        {
            userId: currentWorkspace.owner._id,
            userName: currentWorkspace.owner.name,
            userEmail: currentWorkspace.owner.email,
            avatar: currentWorkspace.owner.avatar,
            role: 'owner',
            isOnline: users.some(u => u.userId === currentWorkspace.owner._id),
        },
        ...currentWorkspace.members.map(m => ({
            userId: m.user._id,
            userName: m.user.name,
            userEmail: m.user.email,
            avatar: m.user.avatar,
            role: m.role,
            isOnline: users.some(u => u.userId === m.user._id),
        })),
    ];

    return (
        <>
            <div className="fixed inset-y-0 right-0 w-80 bg-gray-900/95 backdrop-blur-md border-l border-gray-800 shadow-2xl z-40 flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
                    <div>
                        <h2 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50 animate-pulse"></span>
                            Workspace Members
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            {users.length} active online · {allMembers.length} total members
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-300 transition-colors p-1.5 hover:bg-gray-800 rounded-lg"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Invite button */}
                {canManage && (
                    <div className="px-5 py-4 border-b border-gray-800 shrink-0 bg-gray-950/20">
                        <button
                            onClick={() => setShowInviteDialog(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] transition-all duration-200"
                        >
                            <UserPlus className="h-4 w-4" />
                            Invite Collaborator
                        </button>
                    </div>
                )}

                {/* Members list */}
                <div className="flex-1 overflow-auto px-4 py-4 space-y-3">
                    {allMembers.map((member) => {
                        const onlineUser = users.find(u => u.userId === member.userId);
                        const isTyping = onlineUser?.isTyping;
                        const typingField = onlineUser?.typingField;

                        return (
                            <div
                                key={member.userId}
                                className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200"
                            >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div
                                        className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner"
                                        style={{
                                            backgroundColor: onlineUser?.color || '#4b5563',
                                        }}
                                    >
                                        {member.avatar ? (
                                            <img
                                                src={member.avatar}
                                                alt={member.userName}
                                                className="h-full w-full rounded-full object-cover"
                                            />
                                        ) : (
                                            getInitials(member.userName)
                                        )}
                                    </div>

                                    {/* Online status ring indicator */}
                                    <div
                                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-gray-900 ${
                                            member.isOnline 
                                                ? 'bg-green-500 shadow-md shadow-green-500/50' 
                                                : 'bg-gray-600'
                                        }`}
                                    />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs font-semibold text-gray-200 truncate">
                                            {member.userName}
                                            {member.userId === currentUser?._id && (
                                                <span className="text-[10px] text-gray-500 font-normal ml-1">(You)</span>
                                            )}
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{member.userEmail}</p>
                                    
                                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${
                                            member.role === 'owner'
                                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                : member.role === 'admin'
                                                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                    : member.role === 'editor'
                                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                        : 'bg-gray-800 text-gray-400 border-gray-700'
                                        }`}>
                                            {member.role === 'owner' ? 'Owner' : getRoleLabel(member.role)}
                                        </span>
                                        {isTyping && typingField && (
                                            <span className="text-[9px] text-orange-400 animate-pulse flex items-center gap-1 font-semibold">
                                                <span className="h-1 w-1 rounded-full bg-orange-400 animate-ping" />
                                                Typing in {typingField}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Manage members button */}
                {canManage && (
                    <div className="px-5 py-4 border-t border-gray-800 shrink-0 bg-gray-950/20">
                        <button
                            onClick={() => setShowMemberManagement(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 hover:bg-gray-800 hover:border-gray-700 text-gray-300 hover:text-white text-sm font-semibold rounded-lg active:scale-[0.98] transition-all duration-200"
                        >
                            <Trash2 className="h-4 w-4" />
                            Manage Permissions
                        </button>
                    </div>
                )}
            </div>

            {/* Overlay */}
            <div className="fixed inset-0 bg-black/30 z-30" onClick={onClose} />

            {/* Modals */}
            {showInviteDialog && (
                <InviteDialog
                    workspaceId={currentWorkspace._id}
                    workspaceName={currentWorkspace.name}
                    onClose={() => setShowInviteDialog(false)}
                />
            )}

            {showMemberManagement && (
                <MemberManagement
                    workspace={currentWorkspace}
                    onClose={() => setShowMemberManagement(false)}
                />
            )}
        </>
    );
}
