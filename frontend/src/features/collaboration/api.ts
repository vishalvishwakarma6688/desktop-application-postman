import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface InvitationData {
    email: string;
    role: 'viewer' | 'editor' | 'admin';
    message?: string;
}

export interface Invitation {
    _id: string;
    invitedEmail: string;
    role: string;
    status: 'pending' | 'accepted' | 'expired' | 'revoked';
    expiresAt: string;
    invitedBy: {
        name: string;
        email: string;
        avatar?: string;
    };
    createdAt: string;
}

export interface InvitationDetails {
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

export interface ActiveSession {
    _id: string;
    resourceType: string;
    resourceId: string;
    activeUsers: Array<{
        userId: {
            _id: string;
            name: string;
            email: string;
            avatar?: string;
        };
        userName: string;
        userEmail: string;
        color: string;
        cursor: any;
        lastActivity: string;
    }>;
    lastActivityAt: string;
}

export interface AuditLog {
    _id: string;
    userId: {
        name: string;
        email: string;
        avatar?: string;
    };
    action: string;
    resourceType?: string;
    resourceId?: string;
    metadata: any;
    createdAt: string;
}

export const collaborationApi = {
    // Send invitation
    sendInvitation: async (workspaceId: string, data: InvitationData) => {
        const response = await api.post(`/collaboration/workspaces/${workspaceId}/invitations`, data);
        return response.data;
    },

    // Get workspace invitations
    getWorkspaceInvitations: async (workspaceId: string) => {
        const response = await api.get<{ invitations: Invitation[] }>(`/collaboration/workspaces/${workspaceId}/invitations`);
        return response.data;
    },

    // Accept invitation
    acceptInvitation: async (token: string) => {
        const response = await api.post(`/collaboration/invitations/${token}/accept`);
        return response.data;
    },

    // Get invitation details (public - no auth needed for viewing)
    getInvitationDetails: async (token: string) => {
        const response = await api.get<InvitationDetails>(`/collaboration/invitations/${token}`);
        return response.data;
    },

    // Revoke invitation
    revokeInvitation: async (invitationId: string) => {
        const response = await api.delete(`/collaboration/invitations/${invitationId}`);
        return response.data;
    },

    // Remove member
    removeMember: async (workspaceId: string, memberId: string) => {
        const response = await api.delete(`/collaboration/workspaces/${workspaceId}/members/${memberId}`);
        return response.data;
    },

    // Update member role
    updateMemberRole: async (workspaceId: string, memberId: string, role: 'viewer' | 'editor' | 'admin') => {
        const response = await api.patch(`/collaboration/workspaces/${workspaceId}/members/${memberId}/role`, { role });
        return response.data;
    },

    // Get active sessions
    getActiveSessions: async (workspaceId: string) => {
        const response = await api.get<{ sessions: ActiveSession[] }>(`/collaboration/workspaces/${workspaceId}/sessions`);
        return response.data;
    },

    // Get audit logs
    getAuditLogs: async (workspaceId: string, limit = 50, skip = 0) => {
        const response = await api.get<{ logs: AuditLog[]; pagination: { total: number; limit: number; skip: number } }>(
            `/collaboration/workspaces/${workspaceId}/audit`,
            { params: { limit, skip } }
        );
        return response.data;
    },
};
