/**
 * STOMP Client Configuration for Chat Service
 * Backend: chat-service via Nginx Gateway at port 8080
 */

import { Client, StompConfig } from '@stomp/stompjs';

/**
 * Tạo STOMP client đã được config sẵn
 * @param token - JWT token để xác thực với backend
 * @returns Configured STOMP Client instance
 */
export function createStompClient(token: string): Client {
  const client = new Client({
    // Broker URL - Nginx proxy vào chat-service
    brokerURL: 'ws://localhost:8080/api/ws',
    
    // Header xác thực - Backend sử dụng TOKEN_AUTH
    connectHeaders: {
      'TOKEN_AUTH': `Bearer ${token}`
    },
    
    // Cấu hình reconnect
    reconnectDelay: 5000, // 5 giây
    
    // Cấu hình heartbeat
    heartbeatIncoming: 4000, // 4 giây
    heartbeatOutgoing: 4000, // 4 giây
    
    // Debug function để dễ theo dõi
    debug: (str: string) => {
      console.log('[STOMP Debug]:', str);
    },
    
    // Callback khi connect thành công
    onConnect: (frame) => {
      console.log('✅ STOMP Connected:', frame);
    },
    
    // Callback khi disconnect
    onDisconnect: (frame) => {
      console.log('❌ STOMP Disconnected:', frame);
    },
    
    // Callback khi có lỗi
    onStompError: (frame) => {
      console.error('🔴 STOMP Error:', frame.headers['message']);
      console.error('Details:', frame.body);
    },
    
    // Callback khi có lỗi WebSocket
    onWebSocketError: (event) => {
      console.error('🔴 WebSocket Error:', event);
    },
    
    // Callback khi WebSocket đóng
    onWebSocketClose: (event) => {
      console.warn('⚠️ WebSocket Closed:', event);
    }
  });
  
  return client;
}

/**
 * Kiểm tra trạng thái kết nối của client
 */
export function isClientConnected(client: Client | null): boolean {
  return client?.connected || false;
}
