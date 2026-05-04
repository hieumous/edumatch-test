package com.edumatch.scholarship.controller;

import com.edumatch.scholarship.dto.OpportunityDetailDto;
import com.edumatch.scholarship.dto.OpportunityDto;
import com.edumatch.scholarship.service.ScholarshipService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.data.domain.*;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
                "spring.profiles.active=test",
                "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration"
})
@Import(ScholarshipControllerTest.TestSecurityConfig.class)
class ScholarshipControllerTest {

        @Autowired
        private TestRestTemplate restTemplate;

        @MockBean
        private ScholarshipService scholarshipService;

        // =========================
        // TEST SECURITY CONFIG (QUAN TRỌNG)
        // =========================
        @org.springframework.boot.test.context.TestConfiguration
        static class TestSecurityConfig {

                @Bean
                @org.springframework.core.annotation.Order(1)
                public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                        http
                                        .csrf(csrf -> csrf.disable())
                                        .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());

                        return http.build();
                }
        }

        // =========================
        // 1. TEST SEARCH API
        // =========================
        @Test
        void shouldReturnScholarshipList() {

                OpportunityDto dto = OpportunityDto.builder()
                                .id(1L)
                                .title("Scholarship A")
                                .tags(List.of("IT"))
                                .requiredSkills(List.of("Java"))
                                .build();

                Page<OpportunityDto> page = new PageImpl<>(List.of(dto));

                when(scholarshipService.searchOpportunities(
                                nullable(String.class),
                                any(),
                                nullable(String.class),
                                nullable(String.class),
                                any(),
                                any(LocalDate.class),
                                any())).thenReturn(page);

                ResponseEntity<String> response = restTemplate.getForEntity("/api/scholarships", String.class);

                assertEquals(HttpStatus.OK, response.getStatusCode());
                assertNotNull(response.getBody());
        }

        // =========================
        // 2. TEST DETAIL API
        // =========================
        @Test
        void shouldReturnScholarshipDetail() {

                OpportunityDto opportunity = OpportunityDto.builder()
                                .id(1L)
                                .title("Scholarship A")
                                .build();

                OpportunityDetailDto dto = new OpportunityDetailDto(opportunity);

                when(scholarshipService.getOpportunityDetails(eq(1L), isNull()))
                                .thenReturn(dto);

                ResponseEntity<OpportunityDetailDto> response = restTemplate.getForEntity("/api/scholarships/1",
                                OpportunityDetailDto.class);

                assertEquals(HttpStatus.OK, response.getStatusCode());
                assertNotNull(response.getBody()); // sẽ pass
                assertEquals(1L, response.getBody().getOpportunity().getId());
        }

        // =========================
        // 3. TEST VIEW COUNT
        // =========================
        @Test
        void shouldIncrementViewCount() {

                doNothing().when(scholarshipService).incrementViewCount(1L);

                ResponseEntity<Void> response = restTemplate.postForEntity("/api/scholarships/1/view", null,
                                Void.class);

                assertEquals(HttpStatus.OK, response.getStatusCode());

                verify(scholarshipService, times(1)).incrementViewCount(1L);
        }
}