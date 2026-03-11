package com.edumatch.chat.service;

import com.edumatch.chat.config.RabbitMQConfig;
import com.edumatch.chat.dto.NotificationEvent;
import com.edumatch.chat.model.Notification;
import com.edumatch.chat.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer {

    private final NotificationRepository notificationRepository;
    private final FirebaseMessagingService firebaseMessagingService;
    private final SimpMessagingTemplate messagingTemplate; // WebSocket

    /**
     * Lắng nghe Queue "notification_queue"
     * Xử lý notification từ các service: Scholarship, Matching, Application
     */
    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_QUEUE)
    @Transactional
    public void handleNotificationEvent(NotificationEvent event) {
        log.info("📬 [NotificationConsumer] ============================================");
        log.info("📬 [NotificationConsumer] Received new event from RabbitMQ");
        log.debug("📬 [NotificationConsumer] Event details: {}", event);
        
        Long recipientId = event.getRecipientId();

        if (recipientId == null) {
            log.error("❌ [NotificationConsumer] CRITICAL: Không xác định được ID người nhận");
            log.error("❌ [NotificationConsumer] Event data: {}", event);
            log.error("❌ [NotificationConsumer] Kiểm tra: recipientId, userId, creatorUserId trong event");
            log.error("📬 [NotificationConsumer] ============================================");
            return;
        }

        log.info("📬 [NotificationConsumer] Recipient User ID: {}", recipientId);
        log.info("📬 [NotificationConsumer] Event Type: {}", event.getType());

        // Xử lý logic và tạo nội dung
        String type = Optional.ofNullable(event.getType()).orElse("GENERAL");
        String title = Optional.ofNullable(event.getTitle()).orElse("Cập nhật từ EduMatch");
        String body = Optional.ofNullable(event.getBody()).orElse("Bạn có thông báo mới.");
        String referenceId = Optional.ofNullable(event.getReferenceId()).orElse(null);

        // Xử lý các loại event cụ thể
        if ("SCHOLARSHIP_APPROVED".equals(type) || "SCHOLARSHIP_REJECTED".equals(type)) {
            log.info("📬 [NotificationConsumer] Processing SCHOLARSHIP status event");
            // scholarship.updated - thông báo cho người tạo
            title = Optional.ofNullable(event.getTitle()).orElse("Cập nhật học bổng");
            referenceId = event.getOpportunityId();
            log.debug("📬 [NotificationConsumer] Scholarship ID: {}", referenceId);
            
        } else if ("NEW_APPLICATION_ADMIN".equals(type)) {
            log.info("📬 [NotificationConsumer] Processing NEW_APPLICATION_ADMIN event");
            // Admin notification về đơn ứng tuyển mới
            title = Optional.ofNullable(event.getTitle()).orElse("📝 Đơn ứng tuyển mới");
            body = Optional.ofNullable(event.getBody()).orElse("Có một đơn ứng tuyển mới cần xem xét.");
            if (event.getApplicationId() != null) {
                referenceId = event.getApplicationId().toString();
            } else if (event.getReferenceId() != null) {
                referenceId = event.getReferenceId();
            }
            log.info("📬 [NotificationConsumer] NEW_APPLICATION_ADMIN - Application ID: {}, Recipient: {}", referenceId, recipientId);
            
        } else if ("NEW_SCHOLARSHIP_ADMIN".equals(type)) {
            log.info("📬 [NotificationConsumer] Processing NEW_SCHOLARSHIP_ADMIN event");
            // Admin notification về học bổng mới cần duyệt
            title = Optional.ofNullable(event.getTitle()).orElse("🎓 Học bổng mới cần duyệt");
            body = Optional.ofNullable(event.getBody()).orElse("Có một học bổng mới đang chờ duyệt.");
            if (event.getOpportunityId() != null) {
                referenceId = event.getOpportunityId().toString();
            } else if (event.getReferenceId() != null) {
                referenceId = event.getReferenceId();
            }
            log.info("📬 [NotificationConsumer] NEW_SCHOLARSHIP_ADMIN - Opportunity ID: {}, Recipient: {}", referenceId, recipientId);
            
        } else if (event.getApplicationId() != null) {
            log.info("📬 [NotificationConsumer] Processing APPLICATION status event");
            // Application status changed
            type = "APPLICATION_STATUS";
            title = String.format("Cập nhật đơn: %s", event.getStatus());
            referenceId = event.getApplicationId().toString();
            log.debug("📬 [NotificationConsumer] Application ID: {}", referenceId);
            
        } else if (event.getOpportunityId() != null && "NEW_MATCH".equals(type)) {
            log.info("📬 [NotificationConsumer] Processing NEW_MATCH event");
            // New match from matching service
            type = "NEW_MATCH";
            title = "🎯 Cơ hội mới phù hợp với bạn!";
            referenceId = event.getOpportunityId();
            log.debug("📬 [NotificationConsumer] Matched Opportunity ID: {}", referenceId);
        }

        log.info("📬 [NotificationConsumer] Final notification content:");
        log.info("📬 [NotificationConsumer]   Title: {}", title);
        log.info("📬 [NotificationConsumer]   Body: {}", body);
        log.info("📬 [NotificationConsumer]   Type: {}", type);
        log.info("📬 [NotificationConsumer]   Reference ID: {}", referenceId);

        // 1. Lưu vào CSDL
        log.info("💾 [NotificationConsumer] Saving to database...");
        Notification notification = Notification.builder()
                .userId(recipientId)
                .title(title)
                .body(body)
                .type(type)
                .referenceId(referenceId)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        log.info("✅ [NotificationConsumer] Saved Notification ID: {} for User {}", notification.getId(), recipientId);

        // 2. Gửi qua WebSocket (Real-time cho web)
        try {
            log.info("📡 [NotificationConsumer] Sending via WebSocket...");
            Map<String, Object> notifPayload = new HashMap<>();
            notifPayload.put("id", notification.getId());
            notifPayload.put("title", title);
            notifPayload.put("body", body);
            notifPayload.put("message", body); // Add 'message' field for frontend compatibility
            notifPayload.put("type", type);
            notifPayload.put("referenceId", referenceId);
            notifPayload.put("createdAt", notification.getCreatedAt());
            notifPayload.put("isRead", false);
            notifPayload.put("read", false); // Add 'read' field for frontend compatibility
            
            // Add opportunityTitle if present (for scholarship details in notification)
            if (event.getOpportunityTitle() != null) {
                notifPayload.put("opportunityTitle", event.getOpportunityTitle());
                log.info("📬 [NotificationConsumer] Added opportunityTitle: {}", event.getOpportunityTitle());
            }
            
            String destination = "/topic/notifications/" + recipientId;
            messagingTemplate.convertAndSend(destination, notifPayload);
            log.info("✅ [NotificationConsumer] WebSocket sent to: {}", destination);
        } catch (Exception e) {
            log.error("❌ [NotificationConsumer] WebSocket ERROR: {}", e.getMessage(), e);
        }

        // 3. Gửi Push Notification (FCM cho mobile)
        log.info("📱 [NotificationConsumer] Delegating to FirebaseMessagingService...");
        try {
            firebaseMessagingService.sendNotification(
                    recipientId,
                    title,
                    body,
                    type,
                    referenceId
            );
            log.info("✅ [NotificationConsumer] FCM delegation completed (check FCM logs above)");
        } catch (Exception e) {
            log.error("❌ [NotificationConsumer] FCM delegation ERROR: {}", e.getMessage(), e);
        }
        
        log.info("✅ [NotificationConsumer] Event processing COMPLETE for User {}", recipientId);
        log.info("📬 [NotificationConsumer] ============================================");
    }
}