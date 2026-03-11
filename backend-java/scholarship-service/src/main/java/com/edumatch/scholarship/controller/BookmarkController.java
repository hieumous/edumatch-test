package com.edumatch.scholarship.controller;

import com.edumatch.scholarship.dto.BookmarkDto;
import com.edumatch.scholarship.service.BookmarkService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
@Slf4j
public class BookmarkController {

    private final BookmarkService bookmarkService;

    /**
     * Helper method để lấy JWT token từ request header
     */
    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // Remove "Bearer " prefix
        }
        return null;
    }

    /**
     * API để Applicant (Sinh viên) bookmark/un-bookmark một cơ hội
     * Endpoint: POST /api/bookmarks/{opportunityId}
     */
    @PostMapping("/{opportunityId}")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public ResponseEntity<?> toggleBookmark(
            @PathVariable Long opportunityId,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {
        try {
            if (userDetails == null) {
                log.error("UserDetails is null in toggleBookmark");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not authenticated"));
            }
            
            String token = getTokenFromRequest(request);
            if (token == null || token.isEmpty()) {
                log.error("Token not found in request header");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Token not found in request"));
            }
            
            boolean isBookmarked = bookmarkService.toggleBookmark(opportunityId, userDetails, token);
            return ResponseEntity.ok(Map.of("bookmarked", isBookmarked));
        } catch (Exception e) {
            log.error("Error in toggleBookmark: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to toggle bookmark");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * API để Applicant (Sinh viên) lấy danh sách đã bookmark
     * Endpoint: GET /api/bookmarks/my
     */
    @GetMapping("/my")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public ResponseEntity<?> getMyBookmarks(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {
        try {
            if (userDetails == null) {
                log.error("UserDetails is null in getMyBookmarks");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not authenticated"));
            }
            
            String token = getTokenFromRequest(request);
            if (token == null || token.isEmpty()) {
                log.error("Token not found in request header");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Token not found in request"));
            }
            
            List<BookmarkDto> bookmarks = bookmarkService.getMyBookmarks(userDetails, token);
            return ResponseEntity.ok(bookmarks);
        } catch (Exception e) {
            log.error("Error in getMyBookmarks: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to get bookmarks");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}