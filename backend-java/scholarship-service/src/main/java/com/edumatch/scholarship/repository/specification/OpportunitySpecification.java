package com.edumatch.scholarship.repository.specification;

import com.edumatch.scholarship.model.Opportunity;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class OpportunitySpecification {
    public static Specification<Opportunity> filterBy(
            String keyword, // Tham số ?q=
            BigDecimal gpa, // Tham số ?gpa=
            // THAM SỐ LỌC MỚI
            String studyMode,
            String level,
            Boolean isPublic,
            LocalDate currentDate // Tham số có thể bị null
    ) {
        // --- KHẮC PHỤC LỖI BIÊN DỊCH Ở ĐÂY ---
        // Tạo một biến final mới để sử dụng bên trong lambda
        final LocalDate dateToFilter = (currentDate == null) ? LocalDate.now() : currentDate;
        // ----------------------------------------

        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>(); //

            // 1. ĐIỀU KIỆN BẮT BUỘC: Chỉ lấy các cơ hội đã được duyệt
            predicates.add(criteriaBuilder.equal(root.get("moderationStatus"), "APPROVED")); //

            // 2. ĐIỀU KIỆN CÔNG KHAI: isPublic=true
            if (isPublic == null || isPublic) {
                predicates.add(criteriaBuilder.equal(root.get("isPublic"), true));
            }

            // 3. ĐIỀU KIỆN DEADLINE: Hạn nộp đơn phải chưa hết hạn
            // SỬ DỤNG dateToFilter THAY VÌ currentDate
            predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("applicationDeadline"), dateToFilter));

            // 4. Lọc theo Keyword (Giữ nguyên)
            if (keyword != null && !keyword.isEmpty()) {
                String keywordLike = "%" + keyword.toLowerCase() + "%"; //
                predicates.add( //
                        criteriaBuilder.or(
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), keywordLike), //
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("fullDescription")), keywordLike) //
                        )
                );
            }

            // 5. Lọc theo GPA
            if (gpa != null) { //
                predicates.add( //
                        criteriaBuilder.or( //
                                criteriaBuilder.lessThanOrEqualTo(root.get("minGpa"), gpa),
                                criteriaBuilder.isNull(root.get("minGpa")) //
                        ) //
                );
            } //

            // 6. Lọc theo Study Mode
            if (studyMode != null && !studyMode.isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("studyMode"), studyMode));
            }

            // 7. Lọc theo Level
            if (level != null && !level.isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("level"), level));
            }

            // Kết hợp tất cả lại bằng AND
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        }; //
    }
}