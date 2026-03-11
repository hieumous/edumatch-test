package com.edumatch.chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NotificationTemplateRequest {
    
    @NotBlank(message = "Name is required")
    private String name;
    
    private String description;
    
    @NotBlank(message = "Type is required")
    private String type; // SYSTEM, ANNOUNCEMENT, ALERT, UPDATE
    
    private String title;
    
    private String message;
    
    private String actionUrl;
    
    private String actionLabel;
    
    private String priority; // LOW, NORMAL, HIGH, URGENT
}

