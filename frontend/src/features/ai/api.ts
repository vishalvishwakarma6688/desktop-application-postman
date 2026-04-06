import api from '@/services/api';

export const aiApi = {
    explainResponse: async (payload: {
        status: number; statusText: string; data: any;
        headers: any; method: string; url: string;
    }) => {
        const res = await api.post('/ai/explain-response', payload);
        return res.data?.data?.text as string;
    },

    generateBody: async (payload: { method: string; url: string; description?: string }) => {
        const res = await api.post('/ai/generate-body', payload);
        return res.data?.data?.text as string;
    },

    fixRequest: async (payload: {
        method: string; url: string; headers: any; body: any;
        errorResponse: any; errorStatus: number;
    }) => {
        const res = await api.post('/ai/fix-request', payload);
        return res.data?.data?.text as string;
    },

    generateTests: async (payload: {
        method: string; url: string; responseStatus: number; responseData: any;
    }) => {
        const res = await api.post('/ai/generate-tests', payload);
        return res.data?.data?.text as string;
    },

    chat: async (message: string, context?: any) => {
        const res = await api.post('/ai/chat', { message, context });
        return res.data?.data?.text as string;
    },
};
