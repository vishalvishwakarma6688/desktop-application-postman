import api from '@/services/api';
import { ApiResponse, RequestHistory } from '@/types';

export const historyApi = {
    getAll: async (limit = 50): Promise<ApiResponse<RequestHistory[]>> => {
        const response = await api.get('/history', { params: { limit } });
        return response.data;
    },
    delete: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete(`/history/${id}`);
        return response.data;
    },
    clearAll: async (): Promise<ApiResponse> => {
        const response = await api.delete('/history');
        return response.data;
    },
};
