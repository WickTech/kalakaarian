import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, MessageSquare, FileText, DollarSign, Info } from 'lucide-react';
import { api } from '@/lib/api';

interface Notification {
  id: string;
  type: 'proposal' | 'campaign' | 'message' | 'payment' | 'system';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

interface NotificationBellProps {
  className?: string;
}

const typeIcons = {
  proposal: MessageSquare,
  campaign: FileText,
  message: MessageSquare,
  payment: DollarSign,
  system: Info,
};

export function NotificationBell({ className }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('kalakariaan_token');
    if (!token) return;
    fetchNotifications();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const { count } = await api.getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className={`relative ${className || ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-md border border-white/10 hover:bg-white/5 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-charcoal border border-white/10 rounded-lg shadow-xl shadow-black/40 z-50 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-white/8">
              <span className="font-medium text-chalk text-sm">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-purple-400 hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-chalk-dim text-center py-8">No notifications</p>
              ) : (
                notifications.map((notification) => {
                  const Icon = typeIcons[notification.type] || Info;
                  return (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${
                        !notification.read ? 'bg-purple-600/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-white/5 rounded">
                          <Icon className="w-4 h-4 text-chalk-dim" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-chalk truncate">{notification.title}</p>
                          <p className="text-xs text-chalk-dim line-clamp-2">{notification.message}</p>
                          <p className="text-[10px] text-chalk-faint mt-1">{getTimeAgo(notification.createdAt)}</p>
                        </div>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 hover:bg-white/5 rounded text-chalk-dim"
                            title="Mark as read"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <Link to="/notifications" onClick={() => setOpen(false)}
              className="block px-3 py-2 text-xs text-purple-400 hover:underline text-center border-t border-white/8">
              View all notifications →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}