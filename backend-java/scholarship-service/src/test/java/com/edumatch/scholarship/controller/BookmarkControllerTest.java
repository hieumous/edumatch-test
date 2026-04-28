package com.edumatch.scholarship.controller;

import com.edumatch.scholarship.dto.BookmarkDto;
import com.edumatch.scholarship.dto.OpportunityDto;
import com.edumatch.scholarship.service.BookmarkService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BookmarkController.class)
@AutoConfigureMockMvc(addFilters = false)
class BookmarkControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BookmarkService bookmarkService;

    @MockBean
    private com.edumatch.scholarship.security.JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void shouldToggleBookmarkSuccessfully() throws Exception {
        when(bookmarkService.toggleBookmark(eq(1L), any(), any()))
                .thenReturn(true);

        mockMvc.perform(post("/api/bookmarks/1")
                .header("Authorization", "Bearer fake-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookmarked").value(true));

        verify(bookmarkService)
                .toggleBookmark(eq(1L), any(), eq("fake-token"));
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void shouldReturn401WhenTokenMissing() throws Exception {
        mockMvc.perform(post("/api/bookmarks/1"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Token not found in request"));
    }

    @Test
    void shouldReturn401WhenUserNotAuthenticated() throws Exception {
        mockMvc.perform(post("/api/bookmarks/1")
                .header("Authorization", "Bearer token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("User not authenticated"));
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void shouldReturn500WhenServiceFails() throws Exception {
        when(bookmarkService.toggleBookmark(eq(1L), any(), any()))
                .thenThrow(new RuntimeException("DB error"));

        mockMvc.perform(post("/api/bookmarks/1")
                .header("Authorization", "Bearer token"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Failed to toggle bookmark"))
                .andExpect(jsonPath("$.message").value("DB error"));
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void shouldGetMyBookmarks() throws Exception {

        OpportunityDto opportunity = OpportunityDto.builder()
                .id(10L)
                .title("Scholarship A")
                .build();

        BookmarkDto bookmark = BookmarkDto.builder()
                .id(1L)
                .applicantUserId(100L)
                .opportunity(opportunity)
                .build();

        List<BookmarkDto> list = List.of(bookmark);

        when(bookmarkService.getMyBookmarks(any(), any()))
                .thenReturn(list);

        mockMvc.perform(get("/api/bookmarks/my")
                .header("Authorization", "Bearer token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].applicantUserId").value(100L))
                .andExpect(jsonPath("$[0].opportunity.id").value(10L))
                .andExpect(jsonPath("$[0].opportunity.title").value("Scholarship A"));

        verify(bookmarkService)
                .getMyBookmarks(any(), eq("token"));
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void shouldReturn401WhenGetBookmarksWithoutToken() throws Exception {
        mockMvc.perform(get("/api/bookmarks/my"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Token not found in request"));
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void shouldReturn500WhenGetBookmarksFails() throws Exception {
        when(bookmarkService.getMyBookmarks(any(), any()))
                .thenThrow(new RuntimeException("Service error"));

        mockMvc.perform(get("/api/bookmarks/my")
                .header("Authorization", "Bearer token"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Failed to get bookmarks"));
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void shouldReturnMultipleBookmarks() throws Exception {

        OpportunityDto opp1 = OpportunityDto.builder().id(1L).title("A").build();
        OpportunityDto opp2 = OpportunityDto.builder().id(2L).title("B").build();

        List<BookmarkDto> list = List.of(
                BookmarkDto.builder().id(1L).applicantUserId(1L).opportunity(opp1).build(),
                BookmarkDto.builder().id(2L).applicantUserId(1L).opportunity(opp2).build());

        when(bookmarkService.getMyBookmarks(any(), any()))
                .thenReturn(list);

        mockMvc.perform(get("/api/bookmarks/my")
                .header("Authorization", "Bearer token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }
}