import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useCollaborationStore, CollaborationSession } from '@/store/useCollaborationStore';
import { collaborationService } from '@/services/collaborationService';

/**
 * Main hook for managing collaboration
 * Handles connection, workspace joining, and lifecycle
 */
export function useCollaboration() {
    const { token, isAuthenticated } = useAuthStore();
    const { currentWorkspace } = useWorkspaceStore();
    const { isConnected, isConnecting, connectionError, currentSession } = useCollaborationStore();
    const hasInitialized = useRef(false);

    // Connect to collaboration server when authenticated
    useEffect(() => {
        if (isAuthenticated && token && !hasInitialized.current) {
            hasInitialized.current = true;
            collaborationService.connect(token);
        }

        return () => {
            if (hasInitialized.current) {
                collaborationService.disconnect();
                hasInitialized.current = false;
            }
        };
    }, [isAuthenticated, token]);

    // Join workspace when it changes
    useEffect(() => {
        if (isConnected && currentWorkspace) {
            collaborationService.joinWorkspace(currentWorkspace._id);
        }
    }, [isConnected, currentWorkspace]);

    return {
        isConnected,
        isConnecting,
        connectionError,
        currentSession,
        joinResource: (session: CollaborationSession) => collaborationService.joinResource(session),
        leaveResource: () => collaborationService.leaveResource(),
    };
}
