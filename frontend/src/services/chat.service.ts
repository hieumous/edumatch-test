/**
 * Chat Service - API calls for chat functionality
 * Base URL: http://localhost:8080/api (via Nginx Gateway)
 */

import axios from 'axios';

// Create axios instance for chat service
const chatApiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token interceptor
chatApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Conversation {
  id: number;
  conversationId?: number; // backend returns this
  otherParticipantId?: number; // backend returns this
  otherUserId?: number; // legacy field name for backward compatibility
  otherUserName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  sentAt: string;
  readAt?: string;
}

export interface ChatMessageRequest {
  receiverId: number;
  content: string;
}

export interface FcmRegisterRequest {
  fcmToken: string;
}

/**
 * Lấy danh sách cuộc hội thoại của user hiện tại
 */
export async function getConversations(): Promise<Conversation[]> {
  try {
    const response = await chatApiClient.get('/conversations');
    return response.data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

/**
 * Lấy lịch sử tin nhắn của một cuộc hội thoại
 * @param conversationId - ID của cuộc hội thoại
 * @param page - Số trang (default: 0)
 * @param size - Kích thước trang (default: 50)
 */
export async function getMessages(
  conversationId: number,
  page: number = 0,
  size: number = 50
): Promise<{ content: Message[]; totalPages: number; totalElements: number }> {
  try {
    const response = await chatApiClient.get(`/messages/${conversationId}`, {
      params: { page, size }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

/**
 * Gửi tin nhắn qua HTTP (fallback khi WebSocket không khả dụng)
 * @param request - ChatMessageRequest với receiverId và content
 */
export async function sendMessage(request: ChatMessageRequest): Promise<Message> {
  try {
    const response = await chatApiClient.post('/chat/send', request);
    return response.data;
  } catch (error) {
    console.error('Error sending message via HTTP:', error);
    throw error;
  }
}

/**
 * Đăng ký FCM token để nhận push notification
 * @param fcmToken - Firebase Cloud Messaging token
 */
export async function registerFcm(fcmToken: string): Promise<void> {
  try {
    const request: FcmRegisterRequest = { fcmToken };
    await chatApiClient.post('/fcm/register', request);
    console.log('✅ FCM token registered successfully');
  } catch (error) {
    console.error('Error registering FCM token:', error);
    throw error;
  }
}

/**
 * Lấy danh sách thông báo của user
 * @param page - Số trang (default: 0)
 * @param size - Kích thước trang (default: 20)
 */
export async function getNotifications(
  page: number = 0,
  size: number = 20
): Promise<any> {
  try {
    console.log('[chat.service] Fetching notifications...', { page, size });
    const response = await chatApiClient.get('/notifications', {
      params: { page, size }
    });
    console.log('[chat.service] Notifications response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[chat.service] Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Đánh dấu thông báo là đã đọc
 * @param notificationId - ID của thông báo
 */
export async function markNotificationAsRead(notificationId: number): Promise<void> {
  try {
    await chatApiClient.patch(`/notifications/${notificationId}/read`);
    console.log('✅ Notification marked as read');
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Đánh dấu tất cả tin nhắn trong một conversation là đã đọc
 * @param conversationId - ID của conversation
 */
export async function markConversationAsRead(conversationId: number): Promise<void> {
  try {
    // Thử endpoint từ api.ts trước
    await chatApiClient.put(`/messages/conversations/${conversationId}/read`);
    console.log(`✅ Conversation ${conversationId} marked as read`);
  } catch (error: any) {
    // Nếu endpoint không tồn tại, chỉ log warning và update local state
    if (error.response?.status === 404) {
      console.warn(`⚠️ Mark as read endpoint not found, updating local state only`);
    } else {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  }
}

const chatService = {
  getConversations,
  getMessages,
  sendMessage,
  registerFcm,
  getNotifications,
  markNotificationAsRead,
  markConversationAsRead
};

export default chatService;
