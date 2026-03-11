package com.edumatch.chat.dto;

import lombok.Data;

/**
 * DTO này đại diện cho tin nhắn mà Client GỬI lên server
 * Payload: { "receiverId": "...", "content": "..." }
 */
@Data
public class ChatMessageRequest {

    // ID của người nhận
    private Long receiverId;

    private String content;
}