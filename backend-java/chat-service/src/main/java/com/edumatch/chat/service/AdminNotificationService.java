package com.edumatch.chat.service;

import com.edumatch.chat.config.RabbitMQConfig;
import com.edumatch.chat.dto.*;
import com.edumatch.chat.model.NotificationHistory;
import com.edumatch.chat.model.NotificationTemplate;
import com.edumatch.chat.repository.NotificationHistoryRepository;
import com.edumatch.chat.repository.NotificationTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminNotificationService {

    private final NotificationHistoryRepository historyRepository;
    private final NotificationTemplateRepository templateRepository;
    private final RabbitTemplate rabbitTemplate;
    private final RestTemplate restTemplate;

    @Value("${app.services.auth-service.url:http://localhost:8081}")
    private String authServiceUrl;

    /**
     * Gửi thông báo đến users dựa trên targetAudience
     */
    @Transactional
    public NotificationHistory sendNotification(SendNotificationRequest request, Authentication authentication, String authHeader) {
        log.info("📬 [AdminNotificationService] Bắt đầu gửi thông báo: {}", request.getTitle());
        
        // Lấy admin user ID
        Long adminUserId = getCurrentUserId(authentication);
        
        // Lấy danh sách users dựa trên targetAudience
        List<Long> recipientIds = getRecipientIds(request, authHeader);
        
        if (recipientIds.isEmpty()) {
            log.warn("⚠️ [AdminNotificationService] Không có người nhận nào");
            throw new RuntimeException("No recipients found");
        }
        
        log.info("📬 [AdminNotificationService] Số lượng người nhận: {}", recipientIds.size());
        
        int deliveredCount = 0;
        int failedCount = 0;
        int pendingCount = 0;
        
        // Gửi notification đến từng user qua RabbitMQ
        for (Long userId : recipientIds) {
            try {
                sendNotificationToUser(userId, request);
                deliveredCount++;
            } catch (Exception e) {
                log.error("❌ [AdminNotificationService] Lỗi gửi notification đến user {}: {}", userId, e.getMessage());
                failedCount++;
            }
        }
        
        // Lưu history
        NotificationHistory history = NotificationHistory.builder()
                .title(request.getTitle())
                .message(request.getMessage())
                .targetAudience(NotificationHistory.TargetAudience.valueOf(request.getTargetAudience()))
                .specificEmail(request.getSpecificEmail())
                .type(NotificationHistory.NotificationType.valueOf(request.getType()))
                .priority(NotificationHistory.NotificationPriority.valueOf(request.getPriority()))
                .actionUrl(request.getActionUrl())
                .actionLabel(request.getActionLabel())
                .totalRecipients(recipientIds.size())
                .deliveredCount(deliveredCount)
                .failedCount(failedCount)
                .pendingCount(pendingCount)
                .sendEmail(request.getSendEmail())
                .createdBy(adminUserId)
                .build();
        
        history = historyRepository.save(history);
        log.info("✅ [AdminNotificationService] Đã lưu history: {}", history.getId());
        
        return history;
    }

    /**
     * Lấy danh sách user IDs dựa trên targetAudience
     */
    private List<Long> getRecipientIds(SendNotificationRequest request, String authHeader) {
        String targetAudience = request.getTargetAudience();
        
        if ("SPECIFIC".equals(targetAudience)) {
            // Lấy user ID từ email
            if (request.getSpecificEmail() == null || request.getSpecificEmail().isEmpty()) {
                throw new RuntimeException("Specific email is required for SPECIFIC target audience");
            }
            return getUserIdByEmail(request.getSpecificEmail(), authHeader);
        }
        
        // Gọi auth-service để lấy users
        String role = null;
        if ("APPLICANTS".equals(targetAudience)) {
            role = "ROLE_USER";
        } else if ("PROVIDERS".equals(targetAudience)) {
            role = "ROLE_EMPLOYER";
        } else if ("PREMIUM".equals(targetAudience)) {
            // TODO: Filter by subscription type
            role = null; // Lấy tất cả users, sau đó filter
        }
        
        return getAllUserIds(role, authHeader);
    }

    /**
     * Lấy tất cả user IDs từ auth-service
     */
    private List<Long> getAllUserIds(String role, String authHeader) {
        List<Long> userIds = new java.util.ArrayList<>();
        int page = 0;
        int size = 100;
        boolean hasMore = true;
        
        while (hasMore) {
            try {
                String url = authServiceUrl + "/api/admin/users?page=" + page + "&size=" + size;
                if (role != null) {
                    url += "&role=" + role;
                }
                
                HttpHeaders headers = new HttpHeaders();
                headers.set("Authorization", authHeader);
                HttpEntity<String> entity = new HttpEntity<>(headers);
                
                ResponseEntity<Map> response = restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        entity,
                        Map.class
                );
                
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    Map<String, Object> body = response.getBody();
                    List<Map<String, Object>> users = (List<Map<String, Object>>) body.get("users");
                    
                    if (users != null) {
                        for (Map<String, Object> user : users) {
                            Object id = user.get("id");
                            if (id != null) {
                                userIds.add(Long.valueOf(id.toString()));
                            }
                        }
                    }
                    
                    Integer totalPages = (Integer) body.get("totalPages");
                    hasMore = page < (totalPages != null ? totalPages - 1 : 0);
                    page++;
                } else {
                    hasMore = false;
                }
            } catch (Exception e) {
                log.error("❌ [AdminNotificationService] Lỗi lấy users từ auth-service: {}", e.getMessage());
                hasMore = false;
            }
        }
        
        return userIds;
    }

    /**
     * Lấy user ID từ email
     */
    private List<Long> getUserIdByEmail(String email, String authHeader) {
        try {
            String url = authServiceUrl + "/api/admin/users?keyword=" + email + "&size=1";
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", authHeader);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    Map.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                List<Map<String, Object>> users = (List<Map<String, Object>>) body.get("users");
                
                if (users != null && !users.isEmpty()) {
                    Object id = users.get(0).get("id");
                    if (id != null) {
                        return List.of(Long.valueOf(id.toString()));
                    }
                }
            }
        } catch (Exception e) {
            log.error("❌ [AdminNotificationService] Lỗi lấy user từ email: {}", e.getMessage());
        }
        
        return List.of();
    }

    /**
     * Gửi notification đến một user qua RabbitMQ
     */
    private void sendNotificationToUser(Long userId, SendNotificationRequest request) {
        Map<String, Object> event = new HashMap<>();
        event.put("recipientId", userId);
        event.put("title", request.getTitle());
        event.put("body", request.getMessage());
        event.put("type", "ADMIN_" + request.getType());
        event.put("referenceId", null);
        
        // Gửi qua RabbitMQ
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE_NAME,
                "notification.application.status", // Sử dụng routing key có sẵn
                event
        );
        
        log.debug("📤 [AdminNotificationService] Đã gửi notification event cho user: {}", userId);
    }

    /**
     * Lấy stats
     */
    public NotificationStatsResponse getStats() {
        long totalSent = historyRepository.countTotalSent();
        Long delivered = historyRepository.sumDeliveredCount();
        Long pending = historyRepository.sumPendingCount();
        Long failed = historyRepository.sumFailedCount();
        
        // Tính % thay đổi so với tháng trước
        LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);
        long lastMonthCount = historyRepository.countByCreatedAtAfter(oneMonthAgo);
        double changePercentage = totalSent > 0 
                ? ((double)(totalSent - lastMonthCount) / lastMonthCount) * 100 
                : 0.0;
        
        return NotificationStatsResponse.builder()
                .totalSent(totalSent)
                .delivered(delivered != null ? delivered : 0L)
                .pending(pending != null ? pending : 0L)
                .failed(failed != null ? failed : 0L)
                .changePercentage(changePercentage)
                .build();
    }

    /**
     * Lấy lịch sử notifications
     */
    public Page<NotificationHistoryResponse> getHistory(Pageable pageable) {
        Page<NotificationHistory> history = historyRepository.findAllByOrderByCreatedAtDesc(pageable);
        
        return history.map(h -> NotificationHistoryResponse.builder()
                .id(h.getId())
                .title(h.getTitle())
                .message(h.getMessage())
                .targetAudience(h.getTargetAudience().name())
                .type(h.getType().name())
                .priority(h.getPriority().name())
                .totalRecipients(h.getTotalRecipients())
                .deliveredCount(h.getDeliveredCount())
                .failedCount(h.getFailedCount())
                .pendingCount(h.getPendingCount())
                .createdAt(h.getCreatedAt())
                .build());
    }

    /**
     * CRUD Templates
     */
    public NotificationTemplate createTemplate(NotificationTemplateRequest request) {
        NotificationTemplate template = NotificationTemplate.builder()
                .name(request.getName())
                .description(request.getDescription())
                .type(NotificationTemplate.NotificationType.valueOf(request.getType()))
                .title(request.getTitle())
                .message(request.getMessage())
                .actionUrl(request.getActionUrl())
                .actionLabel(request.getActionLabel())
                .priority(request.getPriority() != null 
                        ? NotificationTemplate.NotificationPriority.valueOf(request.getPriority())
                        : NotificationTemplate.NotificationPriority.NORMAL)
                .build();
        
        return templateRepository.save(template);
    }

    public List<NotificationTemplateResponse> getAllTemplates() {
        return templateRepository.findAll().stream()
                .map(this::toTemplateResponse)
                .collect(Collectors.toList());
    }

    public NotificationTemplateResponse getTemplate(Long id) {
        NotificationTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        return toTemplateResponse(template);
    }

    public NotificationTemplate updateTemplate(Long id, NotificationTemplateRequest request) {
        NotificationTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        
        template.setName(request.getName());
        template.setDescription(request.getDescription());
        template.setType(NotificationTemplate.NotificationType.valueOf(request.getType()));
        template.setTitle(request.getTitle());
        template.setMessage(request.getMessage());
        template.setActionUrl(request.getActionUrl());
        template.setActionLabel(request.getActionLabel());
        if (request.getPriority() != null) {
            template.setPriority(NotificationTemplate.NotificationPriority.valueOf(request.getPriority()));
        }
        
        return templateRepository.save(template);
    }

    public void deleteTemplate(Long id) {
        templateRepository.deleteById(id);
    }

    private NotificationTemplateResponse toTemplateResponse(NotificationTemplate template) {
        return NotificationTemplateResponse.builder()
                .id(template.getId())
                .name(template.getName())
                .description(template.getDescription())
                .type(template.getType().name())
                .title(template.getTitle())
                .message(template.getMessage())
                .actionUrl(template.getActionUrl())
                .actionLabel(template.getActionLabel())
                .priority(template.getPriority().name())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .build();
    }

    private Long getCurrentUserId(Authentication authentication) {
        // Extract user ID from authentication principal
        if (authentication != null && authentication.getPrincipal() != null) {
            try {
                // Assuming principal is UserDetails with username
                String username = authentication.getName();
                // TODO: Get user ID from username via auth-service if needed
                return 1L; // Placeholder - should extract from JWT claims
            } catch (Exception e) {
                log.warn("⚠️ [AdminNotificationService] Không thể lấy user ID từ authentication: {}", e.getMessage());
            }
        }
        return 1L; // Default admin ID
    }
}

