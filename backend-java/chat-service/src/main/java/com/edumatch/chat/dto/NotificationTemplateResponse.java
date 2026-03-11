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
public class NotificationTemplateResponse {
    private Long id;
    private String name;
    private String description;
    private String type;
    private String title;
    private String message;
    private String actionUrl;
    private String actionLabel;
    private String priority;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

