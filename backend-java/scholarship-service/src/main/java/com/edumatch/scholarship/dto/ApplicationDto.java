package com.edumatch.scholarship.dto;

import com.edumatch.scholarship.model.Application;
import com.edumatch.scholarship.model.ApplicationDocument;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
public class ApplicationDto {
    private Long id;
    private Long applicantUserId;
    private Long opportunityId;
    private String opportunityTitle; // Thêm title của opportunity
    private String status;
    private LocalDateTime submittedAt;
    private List<ApplicationDocumentDto> documents;

    // --- CÁC TRƯỜNG BỔ SUNG TỪ FRONTEND ---
    private String applicantUserName;
    private String applicantEmail;
    private String phone;
    private java.math.BigDecimal gpa;
    private String coverLetter;
    private String motivation;
    private String additionalInfo;
    private String portfolioUrl;
    private String linkedinUrl;
    private String githubUrl;
    // --- ------------------------------ ---
    
    // Applicant profile information (from user service)
    private ApplicantProfileDto applicant;
    
    @Data
    @Builder
    public static class ApplicantProfileDto {
        private Long id;
        private String username;
        private String email;
        private String firstName;
        private String lastName;
        private Double gpa;
        private String major;
        private String university;
        private Integer yearOfStudy;
        private String skills; // Comma-separated
        private String researchInterests; // Comma-separated
    }

    // Hàm helper để chuyển từ Entity -> DTO
    public static ApplicationDto fromEntity(Application app, List<ApplicationDocument> docs) {
        return fromEntity(app, docs, null);
    }
    
    // Hàm helper với applicant profile
    public static ApplicationDto fromEntity(Application app, List<ApplicationDocument> docs, com.edumatch.scholarship.dto.client.UserDetailDto applicantProfile) {

        List<ApplicationDocumentDto> docDtos = docs.stream()
                .map(doc -> {
                    ApplicationDocumentDto dto = new ApplicationDocumentDto();
                    dto.setDocumentName(doc.getDocumentName());
                    dto.setDocumentUrl(doc.getDocumentUrl());
                    return dto;
                })
                .collect(Collectors.toList());

        ApplicationDto.ApplicationDtoBuilder builder = ApplicationDto.builder()
                .id(app.getId())
                .applicantUserId(app.getApplicantUserId())
                .opportunityId(app.getOpportunityId())
                .status(app.getStatus())
                .submittedAt(app.getSubmittedAt())
                .documents(docDtos)
                .applicantUserName(app.getApplicantUserName())
                .applicantEmail(app.getApplicantEmail())
                .phone(app.getPhone())
                .gpa(app.getGpa())
                .coverLetter(app.getCoverLetter())
                .motivation(app.getMotivation())
                .additionalInfo(app.getAdditionalInfo())
                .portfolioUrl(app.getPortfolioUrl())
                .linkedinUrl(app.getLinkedinUrl())
                .githubUrl(app.getGithubUrl());
        
        // Add applicant profile if available
        if (applicantProfile != null) {
            ApplicantProfileDto profileDto = ApplicantProfileDto.builder()
                    .id(applicantProfile.getId())
                    .username(applicantProfile.getUsername())
                    .email(applicantProfile.getEmail())
                    .firstName(applicantProfile.getFirstName())
                    .lastName(applicantProfile.getLastName())
                    .gpa(applicantProfile.getGpa())
                    .major(applicantProfile.getMajor())
                    .university(applicantProfile.getUniversity())
                    .yearOfStudy(applicantProfile.getYearOfStudy())
                    .skills(applicantProfile.getSkills())
                    .researchInterests(applicantProfile.getResearchInterests())
                    .build();
            builder.applicant(profileDto);
        }
        
        return builder.build();
    }

    // Hàm helper thứ 2 (khi không có document)
    public static ApplicationDto fromEntity(Application app) {
        return fromEntity(app, List.of(), null);
    }
}