package com.edumatch.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationStatsResponse {
    private Long totalSent;
    private Long delivered;
    private Long pending;
    private Long failed;
    private Double changePercentage; // So với tháng trước
}

