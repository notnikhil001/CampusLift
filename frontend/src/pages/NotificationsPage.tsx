import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { NotificationItem } from '../types';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchNotifications = async () => {
    const res = await apiFetch<{ notifications: NotificationItem[]; unreadCount: number }>(
      '/notifications'
    );
    if (res.success && res.data) {
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    const res = await apiFetch('/notifications/read-all', { method: 'PATCH' });
    if (res.success) {
      fetchNotifications();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">Updates on your travel matches and groups</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-2">
          <Bell className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No notifications yet</h3>
          <p className="text-xs text-slate-500">We will notify you when students join your travel groups.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition ${
                n.readAt
                  ? 'bg-white border-slate-200'
                  : 'bg-indigo-50/50 border-indigo-200/80 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  {new Date(n.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-2">{n.body}</p>

              {n.metadata?.groupId && (
                <Link
                  to={`/groups/${n.metadata.groupId}`}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  View Group &rarr;
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
