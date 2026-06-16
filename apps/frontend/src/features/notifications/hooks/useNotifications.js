import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../services/notification.api.js';
import { useNotificationStore } from '../../../store/notification.store.js';
import { getSocket } from '../../../lib/socket.js';
import { useAuthStore } from '../../../store/auth.store.js';

export const useNotifications = () => {
  const { isAuthenticated } = useAuthStore();
  const { addNotification, setNotifications, setUnreadCount, setConnected } = useNotificationStore();
  const queryClient = useQueryClient();

  // Fetch initial notifications list
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list(),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
    select: (res) => res.data
  });

  // Fetch initial unread count
  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationApi.unreadCount(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    select: (res) => res.data?.count ?? 0
  });

  // Sync fetched data into store
  useEffect(() => {
    if (data?.data) setNotifications(data.data);
  }, [data, setNotifications]);

  useEffect(() => {
    if (typeof unreadData === 'number') setUnreadCount(unreadData);
  }, [unreadData, setUnreadCount]);

  // Socket.io real-time subscription
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onNotification = (notification) => {
      addNotification(notification);
      // Invalidate query cache so a refresh gets fresh data
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('notification', onNotification);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('notification', onNotification);
    };
  }, [isAuthenticated, addNotification, setConnected, queryClient]);

  const markRead = useCallback(async (id) => {
    try {
      await notificationApi.markRead(id);
      useNotificationStore.getState().markOneRead(id);
    } catch {
      // Silently ignore
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationApi.markAllRead();
      useNotificationStore.getState().markAllRead();
    } catch {
      // Silently ignore
    }
  }, []);

  return { isLoading, markRead, markAllRead };
};
