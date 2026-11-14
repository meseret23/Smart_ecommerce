
import { useEffect, useState } from 'react';
import api from '../services/api';

interface Notification {
  id: number;
  user_id: number;
  order_id: number | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Unable to fetch notifications:', error);
    }
  };

  useEffect(() => {
    void fetchNotifications();

    const interval = window.setInterval(() => {
      void fetchNotifications();
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === id
            ? { ...notification, is_read: true }
            : notification
        )
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (error) {
      console.error('Unable to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      await api.patch('/notifications/read-all');

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error('Unable to mark all notifications as read:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="relative rounded-full p-2 text-gray-700 transition hover:bg-gray-100"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="23"
          height="23"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 z-50 mt-3 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl sm:w-96">
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Notifications
                </h3>
                <p className="text-xs text-gray-500">
                  {unreadCount} unread
                </p>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllAsRead()}
                  disabled={loading}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  You're all caught up. No notifications yet.
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => {
                      if (!notification.is_read) {
                        void markAsRead(notification.id);
                      }
                    }}
                    className={`w-full border-b border-gray-100 p-4 text-left transition hover:bg-gray-50 ${
                      notification.is_read ? 'bg-white' : 'bg-blue-50/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          notification.is_read
                            ? 'bg-gray-300'
                            : 'bg-blue-600'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-800">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
