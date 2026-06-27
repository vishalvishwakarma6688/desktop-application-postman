import { create } from 'zustand';

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: Date;
    read: boolean;
}

interface NotificationState {
    notifications: AppNotification[];
    addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotification: (id: string) => void;
    clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [
        {
            id: 'welcome',
            title: 'Welcome to DataCourier',
            message: 'Collaborate in real-time with workspaces, run collection assertions, and use our AI Assistant to debug API requests.',
            type: 'success',
            timestamp: new Date(),
            read: false,
        },
        {
            id: 'tip-palette',
            title: 'Tip: Command Palette',
            message: 'Press Ctrl+P (or Cmd+P) to open the command palette and quickly navigate between actions and screens.',
            type: 'info',
            timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
            read: false,
        }
    ],

    addNotification: (notification) => set((state) => {
        const newNotification: AppNotification = {
            ...notification,
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date(),
            read: false,
        };
        // Keep max 20 notifications to prevent memory issues
        const updated = [newNotification, ...state.notifications].slice(0, 20);
        return { notifications: updated };
    }),

    markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    })),

    markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
    })),

    clearNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
    })),

    clearAll: () => set({ notifications: [] }),
}));
