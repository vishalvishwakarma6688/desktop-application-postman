import api from '@/services/api';
import { ApiResponse, Collection } from '@/types';

export const collectionApi = {
    getByWorkspace: async (workspaceId: string): Promise<ApiResponse<Collection[]>> => {
        const response = await api.get(`/collections/workspace/${workspaceId}`);
        return response.data;
    },

    getById: async (id: string): Promise<ApiResponse<Collection>> => {
        const response = await api.get(`/collections/${id}`);
        return response.data;
    },

    create: async (data: {
        name: string;
        description?: string;
        workspace: string;
    }): Promise<ApiResponse<Collection>> => {
        const response = await api.post('/collections', data);
        return response.data;
    },

    update: async (
        id: string,
        data: { name?: string; description?: string }
    ): Promise<ApiResponse<Collection>> => {
        const response = await api.put(`/collections/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete(`/collections/${id}`);
        return response.data;
    },

    exportCollection: async (id: string): Promise<any> => {
        const response = await api.get(`/collections/${id}/export`);
        return response.data;
    },
};
