import { create } from 'zustand';

export interface CollaboratorUser {
    userId: string;
    userName: string;
    userEmail: string;
    avatar?: string;
    color: string;
    isTyping: boolean;
    typingField?: string;
    cursor: {
        field: string;
        position: { line: number; column: number };
    } | null;
    selection: {
        start: { line: number; column: number };
        end: { line: number; column: number };
    } | null;
    lastActivity: Date;
}

export interface CollaborationSession {
    workspaceId: string;
    resourceId: string;
    resourceType: 'request' | 'collection' | 'environment' | 'workspace';
}

interface CollaborationState {
    // Connection state
    isConnected: boolean;
    connectionError: string | null;
    isConnecting: boolean;

    // Active users in current session
    activeUsers: Map<string, CollaboratorUser>;

    // Current session
    currentSession: CollaborationSession | null;

    // User's role in current workspace
    myRole: 'viewer' | 'editor' | 'admin' | null;

    // Actions
    setConnected: (connected: boolean) => void;
    setConnectionError: (error: string | null) => void;
    setConnecting: (connecting: boolean) => void;
    setActiveUsers: (users: CollaboratorUser[]) => void;
    addUser: (user: CollaboratorUser) => void;
    removeUser: (userId: string) => void;
    updateUser: (userId: string, updates: Partial<CollaboratorUser>) => void;
    setCurrentSession: (session: CollaborationSession | null) => void;
    setMyRole: (role: 'viewer' | 'editor' | 'admin' | null) => void;
    clearSession: () => void;
    reset: () => void;
}

export const useCollaborationStore = create<CollaborationState>((set) => ({
    // Initial state
    isConnected: false,
    connectionError: null,
    isConnecting: false,
    activeUsers: new Map(),
    currentSession: null,
    myRole: null,

    // Actions
    setConnected: (connected) => set({ isConnected: connected }),

    setConnectionError: (error) => set({ connectionError: error }),

    setConnecting: (connecting) => set({ isConnecting: connecting }),

    setActiveUsers: (users) => {
        const usersMap = new Map<string, CollaboratorUser>();
        users.forEach(user => usersMap.set(user.userId, user));
        set({ activeUsers: usersMap });
    },

    addUser: (user) => set((state) => {
        const newUsers = new Map(state.activeUsers);
        newUsers.set(user.userId, user);
        return { activeUsers: newUsers };
    }),

    removeUser: (userId) => set((state) => {
        const newUsers = new Map(state.activeUsers);
        newUsers.delete(userId);
        return { activeUsers: newUsers };
    }),

    updateUser: (userId, updates) => set((state) => {
        const newUsers = new Map(state.activeUsers);
        const existingUser = newUsers.get(userId);
        if (existingUser) {
            newUsers.set(userId, { ...existingUser, ...updates });
        }
        return { activeUsers: newUsers };
    }),

    setCurrentSession: (session) => set({ currentSession: session }),

    setMyRole: (role) => set({ myRole: role }),

    clearSession: () => set({
        currentSession: null,
        activeUsers: new Map(),
        myRole: null,
    }),

    reset: () => set({
        isConnected: false,
        connectionError: null,
        isConnecting: false,
        activeUsers: new Map(),
        currentSession: null,
        myRole: null,
    }),
}));
