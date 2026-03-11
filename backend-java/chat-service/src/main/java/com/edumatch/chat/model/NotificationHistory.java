package com.edumatch.chat.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private TargetAudience targetAudience;

    @Column(length = 255)
    private String specificEmail; // Nếu targetAudience = SPECIFIC

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private NotificationType type;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private NotificationPriority priority;

    @Column(length = 500)
    private String actionUrl;

    @Column(length = 100)
    private String actionLabel;

    @Column(nullable = false)
    private Integer totalRecipients;

    @Column(nullable = false)
    private Integer deliveredCount;

    @Column(nullable = false)
    private Integer failedCount;

    @Column(nullable = false)
    private Integer pendingCount;

    @Column(nullable = false)
    private Boolean sendEmail;

    @Column(name = "created_by")
    private Long createdBy; // Admin user ID

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum TargetAudience {
        ALL_USERS,
        APPLICANTS,
        PROVIDERS,
        PREMIUM,
        SPECIFIC
    }

    public enum NotificationType {
        SYSTEM,
        ANNOUNCEMENT,
        ALERT,
        UPDATE
    }

    public enum NotificationPriority {
        LOW,
        NORMAL,
        HIGH,
        URGENT
    }
}

