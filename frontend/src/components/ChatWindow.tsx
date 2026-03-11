'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, MoreHorizontal, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import chatService from '@/services/chat.service';
import { useSocket } from '@/hooks/useSocket';

interface ChatWindowProps {
  conversationId?: number; // ID của cuộc hội thoại (nếu đã có)
  roomId: string;
  otherUserId: string;
  otherUserName: string;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  isEmbedded?: boolean;
}

export function ChatWindow({ 
  conversationId,
  roomId, 
  otherUserId, 
  otherUserName, 
  currentUserId, 
  isOpen, 
  onClose,
  isEmbedded = false
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get WebSocket hook để lắng nghe tin nhắn realtime
  const socketHook = useSocket(currentUserId);
  const { sendMessage: sendMessageViaWS, isConnected } = socketHook;

  // Load lịch sử tin nhắn khi mở chat window
  useEffect(() => {
    if (isOpen && conversationId) {
      loadMessageHistory();
    }
  }, [isOpen, conversationId]);

  const loadMessageHistory = async () => {
    if (!conversationId) return;
    
    setIsLoadingMessages(true);
    try {
      const response = await chatService.getMessages(conversationId, 0, 50);
      // Sắp xếp tin nhắn theo thời gian tăng dần
      const sortedMessages = response.content.sort((a, b) => 
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );
      setLocalMessages(sortedMessages);
      console.log('✅ Loaded message history:', sortedMessages.length, 'messages');
    } catch (error) {
      console.error('❌ Error loading message history:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Lắng nghe tin nhắn realtime từ WebSocket
  useEffect(() => {
    if (!isOpen || !socketHook) return;

    const handleNewMessage = (message: any) => {
      console.log('📨 ChatWindow received message:', message);
      console.log('🔍 Current chat:', { otherUserId, currentUserId, conversationId });
      
      // Kiểm tra xem tin nhắn có liên quan đến cuộc trò chuyện này không
      const isRelevant = 
        (message.senderId === parseInt(otherUserId) && message.receiverId === parseInt(currentUserId)) ||
        (message.senderId === parseInt(currentUserId) && message.receiverId === parseInt(otherUserId));
      
      console.log('🔍 Message relevance:', { isRelevant, messageSenderId: message.senderId, messageReceiverId: message.receiverId });
      
      if (isRelevant) {
        setLocalMessages(prev => {
          // Kiểm tra xem tin nhắn đã tồn tại chưa (tránh duplicate)
          const exists = prev.some(m => m.id === message.id);
          if (exists) {
            console.log('⚠️ Message already exists, skipping');
            return prev;
          }
          console.log('✅ Adding message to chat');
          return [...prev, message];
        });
      } else {
        console.log('❌ Message not relevant to this chat');
      }
    };

    // Subscribe to message event
    socketHook.on('message', handleNewMessage);

    return () => {
      // Cleanup subscription
      socketHook.off('message', handleNewMessage);
    };
  }, [isOpen, conversationId, otherUserId, currentUserId, socketHook]);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    console.log('🔵 handleSendMessage called, newMessage:', newMessage);
    
    if (!newMessage.trim()) {
      console.log('⚠️ Empty message, aborting');
      return;
    }

    const messageContent = newMessage.trim();
    const receiverIdNum = Number(otherUserId);
    
    console.log('📋 ChatWindow Send:', { 
      receiverId: receiverIdNum,
      receiverIdType: typeof receiverIdNum,
      msg: messageContent,
      wsConnected: isConnected,
      hasSendFunc: !!sendMessageViaWS
    });
    
    // Optimistic UI: Thêm tin nhắn vào list ngay lập tức
    const tempMessage = {
      id: Date.now(),
      conversationId: conversationId || 0,
      senderId: parseInt(currentUserId),
      content: messageContent,
      sentAt: new Date().toISOString(),
      status: 'sending' as any
    };
    
    setLocalMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setIsTyping(false);

    // Gửi thẳng qua WebSocket
    if (sendMessageViaWS) {
      console.log('🟢 Calling sendMessageViaWS...');
      sendMessageViaWS(receiverIdNum, messageContent);
    } else {
      console.error('❌ sendMessageViaWS function is missing!');
      setLocalMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      alert('Cannot send message: WebSocket not ready');
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    // Typing indicator temporarily disabled for STOMP WebSocket
    // Can be re-enabled when backend supports typing events
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <span className="text-gray-400">✓</span>;
      case 'delivered':
        return <span className="text-blue-500">✓✓</span>;
      case 'read':
        return <span className="text-blue-600">✓✓</span>;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      "bg-white flex flex-col",
      isEmbedded ? "h-full w-full" : "fixed bottom-4 right-4 w-80 h-96 z-50 rounded-lg shadow-xl border"
    )}>
      {/* Header - only show when not embedded */}
      {!isEmbedded && (
        <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-medium">
              {otherUserName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-medium text-sm">{otherUserName}</h3>
              <p className="text-xs text-blue-100">online</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-white hover:bg-blue-500 h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-white hover:bg-blue-500 h-8 w-8"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {isLoadingMessages ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm">Loading messages...</p>
          </div>
        ) : localMessages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-gray-400" />
            </div>
            <p className="font-medium">Start your conversation</p>
            <p className="text-sm text-gray-400 mt-1">Send a message to {otherUserName}</p>
          </div>
        ) : (
          localMessages.map((message) => {
            const isOwnMessage = message.senderId === parseInt(currentUserId);
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    isOwnMessage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className={`flex items-center justify-between mt-1 gap-2 ${
                    isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    <span className="text-xs">
                      {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true })}
                    </span>
                    {isOwnMessage && message.status && (
                      <span className="text-xs">
                        {getMessageStatusIcon(message.status)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-3">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 border-gray-300 focus:border-blue-400 focus:ring-blue-400"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="icon"
            className="shrink-0 bg-blue-600 hover:bg-blue-700 rounded-full w-10 h-10 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}