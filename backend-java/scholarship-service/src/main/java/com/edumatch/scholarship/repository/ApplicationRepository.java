package com.edumatch.scholarship.repository;

import com.edumatch.scholarship.model.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    // Lấy các đơn đã nộp của một sinh viên
    List<Application> findByApplicantUserId(Long applicantUserId);

    // Lấy tất cả đơn nộp cho một cơ hội
    List<Application> findByOpportunityId(Long opportunityId);

    boolean existsByApplicantUserIdAndOpportunityId(Long applicantUserId, Long opportunityId);

    // Search applications với filter và pagination (cho admin)
    @Query("""
        SELECT a FROM Application a
        WHERE (:status IS NULL OR a.status = :status)
          AND (:opportunityId IS NULL OR a.opportunityId = :opportunityId)
          AND (:keyword IS NULL OR 
              LOWER(a.applicantUserName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
              LOWER(a.applicantEmail) LIKE LOWER(CONCAT('%', :keyword, '%')))
    """)
    Page<Application> searchApplications(
            @Param("status") String status,
            @Param("opportunityId") Long opportunityId,
            @Param("keyword") String keyword,
            Pageable pageable
    );
    
}