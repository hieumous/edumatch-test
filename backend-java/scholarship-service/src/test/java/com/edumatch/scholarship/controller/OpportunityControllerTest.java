package com.edumatch.scholarship.controller;

import com.edumatch.scholarship.dto.CreateOpportunityRequest;
import com.edumatch.scholarship.dto.EmployerAnalyticsDto;
import com.edumatch.scholarship.dto.ModerateRequestDto;
import com.edumatch.scholarship.dto.OpportunityDto;
import com.edumatch.scholarship.service.ScholarshipService;
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
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(OpportunityController.class)
@AutoConfigureMockMvc(addFilters = false)
class OpportunityControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @MockBean
        private ScholarshipService scholarshipService;
        @MockBean
        private com.edumatch.scholarship.security.JwtAuthenticationFilter jwtAuthenticationFilter;

        @Autowired
        private ObjectMapper objectMapper;

        @Test
        @WithMockUser(roles = "EMPLOYER")
        void shouldCreateOpportunity() throws Exception {

                CreateOpportunityRequest request = new CreateOpportunityRequest();
                request.setTitle("Scholarship A");
                request.setFullDescription("Full description");

                request.setApplicationDeadline(LocalDate.now().plusDays(10)); // phải future
                request.setStartDate(LocalDate.now().plusDays(15));
                request.setEndDate(LocalDate.now().plusDays(30));

                request.setScholarshipAmount(new BigDecimal("1000"));

                request.setStudyMode("ONLINE");
                request.setLevel("BACHELOR");
                request.setIsPublic(true);

                // optional (không bắt buộc nhưng nên có)
                request.setTags(List.of("IT"));
                request.setRequiredSkills(List.of("Java"));

                OpportunityDto dto = OpportunityDto.builder()
                                .id(1L)
                                .title("Scholarship A")
                                .build();

                when(scholarshipService.createOpportunity(any(), any()))
                                .thenReturn(dto);

                mockMvc.perform(post("/api/opportunities")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.title").value("Scholarship A"));

                verify(scholarshipService).createOpportunity(any(), any());
        }

        @Test
        @WithMockUser
        void shouldGetMyOpportunities() throws Exception {
                List<OpportunityDto> list = List.of(
                                OpportunityDto.builder().id(1L).title("A").build());

                when(scholarshipService.getMyOpportunities(any()))
                                .thenReturn(list);

                mockMvc.perform(get("/api/opportunities/my"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[0].title").value("A"));
        }

        @Test
        @WithMockUser(roles = "EMPLOYER")
        void shouldUpdateOpportunity() throws Exception {

                CreateOpportunityRequest request = new CreateOpportunityRequest();
                request.setTitle("Updated");
                request.setFullDescription("Updated description");

                request.setApplicationDeadline(LocalDate.now().plusDays(10));
                request.setStartDate(LocalDate.now().plusDays(15));
                request.setEndDate(LocalDate.now().plusDays(30));

                request.setScholarshipAmount(new BigDecimal("2000"));

                request.setStudyMode("ONLINE");
                request.setLevel("BACHELOR");
                request.setIsPublic(true);

                request.setTags(List.of("IT"));
                request.setRequiredSkills(List.of("Java"));

                OpportunityDto dto = OpportunityDto.builder()
                                .id(1L)
                                .title("Updated")
                                .build();

                when(scholarshipService.updateOpportunity(eq(1L), any(), any()))
                                .thenReturn(dto);

                mockMvc.perform(put("/api/opportunities/1")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.title").value("Updated"));

                verify(scholarshipService)
                                .updateOpportunity(eq(1L), any(), any());
        }

        @Test
        @WithMockUser(roles = "EMPLOYER")
        void shouldDeleteOpportunity() throws Exception {
                doNothing().when(scholarshipService)
                                .deleteOpportunity(eq(1L), any());

                mockMvc.perform(delete("/api/opportunities/1"))
                                .andExpect(status().isNoContent());

                verify(scholarshipService).deleteOpportunity(eq(1L), any());
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void shouldGetAllOpportunities() throws Exception {
                Page<OpportunityDto> page = new PageImpl<>(List.of(OpportunityDto.builder().id(1L).title("A").build()));

                when(scholarshipService.getAllOpportunitiesForAdmin(any(), any(), any()))
                                .thenReturn(page);

                mockMvc.perform(get("/api/opportunities/all"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content[0].title").value("A"));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void shouldModerateOpportunity() throws Exception {
                ModerateRequestDto request = new ModerateRequestDto();
                request.setStatus("APPROVED");

                OpportunityDto dto = OpportunityDto.builder()
                                .id(1L)
                                .title("A")
                                .build();

                when(scholarshipService.moderateOpportunity(eq(1L), eq("APPROVED")))
                                .thenReturn(dto);

                mockMvc.perform(put("/api/opportunities/1/moderate")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void shouldGetStats() throws Exception {
                Map<String, Object> stats = Map.of("total", 10);

                when(scholarshipService.getStats()).thenReturn(stats);

                mockMvc.perform(get("/api/opportunities/stats"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.total").value(10));
        }

        @Test
        @WithMockUser(roles = "EMPLOYER")
        void shouldGetAnalytics() throws Exception {
                EmployerAnalyticsDto dto = new EmployerAnalyticsDto();

                when(scholarshipService.getEmployerAnalytics(any()))
                                .thenReturn(dto);

                mockMvc.perform(get("/api/opportunities/analytics"))
                                .andExpect(status().isOk());
        }
}