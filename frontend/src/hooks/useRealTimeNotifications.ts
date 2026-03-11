'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useNotificationStore } from '@/stores/realtimeStore';
import { useAuth } from '@/lib/auth';
import { Notification } from '@/types/realtime';
import { toast } from 'react-hot-toast';

// Polling interval in milliseconds (5 seconds)
const POLLING_INTERVAL = 5000;

interface UseRealTimeNotificationsOptions {
  enabled?: boolean;
  onNewNotification?: (notification: Notification) => void;
  showToast?: boolean;
}

/**
 * Hook for real-time notification functionality using polling
 * Polls for new notifications every 5 seconds when enabled
 */
export function useRealTimeNotifications(options: UseRealTimeNotificationsOptions = {}) {
  const { enabled = true, onNewNotification, showToast = true } = options;
  const { user, isAuthenticated } = useAuth();
  const { notifications, unreadCount, addNotification, markAsRead, markAllAsRead } = useNotificationStore();
  
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const lastFetchTimeRef = useRef<Date>();
  const lastNotificationIdRef = useRef<string>();

  // Fetch new notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const params = new URLSearchParams();
      if (lastFetchTimeRef.current) {
        params.append('since', lastFetchTimeRef.current.toISOString());
      }

      const response = await fetch(`/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch notifications');

      const newNotifications: Notification[] = await response.json();
      
      // Add new notifications to store and show toasts
      newNotifications.forEach(notification => {
        // Check if this is truly a new notification
        if (lastNotificationIdRef.current !== notification.id) {
          addNotification(notification);
          
          // Trigger callback
          if (onNewNotification) {
            onNewNotification(notification);
          }
          
          // Show toast notification
          if (showToast) {
            const message = getNotificationMessage(notification);
            const notifType = (notification as any).type;
            
            switch (notifType) {
              case 'APPLICATION_ACCEPTED':
              case 'APPLICATION_APPROVED':
                toast.success(message, {
                  duration: 5000,
                  icon: '🎉',
                });
                break;
              case 'APPLICATION_REJECTED':
                toast.error(message, {
                  duration: 5000,
                });
                break;
              case 'NEW_MESSAGE':
                toast(message, {
                  duration: 4000,
                  icon: '💬',
                });
                break;
              case 'NEW_SCHOLARSHIP':
              case 'SCHOLARSHIP_MATCH':
                toast.success(message, {
                  duration: 4000,
                  icon: '🎓',
                });
                break;
              default:
                toast(message, {
                  duration: 4000,
                });
            }
          }
          
          lastNotificationIdRef.current = notification.id;
        }
      });

      // Update last fetch time
      if (newNotifications.length > 0) {
        lastFetchTimeRef.current = new Date();
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [isAuthenticated, user, addNotification, onNewNotification, showToast]);

  // Mark notifications as read
  const markNotificationsAsRead = useCallback(async (notificationIds: string[]) => {
    if (!isAuthenticated || !user) return;

    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          notificationIds,
        }),
      });

      // Update local store
      markAsRead(notificationIds);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, [isAuthenticated, user, markAsRead]);

  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // Update local store
      markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [isAuthenticated, user, markAllAsRead]);

  // Start polling for new notifications
  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    // Initial fetch
    fetchNotifications();

    // Poll for updates
    pollingIntervalRef.current = setInterval(() => {
      fetchNotifications();
    }, POLLING_INTERVAL);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [enabled, isAuthenticated, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    markAsRead: markNotificationsAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    fetchNotifications,
  };
}

// Helper function to get notification message
function getNotificationMessage(notification: Notification): string {
  const data = (notification as any).data;
  const notifType = (notification as any).type;
  
  switch (notifType) {
    case 'APPLICATION_SUBMITTED':
      return `Your application for "${data?.scholarshipTitle}" has been submitted`;
    case 'APPLICATION_ACCEPTED':
      return `Congratulations! Your application for "${data?.scholarshipTitle}" has been accepted`;
    case 'APPLICATION_REJECTED':
      return `Your application for "${data?.scholarshipTitle}" has been rejected`;
    case 'APPLICATION_APPROVED':
      return `Your application for "${data?.scholarshipTitle}" has been approved`;
    case 'APPLICATION_UNDER_REVIEW':
      return `Your application for "${data?.scholarshipTitle}" is now under review`;
    case 'NEW_MESSAGE':
      return `New message from ${data?.senderName}`;
    case 'NEW_SCHOLARSHIP':
      return `New scholarship available: "${data?.scholarshipTitle}"`;
    case 'SCHOLARSHIP_MATCH':
      return `We found a scholarship that matches your profile: "${data?.scholarshipTitle}"`;
    case 'DEADLINE_REMINDER':
      return `Reminder: Application deadline for "${data?.scholarshipTitle}" is in ${data?.daysUntil} days`;
    case 'PROFILE_INCOMPLETE':
      return 'Please complete your profile to get better scholarship matches';
    default:
      return notification.message || 'New notification';
  }
}
