import { create } from 'zustand';
import { Request, Environment } from '@/types';

interface RequestState {
    activeRequest: Request | null;
    activeEnvironment: Environment | null;
    setActiveRequest: (request: Request | null) => void;
    setActiveEnvironment: (environment: Environment | null) => void;
    updateActiveRequest: (updates: Partial<Request>) => void;
}

export const useRequestStore = create<RequestState>((set) => ({
    activeRequest: null,
    activeEnvironment: null,

    setActiveRequest: (request) => {
        set({ activeRequest: request });
    },

    setActiveEnvironment: (environment) => {
        set({ activeEnvironment: environment });
    },

    updateActiveRequest: (updates) => {
        set((state) => ({
            activeRequest: state.activeRequest
                ? { ...state.activeRequest, ...updates }
                : null,
        }));
    },
}));
