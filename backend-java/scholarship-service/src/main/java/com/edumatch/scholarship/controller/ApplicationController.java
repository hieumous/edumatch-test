package com.edumatch.scholarship.controller;

import com.edumatch.scholarship.dto.ApplicationDto;
import com.edumatch.scholarship.dto.CreateApplicationRequest;
import com.edumatch.scholarship.service.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.edumatch.scholarship.dto.UpdateApplicationStatusRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.data.domain.Pageable;
import java.util.List;

@RestController
@RequestMapping("/api/applications") // Đường dẫn gốc cho các API Application
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    /**
     * API để Applicant (Sinh viên) nộp đơn ứng tuyển.
     * Endpoint: POST /api/applications
     */
    @PostMapping
    @PreAuthorize("hasRole('USER')") // Chỉ ROLE_USER mới được nộp đơn
    public ResponseEntity<ApplicationDto> createApplication(
            @Valid @RequestBody CreateApplicationRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ApplicationDto createdDto = applicationService.createApplication(request, userDetails);
        return new ResponseEntity<>(createdDto, HttpStatus.CREATED);
    }
    /**
     * API để Provider xem danh sách ứng viên của 1 cơ hội
     * Endpoint: GET /api/applications/opportunity/{opportunityId}
     */
    @GetMapping("/opportunity/{opportunityId}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<List<ApplicationDto>> getApplicationsForOpportunity(
            @PathVariable Long opportunityId,
            @AuthenticationPrincipal UserDetails userDetails) {

        List<ApplicationDto> dtos = applicationService.getApplicationsForOpportunity(opportunityId, userDetails);
        return ResponseEntity.ok(dtos);
    }
    /**
     * API để Provider cập nhật trạng thái đơn (Approved, Rejected...)
     * Endpoint: PUT /api/applications/{applicationId}/status
     */
    @PutMapping("/{applicationId}/status")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApplicationDto> updateApplicationStatus(
            @PathVariable Long applicationId,
            @Valid @RequestBody UpdateApplicationStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        ApplicationDto dto = applicationService.updateApplicationStatus(applicationId, request.getStatus(), userDetails);
        return ResponseEntity.ok(dto);
    }

    /**
     * API để Applicant (Sinh viên) xem các đơn họ đã nộp
     * Endpoint: GET /api/applications/my
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')") // Chỉ ROLE_USER mới được xem
    public ResponseEntity<List<ApplicationDto>> getMyApplications(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<ApplicationDto> dtos = applicationService.getMyApplications(userDetails);
        return ResponseEntity.ok(dtos);
    }

    /**
     * API để Admin lấy TẤT CẢ applications với filter và pagination
     * Endpoint: GET /api/applications/all
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')") // Chỉ ADMIN
    public ResponseEntity<org.springframework.data.domain.Page<ApplicationDto>> getAllApplications(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long opportunityId,
            @RequestParam(required = false) String keyword,
            org.springframework.data.domain.Pageable pageable) {

        org.springframework.data.domain.Page<ApplicationDto> page = 
                applicationService.getAllApplicationsForAdmin(status, opportunityId, keyword, pageable);
        return ResponseEntity.ok(page);
    }

    /**
     * API để Admin xem chi tiết một application
     * Endpoint: GET /api/applications/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // Chỉ ADMIN
    public ResponseEntity<ApplicationDto> getApplicationByIdForAdmin(@PathVariable Long id) {
        ApplicationDto dto = applicationService.getApplicationByIdForAdmin(id);
        return ResponseEntity.ok(dto);
    }

    /**
     * API để Admin cập nhật trạng thái application (không cần check ownership)
     * Endpoint: PUT /api/applications/{id}/admin/status
     */
    @PutMapping("/{id}/admin/status")
    @PreAuthorize("hasRole('ADMIN')") // Chỉ ADMIN
    public ResponseEntity<ApplicationDto> updateApplicationStatusByAdmin(
            @PathVariable Long id,
            @Valid @RequestBody UpdateApplicationStatusRequest request) {
        ApplicationDto dto = applicationService.updateApplicationStatusByAdmin(id, request.getStatus());
        return ResponseEntity.ok(dto);
    }

    /**
     * API để Admin lấy recent applications (cho dashboard)
     * Endpoint: GET /api/applications/recent
     */
    @GetMapping("/recent")
    @PreAuthorize("hasRole('ADMIN')") // Chỉ ADMIN
    public ResponseEntity<List<ApplicationDto>> getRecentApplications(
            @RequestParam(defaultValue = "5") int limit) {
        List<ApplicationDto> applications = applicationService.getRecentApplications(limit);
        return ResponseEntity.ok(applications);
    }
}