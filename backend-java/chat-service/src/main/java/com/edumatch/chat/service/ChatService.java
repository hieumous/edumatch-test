package com.edumatch.chat.service;

import com.edumatch.chat.dto.ChatMessageRequest;
import com.edumatch.chat.dto.ConversationDto;
import com.edumatch.chat.dto.FcmRegisterRequest;
import com.edumatch.chat.model.FcmToken;
import com.edumatch.chat.dto.UserDetailDto;
import com.edumatch.chat.model.Conversation;
import com.edumatch.chat.model.Message;
import com.edumatch.chat.repository.ConversationRepository;
import com.edumatch.chat.repository.FcmTokenRepository;
import com.edumatch.chat.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import com.edumatch.chat.dto.UserDetailDto;
import com.edumatch.chat.model.Notification;
import com.edumatch.chat.repository.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final FcmTokenRepository fcmTokenRepository;
    private final NotificationRepository notificationRepository;
    private final FirebaseMessagingService firebaseMessagingService;
    private final RestTemplate restTemplate;

    @Value("${app.services.auth-service.url:http://auth-service:8081}") // Lấy URL từ properties
    private String authServiceUrl;

    /**
     * Xử lý và lưu tin nhắn mới
     */
    @Transactional
    public Message saveAndProcessMessage(ChatMessageRequest request, Authentication authentication) {
        // 1. Lấy thông tin người gửi (Sender)
        // Lấy username và token từ Authentication (đã được Interceptor xác thực)
        String username = authentication.getName();
        String token = (String) authentication.getCredentials();

        // Gọi Auth-Service để lấy ID (Long) của người gửi
        UserDetailDto sender = getUserDetailsFromAuthService(username, token);
        Long senderId = sender.getId();
        Long receiverId = request.getReceiverId();

        // 2. Tìm hoặc Tạo cuộc hội thoại (Conversation)
        Conversation conversation = findOrCreateConversation(senderId, receiverId);

        // 3. Tạo và Lưu tin nhắn (Message)
        Message message = Message.builder()
                .conversationId(conversation.getId())
                .senderId(senderId)
                .content(request.getContent())
                // sentAt được tự động điền bởi @CreationTimestamp
                .build();

        Message savedMessage = messageRepository.save(message);
        log.info("Đã lưu tin nhắn mới (ID: {}) vào cuộc hội thoại (ID: {})",
                savedMessage.getId(), conversation.getId());

        // 4. Gửi Push Notification cho người nhận
        try {
            // Cắt nội dung tin nhắn nếu dài quá 50 ký tự
            String notificationBody = request.getContent();
            if (notificationBody != null && notificationBody.length() > 50) {
                notificationBody = notificationBody.substring(0, 50) + "...";
            }
            
            // Gửi thông báo qua Firebase
            firebaseMessagingService.sendNotification(
                receiverId,
                "Bạn có tin nhắn mới",
                notificationBody,
                "CHAT_MESSAGE",
                conversation.getId().toString()
            );
            log.info("Đã gửi push notification cho User {}", receiverId);
        } catch (Exception e) {
            // Không rollback transaction nếu gửi thông báo lỗi
            log.error("Lỗi khi gửi push notification cho User {}: {}", receiverId, e.getMessage(), e);
        }

        return savedMessage;
    }

    /**
     * Tìm cuộc hội thoại giữa 2 người, nếu không có thì tạo mới.
     */
    private Conversation findOrCreateConversation(Long senderId, Long receiverId) {
        return conversationRepository.findByParticipants(senderId, receiverId)
                .map(conv -> {
                    // Nếu tìm thấy, cập nhật thời gian
                    conv.setLastMessageAt(LocalDateTime.now());
                    return conversationRepository.save(conv);
                })
                .orElseGet(() -> {
                    // Nếu không tìm thấy, tạo mới
                    Conversation newConv = Conversation.builder()
                            .participant1Id(senderId)
                            .participant2Id(receiverId)
                            .lastMessageAt(LocalDateTime.now())
                            .build();
                    log.info("Tạo cuộc hội thoại mới giữa User {} và User {}", senderId, receiverId);
                    return conversationRepository.save(newConv);
                });
    }
    /**
     * (Logic cho API: POST /api/fcm/register)
     * Đăng ký hoặc cập nhật FCM token cho user
     */
    @Transactional
    public void registerFcmToken(FcmRegisterRequest request, Authentication authentication) {
        log.info("📱 [FCM Register] Bắt đầu đăng ký FCM token");
        log.debug("📱 [FCM Register] Auth principal: {}", authentication.getName());
        
        // 1. Lấy UserID (Long)
        UserDetailDto user = getUserDetailsFromAuthService(
                authentication.getName(),
                (String) authentication.getCredentials()
        );
        Long userId = user.getId();
        log.info("📱 [FCM Register] User ID: {}", userId);

        // Validate token
        if (request.getFcmToken() == null || request.getFcmToken().trim().isEmpty()) {
            log.error("❌ [FCM Register] FCM token is null or empty for User {}", userId);
            throw new IllegalArgumentException("FCM token cannot be empty");
        }
        
        log.debug("📱 [FCM Register] New token: {}...", 
                  request.getFcmToken().length() > 20 ? request.getFcmToken().substring(0, 20) : request.getFcmToken());

        // 2. Tìm token cũ (nếu có)
        FcmToken token = fcmTokenRepository.findByUserId(userId)
                .orElse(new FcmToken()); // Nếu không có, tạo mới

        boolean isNewToken = token.getId() == null;
        if (isNewToken) {
            log.info("📱 [FCM Register] Creating NEW token entry for User {}", userId);
        } else {
            log.info("📱 [FCM Register] UPDATING existing token (ID: {}) for User {}", token.getId(), userId);
        }

        // 3. Cập nhật
        token.setUserId(userId);
        token.setDeviceToken(request.getFcmToken());
        fcmTokenRepository.save(token);
        
        log.info("✅ [FCM Register] Token {} successfully for User {}", isNewToken ? "created" : "updated", userId);
    }

    /**
     * (Logic cho API: GET /api/conversations)
     * Lấy danh sách cuộc hội thoại của user
     */
    @Transactional(readOnly = true)
    public List<ConversationDto> getConversations(Authentication authentication) {
        // 1. Lấy UserID (Long)
        UserDetailDto user = getUserDetailsFromAuthService(
                authentication.getName(),
                (String) authentication.getCredentials()
        );
        Long currentUserId = user.getId();
        String token = (String) authentication.getCredentials();

        // 2. Lấy danh sách Entity
        List<Conversation> conversations = conversationRepository.findByParticipantId(currentUserId);

        // 3. Chuyển đổi sang DTO với thông tin user name
        return conversations.stream()
                .map(conv -> {
                    // Tìm ID của người "kia"
                    Long otherId = conv.getParticipant1Id().equals(currentUserId)
                            ? conv.getParticipant2Id()
                            : conv.getParticipant1Id();
                    
                    // Lấy tên user từ Auth-Service
                    UserDetailDto otherUser = getUserDetailsByIdFromAuthService(otherId, token);
                    String otherUserName = (otherUser != null && otherUser.getUsername() != null) 
                            ? otherUser.getUsername() 
                            : "User " + otherId;
                    
                    // Lấy tin nhắn cuối cùng
                    Message lastMsg = messageRepository.findTopByConversationIdOrderBySentAtDesc(conv.getId());
                    String lastMessage = (lastMsg != null) ? lastMsg.getContent() : null;
                    
                    return ConversationDto.fromEntity(conv, currentUserId, otherUserName, lastMessage);
                })
                .collect(Collectors.toList());
    }

    /**
     * (Logic cho API: GET /api/messages/{conversationId})
     * Lấy lịch sử tin nhắn (phân trang)
     */
    @Transactional(readOnly = true)
    public Page<Message> getMessagesForConversation(Long conversationId, Pageable pageable, Authentication authentication) {
        // 1. Lấy UserID (Long)
        UserDetailDto user = getUserDetailsFromAuthService(
                authentication.getName(),
                (String) authentication.getCredentials()
        );
        Long currentUserId = user.getId();

        // 2. Kiểm tra quyền
        // (User phải là 1 trong 2 người tham gia hội thoại)
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cuộc hội thoại"));

        if (!conversation.getParticipant1Id().equals(currentUserId) &&
                !conversation.getParticipant2Id().equals(currentUserId)) {
            log.warn("User {} cố gắng truy cập trái phép vào cuộc hội thoại {}",
                    currentUserId, conversationId);
            throw new AccessDeniedException("Bạn không có quyền xem cuộc hội thoại này");
        }

        // 3. Lấy dữ liệu (phân trang)
        // (Chúng ta trả về Page<Message> (Entity) vì MessageDto gần như giống hệt Message Entity)
        return messageRepository.findByConversationIdOrderBySentAtDesc(conversationId, pageable);
    }

    /**
     * Lấy thông tin user bằng ID từ Auth-Service
     */
    private UserDetailDto getUserDetailsByIdFromAuthService(Long userId, String token) {
        String url = authServiceUrl + "/api/internal/user/id/" + userId;
        log.info("ChatService: Calling Auth-Service to get user details for userId: {}", userId);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<UserDetailDto> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, UserDetailDto.class
            );
            UserDetailDto user = response.getBody();
            if (user == null || user.getId() == null) {
                log.warn("Không thể lấy thông tin user ID {} từ Auth-Service.", userId);
                return null;
            }
            log.info("ChatService: Successfully received user details, username={}", user.getUsername());
            return user;
        } catch (Exception ex) {
            log.error("Lỗi khi gọi Auth-Service để lấy user ID {}: {}", userId, ex.getMessage());
            return null;
        }
    }

    /**
     * Hàm helper gọi sang Auth-Service để lấy UserID (Long) từ Username (String).
     */
    private UserDetailDto getUserDetailsFromAuthService(String username, String token) {
        String url = authServiceUrl + "/api/internal/user/" + username;
        log.info("ChatService: Calling Auth-Service to get user details for: {}", username);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<UserDetailDto> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, UserDetailDto.class
            );
            UserDetailDto user = response.getBody();
            if (user == null || user.getId() == null) {
                throw new RuntimeException("Không thể lấy thông tin (ID) user từ Auth-Service.");
            }
            log.info("ChatService: Successfully received user details, userId={}", user.getId());
            return user;
        } catch (Exception ex) {
            log.error("Lỗi khi gọi Auth-Service: {}", ex.getMessage());
            throw new IllegalStateException("Không thể kết nối hoặc xác thực với Auth-Service.");
        }
    }
    /**
     * (Logic cho API: GET /api/notifications)
     * Lấy danh sách thông báo đã lưu trong DB của user
     * Admin sẽ lấy cả notifications cá nhân và admin notifications (userId = -1)
     */
    @Transactional(readOnly = true)
    public Page<Notification> getMyNotifications(Pageable pageable, Authentication authentication) {
        // 1. Lấy UserID (Long)
        UserDetailDto user = getUserDetailsFromAuthService(
                authentication.getName(),
                (String) authentication.getCredentials()
        );
        Long currentUserId = user.getId();
        
        log.info("📬 [ChatService] getMyNotifications - User ID: {}, Page: {}, Size: {}", 
                currentUserId, pageable.getPageNumber(), pageable.getPageSize());

        // 2. Kiểm tra xem user có phải admin không
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        // 3. Lấy dữ liệu
        Page<Notification> result;
        if (isAdmin) {
            // Admin lấy cả notifications của mình và admin notifications (userId = -1)
            java.util.List<Long> userIds = java.util.Arrays.asList(currentUserId, -1L);
            result = notificationRepository.findByUserIdInOrderByCreatedAtDesc(userIds, pageable);
            log.info("📬 [ChatService] Admin query - Found {} notifications for user IDs: {}", 
                    result.getTotalElements(), userIds);
        } else {
            // User thường chỉ lấy notifications của mình
            result = notificationRepository.findByUserIdOrderByCreatedAtDesc(currentUserId, pageable);
            log.info("📬 [ChatService] User query - Found {} notifications for user ID: {}", 
                    result.getTotalElements(), currentUserId);
        }
        
        // Log first few notifications for debugging
        if (result.getContent().size() > 0) {
            log.info("📬 [ChatService] Sample notifications: {}", 
                    result.getContent().stream()
                        .limit(3)
                        .map(n -> String.format("ID:%d, Title:%s, Type:%s", n.getId(), n.getTitle(), n.getType()))
                        .collect(java.util.stream.Collectors.joining(", ")));
        } else {
            log.warn("📬 [ChatService] No notifications found in database for user ID: {}", currentUserId);
        }
        
        return result;
    }

    /**
     * (Logic cho API: PATCH /api/notifications/{id}/read)
     * Đánh dấu thông báo là đã đọc
     * Admin có thể đánh dấu đọc cả admin notifications (userId = -1)
     */
    @Transactional
    public void markNotificationAsRead(Long notificationId, Authentication authentication) {
        // 1. Lấy UserID (Long)
        UserDetailDto user = getUserDetailsFromAuthService(
                authentication.getName(),
                (String) authentication.getCredentials()
        );
        Long currentUserId = user.getId();

        // 2. Kiểm tra xem user có phải admin không
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        // 3. Tìm thông báo
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông báo với ID: " + notificationId));

        // 4. Kiểm tra quyền sở hữu (Bắt buộc)
        // Admin có thể đánh dấu đọc cả admin notifications (userId = -1) và notifications của mình
        if (!notification.getUserId().equals(currentUserId) && !(isAdmin && notification.getUserId().equals(-1L))) {
            log.warn("User {} cố gắng đánh dấu thông báo {} của người khác là đã đọc.",
                    currentUserId, notificationId);
            throw new AccessDeniedException("Bạn không có quyền chỉnh sửa thông báo này.");
        }

        // 5. Đánh dấu đã đọc và lưu
        notification.setRead(true);
        notificationRepository.save(notification);
        log.info("✅ Đã đánh dấu thông báo ID: {} là đã đọc bởi User {}", notificationId, currentUserId);
    }

    /**
     * Đếm số thông báo chưa đọc cho user hiện tại
     * Admin sẽ đếm cả notifications cá nhân và admin notifications (userId = -1)
     */
    @Transactional(readOnly = true)
    public long countUnreadNotifications(Authentication authentication) {
        // 1. Lấy UserID (Long)
        UserDetailDto user = getUserDetailsFromAuthService(
                authentication.getName(),
                (String) authentication.getCredentials()
        );
        Long currentUserId = user.getId();

        // 2. Kiểm tra xem user có phải admin không
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        // 3. Đếm thông báo chưa đọc
        if (isAdmin) {
            // Admin đếm cả notifications của mình và admin notifications (userId = -1)
            java.util.List<Long> userIds = java.util.Arrays.asList(currentUserId, -1L);
            return notificationRepository.countByUserIdInAndIsReadFalse(userIds);
        } else {
            // User thường chỉ đếm notifications của mình
            return notificationRepository.countByUserIdAndIsReadFalse(currentUserId);
        }
    }
}
