package com.edumatch.scholarship.controller;

import com.edumatch.scholarship.dto.ApplicationDto;
import com.edumatch.scholarship.dto.CreateApplicationRequest;
import com.edumatch.scholarship.dto.UpdateApplicationStatusRequest;
import com.edumatch.scholarship.security.JwtAuthenticationFilter;
import com.edumatch.scholarship.service.ApplicationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ApplicationController.class)
@AutoConfigureMockMvc(addFilters = false)
class ApplicationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ApplicationService applicationService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(roles = "USER")
    void shouldCreateApplication() throws Exception {
        CreateApplicationRequest request = new CreateApplicationRequest();
        request.setOpportunityId(1L);
        request.setCoverLetter("Motivation");
        request.setGpa(new BigDecimal("3.5"));

        ApplicationDto dto = ApplicationDto.builder()
                .id(1L)
                .opportunityId(1L)
                .status("PENDING")
                .applicantUserName("testuser")
                .build();

        when(applicationService.createApplication(any(), any()))
                .thenReturn(dto);

        mockMvc.perform(post("/api/applications")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"));

        verify(applicationService).createApplication(any(), any());
    }

    @Test
    @WithMockUser(roles = "EMPLOYER")
    void shouldGetApplicationsForOpportunity() throws Exception {

        ApplicationDto dto = ApplicationDto.builder()
                .id(1L)
                .opportunityId(1L)
                .status("PENDING")
                .applicantUserName("john_doe")
                .gpa(new java.math.BigDecimal("3.6"))
                .build();

        List<ApplicationDto> list = List.of(dto);

        when(applicationService.getApplicationsForOpportunity(eq(1L), any()))
                .thenReturn(list);

        mockMvc.perform(get("/api/applications/opportunity/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].status").value("PENDING"))
                .andExpect(jsonPath("$[0].applicantUserName").value("john_doe"))
                .andExpect(jsonPath("$[0].gpa").value(3.6));

        verify(applicationService)
                .getApplicationsForOpportunity(eq(1L), any());
    }

    @Test
    @WithMockUser(roles = "EMPLOYER")
    void shouldUpdateApplicationStatus() throws Exception {
        UpdateApplicationStatusRequest request = new UpdateApplicationStatusRequest();
        request.setStatus("APPROVED");

        ApplicationDto dto = ApplicationDto.builder()
                .id(1L)
                .status("APPROVED")
                .build();

        when(applicationService.updateApplicationStatus(eq(1L), eq("APPROVED"), any()))
                .thenReturn(dto);

        mockMvc.perform(put("/api/applications/1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        verify(applicationService)
                .updateApplicationStatus(eq(1L), eq("APPROVED"), any());
    }

    @Test
    @WithMockUser(roles = "USER")
    void shouldGetMyApplications() throws Exception {
        List<ApplicationDto> list = List.of(
                ApplicationDto.builder().id(1L).status("PENDING").build());

        when(applicationService.getMyApplications(any()))
                .thenReturn(list);

        mockMvc.perform(get("/api/applications/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("PENDING"));

        verify(applicationService).getMyApplications(any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldGetAllApplications() throws Exception {

        ApplicationDto dto = ApplicationDto.builder()
                .id(1L)
                .opportunityId(100L)
                .status("APPROVED")
                .applicantUserName("admin_test")
                .gpa(new java.math.BigDecimal("3.8"))
                .build();

        Page<ApplicationDto> page = new PageImpl<>(List.of(dto));

        when(applicationService.getAllApplicationsForAdmin(any(), any(), any(), any()))
                .thenReturn(page);

        mockMvc.perform(get("/api/applications/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].status").value("APPROVED"))
                .andExpect(jsonPath("$.content[0].applicantUserName").value("admin_test"))
                .andExpect(jsonPath("$.content[0].gpa").value(3.8));

        verify(applicationService)
                .getAllApplicationsForAdmin(any(), any(), any(), any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldGetApplicationById() throws Exception {

        ApplicationDto dto = ApplicationDto.builder()
                .id(1L)
                .opportunityId(100L)
                .status("APPROVED")
                .applicantUserName("john_doe")
                .gpa(new java.math.BigDecimal("3.7"))
                .build();

        when(applicationService.getApplicationByIdForAdmin(1L))
                .thenReturn(dto);

        mockMvc.perform(get("/api/applications/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.applicantUserName").value("john_doe"))
                .andExpect(jsonPath("$.gpa").value(3.7));

        verify(applicationService).getApplicationByIdForAdmin(1L);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldUpdateApplicationStatusByAdmin() throws Exception {

        UpdateApplicationStatusRequest request = new UpdateApplicationStatusRequest();
        request.setStatus("APPROVED");

        ApplicationDto dto = ApplicationDto.builder()
                .id(1L)
                .status("APPROVED")
                .applicantUserName("admin_updated")
                .build();

        when(applicationService.updateApplicationStatusByAdmin(eq(1L), eq("APPROVED")))
                .thenReturn(dto);

        mockMvc.perform(put("/api/applications/1/admin/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.applicantUserName").value("admin_updated"));

        verify(applicationService)
                .updateApplicationStatusByAdmin(eq(1L), eq("APPROVED"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldGetRecentApplications() throws Exception {

        ApplicationDto dto = ApplicationDto.builder()
                .id(1L)
                .opportunityId(100L)
                .status("PENDING")
                .applicantUserName("recent_user")
                .gpa(new java.math.BigDecimal("3.9"))
                .build();

        List<ApplicationDto> list = List.of(dto);

        when(applicationService.getRecentApplications(5))
                .thenReturn(list);

        mockMvc.perform(get("/api/applications/recent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].status").value("PENDING"))
                .andExpect(jsonPath("$[0].applicantUserName").value("recent_user"))
                .andExpect(jsonPath("$[0].gpa").value(3.9));

        verify(applicationService).getRecentApplications(5);
    }
}