import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isConnected: false,

  setNotifications: (notifications) => set({ notifications }),

  // Prepend incoming real-time notification and bump unread count
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    })),

  setUnreadCount: (count) => set({ unreadCount: count }),

  markOneRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      const unreadCount = Math.max(0, state.unreadCount - 1);
      return { notifications, unreadCount };
    }),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0
    })),

  setConnected: (isConnected) => set({ isConnected })
}));
