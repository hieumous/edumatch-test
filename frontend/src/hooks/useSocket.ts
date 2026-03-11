'use client';

import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { SocketEvents } from '@/types/realtime';
import { createStompClient } from '@/lib/stomp';

// WebSocket URL qua Nginx Gateway
const SOCKET_URL = 'ws://localhost:8080/api/ws';

// Tạo biến global client bên ngoài hook để giữ kết nối qua các lần render
let globalClient: Client | null = null;
let globalUserId: string | null = null;
// Global event handlers để giữ handlers qua các instances
const globalEventHandlers = new Map<string, Function[]>();

export function useSocket(userId?: string, userRole?: string, userName?: string) {
  const clientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  // Use global event handlers để giữ handlers qua các instances
  const eventHandlers = useRef(globalEventHandlers);

  // Helper to trigger registered callbacks - dùng globalEventHandlers trực tiếp
  const trigger = (event: string, data: any) => {
    const handlers = globalEventHandlers.get(event);
    console.log(`🔔 [useSocket] Triggering event '${event}' to ${handlers?.length || 0} handlers`);
    console.log(`🔔 [useSocket] All registered events:`, Array.from(globalEventHandlers.keys()));
    if (handlers && handlers.length > 0) {
      handlers.forEach((cb, index) => {
        console.log(`🔔 [useSocket] Calling handler ${index + 1}/${handlers.length}`);
        try {
          cb(data);
          console.log(`✅ [useSocket] Handler ${index + 1} executed successfully`);
        } catch (error) {
          console.error(`❌ [useSocket] Handler ${index + 1} error:`, error);
        }
      });
    } else {
      console.log(`⚠️ [useSocket] No handlers registered for event '${event}'`);
      console.log(`⚠️ [useSocket] Available events:`, Array.from(globalEventHandlers.keys()));
    }
  };

  useEffect(() => {
    if (!userId) return;

    // Nếu đã có client đang chạy và đúng user thì dùng lại, không tạo mới
    if (globalClient && globalClient.active && globalUserId === userId) {
      console.log('♻️ Reusing existing STOMP connection for user:', userId);
      console.log('♻️ Current handlers count:', {
        message: globalEventHandlers.get('message')?.length || 0,
        notification: globalEventHandlers.get('notification')?.length || 0,
        allEvents: Array.from(globalEventHandlers.keys())
      });
      clientRef.current = globalClient;
      setIsConnected(true);
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('⚠️ No auth token found. Cannot connect to WebSocket.');
      return;
    }
    
    console.log('🔐 Auth token found, connecting WebSocket for user:', userId);
    console.log('🔑 Token (first 20 chars):', token.substring(0, 20) + '...');
    
    // Sử dụng createStompClient từ lib/stomp.ts
    const client = createStompClient(token);

    client.onConnect = (frame: any) => {
      console.log('✅ STOMP Connected successfully');
      console.log('📡 Connection frame:', frame);
      setIsConnected(true);
      trigger('connect', {});
      
      // Subscribe vào topic cá nhân: /topic/messages/{userId}
      client.subscribe(`/topic/messages/${userId}`, (message: any) => {
        try {
          const body = JSON.parse(message.body);
          console.log('📨 Received message:', body);
          console.log('📨 Message structure:', {
            id: body.id,
            senderId: body.senderId,
            receiverId: body.receiverId,
            conversationId: body.conversationId,
            content: body.content?.substring(0, 50)
          });
          
          // Update messages state
          setMessages(prev => [...prev, body]);
          
          // Trigger callback cho listener
          console.log('📨 Triggering message event to listeners...');
          trigger('message', body);
          console.log('📨 Message event triggered');
        } catch (e) {
          console.error('❌ Error parsing message:', e);
        }
      });

      // Subscribe vào notifications
      client.subscribe(`/topic/notifications/${userId}`, (message: any) => {
        try {
          const body = JSON.parse(message.body);
          console.log('🔔 Received notification:', body);
          trigger('notification', body);
        } catch (e) {
          console.error('❌ Error parsing notification:', e);
        }
      });
    };

    client.onStompError = (frame: any) => {
      console.error('🔴 Broker reported error:', frame.headers['message']);
      console.error('Details:', frame.body);
      setIsConnected(false);
      trigger('connect_error', frame);
    };

    client.onWebSocketClose = () => {
      console.log('⚠️ WebSocket closed');
      setIsConnected(false);
      trigger('disconnect', {});
    };

    client.activate();
    clientRef.current = client;
    globalClient = client; // Lưu vào global để reuse
    globalUserId = userId; // Lưu userId để check

    // Cleanup: TẠM THỜI COMMENT để tránh mất kết nối khi re-render
    return () => {
      console.log('🔌 Component cleanup called, but keeping connection alive...');
      // client.deactivate(); // <--- COMMENT để giữ kết nối
      // clientRef.current = null;
      // setIsConnected(false);
    };
  }, [userId, userRole, userName]);

  /**
   * Gửi tin nhắn qua WebSocket
   * @param receiverId - ID người nhận
   * @param content - Nội dung tin nhắn
   */
  const sendMessage = (receiverId: any, content: string) => {
    console.log('🚀 Đang gửi tin nhắn tới ID:', receiverId, 'Kiểu:', typeof receiverId);
    
    if (!clientRef.current) {
      console.error('❌ Cannot send message: STOMP client is null');
      return;
    }
    
    if (!clientRef.current.connected) {
      console.error('❌ Chưa kết nối WebSocket, không thể gửi!');
      return;
    }

    // Ép kiểu sang số nguyên (Backend Java yêu cầu Long)
    const receiverIdLong = Number(receiverId);

    if (isNaN(receiverIdLong)) {
      console.error('❌ Lỗi: receiverId không phải là số!', receiverId);
      return;
    }

    const payload = {
      receiverId: receiverIdLong, // ✅ Đảm bảo luôn là số
      content
    };

    try {
      console.log('📤 Publishing to /app/chat.send | Payload:', payload);
      
      // Check lại client state trước khi gửi
      console.log('🔌 Client State:', { 
        connected: clientRef.current?.connected, 
        active: clientRef.current?.active 
      });

      clientRef.current.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(payload)
      });
      console.log('✅ Message published successfully');
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  };

  // Mimic Socket.IO API for compatibility - dùng globalEventHandlers
  const on = <K extends keyof SocketEvents>(
    event: K,
    callback: SocketEvents[K]
  ) => {
    const evt = event as string;
    console.log(`📝 [useSocket] Registering listener for event '${evt}'`);
    if (!globalEventHandlers.has(evt)) {
        globalEventHandlers.set(evt, []);
    }
    globalEventHandlers.get(evt)?.push(callback as Function);
    const handlerCount = globalEventHandlers.get(evt)?.length || 0;
    console.log(`✅ [useSocket] Event '${evt}' now has ${handlerCount} handler(s)`);
    console.log(`✅ [useSocket] All events:`, Array.from(globalEventHandlers.keys()));
  };

  const off = <K extends keyof SocketEvents>(
    event: K,
    callback?: SocketEvents[K]
  ) => {
     const evt = event as string;
     console.log(`🗑️ [useSocket] Removing listener for event '${evt}'`, callback ? '(specific callback)' : '(all callbacks)');
     if (globalEventHandlers.has(evt)) {
         if (callback) {
             const handlers = globalEventHandlers.get(evt) || [];
             const index = handlers.indexOf(callback as Function);
             if (index !== -1) {
                 handlers.splice(index, 1);
                 console.log(`✅ [useSocket] Removed specific handler, remaining: ${handlers.length}`);
             } else {
                 console.log(`⚠️ [useSocket] Handler not found in list`);
             }
         } else {
             globalEventHandlers.delete(evt);
             console.log(`✅ [useSocket] Removed all handlers for event '${evt}'`);
         }
     } else {
         console.log(`⚠️ [useSocket] Event '${evt}' not found in handlers`);
     }
  };

  const emit = <K extends keyof SocketEvents>(
    event: K,
    ...args: Parameters<SocketEvents[K]>
  ) => {
    if (clientRef.current && clientRef.current.connected) {
        const data = args[0];
        
        if (event === 'send_message') {
            // Backend expects payload at /app/chat.send
            clientRef.current.publish({
                destination: '/app/chat.send',
                body: JSON.stringify(data)
            });
        } 
        // Add other event mappings here if backend supports them
        // e.g. typing, mark_read
    }
  };

  const joinRoom = (roomId: string) => {
     // STOMP: No-op for 1-on-1 if using user-specific topics
  };

  const leaveRoom = (roomId: string) => {
     // STOMP: No-op
  };

  // Mock socket object to pass to RealTimeProvider
  const socket = {
      id: 'stomp-client',
      connected: isConnected,
      on,
      off,
      emit,
      disconnect: () => clientRef.current?.deactivate(),
      joinRoom,
      leaveRoom
  };

  return {
    socket, 
    isConnected,
    messages,
    onlineUsers,
    sendMessage, // Export sendMessage function
    on,
    off,
    emit,
    joinRoom,
    leaveRoom,
  };
}