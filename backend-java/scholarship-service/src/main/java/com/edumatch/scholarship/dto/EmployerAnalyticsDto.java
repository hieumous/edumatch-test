package com.edumatch.scholarship.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployerAnalyticsDto {
    // Overview stats
    private OverviewStats overview;
    
    // Scholarship performance
    private List<ScholarshipPerformance> scholarshipPerformance;
    
    // Monthly statistics
    private List<MonthlyStat> monthlyStats;
    
    // Status distribution
    private StatusDistribution statusDistribution;
    
    // Top universities and majors (for demographics)
    private List<UniversityStat> topUniversities;
    private List<MajorStat> topMajors;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverviewStats {
        private Long totalScholarships;
        private Long totalApplications;
        private Long acceptedApplications;
        private Long rejectedApplications;
        private Long pendingApplications;
        private Long activeScholarships;
        private Double acceptanceRate;
        private Double averageApplicationsPerScholarship;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScholarshipPerformance {
        private Long id;
        private String title;
        private Long applications;
        private Long accepted;
        private Long rejected;
        private Long pending;
        private Double acceptanceRate;
        private Double averageRating;
        private String status;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyStat {
        private String month;
        private Long applications;
        private Long accepted;
        private Long rejected;
        private Long pending;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusDistribution {
        private Long accepted;
        private Long pending;
        private Long rejected;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UniversityStat {
        private String name;
        private Long applications;
        private Double percentage;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MajorStat {
        private String name;
        private Long applications;
        private Double percentage;
    }
}

