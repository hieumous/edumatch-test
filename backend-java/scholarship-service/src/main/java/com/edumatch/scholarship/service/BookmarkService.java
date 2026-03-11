package com.edumatch.scholarship.service;

import com.edumatch.scholarship.dto.BookmarkDto;
import com.edumatch.scholarship.dto.client.UserDetailDto;
import com.edumatch.scholarship.exception.ResourceNotFoundException;
import com.edumatch.scholarship.model.Bookmark;
import com.edumatch.scholarship.model.Opportunity;
import com.edumatch.scholarship.repository.BookmarkRepository;
import com.edumatch.scholarship.repository.OpportunityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final OpportunityRepository opportunityRepository; // Cần để lấy thông tin opp
    private final ScholarshipService scholarshipService; // Cần để lấy User ID

    /**
     * Chức năng: Thêm hoặc xóa (Toggle) một bookmark
     * Trả về true nếu là "Đã thêm", false nếu là "Đã xóa"
     */
    public boolean toggleBookmark(Long opportunityId, UserDetails userDetails, String token) {
        try {
            if (token == null || token.isEmpty()) {
                throw new RuntimeException("JWT token is required");
            }
            
            UserDetailDto user = scholarshipService.getUserDetailsFromAuthService(userDetails.getUsername(), token);
            if (user == null || user.getId() == null) {
                throw new RuntimeException("Failed to get user details from auth service");
            }
            Long applicantId = user.getId();

            var existingBookmark = bookmarkRepository
                    .findByApplicantUserIdAndOpportunityId(applicantId, opportunityId);

            if (existingBookmark.isPresent()) {
                bookmarkRepository.delete(existingBookmark.get());
                return false;
            } else {
                if (!opportunityRepository.existsById(opportunityId)) {
                    throw new ResourceNotFoundException("Không tìm thấy cơ hội với ID: " + opportunityId);
                }

                Bookmark newBookmark = new Bookmark();
                newBookmark.setApplicantUserId(applicantId);
                newBookmark.setOpportunityId(opportunityId);
                bookmarkRepository.save(newBookmark);
                return true;
            }
        } catch (Exception e) {
            log.error("Error in toggleBookmark for user {} and opportunity {}: {}", 
                    userDetails.getUsername(), opportunityId, e.getMessage(), e);
            throw new RuntimeException("Failed to toggle bookmark: " + e.getMessage(), e);
        }
    }

    /**
     * Chức năng: Lấy tất cả bookmark của tôi
     */
    public List<BookmarkDto> getMyBookmarks(UserDetails userDetails, String token) {
        try {
            if (token == null || token.isEmpty()) {
                throw new RuntimeException("JWT token is required");
            }
            
            UserDetailDto user = scholarshipService.getUserDetailsFromAuthService(userDetails.getUsername(), token);
            if (user == null || user.getId() == null) {
                throw new RuntimeException("Failed to get user details from auth service");
            }
            Long applicantId = user.getId();

            List<Bookmark> bookmarks = bookmarkRepository.findByApplicantUserId(applicantId);

            return bookmarks.stream()
                    .map(bookmark -> {
                        try {
                            Opportunity opp = opportunityRepository.findById(bookmark.getOpportunityId())
                                    .orElse(null);

                            if (opp == null) {
                                log.warn("Opportunity {} not found for bookmark {}", bookmark.getOpportunityId(), bookmark.getId());
                                return null;
                            }

                            return BookmarkDto.fromEntity(bookmark, opp);
                        } catch (Exception e) {
                            log.error("Error converting bookmark {} to DTO: {}", bookmark.getId(), e.getMessage());
                            return null;
                        }
                    })
                    .filter(dto -> dto != null)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error in getMyBookmarks for user {}: {}", 
                    userDetails.getUsername(), e.getMessage(), e);
            throw new RuntimeException("Failed to get bookmarks: " + e.getMessage(), e);
        }
    }
}