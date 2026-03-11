package com.edumatch.chat.controller;

import com.edumatch.chat.model.Notification;
import com.edumatch.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final ChatService chatService; // Sử dụng lại ChatService để lấy UserID

    /**
     * API: GET /api/notifications
     * Mục tiêu: Lấy danh sách thông báo đã lưu trong DB cho user.
     */
    @GetMapping
    public ResponseEntity<Page<Notification>> getMyNotifications(
            Pageable pageable, // Ví dụ: ?page=0&size=20
            Authentication authentication) {

        // Lấy thông báo (Logic nằm trong ChatService)
        Page<Notification> notifications = chatService.getMyNotifications(pageable, authentication);
        return ResponseEntity.ok(notifications);
    }

    /**
     * API: PATCH /api/notifications/{id}/read
     * Mục tiêu: Đánh dấu 1 thông báo là "đã đọc".
     */
    @PatchMapping("/{notificationId}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT) // Trả về 204 No Content
    public void markAsRead(
            @PathVariable Long notificationId,
            Authentication authentication) {

        // Đánh dấu đã đọc (Logic nằm trong ChatService)
        chatService.markNotificationAsRead(notificationId, authentication);
    }

    /**
     * API: GET /api/notifications/unread-count
     * Mục tiêu: Lấy số lượng thông báo chưa đọc cho user hiện tại.
     * Admin sẽ đếm cả notifications cá nhân và admin notifications.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<java.util.Map<String, Long>> getUnreadNotificationCount(
            Authentication authentication) {

        long count = chatService.countUnreadNotifications(authentication);
        java.util.Map<String, Long> response = new java.util.HashMap<>();
        response.put("count", count);
        return ResponseEntity.ok(response);
    }
}