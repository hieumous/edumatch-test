package com.edumatch.scholarship.repository;

import com.edumatch.scholarship.model.Opportunity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository

public interface OpportunityRepository extends JpaRepository<Opportunity, Long>, JpaSpecificationExecutor<Opportunity> {

     List<Opportunity> findByCreatorUserId(Long creatorUserId);
     List<Opportunity> findByOrganizationId(Long organizationId);
     Page<Opportunity> findByModerationStatus(String status, Pageable pageable);
     
     // Kiểm tra xem đã có học bổng với cùng title và organizationId chưa
     boolean existsByOrganizationIdAndTitleIgnoreCase(Long organizationId, String title);
     
     // Kiểm tra xem đã có học bổng khác (không phải id này) với cùng title và organizationId chưa
     boolean existsByOrganizationIdAndTitleIgnoreCaseAndIdNot(Long organizationId, String title, Long id);
     
     // Tìm tất cả học bổng có cùng title (case-insensitive) để kiểm tra duplicate chi tiết
     List<Opportunity> findByTitleIgnoreCase(String title);
}