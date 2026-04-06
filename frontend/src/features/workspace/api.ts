import api from '@/services/api';
import { ApiResponse, Workspace } from '@/types';

export const workspaceApi = {
    getAll: async (): Promise<ApiResponse<Workspace[]>> => {
        const response = await api.get('/workspaces');
        return response.data;
    },

    getById: async (id: string): Promise<ApiResponse<Workspace>> => {
        const response = await api.get(`/workspaces/${id}`);
        return response.data;
    },

    create: async (data: { name: string }): Promise<ApiResponse<Workspace>> => {
        const response = await api.post('/workspaces', data);
        return response.data;
    },

    update: async (id: string, data: { name: string }): Promise<ApiResponse<Workspace>> => {
        const response = await api.put(`/workspaces/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete(`/workspaces/${id}`);
        return response.data;
    },

    addMember: async (
        id: string,
        data: { userId: string; role: string }
    ): Promise<ApiResponse<Workspace>> => {
        const response = await api.post(`/workspaces/${id}/members`, data);
        return response.data;
    },
};
