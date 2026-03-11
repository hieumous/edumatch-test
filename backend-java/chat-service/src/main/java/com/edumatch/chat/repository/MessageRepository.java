package com.edumatch.chat.repository;

import com.edumatch.chat.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * Tìm tin nhắn theo ID cuộc hội thoại và có phân trang.
     * (Sắp xếp theo thời gian gửi giảm dần (DESC) để lấy tin nhắn mới nhất trước)
     */
    Page<Message> findByConversationIdOrderBySentAtDesc(Long conversationId, Pageable pageable);
    
    /**
     * Lấy tin nhắn cuối cùng của một cuộc hội thoại
     */
    Message findTopByConversationIdOrderBySentAtDesc(Long conversationId);
}