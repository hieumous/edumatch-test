'use client';

import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRealTime } from '@/providers/RealTimeProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { parseNotification, getNotificationIcon } from '@/lib/notification-templates';

export function NotificationDropdown() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const { 
    notifications, 
    notificationUnreadCount: unreadCount, 
    markNotificationsAsRead: markAsRead, 
    markAllNotificationsAsRead: markAllAsRead 
  } = useRealTime();

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead([notificationId]);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleNotificationClick = (notification: any) => {
    // Mark as read
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    // Close dropdown and show detail modal
    setIsOpen(false);
    setSelectedNotification(notification);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border z-50">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">{t('notificationDropdown.title')}</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {t('notificationDropdown.markAllRead')}
              </Button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const { templateKey, params } = parseNotification(notification);
                return (
                  <div
                    key={notification.id}
                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-sm">
                            {notification.title || t(templateKey + '.title', params || {})}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.body || notification.message || t(templateKey, params || {})}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>{t('notificationDropdown.noNotifications')}</p>
                <p className="text-xs mt-1">{t('notificationDropdown.noNotificationsDesc')}</p>
              </div>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="p-4 border-t">
              <Button variant="outline" size="sm" className="w-full">
                {t('notificationDropdown.viewAll')}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setSelectedNotification(null)}>
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {getNotificationIcon(selectedNotification.type)}
                </span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedNotification.title || 'Thông báo'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(selectedNotification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Nội dung thông báo</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {selectedNotification.body || selectedNotification.message || 'Không có nội dung'}
                    </p>
                  </div>
                </div>

                {selectedNotification.referenceId && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Thông tin liên quan</h3>
                    <p className="text-sm text-gray-700">
                      ID tham chiếu: {selectedNotification.referenceId}
                    </p>
                  </div>
                )}

                {(selectedNotification as any).opportunityTitle && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Học bổng</h3>
                    <p className="text-sm text-gray-700">
                      {(selectedNotification as any).opportunityTitle}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedNotification(null)}
              >
                Đóng
              </Button>
              {selectedNotification.referenceId && (
                <Button
                  onClick={() => {
                    // Navigate to related page based on type
                    if (selectedNotification.type?.includes('APPLICATION')) {
                      window.location.href = `/applications`;
                    } else if (selectedNotification.type?.includes('SCHOLARSHIP')) {
                      window.location.href = `/scholarships/${selectedNotification.referenceId}`;
                    }
                    setSelectedNotification(null);
                  }}
                >
                  Xem chi tiết
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
