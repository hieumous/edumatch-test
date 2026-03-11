package com.edumatch.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationHistoryResponse {
    private Long id;
    private String title;
    private String message;
    private String targetAudience;
    private String type;
    private String priority;
    private Integer totalRecipients;
    private Integer deliveredCount;
    private Integer failedCount;
    private Integer pendingCount;
    private LocalDateTime createdAt;
}

