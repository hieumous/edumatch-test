package com.edumatch.scholarship.service;

import com.edumatch.scholarship.dto.ApplicationDto;
import com.edumatch.scholarship.dto.CreateApplicationRequest;
import com.edumatch.scholarship.dto.client.UserDetailDto;
import com.edumatch.scholarship.model.Application;
import com.edumatch.scholarship.model.ApplicationDocument;
import com.edumatch.scholarship.repository.ApplicationDocumentRepository;
import com.edumatch.scholarship.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.edumatch.scholarship.config.RabbitMQConfig;
import com.edumatch.scholarship.exception.DuplicateResourceException;
import com.edumatch.scholarship.exception.ResourceNotFoundException;
import com.edumatch.scholarship.model.Opportunity;
import com.edumatch.scholarship.repository.OpportunityRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.security.access.AccessDeniedException;
import java.time.LocalDate;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationDocumentRepository applicationDocumentRepository;

    // Chúng ta cần ScholarshipService để dùng lại hàm getUserDetails
    private final ScholarshipService scholarshipService;
    private final OpportunityRepository opportunityRepository; //để check quyền sở hữu
    private final RabbitTemplate rabbitTemplate; // để gửi email

    /**
     * Chức năng: Applicant (Sinh viên) nộp đơn ứng tuyển
     */
    @Transactional
    public ApplicationDto createApplication(CreateApplicationRequest request, UserDetails userDetails) {

        // 1. Lấy thông tin sinh viên (người đang nộp đơn)
        // dùng lại hàm helper của ScholarshipService
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String token = (String) authentication.getCredentials();
        UserDetailDto user = scholarshipService.getUserDetailsFromAuthService(userDetails.getUsername(), token);

        // 1.5. Check: Provider không thể apply vào opportunity của chính mình
        Opportunity opportunity = opportunityRepository.findById(request.getOpportunityId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cơ hội với ID: " + request.getOpportunityId()));

        if (!"APPROVED".equals(opportunity.getModerationStatus())) {
            throw new AccessDeniedException("Cơ hội này chưa được duyệt để nhận đơn ứng tuyển.");
        }

        if (opportunity.getApplicationDeadline() != null
                && opportunity.getApplicationDeadline().isBefore(LocalDate.now())) {
            throw new AccessDeniedException("Đã hết hạn nộp đơn cho cơ hội này.");
        }
        
        if (opportunity.getCreatorUserId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException(
                "Provider cannot apply to their own opportunity");
        }

        if (applicationRepository.existsByApplicantUserIdAndOpportunityId(user.getId(), request.getOpportunityId())) {
            throw new DuplicateResourceException("Bạn đã nộp đơn cho cơ hội này rồi.");
        }

        // 2. Tạo đối tượng Application (Đơn ứng tuyển)
        Application app = new Application();
        app.setApplicantUserId(user.getId());
        app.setOpportunityId(request.getOpportunityId());
        app.setStatus("PENDING");
        // app.setNotes(null); // Ghi chú (nếu có)

        // 2.5. Lưu các trường bổ sung từ request (nếu có)
        app.setApplicantUserName(request.getApplicantUserName() != null ? request.getApplicantUserName() : user.getUsername());
        app.setApplicantEmail(request.getApplicantEmail());
        app.setPhone(request.getPhone());
        app.setGpa(request.getGpa());
        app.setCoverLetter(request.getCoverLetter());
        app.setMotivation(request.getMotivation());
        app.setAdditionalInfo(request.getAdditionalInfo());
        app.setPortfolioUrl(request.getPortfolioUrl());
        app.setLinkedinUrl(request.getLinkedinUrl());
        app.setGithubUrl(request.getGithubUrl());

        // 3. Lưu Application vào DB để lấy ID
        Application savedApp = applicationRepository.save(app);
        log.info("Đã tạo đơn ứng tuyển mới với ID: {}", savedApp.getId());

        List<ApplicationDocument> savedDocs = new ArrayList<>();

        // 4. Lưu các tài liệu đính kèm (nếu có)
        if (request.getDocuments() != null && !request.getDocuments().isEmpty()) {
            for (var docDto : request.getDocuments()) {
                ApplicationDocument doc = new ApplicationDocument();
                doc.setApplicationId(savedApp.getId()); // Gán ID của đơn vừa tạo
                doc.setDocumentName(docDto.getDocumentName());
                doc.setDocumentUrl(docDto.getDocumentUrl());

                // Lưu tài liệu vào DB
                savedDocs.add(applicationDocumentRepository.save(doc));
            }
            log.info("Đã lưu {} tài liệu cho đơn ID: {}", savedDocs.size(), savedApp.getId());
        }

        // 5. Gửi notification cho Admin về đơn ứng tuyển mới
        try {
            Map<String, Object> adminNotificationEvent = new HashMap<>();
            adminNotificationEvent.put("recipientId", -1L); // -1 = Admin notifications
            adminNotificationEvent.put("title", "📝 Đơn ứng tuyển mới");
            adminNotificationEvent.put("body", String.format("Ứng viên %s đã nộp đơn cho học bổng \"%s\"", 
                savedApp.getApplicantUserName(), opportunity.getTitle()));
            adminNotificationEvent.put("type", "NEW_APPLICATION_ADMIN");
            adminNotificationEvent.put("referenceId", savedApp.getId().toString());
            adminNotificationEvent.put("applicationId", savedApp.getId());
            adminNotificationEvent.put("opportunityId", savedApp.getOpportunityId() != null ? savedApp.getOpportunityId().toString() : null);
            adminNotificationEvent.put("opportunityTitle", opportunity.getTitle());
            adminNotificationEvent.put("applicantUserId", savedApp.getApplicantUserId());
            adminNotificationEvent.put("applicantUserName", savedApp.getApplicantUserName());

            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "notification.application.status", adminNotificationEvent);
            log.info("✅ [NEW_APPLICATION_ADMIN] Đã gửi notification cho Admin về đơn ứng tuyển mới");
            log.info("   - Application ID: {}", savedApp.getId());
            log.info("   - Applicant: {}", savedApp.getApplicantUserName());
            log.info("   - Scholarship: {}", opportunity.getTitle());
            log.info("   - Routing key: notification.application.status");
        } catch (Exception e) {
            log.error("❌ [NEW_APPLICATION_ADMIN] Không thể gửi notification cho Admin: {}", e.getMessage(), e);
        }

        // 6. Trả về DTO hoàn chỉnh (bao gồm đơn và tài liệu)
        return ApplicationDto.fromEntity(savedApp, savedDocs);
    }
    /**
     * Kiểm tra xem Provider (user) có sở hữu Opportunity (opp) không
     */
    private void checkProviderOwnership(Long opportunityId, UserDetails userDetails) {
        // 1. Lấy thông tin Provider
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String token = (String) authentication.getCredentials();
        UserDetailDto user = scholarshipService.getUserDetailsFromAuthService(userDetails.getUsername(), token); // Dùng hàm public là đúng

        // 2. Lấy thông tin Opportunity
        Opportunity opp = opportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cơ hội với ID: " + opportunityId));

        // 3. So sánh ID người tạo và ID người đang gọi API
        if (!opp.getCreatorUserId().equals(user.getId())) {
            log.warn("User {} không có quyền truy cập cơ hội {} của user {}", user.getId(), opp.getId(), opp.getCreatorUserId());
            throw new AccessDeniedException("Bạn không có quyền xem đơn ứng tuyển của cơ hội này.");
        }
    }

    /**
     * Helper method to fetch applicant profile by userId or username
     */
    private com.edumatch.scholarship.dto.client.UserDetailDto fetchApplicantProfile(Long applicantUserId, String applicantUserName, String token) {
        // Try to fetch by username first (preferred)
        if (applicantUserName != null && !applicantUserName.isEmpty()) {
            try {
                log.debug("Fetching profile by username: {}", applicantUserName);
                return scholarshipService.getUserDetailsFromAuthService(applicantUserName, token);
            } catch (Exception e) {
                log.warn("Could not fetch profile by username {} for userId {}: {}", 
                        applicantUserName, applicantUserId, e.getMessage());
                // Fall through to try by userId
            }
        }
        
        // Fallback: try to fetch by userId if username is not available
        try {
            log.debug("Fetching profile by userId: {}", applicantUserId);
            return scholarshipService.getUserDetailsFromAuthServiceById(applicantUserId, token);
        } catch (Exception e) {
            log.warn("Could not fetch profile by userId {}: {}", applicantUserId, e.getMessage());
            return null;
        }
    }

    /**
     * Lấy danh sách ứng viên đã nộp vào một cơ hội
     */
    public List<ApplicationDto> getApplicationsForOpportunity(Long opportunityId, UserDetails userDetails) {
        // 1. Kiểm tra quyền sở hữu
        checkProviderOwnership(opportunityId, userDetails);

        // 2. Lấy token để gọi user service
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String token = (String) authentication.getCredentials();

        // 3. Lấy các đơn ứng tuyển
        List<Application> applications = applicationRepository.findByOpportunityId(opportunityId);

        // 4. Chuyển đổi sang DTO (bao gồm cả tài liệu và profile của từng đơn)
        return applications.stream()
                .map(app -> {
                    // Lấy tài liệu của đơn này
                    List<ApplicationDocument> docs = applicationDocumentRepository.findByApplicationId(app.getId());
                    
                    // Fetch applicant profile from user service
                    // Will try by username first, then fallback to userId
                    String username = app.getApplicantUserName();
                    com.edumatch.scholarship.dto.client.UserDetailDto applicantProfile = 
                            fetchApplicantProfile(app.getApplicantUserId(), username, token);
                    
                    if (applicantProfile != null) {
                        log.info("✅ Successfully fetched profile for applicant userId {} (username: {})", 
                                app.getApplicantUserId(), applicantProfile.getUsername());
                    } else {
                        log.warn("⚠️ Could not fetch profile for applicant userId {} (username: {})", 
                                app.getApplicantUserId(), username != null ? username : "null");
                    }
                    
                    return ApplicationDto.fromEntity(app, docs, applicantProfile);
                })
                .collect(Collectors.toList());
    }

    /**
     * Cập nhật trạng thái (Duyệt/Từ chối) một đơn ứng tuyển
     */
    @Transactional
    public ApplicationDto updateApplicationStatus(Long applicationId, String newStatus, UserDetails userDetails) {
        // 1. Tìm đơn ứng tuyển
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn ứng tuyển với ID: " + applicationId));

        // 2. Kiểm tra quyền sở hữu (thông qua cơ hội) [cite: 788]
        checkProviderOwnership(app.getOpportunityId(), userDetails);

        // 3. Cập nhật trạng thái
        app.setStatus(newStatus); // Ví dụ: "APPROVED", "REJECTED"
        Application savedApp = applicationRepository.save(app);
        
        // 3.1 Lấy thông tin Opportunity (scholarship) để đưa vào notification
        Opportunity opportunity = opportunityRepository.findById(savedApp.getOpportunityId())
                .orElse(null);
        String opportunityTitle = opportunity != null ? opportunity.getTitle() : "học bổng";

        // 4. GỬI SỰ KIỆN EMAIL
        // (Gửi 1 Map đơn giản chứa ID người nhận, tiêu đề, nội dung)
        // (Notification-service sẽ xử lý việc tìm email từ applicantUserId)
        Map<String, Object> emailEvent = Map.of(
                "applicantUserId", savedApp.getApplicantUserId(),
                "subject", "Cập nhật trạng thái đơn ứng tuyển",
                "body", "Trạng thái đơn ứng tuyển của bạn đã được cập nhật thành: " + newStatus
        );

        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "notification.send.email", emailEvent);
        log.info("Đã gửi sự kiện 'notification.send.email' cho user ID: {}", savedApp.getApplicantUserId());

        // 5. GỬI REAL-TIME NOTIFICATION EVENT
        log.info("📨 [Application Status] Employer changed application {} status to: {}", applicationId, newStatus);
        log.info("📨 [Application Status] Opportunity: {}", opportunityTitle);
        
        String notificationTitle = "";
        String notificationBody = "";
        
        switch (newStatus) {
            case "ACCEPTED":
                notificationTitle = "✅ Đơn ứng tuyển được chấp nhận!";
                notificationBody = String.format("Chúc mừng! Đơn ứng tuyển của bạn cho học bổng \"%s\" đã được chấp nhận bởi nhà tuyển dụng.", opportunityTitle);
                break;
            case "REJECTED":
                notificationTitle = "❌ Đơn ứng tuyển bị từ chối";
                notificationBody = String.format("Rất tiếc, đơn ứng tuyển của bạn cho học bổng \"%s\" không được chấp nhận lần này.", opportunityTitle);
                break;
            case "UNDER_REVIEW":
                notificationTitle = "🔍 Đơn đang được xem xét";
                notificationBody = String.format("Đơn ứng tuyển của bạn cho học bổng \"%s\" đang được nhà tuyển dụng xem xét.", opportunityTitle);
                break;
            case "WAITLISTED":
                notificationTitle = "⏳ Đơn trong danh sách chờ";
                notificationBody = String.format("Đơn ứng tuyển của bạn cho học bổng \"%s\" đã được đưa vào danh sách chờ.", opportunityTitle);
                break;
            default:
                notificationTitle = "📋 Cập nhật đơn ứng tuyển";
                notificationBody = String.format("Trạng thái đơn ứng tuyển cho học bổng \"%s\": %s", opportunityTitle, newStatus);
        }
        
        Map<String, Object> notificationEvent = new HashMap<>();
        notificationEvent.put("recipientId", savedApp.getApplicantUserId());
        notificationEvent.put("title", notificationTitle);
        notificationEvent.put("body", notificationBody);
        notificationEvent.put("type", "APPLICATION_STATUS");
        notificationEvent.put("applicationId", savedApp.getId());
        notificationEvent.put("status", newStatus);
        notificationEvent.put("opportunityTitle", opportunityTitle); // Add scholarship name
        
        // Add opportunity info if available
        if (savedApp.getOpportunityId() != null) {
            notificationEvent.put("referenceId", savedApp.getOpportunityId().toString());
            notificationEvent.put("opportunityId", savedApp.getOpportunityId()); // Add for reference
        }
        
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "notification.application.status", notificationEvent);
        log.info("✅ [Application Status] Sent notification event to RabbitMQ for applicant userId: {}", savedApp.getApplicantUserId());
        log.info("📤 [Application Status] Scholarship: '{}', Status: {}", opportunityTitle, newStatus);
        log.info("📤 [Application Status] Event published to routing key: notification.application.status");

        // 6. Trả về DTO với applicant profile
        List<ApplicationDocument> docs = applicationDocumentRepository.findByApplicationId(savedApp.getId());
        // Fetch applicant profile
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String token = (String) auth.getCredentials();
        com.edumatch.scholarship.dto.client.UserDetailDto applicantProfile = 
                fetchApplicantProfile(savedApp.getApplicantUserId(), savedApp.getApplicantUserName(), token);
        return ApplicationDto.fromEntity(savedApp, docs, applicantProfile);
    }
    /**
     * Lấy danh sách các đơn ứng tuyển của user đang đăng nhập
     */
    public List<ApplicationDto> getMyApplications(UserDetails userDetails) {
        // 1. Lấy thông tin user (dùng lại hàm helper)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String token = (String) authentication.getCredentials();
        UserDetailDto user = scholarshipService.getUserDetailsFromAuthService(userDetails.getUsername(), token);
        Long applicantId = user.getId();

        // 2. Lấy đơn (dùng hàm repo đã có)
        List<Application> applications = applicationRepository.findByApplicantUserId(applicantId);

        // 3. Chuyển đổi sang DTO (gồm cả tài liệu và profile)
        return applications.stream()
                .map(app -> {
                    List<ApplicationDocument> docs = applicationDocumentRepository.findByApplicationId(app.getId());
                    // Include user's own profile
                    return ApplicationDto.fromEntity(app, docs, user);
                })
                .collect(Collectors.toList());
    }

    /**
     * Lấy TẤT CẢ applications với filter và pagination (cho Admin)
     */
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<ApplicationDto> getAllApplicationsForAdmin(
            String status,
            Long opportunityId,
            String keyword,
            org.springframework.data.domain.Pageable pageable) {
        
        // Lấy applications với filter
        org.springframework.data.domain.Page<Application> page = applicationRepository.searchApplications(
                status, opportunityId, keyword, pageable);

        // Chuyển đổi sang DTO và thêm opportunity title
        return page.map(app -> {
            List<ApplicationDocument> docs = applicationDocumentRepository.findByApplicationId(app.getId());
            ApplicationDto dto = ApplicationDto.fromEntity(app, docs);
            
            // Lấy opportunity title nếu có
            if (app.getOpportunityId() != null) {
                opportunityRepository.findById(app.getOpportunityId())
                    .ifPresent(opp -> dto.setOpportunityTitle(opp.getTitle()));
            }
            
            return dto;
        });
    }

    /**
     * Lấy recent applications (cho Admin dashboard)
     */
    @Transactional(readOnly = true)
    public List<ApplicationDto> getRecentApplications(int limit) {
        org.springframework.data.domain.Pageable pageable = 
                org.springframework.data.domain.PageRequest.of(0, limit, 
                        org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "submittedAt"));
        
        org.springframework.data.domain.Page<Application> page = applicationRepository.findAll(pageable);
        List<Application> applications = page.getContent();
        
        // Get token for fetching profiles
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String token = authentication != null ? (String) authentication.getCredentials() : null;
        
        return applications.stream()
                .map(app -> {
                    List<ApplicationDocument> docs = applicationDocumentRepository.findByApplicationId(app.getId());
                    
                    // Fetch applicant profile if token available
                    com.edumatch.scholarship.dto.client.UserDetailDto applicantProfile = null;
                    if (token != null) {
                        applicantProfile = fetchApplicantProfile(app.getApplicantUserId(), app.getApplicantUserName(), token);
                    }
                    
                    ApplicationDto dto = ApplicationDto.fromEntity(app, docs, applicantProfile);
                    
                    // Lấy opportunity title nếu có
                    if (app.getOpportunityId() != null) {
                        opportunityRepository.findById(app.getOpportunityId())
                            .ifPresent(opp -> dto.setOpportunityTitle(opp.getTitle()));
                    }
                    
                    return dto;
                })
                .collect(Collectors.toList());
    }

    /**
     * Admin lấy chi tiết một application
     */
    @Transactional(readOnly = true)
    public ApplicationDto getApplicationByIdForAdmin(Long applicationId) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn ứng tuyển với ID: " + applicationId));
        
        List<ApplicationDocument> docs = applicationDocumentRepository.findByApplicationId(app.getId());
        ApplicationDto dto = ApplicationDto.fromEntity(app, docs);
        
        // Lấy opportunity title nếu có
        if (app.getOpportunityId() != null) {
            opportunityRepository.findById(app.getOpportunityId())
                .ifPresent(opp -> dto.setOpportunityTitle(opp.getTitle()));
        }
        
        return dto;
    }

    /**
     * Admin cập nhật trạng thái application (không cần check ownership)
     */
    @Transactional
    public ApplicationDto updateApplicationStatusByAdmin(Long applicationId, String newStatus) {
        // 1. Tìm đơn ứng tuyển
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn ứng tuyển với ID: " + applicationId));

        // 2. Cập nhật trạng thái (Admin không cần check ownership)
        app.setStatus(newStatus);
        Application savedApp = applicationRepository.save(app);
        
        // 2.1 Lấy thông tin Opportunity (scholarship) để đưa vào notification
        Opportunity opportunity = opportunityRepository.findById(savedApp.getOpportunityId())
                .orElse(null);
        String opportunityTitle = opportunity != null ? opportunity.getTitle() : "học bổng";

        // 3. GỬI SỰ KIỆN EMAIL
        Map<String, Object> emailEvent = Map.of(
                "applicantUserId", savedApp.getApplicantUserId(),
                "subject", "Cập nhật trạng thái đơn ứng tuyển",
                "body", "Trạng thái đơn ứng tuyển của bạn đã được cập nhật thành: " + newStatus
        );

        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "notification.send.email", emailEvent);
        log.info("Admin đã cập nhật trạng thái đơn ứng tuyển ID: {} thành: {}", savedApp.getId(), newStatus);

        // 4. GỬI REAL-TIME NOTIFICATION EVENT
        String notificationTitle = "";
        String notificationBody = "";
        
        switch (newStatus) {
            case "ACCEPTED":
                notificationTitle = "✅ Đơn ứng tuyển được chấp nhận!";
                notificationBody = String.format("Chúc mừng! Đơn ứng tuyển của bạn cho học bổng \"%s\" đã được chấp nhận.", opportunityTitle);
                break;
            case "REJECTED":
                notificationTitle = "❌ Đơn ứng tuyển bị từ chối";
                notificationBody = String.format("Rất tiếc, đơn ứng tuyển của bạn cho học bổng \"%s\" không được chấp nhận lần này.", opportunityTitle);
                break;
            case "UNDER_REVIEW":
                notificationTitle = "🔍 Đơn đang được xem xét";
                notificationBody = String.format("Đơn ứng tuyển của bạn cho học bổng \"%s\" đang được xem xét.", opportunityTitle);
                break;
            default:
                notificationTitle = "📋 Cập nhật đơn ứng tuyển";
                notificationBody = String.format("Trạng thái đơn ứng tuyển cho học bổng \"%s\": %s", opportunityTitle, newStatus);
        }
        
        Map<String, Object> notificationEvent = new HashMap<>();
        notificationEvent.put("recipientId", savedApp.getApplicantUserId());
        notificationEvent.put("title", notificationTitle);
        notificationEvent.put("body", notificationBody);
        notificationEvent.put("type", "APPLICATION_STATUS");
        notificationEvent.put("applicationId", savedApp.getId());
        notificationEvent.put("status", newStatus);
        notificationEvent.put("opportunityTitle", opportunityTitle); // Add scholarship name
        
        // Add opportunity info if available
        if (savedApp.getOpportunityId() != null) {
            notificationEvent.put("referenceId", savedApp.getOpportunityId().toString());
            notificationEvent.put("opportunityId", savedApp.getOpportunityId());
        }
        
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "notification.application.status", notificationEvent);
        log.info("📨 [Admin] Sent notification event for application {} to userId: {}", savedApp.getId(), savedApp.getApplicantUserId());
        log.info("📤 [Admin] Scholarship: '{}', Status: {}", opportunityTitle, newStatus);

        // 5. Trả về DTO
        List<ApplicationDocument> docs = applicationDocumentRepository.findByApplicationId(savedApp.getId());
        ApplicationDto dto = ApplicationDto.fromEntity(savedApp, docs);
        
        // Lấy opportunity title nếu có
        if (savedApp.getOpportunityId() != null) {
            opportunityRepository.findById(savedApp.getOpportunityId())
                .ifPresent(opp -> dto.setOpportunityTitle(opp.getTitle()));
        }
        
        return dto;
    }
}