'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useMessageStore } from '@/stores/realtimeStore';
import { useAuth } from '@/lib/auth';
import { Message, ChatRoom } from '@/types/realtime';
import { toast } from 'react-hot-toast';

// Polling interval in milliseconds (3 seconds)
const POLLING_INTERVAL = 3000;

interface UseRealTimeMessagesOptions {
  enabled?: boolean;
  onNewMessage?: (message: Message) => void;
}

/**
 * Hook for real-time message functionality using polling
 * Polls for new messages every 3 seconds when enabled
 */
export function useRealTimeMessages(options: UseRealTimeMessagesOptions = {}) {
  const { enabled = true, onNewMessage } = options;
  const { user, isAuthenticated } = useAuth();
  const { addMessage, chatRooms, messages, activeRoom, updateChatRoom } = useMessageStore();
  
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const lastFetchTimeRef = useRef<Record<string, Date>>({});

  // Fetch messages for a specific room
  const fetchMessages = useCallback(async (roomId: string) => {
    if (!isAuthenticated || !user) return;

    try {
      const lastFetch = lastFetchTimeRef.current[roomId];
      const params = new URLSearchParams({
        roomId,
        ...(lastFetch && { since: lastFetch.toISOString() })
      });

      const response = await fetch(`/api/messages?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch messages');

      const newMessages: Message[] = await response.json();
      
      // Add new messages to store
      newMessages.forEach(message => {
        addMessage(roomId, message);
        
        // Trigger callback for new messages
        if (onNewMessage && message.senderId !== user.id) {
          onNewMessage(message);
        }
        
        // Show toast notification for new messages when not in active room
        if (activeRoom !== roomId && message.senderId !== user.id) {
          toast.success(`New message from ${(message as any).senderName || 'user'}`, {
            duration: 3000,
            position: 'top-right',
          });
        }
      });

      // Update last fetch time
      lastFetchTimeRef.current[roomId] = new Date();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [isAuthenticated, user, addMessage, activeRoom, onNewMessage]);

  // Fetch all chat rooms
  const fetchChatRooms = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const response = await fetch('/api/messages/rooms', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch chat rooms');

      const rooms: ChatRoom[] = await response.json();
      
      // Update chat rooms in store
      rooms.forEach(room => {
        updateChatRoom(room);
      });
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    }
  }, [isAuthenticated, user, updateChatRoom]);

  // Send a message
  const sendMessage = useCallback(async (roomId: string, content: string, attachments?: string[]) => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          roomId,
          content,
          attachments,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const message: Message = await response.json();
      
      // Add message to store
      addMessage(roomId, message);
      
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      throw error;
    }
  }, [isAuthenticated, user, addMessage]);

  // Mark messages as read
  const markAsRead = useCallback(async (roomId: string, messageIds: string[]) => {
    if (!isAuthenticated || !user) return;

    try {
      await fetch('/api/messages/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          roomId,
          messageIds,
        }),
      });

      // Update local store
      useMessageStore.getState().markMessagesAsRead(roomId, messageIds);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [isAuthenticated, user]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(async (roomId: string, isTyping: boolean) => {
    if (!isAuthenticated || !user) return;

    try {
      await fetch('/api/messages/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          roomId,
          isTyping,
        }),
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }, [isAuthenticated, user]);

  // Start polling for new messages
  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    // Initial fetch
    fetchChatRooms();

    // Poll for updates
    pollingIntervalRef.current = setInterval(() => {
      // Fetch chat rooms to get latest metadata
      fetchChatRooms();
      
      // Fetch messages for all rooms
      Object.keys(chatRooms).forEach(roomId => {
        fetchMessages(roomId);
      });
    }, POLLING_INTERVAL);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [enabled, isAuthenticated, chatRooms, fetchChatRooms, fetchMessages]);

  // Calculate unread count
  const unreadCount = Object.entries(messages).reduce((total, [roomId, roomMessages]) => {
    const unread = roomMessages.filter(msg => 
      msg.receiverId === user?.id && msg.status !== 'read'
    ).length;
    return total + unread;
  }, 0);

  return {
    messages,
    chatRooms,
    activeRoom,
    unreadCount,
    sendMessage,
    markAsRead,
    sendTypingIndicator,
    fetchMessages,
    fetchChatRooms,
  };
}
