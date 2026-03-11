package com.edumatch.chat.controller;

import com.edumatch.chat.dto.ApiResponse;
import com.edumatch.chat.dto.ChatMessageRequest;
import com.edumatch.chat.dto.ConversationDto;
import com.edumatch.chat.dto.FcmRegisterRequest;
import com.edumatch.chat.dto.MessageDto;
import com.edumatch.chat.model.Message;
import com.edumatch.chat.service.ChatService;
import com.edumatch.chat.service.FirebaseMessagingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api") // Tiền tố chung cho các API
@RequiredArgsConstructor
public class ChatHttpController {

    private final ChatService chatService;
    private final SimpMessagingTemplate simpMessagingTemplate;
    private final FirebaseMessagingService firebaseMessagingService;

    /**
     * API: POST /api/chat/send
     * Backup endpoint để gửi tin nhắn qua HTTP (khi WebSocket không khả dụng)
     */
    @PostMapping("/chat/send")
    public ResponseEntity<MessageDto> sendMessageHttp(
            @Valid @RequestBody ChatMessageRequest request,
            Authentication authentication) {

        // 1. Lưu tin nhắn vào DB qua service
        Message savedMessage = chatService.saveAndProcessMessage(request, authentication);

        // 2. Broadcast tin nhắn qua WebSocket cho người nhận (nếu họ đang online)
        MessageDto messageDto = MessageDto.fromEntity(savedMessage);
        
        String receiverDestination = "/topic/messages/" + request.getReceiverId();
        simpMessagingTemplate.convertAndSend(receiverDestination, messageDto);
        
        String senderDestination = "/topic/messages/" + savedMessage.getSenderId();
        simpMessagingTemplate.convertAndSend(senderDestination, messageDto);

        // 3. Trả về tin nhắn đã lưu cho client
        return ResponseEntity.ok(messageDto);
    }

    /**
     * API: POST /api/fcm/register
     */
    @PostMapping("/fcm/register")
    public ResponseEntity<ApiResponse> registerFcmToken(
            @Valid @RequestBody FcmRegisterRequest request,
            Authentication authentication) {

        chatService.registerFcmToken(request, authentication);
        return ResponseEntity.ok(new ApiResponse(true, "Token đã được đăng ký thành công"));
    }

    /**
     * API: GET /api/conversations
     */
    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDto>> getConversations(Authentication authentication) {

        List<ConversationDto> conversations = chatService.getConversations(authentication);
        return ResponseEntity.ok(conversations);
    }

    /**
     * API: GET /api/messages/{conversationId}
     * (Khớp yêu cầu [cite: 391])
     */
    @GetMapping("/messages/{conversationId}")
    public ResponseEntity<Page<Message>> getMessages(
            @PathVariable Long conversationId,
            Pageable pageable, // Spring tự động điền (vd: ?page=0&size=20)
            Authentication authentication) {

        Page<Message> messages = chatService.getMessagesForConversation(
                conversationId, pageable, authentication
        );
        return ResponseEntity.ok(messages);
    }
    
    /**
     * API: POST /api/fcm/test
     * Test endpoint để gửi notification thử nghiệm
     * Body: { "userId": 123, "title": "Test", "body": "Test message" }
     */
    @PostMapping("/fcm/test")
    public ResponseEntity<ApiResponse> testFcmNotification(
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {
        
        Long userId = Long.valueOf(payload.get("userId").toString());
        String title = payload.getOrDefault("title", "Test Notification").toString();
        String body = payload.getOrDefault("body", "This is a test notification").toString();
        
        firebaseMessagingService.sendNotification(
            userId, 
            title, 
            body, 
            "TEST",
            "test-ref-" + System.currentTimeMillis()
        );
        
        return ResponseEntity.ok(new ApiResponse(true, "Test notification sent. Check logs for details."));
    }
    
    /**
     * API: GET /api/fcm/status
     * Kiểm tra trạng thái Firebase initialization
     */
    @GetMapping("/fcm/status")
    public ResponseEntity<Map<String, Object>> checkFirebaseStatus() {
        boolean isInitialized = firebaseMessagingService.isFirebaseInitialized();
        return ResponseEntity.ok(Map.of(
            "firebase_initialized", isInitialized,
            "status", isInitialized ? "OK" : "ERROR",
            "message", isInitialized ? "Firebase is ready" : "Firebase initialization failed"
        ));
    }
}