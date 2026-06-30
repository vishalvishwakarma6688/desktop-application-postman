import { create } from 'zustand';

interface GitBranchState {
    activeBranch: string;
    branchMappings: Record<string, string>; // e.g., { "main": "env_prod_id", "dev": "env_dev_id" }
    currentWorkspaceId: string | null;

    setActiveBranch: (branch: string) => void;
    setBranchMapping: (branch: string, envId: string) => void;
    removeBranchMapping: (branch: string) => void;
    loadMappings: (workspaceId: string) => void;
    reset: () => void;
}

export const useGitBranchStore = create<GitBranchState>((set) => ({
    activeBranch: '',
    branchMappings: {},
    currentWorkspaceId: null,

    setActiveBranch: (activeBranch) => set({ activeBranch }),

    setBranchMapping: (branch, envId) => set((state) => {
        const updated = { ...state.branchMappings, [branch]: envId };
        if (state.currentWorkspaceId) {
            localStorage.setItem(
                `apiflow_branch_map_${state.currentWorkspaceId}`,
                JSON.stringify(updated)
            );
        }
        return { branchMappings: updated };
    }),

    removeBranchMapping: (branch) => set((state) => {
        const updated = { ...state.branchMappings };
        delete updated[branch];
        if (state.currentWorkspaceId) {
            localStorage.setItem(
                `apiflow_branch_map_${state.currentWorkspaceId}`,
                JSON.stringify(updated)
            );
        }
        return { branchMappings: updated };
    }),

    loadMappings: (workspaceId) => set(() => {
        const raw = localStorage.getItem(`apiflow_branch_map_${workspaceId}`);
        let branchMappings = {};
        if (raw) {
            try {
                branchMappings = JSON.parse(raw);
            } catch {
                // Ignore malformed JSON
            }
        }
        return {
            currentWorkspaceId: workspaceId,
            branchMappings,
            activeBranch: '', // Clear previous branch until watch tick fires
        };
    }),

    reset: () => set({
        activeBranch: '',
        branchMappings: {},
        currentWorkspaceId: null
    })
}));
