package com.edumatch.chat.repository;

import com.edumatch.chat.model.NotificationHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface NotificationHistoryRepository extends JpaRepository<NotificationHistory, Long> {
    
    Page<NotificationHistory> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    @Query("SELECT COUNT(h) FROM NotificationHistory h")
    long countTotalSent();
    
    @Query("SELECT SUM(h.deliveredCount) FROM NotificationHistory h")
    Long sumDeliveredCount();
    
    @Query("SELECT SUM(h.pendingCount) FROM NotificationHistory h")
    Long sumPendingCount();
    
    @Query("SELECT SUM(h.failedCount) FROM NotificationHistory h")
    Long sumFailedCount();
    
    @Query("SELECT COUNT(h) FROM NotificationHistory h WHERE h.createdAt >= :startDate")
    long countByCreatedAtAfter(LocalDateTime startDate);
}

