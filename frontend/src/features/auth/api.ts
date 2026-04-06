import api from '@/services/api';
import { ApiResponse, User } from '@/types';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export const authApi = {
    register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    getMe: async (): Promise<ApiResponse<User>> => {
        const response = await api.get('/auth/me');
        return response.data;
    },
};
