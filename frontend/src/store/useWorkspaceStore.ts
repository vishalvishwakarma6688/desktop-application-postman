import { create } from 'zustand';
import { Workspace } from '@/types';

interface WorkspaceState {
    currentWorkspace: Workspace | null;
    workspaces: Workspace[];
    setCurrentWorkspace: (workspace: Workspace | null) => void;
    setWorkspaces: (workspaces: Workspace[]) => void;
    addWorkspace: (workspace: Workspace) => void;
    updateWorkspace: (workspace: Workspace) => void;
    removeWorkspace: (workspaceId: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
    currentWorkspace: null,
    workspaces: [],

    setCurrentWorkspace: (workspace) => {
        if (workspace) {
            localStorage.setItem('currentWorkspaceId', workspace._id);
        } else {
            localStorage.removeItem('currentWorkspaceId');
        }
        set({ currentWorkspace: workspace });
    },

    setWorkspaces: (workspaces) => {
        set({ workspaces });
    },

    addWorkspace: (workspace) => {
        set((state) => ({
            workspaces: [...state.workspaces, workspace],
        }));
    },

    updateWorkspace: (workspace) => {
        set((state) => ({
            workspaces: state.workspaces.map((w) =>
                w._id === workspace._id ? workspace : w
            ),
            currentWorkspace:
                state.currentWorkspace?._id === workspace._id
                    ? workspace
                    : state.currentWorkspace,
        }));
    },

    removeWorkspace: (workspaceId) => {
        set((state) => ({
            workspaces: state.workspaces.filter((w) => w._id !== workspaceId),
            currentWorkspace:
                state.currentWorkspace?._id === workspaceId
                    ? null
                    : state.currentWorkspace,
        }));
    },
}));
