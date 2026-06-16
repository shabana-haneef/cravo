import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Bell, Check, CheckCheck, Package, Store, ShoppingBag, X } from 'lucide-react';
import { useNotificationStore } from '../../../store/notification.store.js';
import { useNotifications } from '../hooks/useNotifications.js';
import { formatDistanceToNow } from 'date-fns';

// ─── Type config ─────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  ORDER_PLACED:         { icon: <ShoppingBag size={16} />, color: 'text-green-600', bg: 'bg-green-50' },
  ORDER_STATUS_UPDATED: { icon: <Package size={16} />,      color: 'text-blue-600',  bg: 'bg-blue-50' },
  ORDER_CANCELLED:      { icon: <X size={16} />,            color: 'text-red-600',   bg: 'bg-red-50' },
  SELLER_APPROVED:      { icon: <Check size={16} />,        color: 'text-green-600', bg: 'bg-green-50' },
  SELLER_REJECTED:      { icon: <X size={16} />,            color: 'text-red-600',   bg: 'bg-red-50' },
  PRODUCT_APPROVED:     { icon: <Check size={16} />,        color: 'text-green-600', bg: 'bg-green-50' },
  PRODUCT_REJECTED:     { icon: <X size={16} />,            color: 'text-red-600',   bg: 'bg-red-50' },
};

// ─── Single notification item (memoized) ─────────────────────────────────────
const NotificationItem = React.memo(({ notification, onMarkRead }) => {
  const config = TYPE_CONFIG[notification.type] ?? {
    icon: <Bell size={16} />,
    color: 'text-gray-600',
    bg: 'bg-gray-50'
  };

  const timeAgo = useMemo(
    () => formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }),
    [notification.createdAt]
  );

  const handleClick = useCallback(() => {
    if (!notification.isRead) onMarkRead(notification.id);
  }, [notification.id, notification.isRead, onMarkRead]);

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.isRead ? 'bg-indigo-50/40 border-l-2 border-indigo-400' : ''
      }`}
    >
      <div className={`w-8 h-8 rounded-full ${config.bg} ${config.color} flex items-center justify-center shrink-0 mt-0.5`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${notification.isRead ? 'text-gray-700' : 'text-gray-900'} leading-snug`}>
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
          {notification.message}
        </p>
        <p className="text-[11px] text-gray-400 mt-1">{timeAgo}</p>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2" />
      )}
    </div>
  );
});
NotificationItem.displayName = 'NotificationItem';

// ─── Bell + Dropdown ──────────────────────────────────────────────────────────
export const NotificationBell = React.memo(({ variant = 'admin' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const { markRead, markAllRead } = useNotifications();

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const toggleOpen = useCallback(() => setIsOpen((o) => !o), []);

  const handleMarkAllRead = useCallback(async () => {
    await markAllRead();
  }, [markAllRead]);

  const bellColor = variant === 'admin'
    ? 'text-gray-400 hover:text-indigo-600'
    : 'text-gray-400 hover:text-gray-600';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={toggleOpen}
        className={`relative p-2 transition-colors ${bellColor}`}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none border-2 border-white px-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                aria-label="Close notifications"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center text-center text-gray-400">
                <Bell size={32} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs mt-1">We'll notify you about important updates.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={markRead}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});
NotificationBell.displayName = 'NotificationBell';
