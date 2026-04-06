import { create } from 'zustand';
import { Request } from '@/types';

export interface Tab {
    id: string;
    type: 'request' | 'new-request';
    title: string;
    request?: Request;
    unsavedRequest?: Partial<Request>;
    isDirty?: boolean;
}

interface TabState {
    tabs: Tab[];
    activeTabId: string | null;
    addTab: (tab: Tab) => void;
    removeTab: (tabId: string) => void;
    setActiveTab: (tabId: string) => void;
    updateTab: (tabId: string, updates: Partial<Tab>) => void;
    closeAllTabs: () => void;
}

export const useTabStore = create<TabState>((set, get) => ({
    tabs: [],
    activeTabId: null,

    addTab: (tab) => {
        const { tabs } = get();
        // Check if tab already exists
        const existingTab = tabs.find(t => t.id === tab.id);
        if (existingTab) {
            set({ activeTabId: tab.id });
            return;
        }
        set({ tabs: [...tabs, tab], activeTabId: tab.id });
    },

    removeTab: (tabId) => {
        const { tabs, activeTabId } = get();
        const newTabs = tabs.filter(t => t.id !== tabId);
        let newActiveTabId = activeTabId;

        if (activeTabId === tabId) {
            const index = tabs.findIndex(t => t.id === tabId);
            if (newTabs.length > 0) {
                newActiveTabId = newTabs[Math.max(0, index - 1)]?.id || newTabs[0]?.id;
            } else {
                newActiveTabId = null;
            }
        }

        set({ tabs: newTabs, activeTabId: newActiveTabId });
    },

    setActiveTab: (tabId) => {
        set({ activeTabId: tabId });
    },

    updateTab: (tabId, updates) => {
        set((state) => ({
            tabs: state.tabs.map(tab =>
                tab.id === tabId ? { ...tab, ...updates } : tab
            ),
        }));
    },

    closeAllTabs: () => {
        set({ tabs: [], activeTabId: null });
    },
}));
