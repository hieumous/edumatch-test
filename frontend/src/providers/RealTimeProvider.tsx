'use client';

import React, { createContext, useContext, useEffect, ReactNode, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/lib/auth';
import { useMessageStore, useNotificationStore } from '@/stores/realtimeStore';
import type { Message, Notification as NotificationModel } from '@/types/realtime';
import { toast } from 'react-hot-toast';
import { markNotificationAsRead as markNotificationAsReadAPI } from '@/services/chat.service';

interface RealTimeContextType {
  // Socket
  socket: ReturnType<typeof useSocket>['socket'];
  isConnected: boolean;
  onlineUsers: string[];
  onlineUsersMap: Map<string, { name: string; role: string }>;
  
  // Messages
  messages: Record<string, Message[]>;
  chatRooms: Record<string, any>;
  activeRoom: string | null;
  sendMessage: (roomId: string, content: string, attachments?: string[]) => void;
  markMessagesAsRead: (roomId: string, messageIds: string[]) => void;
  sendTypingIndicator: (roomId: string, isTyping: boolean) => void;
  joinChatRoom: (roomId: string) => void;
  leaveChatRoom: (roomId: string) => void;
  
  // Notifications
  notifications: NotificationModel[];
  notificationUnreadCount: number;
  markNotificationsAsRead: (notificationIds: string[]) => void;
  markAllNotificationsAsRead: () => void;
  
  // Utilities
  canChatWith: (otherUserRole: string) => boolean;
  isRealTimeEnabled: boolean;
}

const RealTimeContext = createContext<RealTimeContextType | null>(null);

interface RealTimeProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export function RealTimeProvider({ children, enabled = true }: RealTimeProviderProps) {
  const { user, isAuthenticated } = useAuth();
  
  console.log('🚀 [RealTimeProvider] Component rendered', {
    isAuthenticated,
    userId: user?.id,
    enabled
  });
  
  // Initialize Socket.IO
  const socket = useSocket(
    isAuthenticated ? user?.id : undefined,
    isAuthenticated ? user?.role : undefined,
    isAuthenticated ? user?.name : undefined
  );
  
  console.log('🔌 [RealTimeProvider] Socket state:', {
    isConnected: socket.isConnected,
    hasSocket: !!socket.socket,
    socketId: (socket.socket as any)?.id
  });
  
  // Store actions
  const { 
    messages, 
    chatRooms, 
    activeRoom, 
    addMessage, 
    updateChatRoom, 
    setTyping,
    markMessagesAsRead: storeMarkMessagesAsRead 
  } = useMessageStore();
  
  const { 
    notifications, 
    unreadCount, 
    loadNotifications: storeLoadNotifications,
    addNotification, 
    markAsRead: storeMarkNotificationsAsRead,
    markAllAsRead: storeMarkAllAsRead 
  } = useNotificationStore();
  
  // Load notifications from API on mount
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    const fetchInitialNotifications = async () => {
      try {
        console.log('[RealTimeProvider] Fetching initial notifications...');
        const { getNotifications } = await import('@/services/chat.service');
        const notificationsData = await getNotifications(0, 50);
        
        let notificationsArray: any[] = [];
        if (notificationsData && notificationsData.content) {
          notificationsArray = notificationsData.content;
        } else if (Array.isArray(notificationsData)) {
          notificationsArray = notificationsData;
        }
        
        if (notificationsArray.length > 0) {
          console.log('[RealTimeProvider] Loading', notificationsArray.length, 'notifications into store');
          await storeLoadNotifications(notificationsArray);
        } else {
          console.log('[RealTimeProvider] No notifications found');
        }
      } catch (error) {
        console.error('[RealTimeProvider] Error fetching initial notifications:', error);
      }
    };
    
    fetchInitialNotifications();
  }, [isAuthenticated, user, storeLoadNotifications]);

  // Role-based chat rules
  const canChatWith = (otherUserRole: string): boolean => {
    if (!user) return false;
    
    const userRole = user.role;
    
    // Same role can chat with each other
    if (userRole === otherUserRole) return true;
    
    // Student can chat with Provider and vice versa
    if (
      (userRole === 'USER' && otherUserRole === 'EMPLOYER') ||
      (userRole === 'EMPLOYER' && otherUserRole === 'USER')
    ) {
      return true;
    }
    
    // Admin can chat with everyone
    if (userRole === 'ADMIN') return true;
    
    return false;
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('🔔 [RealTimeProvider] Notification permission:', permission);
        });
      } else {
        console.log('🔔 [RealTimeProvider] Notification permission:', Notification.permission);
      }
    }
  }, []);

  const [onlineUsersMap, setOnlineUsersMap] = React.useState<Map<string, { name: string; role: string }>>(new Map());
  
  // Use refs to store handlers to avoid re-registration
  const messageHandlerRef = React.useRef<((message: any) => void) | null>(null);
  const handlersRegisteredRef = React.useRef(false);
  
  // Use refs to access latest values in handlers
  const userRef = React.useRef(user);
  const activeRoomRef = React.useRef(activeRoom);
  const onlineUsersMapRef = React.useRef(onlineUsersMap);
  
  // Update refs when values change
  React.useEffect(() => {
    userRef.current = user;
  }, [user]);
  
  React.useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);
  
  React.useEffect(() => {
    onlineUsersMapRef.current = onlineUsersMap;
  }, [onlineUsersMap]);

  // Setup Socket.IO event listeners
  useEffect(() => {
    console.log('🔧 [RealTimeProvider] ===== useEffect RUNNING =====');
    console.log('🔧 [RealTimeProvider] Setting up event listeners...', {
      isConnected: socket.isConnected,
      isAuthenticated,
      enabled,
      hasSocket: !!socket.socket,
      hasOnMethod: typeof (socket.socket as any)?.on === 'function',
      socketId: (socket.socket as any)?.id,
      handlersAlreadyRegistered: handlersRegisteredRef.current
    });

    if (!isAuthenticated || !enabled) {
      console.log('⚠️ [RealTimeProvider] Cannot setup listeners - not authenticated or disabled');
      handlersRegisteredRef.current = false;
      return;
    }

    if (!socket.isConnected) {
      console.log('⚠️ [RealTimeProvider] Socket not connected yet, will retry when connected');
      handlersRegisteredRef.current = false;
      return;
    }

    // Nếu đã đăng ký rồi, không đăng ký lại
    if (handlersRegisteredRef.current) {
      console.log('⚠️ [RealTimeProvider] Handlers already registered, skipping');
      return;
    }

    console.log('✅ [RealTimeProvider] All requirements met, setting up listeners');

    // User online/offline events
    (socket.socket as any).on('user_online', (userData: { userId: string; role: string; name: string }) => {
      setOnlineUsersMap(prev => {
        const newMap = new Map(prev);
        newMap.set(userData.userId, { name: userData.name, role: userData.role });
        return newMap;
      });
    });

    (socket.socket as any).on('user_offline', (userData: { userId: string; role: string; name: string }) => {
      setOnlineUsersMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(userData.userId);
        return newMap;
      });
    });

    (socket.socket as any).on('online_users', (users: Array<{ userId: string; role: string; name: string }>) => {
      const newMap = new Map();
      users.forEach(u => newMap.set(u.userId, { name: u.name, role: u.role }));
      setOnlineUsersMap(newMap);
    });

    // Message events
    console.log('📝 [RealTimeProvider] Registering message event listener...');
    messageHandlerRef.current = (message: any) => {
      console.log('🔔 [RealTimeProvider] ===== MESSAGE EVENT HANDLER CALLED =====');
      console.log('🔔 [RealTimeProvider] Received message event:', message);
      
      // Message từ STOMP (MessageDto từ backend) có cấu trúc:
      // { id, conversationId, senderId, content, sentAt }
      // Message được gửi đến /topic/messages/{userId} nghĩa là dành cho user đó
      const senderId = message.senderId?.toString() || String(message.senderId);
      const currentUser = userRef.current;
      const currentUserId = currentUser?.id?.toString() || String(currentUser?.id);
      
      console.log('🔔 [RealTimeProvider] Message details:', {
        messageId: message.id,
        senderId,
        currentUserId,
        isFromCurrentUser: senderId === currentUserId,
        conversationId: message.conversationId,
        content: message.content?.substring(0, 50)
      });
      
      // Chỉ xử lý tin nhắn KHÔNG phải từ chính user hiện tại
      // (Vì message được gửi đến topic của user, nên đó là tin nhắn dành cho user)
      if (senderId !== currentUserId) {
        // Tạo roomId từ senderId và receiverId (currentUserId)
        const roomId = [senderId, currentUserId].sort().join('-');
        
        // Lấy activeRoom từ ref để tránh stale closure
        const currentActiveRoom = activeRoomRef.current;
        console.log('🔔 [RealTimeProvider] Processing message for room:', roomId, 'activeRoom:', currentActiveRoom);
        
        // Nếu đang ở trong room này, đánh dấu đã đọc ngay
        if (currentActiveRoom === roomId) {
          console.log('🔔 [RealTimeProvider] User is in active room, marking as read');
          addMessage(roomId, { ...message, status: 'read' as const });
          (socket.socket as any).emit('mark_messages_read', { roomId, messageIds: [message.id] });
        } else {
          // Không ở trong room, thêm vào store và hiển thị toast
          console.log('🔔 [RealTimeProvider] User not in active room, showing notification');
          addMessage(roomId, message);
          
          // Lấy tên người gửi từ onlineUsersMapRef hoặc dùng fallback
          const senderInfo = onlineUsersMapRef.current.get(senderId);
          const senderName = senderInfo?.name || (message as any).senderName || 'Người dùng';
          
          console.log('🔔 [RealTimeProvider] Showing toast notification for message from:', senderName);
          
          // Hiển thị toast notification
          toast(`Tin nhắn mới từ ${senderName}`, {
            duration: 4000,
            icon: '💬',
            position: 'top-right',
          });
          
          // Thử hiển thị browser notification nếu có quyền
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`Tin nhắn mới từ ${senderName}`, {
                body: message.content?.substring(0, 100) || 'Bạn có tin nhắn mới',
                icon: '/favicon.ico',
                tag: `message-${message.id}`,
                requireInteraction: false,
              });
            } catch (error) {
              console.error('Error showing browser notification:', error);
            }
          }
          
          // Trigger custom event để Navbar và các component khác reload conversations ngay
          // Delay nhỏ để server có thời gian cập nhật unreadCount
          console.log('🔔 [RealTimeProvider] Dispatching newMessage event to trigger unread count update');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('newMessageReceived', { 
              detail: { 
                conversationId: message.conversationId,
                senderId: senderId 
              } 
            }));
          }, 500); // Đợi 500ms để server cập nhật unreadCount
        }
      } else {
        console.log('🔔 [RealTimeProvider] Message ignored - from current user (sync message)');
      }
    };
    
    console.log('📝 [RealTimeProvider] About to register message handler on socket:', socket.socket);
    (socket.socket as any).on('message', messageHandlerRef.current);
    handlersRegisteredRef.current = true;
    console.log('✅ [RealTimeProvider] Message event listener registered');

    // Notification events
    (socket.socket as any).on('notification', (notification: NotificationModel) => {
      console.log('🔔 [RealTimeProvider] Received notification:', notification);
      console.log('🔔 [RealTimeProvider] Notification type:', notification.type);
      console.log('🔔 [RealTimeProvider] Notification opportunityTitle:', (notification as any).opportunityTitle);
      
      addNotification(notification);
      
      // Show toast
      const notifType = (notification as any).type;
      const message = notification.message || 'New notification';
      
      switch (notifType) {
        case 'APPLICATION_ACCEPTED':
        case 'APPLICATION_APPROVED':
          toast.success(message, { duration: 5000, icon: '🎉' });
          break;
        case 'APPLICATION_REJECTED':
          toast.error(message, { duration: 5000 });
          break;
        case 'NEW_MESSAGE':
          toast(message, { duration: 4000, icon: '💬' });
          break;
        case 'NEW_SCHOLARSHIP':
        case 'SCHOLARSHIP_MATCH':
          toast.success(message, { duration: 4000, icon: '🎓' });
          break;
        default:
          toast(message, { duration: 4000 });
      }
      
      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification(notification.title || 'EduMatch', {
          body: message,
          icon: '/favicon.ico',
        });
      }
    });

    // Typing events
    (socket.socket as any).on('typing', ({ userId: typingUserId, roomId, isTyping }) => {
      if (typingUserId !== user?.id) {
        setTyping(roomId, typingUserId, isTyping);
      }
    });

    // KHÔNG cleanup handlers - giữ chúng hoạt động qua các re-renders
    // Handlers sẽ tự động cleanup khi component unmount hoàn toàn
    return () => {
      console.log('♻️ [RealTimeProvider] useEffect cleanup - but keeping handlers alive for reuse');
      // KHÔNG cleanup handlers ở đây để tránh mất handlers khi component re-render
      // Chỉ đánh dấu là đã cleanup để có thể setup lại nếu cần
      handlersRegisteredRef.current = false;
    };
  }, [socket.isConnected, isAuthenticated, enabled]); // Chỉ phụ thuộc vào những thứ thực sự cần thiết

  // Helper functions
  // DEPRECATED: This sendMessage function is for old Socket.IO implementation
  // New chat system uses STOMP WebSocket - see ChatWindow component
  const sendMessage = (roomId: string, content: string, attachments?: string[]) => {
    console.warn('⚠️ sendMessage called on deprecated RealTimeProvider. Use ChatWindow with STOMP instead.');
    // Disabled to prevent "Invalid chat room" errors
    return;
  };

  const markMessagesAsRead = (roomId: string, messageIds: string[]) => {
    if (!socket.isConnected) return;
    
    // Just emit to server, don't use the event name in type checking
    (socket as any).emit('mark_messages_read', { roomId, messageIds });
    storeMarkMessagesAsRead(roomId, messageIds);
  };

  const sendTypingIndicator = (roomId: string, isTyping: boolean) => {
    if (!socket.isConnected || !user?.id) return;
    
    socket.emit('typing', { roomId, userId: user.id, isTyping });
  };

  const joinChatRoom = (roomId: string) => {
    if (!socket.isConnected) return;
    socket.joinRoom(roomId);
  };

  const leaveChatRoom = (roomId: string) => {
    if (!socket.isConnected) return;
    socket.leaveRoom(roomId);
  };

  const markNotificationsAsRead = async (notificationIds: string[]) => {
    if (!isAuthenticated || !user) return;
    
    try {
      // Call HTTP API to save read status to database
      await Promise.all(
        notificationIds.map(id => markNotificationAsReadAPI(Number(id)))
      );
      
      // Update local store
      storeMarkNotificationsAsRead(notificationIds);
      
      // Emit WebSocket event for real-time sync (optional)
      if (socket.isConnected) {
        (socket as any).emit('mark_notifications_read', notificationIds);
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      // Still update local store for optimistic UI
      storeMarkNotificationsAsRead(notificationIds);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      const allIds = notifications.map(n => n.id);
      
      // Call HTTP API to save read status to database
      await Promise.all(
        allIds.map(id => markNotificationAsReadAPI(Number(id)))
      );
      
      // Update local store
      storeMarkAllAsRead();
      
      // Emit WebSocket event for real-time sync (optional)
      if (socket.isConnected) {
        (socket as any).emit('mark_notifications_read', allIds);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Still update local store for optimistic UI
      storeMarkAllAsRead();
    }
  };

  const contextValue: RealTimeContextType = {
    // Socket
    socket: socket.socket,
    isConnected: socket.isConnected && enabled && isAuthenticated,
    onlineUsers: socket.onlineUsers,
    onlineUsersMap,
    
    // Messages
    messages,
    chatRooms,
    activeRoom,
    sendMessage,
    markMessagesAsRead,
    sendTypingIndicator,
    joinChatRoom,
    leaveChatRoom,
    
    // Notifications
    notifications,
    notificationUnreadCount: unreadCount,
    markNotificationsAsRead,
    markAllNotificationsAsRead,
    
    // Utilities
    canChatWith,
    isRealTimeEnabled: enabled && isAuthenticated && socket.isConnected,
  };

  return (
    <RealTimeContext.Provider value={contextValue}>
      {children}
    </RealTimeContext.Provider>
  );
}

export function useRealTime() {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
}

// Hook to check real-time status
export function useRealTimeStatus() {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTimeStatus must be used within a RealTimeProvider');
  }
  return {
    isEnabled: context.isRealTimeEnabled,
    isConnected: context.isConnected,
    onlineUsersCount: context.onlineUsers.length,
    messageUnreadCount: Object.values(context.messages).flat().filter((msg: any) => 
      msg.receiverId === (context as any).user?.id && msg.status !== 'read'
    ).length,
    notificationUnreadCount: context.notificationUnreadCount,
  };
}

// Hook to request notification permission
export function useNotificationPermission() {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
}