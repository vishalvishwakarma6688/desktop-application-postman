import axios from 'axios';

const api = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30s timeout — prevents hanging forever
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only redirect to login for non-execute endpoints
        // Execute endpoint returns 401 inside the result, not as an HTTP error
        const url: string = error.config?.url || '';
        const isExecute = url.includes('/execute');

        if (error.response?.status === 401 && !isExecute) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
