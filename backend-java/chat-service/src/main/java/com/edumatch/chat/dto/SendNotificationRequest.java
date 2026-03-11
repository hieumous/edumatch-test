package com.edumatch.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SendNotificationRequest {
    
    @NotBlank(message = "Target audience is required")
    private String targetAudience; // ALL_USERS, APPLICANTS, PROVIDERS, PREMIUM, SPECIFIC
    
    private String specificEmail; // Required if targetAudience = SPECIFIC
    
    @NotBlank(message = "Type is required")
    private String type; // SYSTEM, ANNOUNCEMENT, ALERT, UPDATE
    
    @NotBlank(message = "Priority is required")
    private String priority; // LOW, NORMAL, HIGH, URGENT
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Message is required")
    private String message;
    
    private String actionUrl;
    
    private String actionLabel;
    
    @NotNull(message = "Send email flag is required")
    private Boolean sendEmail;
}

