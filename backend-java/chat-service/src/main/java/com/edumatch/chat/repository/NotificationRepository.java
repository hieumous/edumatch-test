package com.edumatch.chat.repository;

import com.edumatch.chat.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Tìm thông báo cho một user ID, có phân trang.
     * (Sắp xếp theo thời gian tạo giảm dần (DESC) để lấy thông báo mới nhất trước)
     */
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Tìm thông báo cho nhiều user IDs (dùng cho admin lấy cả notifications cá nhân và admin notifications)
     */
    Page<Notification> findByUserIdInOrderByCreatedAtDesc(List<Long> userIds, Pageable pageable);

    /**
     * Đếm số thông báo chưa đọc cho một user ID
     */
    long countByUserIdAndIsReadFalse(Long userId);

    /**
     * Đếm số thông báo chưa đọc cho nhiều user IDs (dùng cho admin)
     */
    long countByUserIdInAndIsReadFalse(List<Long> userIds);
}