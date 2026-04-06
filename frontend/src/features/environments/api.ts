import api from '@/services/api';
import { ApiResponse, Environment } from '@/types';

export const environmentApi = {
    getByWorkspace: async (workspaceId: string): Promise<ApiResponse<Environment[]>> => {
        const response = await api.get(`/environments/workspace/${workspaceId}`);
        return response.data;
    },

    getById: async (id: string): Promise<ApiResponse<Environment>> => {
        const response = await api.get(`/environments/${id}`);
        return response.data;
    },

    create: async (data: Partial<Environment>): Promise<ApiResponse<Environment>> => {
        const response = await api.post('/environments', data);
        return response.data;
    },

    update: async (
        id: string,
        data: Partial<Environment>
    ): Promise<ApiResponse<Environment>> => {
        const response = await api.put(`/environments/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete(`/environments/${id}`);
        return response.data;
    },
};
