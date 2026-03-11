package com.edumatch.chat.controller;

import com.edumatch.chat.dto.*;
import com.edumatch.chat.model.NotificationHistory;
import com.edumatch.chat.model.NotificationTemplate;
import com.edumatch.chat.service.AdminNotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private final AdminNotificationService adminNotificationService;

    /**
     * POST /api/admin/notifications/send
     * Gửi thông báo đến users
     */
    @PostMapping("/send")
    public ResponseEntity<NotificationHistoryResponse> sendNotification(
            @Valid @RequestBody SendNotificationRequest request,
            Authentication authentication,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        try {
            NotificationHistory history = adminNotificationService.sendNotification(request, authentication, authHeader);
            NotificationHistoryResponse response = NotificationHistoryResponse.builder()
                    .id(history.getId())
                    .title(history.getTitle())
                    .message(history.getMessage())
                    .targetAudience(history.getTargetAudience().name())
                    .type(history.getType().name())
                    .priority(history.getPriority().name())
                    .totalRecipients(history.getTotalRecipients())
                    .deliveredCount(history.getDeliveredCount())
                    .failedCount(history.getFailedCount())
                    .pendingCount(history.getPendingCount())
                    .createdAt(history.getCreatedAt())
                    .build();
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ [AdminNotificationController] Lỗi gửi notification: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/admin/notifications/stats
     * Lấy thống kê notifications
     */
    @GetMapping("/stats")
    public ResponseEntity<NotificationStatsResponse> getStats() {
        NotificationStatsResponse stats = adminNotificationService.getStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * GET /api/admin/notifications/history
     * Lấy lịch sử notifications
     */
    @GetMapping("/history")
    public ResponseEntity<Page<NotificationHistoryResponse>> getHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<NotificationHistoryResponse> history = adminNotificationService.getHistory(pageable);
        return ResponseEntity.ok(history);
    }

    /**
     * GET /api/admin/notifications/templates
     * Lấy tất cả templates
     */
    @GetMapping("/templates")
    public ResponseEntity<List<NotificationTemplateResponse>> getAllTemplates() {
        List<NotificationTemplateResponse> templates = adminNotificationService.getAllTemplates();
        return ResponseEntity.ok(templates);
    }

    /**
     * GET /api/admin/notifications/templates/{id}
     * Lấy một template
     */
    @GetMapping("/templates/{id}")
    public ResponseEntity<NotificationTemplateResponse> getTemplate(@PathVariable Long id) {
        NotificationTemplateResponse template = adminNotificationService.getTemplate(id);
        return ResponseEntity.ok(template);
    }

    /**
     * POST /api/admin/notifications/templates
     * Tạo template mới
     */
    @PostMapping("/templates")
    public ResponseEntity<NotificationTemplateResponse> createTemplate(
            @Valid @RequestBody NotificationTemplateRequest request) {
        
        NotificationTemplate template = adminNotificationService.createTemplate(request);
        NotificationTemplateResponse response = NotificationTemplateResponse.builder()
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
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * PUT /api/admin/notifications/templates/{id}
     * Cập nhật template
     */
    @PutMapping("/templates/{id}")
    public ResponseEntity<NotificationTemplateResponse> updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody NotificationTemplateRequest request) {
        
        NotificationTemplate template = adminNotificationService.updateTemplate(id, request);
        NotificationTemplateResponse response = NotificationTemplateResponse.builder()
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
        
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/admin/notifications/templates/{id}
     * Xóa template
     */
    @DeleteMapping("/templates/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTemplate(@PathVariable Long id) {
        adminNotificationService.deleteTemplate(id);
    }
}

