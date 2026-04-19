package com.edumatch.scholarship.service;

import com.edumatch.scholarship.dto.CreateApplicationRequest;
import com.edumatch.scholarship.dto.ApplicationDto;
import com.edumatch.scholarship.dto.client.UserDetailDto;

import com.edumatch.scholarship.model.Application;
import com.edumatch.scholarship.model.Opportunity;

import com.edumatch.scholarship.repository.ApplicationRepository;
import com.edumatch.scholarship.repository.ApplicationDocumentRepository;
import com.edumatch.scholarship.repository.OpportunityRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;
import java.util.ArrayList;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private ApplicationDocumentRepository applicationDocumentRepository;

    @Mock
    private ScholarshipService scholarshipService;

    @Mock
    private OpportunityRepository opportunityRepository;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private ApplicationService applicationService;

    // ===============================
    // TEST 1: CREATE APPLICATION
    // ===============================

    @Test
    void testCreateApplication() {

        // Fake login user
        UserDetails userDetails =
                new User("student1", "123", new ArrayList<>());

        var auth =
                new UsernamePasswordAuthenticationToken(
                        userDetails,
                        "fake-token"
                );

        SecurityContextHolder
                .getContext()
                .setAuthentication(auth);

        // Fake user detail
        UserDetailDto userDetailDto =
                new UserDetailDto();

        userDetailDto.setId(10L);
        userDetailDto.setUsername("student1");

        when(
                scholarshipService
                        .getUserDetailsFromAuthService(any(), any())
        ).thenReturn(userDetailDto);

        // Fake opportunity
        Opportunity opp = new Opportunity();

        opp.setId(1L);
        opp.setModerationStatus("APPROVED");
        opp.setCreatorUserId(99L);

        // Quan trọng: tránh lỗi deadline
        opp.setApplicationDeadline(
                LocalDate.now().plusDays(5)
        );

        when(
                opportunityRepository.findById(1L)
        ).thenReturn(Optional.of(opp));

        when(
                applicationRepository
                        .existsByApplicantUserIdAndOpportunityId(any(), any())
        ).thenReturn(false);

        // Fake saved application
        Application savedApp =
                new Application();

        savedApp.setId(1L);
        savedApp.setStatus("PENDING");
        savedApp.setApplicantUserId(10L);

        when(
                applicationRepository.save(any())
        ).thenReturn(savedApp);

        // Request
        CreateApplicationRequest request =
                new CreateApplicationRequest();

        request.setOpportunityId(1L);

        // Call service
        ApplicationDto result =
                applicationService.createApplication(
                        request,
                        userDetails
                );

        // Assert
        assertNotNull(result);
        assertEquals("PENDING", result.getStatus());

        // Verify RabbitMQ call
        verify(rabbitTemplate, times(1))
                .convertAndSend(
                        anyString(),
                        anyString(),
                        any(Object.class)
                );
    }

    // ===============================
    // TEST 2: UPDATE STATUS
    // ===============================

    @Test
    void testUpdateApplicationStatus() {

        UserDetails userDetails =
                new User("employer1", "123", new ArrayList<>());

        var auth =
                new UsernamePasswordAuthenticationToken(
                        userDetails,
                        "fake-token"
                );

        SecurityContextHolder
                .getContext()
                .setAuthentication(auth);

        // Fake application
        Application app =
                new Application();

        app.setId(1L);
        app.setOpportunityId(2L);
        app.setApplicantUserId(10L);

        when(
                applicationRepository.findById(1L)
        ).thenReturn(Optional.of(app));

        // Fake opportunity
        Opportunity opp =
                new Opportunity();

        opp.setId(2L);
        opp.setCreatorUserId(20L);

        // Tránh lỗi deadline
        opp.setApplicationDeadline(
                LocalDate.now().plusDays(5)
        );

        when(
                opportunityRepository.findById(2L)
        ).thenReturn(Optional.of(opp));

        // Fake employer
        UserDetailDto employer =
                new UserDetailDto();

        employer.setId(20L);

        when(
                scholarshipService
                        .getUserDetailsFromAuthService(any(), any())
        ).thenReturn(employer);

        when(
                applicationRepository.save(any())
        ).thenReturn(app);

        // Call service
        ApplicationDto result =
                applicationService.updateApplicationStatus(
                        1L,
                        "ACCEPTED",
                        userDetails
                );

        // Assert
        assertEquals("ACCEPTED", result.getStatus());

        // ⚠️ Quan trọng: Service gọi RabbitMQ 2 lần
        verify(rabbitTemplate, times(2))
                .convertAndSend(
                        anyString(),
                        anyString(),
                        any(Object.class)
                );
    }
}