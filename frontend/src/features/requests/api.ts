import api from '@/services/api';
import { ApiResponse, Request, ExecuteRequestResponse } from '@/types';

export const requestApi = {
    getByCollection: async (collectionId: string): Promise<ApiResponse<Request[]>> => {
        const response = await api.get(`/requests/collection/${collectionId}`);
        return response.data;
    },

    getById: async (id: string): Promise<ApiResponse<Request>> => {
        const response = await api.get(`/requests/${id}`);
        return response.data;
    },

    getStarred: async (workspaceId: string): Promise<ApiResponse<Request[]>> => {
        const response = await api.get(`/requests/workspace/${workspaceId}/starred`);
        return response.data;
    },

    create: async (data: Partial<Request>): Promise<ApiResponse<Request>> => {
        const response = await api.post('/requests', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Request>): Promise<ApiResponse<Request>> => {
        const response = await api.put(`/requests/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete(`/requests/${id}`);
        return response.data;
    },

    toggleStar: async (id: string): Promise<ApiResponse<Request>> => {
        const response = await api.patch(`/requests/${id}/star`);
        return response.data;
    },

    execute: async (
        id: string,
        environmentId?: string
    ): Promise<ApiResponse<ExecuteRequestResponse>> => {
        const response = await api.post(`/requests/${id}/execute`, { environmentId });
        return response.data;
    },

    getUrlSuggestions: async (q: string): Promise<{ url: string; method: string }[]> => {
        const response = await api.get('/history/url-suggestions', { params: { q } });
        return response.data?.data || [];
    },

    duplicate: async (id: string): Promise<ApiResponse<Request>> => {
        const response = await api.post(`/requests/${id}/duplicate`);
        return response.data;
    },
};
