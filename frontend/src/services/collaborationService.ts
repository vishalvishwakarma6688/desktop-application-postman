import { io, Socket } from 'socket.io-client';
import { useCollaborationStore, CollaboratorUser, CollaborationSession } from '@/store/useCollaborationStore';
import { Operation } from './otClient';
import { useNotificationStore } from '@/store/useNotificationStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

class CollaborationService {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    /**
     * Connect to WebSocket server
     */
    connect(token: string): void {
        if (this.socket?.connected) {
            console.log('Already connected to collaboration server');
            return;
        }

        const store = useCollaborationStore.getState();
        store.setConnecting(true);
        store.setConnectionError(null);

        this.socket = io(BACKEND_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: this.maxReconnectAttempts,
        });

        this.setupEventHandlers();
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        const store = useCollaborationStore.getState();
        store.reset();
    }

    /**
     * Setup Socket.IO event handlers
     */
    private setupEventHandlers(): void {
        if (!this.socket) return;

        const store = useCollaborationStore.getState();

        // Connection events
        this.socket.on('connect', () => {
            console.log('✅ Connected to collaboration server');
            store.setConnected(true);
            store.setConnecting(false);
            store.setConnectionError(null);
            this.reconnectAttempts = 0;

            // Rejoin current session if exists
            const session = store.currentSession;
            if (session) {
                this.joinResource(session);
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from collaboration server:', reason);
            store.setConnected(false);

            if (reason === 'io server disconnect') {
                // Server disconnected us, don't attempt reconnect
                store.setConnectionError('Server disconnected');
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            store.setConnecting(false);
            store.setConnectionError(error.message);
            this.reconnectAttempts++;

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                store.setConnectionError('Failed to connect after multiple attempts');
            }
        });

        // Workspace events
        this.socket.on('workspace-joined', (data: { workspaceId: string; activeUsers: CollaboratorUser[] }) => {
            console.log('📂 Joined workspace:', data.workspaceId);
            store.setActiveUsers(data.activeUsers);
        });

        this.socket.on('user-joined-workspace', (data: CollaboratorUser) => {
            console.log('👤 User joined workspace:', data.userName);
            store.addUser(data);
            useNotificationStore.getState().addNotification({
                title: 'Collaborator Joined',
                message: `${data.userName} has joined the workspace.`,
                type: 'info'
            });
        });

        this.socket.on('user-left-workspace', (data: { userId: string }) => {
            console.log('👋 User left workspace:', data.userId);
            const user = store.activeUsers.get(data.userId);
            const userName = user ? user.userName : 'A collaborator';
            store.removeUser(data.userId);
            useNotificationStore.getState().addNotification({
                title: 'Collaborator Left',
                message: `${userName} has left the workspace.`,
                type: 'info'
            });
        });

        // Resource events
        this.socket.on('resource-joined', (data: {
            resourceId: string;
            resourceType: string;
            role: 'viewer' | 'editor' | 'admin';
            activeUsers: CollaboratorUser[]
        }) => {
            console.log('📝 Joined resource:', data.resourceType, data.resourceId);
            store.setMyRole(data.role);
            store.setActiveUsers(data.activeUsers);
        });

        this.socket.on('user-joined-resource', (data: CollaboratorUser & { resourceId: string }) => {
            console.log('👤 User joined resource:', data.userName);
            store.addUser(data);
        });

        this.socket.on('user-left-resource', (data: { userId: string; resourceId: string }) => {
            console.log('👋 User left resource:', data.userId);
            store.removeUser(data.userId);
        });

        // Operation events (editing)
        this.socket.on('operation', (data: {
            userId: string;
            userName: string;
            resourceId: string;
            operation: Operation;
            revision: number;
            timestamp: number;
        }) => {
            // Operation will be handled by the specific component
            window.dispatchEvent(new CustomEvent('collab:operation', { detail: data }));
        });

        // Cursor events
        this.socket.on('cursor-move', (data: {
            userId: string;
            resourceId: string;
            field: string;
            position: { line: number; column: number };
        }) => {
            store.updateUser(data.userId, {
                cursor: {
                    field: data.field,
                    position: data.position
                }
            });
        });

        // Selection events
        this.socket.on('selection-change', (data: {
            userId: string;
            resourceId: string;
            field: string;
            selection: { start: { line: number; column: number }; end: { line: number; column: number } };
        }) => {
            store.updateUser(data.userId, {
                selection: data.selection
            });
        });

        // Typing indicator
        this.socket.on('typing', (data: {
            userId: string;
            userName: string;
            resourceId: string;
            field: string;
            isTyping: boolean;
        }) => {
            store.updateUser(data.userId, {
                isTyping: data.isTyping,
                typingField: data.isTyping ? data.field : undefined
            });

            // Auto-clear typing indicator after 3 seconds
            if (data.isTyping) {
                setTimeout(() => {
                    store.updateUser(data.userId, { isTyping: false, typingField: undefined });
                }, 3000);
            }
        });

        // Error events
        this.socket.on('error', (data: { message: string }) => {
            console.error('Collaboration error:', data.message);
            store.setConnectionError(data.message);
        });
    }

    /**
     * Join a workspace
     */
    joinWorkspace(workspaceId: string): void {
        if (!this.socket?.connected) {
            console.warn('Not connected to collaboration server');
            return;
        }

        this.socket.emit('join-workspace', { workspaceId });
    }

    /**
     * Join a resource (request, collection, etc.)
     */
    joinResource(session: CollaborationSession): void {
        if (!this.socket?.connected) {
            console.warn('Not connected to collaboration server');
            return;
        }

        const store = useCollaborationStore.getState();
        store.setCurrentSession(session);

        this.socket.emit('join-resource', {
            workspaceId: session.workspaceId,
            resourceType: session.resourceType,
            resourceId: session.resourceId
        });
    }

    /**
     * Leave current resource
     */
    leaveResource(): void {
        if (!this.socket?.connected) return;

        const store = useCollaborationStore.getState();
        const session = store.currentSession;

        if (session) {
            this.socket.emit('leave-resource', { resourceId: session.resourceId });
            store.clearSession();
        }
    }

    /**
     * Send an operation (edit)
     */
    sendOperation(operation: Operation, revision: number): void {
        if (!this.socket?.connected) return;

        const store = useCollaborationStore.getState();
        const session = store.currentSession;

        if (!session) {
            console.warn('No active session');
            return;
        }

        if (store.myRole === 'viewer') {
            console.warn('Viewers cannot edit');
            return;
        }

        this.socket.emit('operation', {
            resourceId: session.resourceId,
            operation,
            revision
        });
    }

    /**
     * Send cursor position (throttled on client side)
     */
    sendCursorMove(field: string, position: { line: number; column: number }): void {
        if (!this.socket?.connected) return;

        const store = useCollaborationStore.getState();
        const session = store.currentSession;

        if (!session) return;

        this.socket.emit('cursor-move', {
            resourceId: session.resourceId,
            field,
            position
        });
    }

    /**
     * Send selection change
     */
    sendSelectionChange(
        field: string,
        selection: { start: { line: number; column: number }; end: { line: number; column: number } } | null
    ): void {
        if (!this.socket?.connected) return;

        const store = useCollaborationStore.getState();
        const session = store.currentSession;

        if (!session) return;

        this.socket.emit('selection-change', {
            resourceId: session.resourceId,
            field,
            selection
        });
    }

    /**
     * Send typing indicator
     */
    sendTyping(field: string, isTyping: boolean): void {
        if (!this.socket?.connected) return;

        const store = useCollaborationStore.getState();
        const session = store.currentSession;

        if (!session) return;

        this.socket.emit('typing', {
            resourceId: session.resourceId,
            field,
            isTyping
        });
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    /**
     * Get socket instance (for advanced use cases)
     */
    getSocket(): Socket | null {
        return this.socket;
    }
}

// Export singleton instance
export const collaborationService = new CollaborationService();
