package com.edumatch.scholarship.repository;

import com.edumatch.scholarship.model.Bookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

    // Lấy danh sách bookmark của một sinh viên
    List<Bookmark> findByApplicantUserId(Long applicantUserId);

    // Dùng để kiểm tra xem sinh viên đã bookmark cơ hội này chưa
    Optional<Bookmark> findByApplicantUserIdAndOpportunityId(Long applicantUserId, Long opportunityId);

    @Transactional
    void deleteAllByOpportunityId(Long opportunityId);
}