import { useState } from 'react';
import { Users } from 'lucide-react';
import { useCollaborationStore } from '@/store/useCollaborationStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

interface CollaboratorsAvatarsProps {
    onOpenPanel?: () => void;
}

const USER_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B739', '#52C41A', '#FA8C16', '#EB2F96',
];

export default function CollaboratorsAvatars({ onOpenPanel }: CollaboratorsAvatarsProps) {
    const { currentWorkspace } = useWorkspaceStore();
    const { activeUsers, isConnected } = useCollaborationStore();
    const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);

    if (!currentWorkspace) {
        return null;
    }

    // Convert Map to array
    const users = Array.from(activeUsers.values());

    const visibleUsers = users.slice(0, 4);
    const hiddenCount = users.length - visibleUsers.length;

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="relative flex items-center">
            <button
                onClick={onOpenPanel}
                className="flex items-center gap-1.5 rounded px-2 py-1 hover:bg-gray-800 transition-colors h-7"
                title={users.length > 0 
                    ? `${users.length} collaborator${users.length > 1 ? 's' : ''} online`
                    : 'Collaborators & Members'
                }
            >
                {users.length > 0 ? (
                    <div className="flex items-center -space-x-2">
                        {visibleUsers.map((user, index) => (
                            <div
                                key={user.userId}
                                className="relative group animate-fade-in"
                                onMouseEnter={() => setHoveredUserId(user.userId)}
                                onMouseLeave={() => setHoveredUserId(null)}
                            >
                                {/* Avatar */}
                                <div
                                    className="relative h-5 w-5 rounded-full border border-gray-900 flex items-center justify-center text-[8px] font-bold text-white transition-transform group-hover:scale-110 group-hover:z-10"
                                    style={{
                                        backgroundColor: user.color || USER_COLORS[index % USER_COLORS.length],
                                    }}
                                >
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt={user.userName}
                                            className="h-full w-full rounded-full object-cover"
                                        />
                                    ) : (
                                        getInitials(user.userName)
                                    )}
                                </div>

                                {/* Online indicator */}
                                <div className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-green-500 border border-gray-900"></div>

                                {/* Tooltip */}
                                {hoveredUserId === user.userId && (
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 whitespace-nowrap shadow-lg">
                                        <div className="font-medium">{user.userName}</div>
                                        <div className="text-gray-400 text-[10px]">{user.userEmail}</div>
                                        {user.isTyping && user.typingField && (
                                            <div className="text-orange-400 text-[10px] mt-0.5">
                                                Typing in {user.typingField}...
                                            </div>
                                        )}
                                        {/* Arrow */}
                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* +N more indicator */}
                        {hiddenCount > 0 && (
                            <div className="relative h-5 w-5 rounded-full border border-gray-900 bg-gray-700 flex items-center justify-center text-[8px] font-bold text-gray-300">
                                +{hiddenCount}
                            </div>
                        )}
                    </div>
                ) : (
                    <span className="text-xs text-gray-400 font-medium">Invite</span>
                )}

                {/* Icon */}
                <Users className="h-4 w-4 text-gray-400" />
            </button>

            {/* Connection status indicator (when disconnected from signaling) */}
            {!isConnected && (
                <div 
                    className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 border border-gray-900 animate-pulse" 
                    title="Collaboration server disconnected (reconnecting...)"
                />
            )}
        </div>
    );
}

