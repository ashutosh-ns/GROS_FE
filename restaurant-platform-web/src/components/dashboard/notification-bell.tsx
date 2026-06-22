'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { restaurantsApi } from '@/lib/api/restaurants';
import { useStaffSocket } from '@/lib/hooks/use-socket';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const activeRestaurantId = useAuthStore((s) => s.activeRestaurantId);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { socket } = useStaffSocket(activeRestaurantId);

  useEffect(() => {
    if (activeRestaurantId) loadUnreadCount();
  }, [activeRestaurantId]);

  // WebSocket: new notification
  useEffect(() => {
    if (!socket) return;

    const handleNew = (notification: Notification) => {
      setUnreadCount((c) => c + 1);
      setNotifications((prev) => [notification, ...prev].slice(0, 20));
    };

    socket.on('notification:new', handleNew);
    return () => { socket.off('notification:new', handleNew); };
  }, [socket]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const loadUnreadCount = async () => {
    try {
      const res: any = await restaurantsApi.getUnreadCount(activeRestaurantId!);
      setUnreadCount(res.data?.count || 0);
    } catch {}
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res: any = await restaurantsApi.getNotifications(activeRestaurantId!, { limit: '20' });
      setNotifications(res.data?.data || []);
      setUnreadCount(res.data?.meta?.unreadCount || 0);
    } catch {}
    setLoading(false);
  };

  const handleOpen = () => {
    setOpen(!open);
    if (!open) loadNotifications();
  };

  const handleMarkRead = async (id: string) => {
    try {
      await restaurantsApi.markNotificationRead(activeRestaurantId!, id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await restaurantsApi.markAllNotificationsRead(activeRestaurantId!);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative rounded-md p-2 hover:bg-accent"
        aria-label="Notifications"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-center text-sm text-muted-foreground">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkRead(n.id)}
                  className={`cursor-pointer border-b px-4 py-3 last:border-0 hover:bg-accent ${
                    !n.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm ${!n.isRead ? 'font-medium' : ''}`}>{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                    </div>
                    {!n.isRead && <span className="ml-2 mt-1 h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">{formatTimeAgo(n.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
