package com.example.jwt.example.repository;

import com.example.jwt.example.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByUsernameOrEmail(String username, String email);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);

    Optional<User> findByVerificationCode(String verificationCode);

    @Query("""
        SELECT DISTINCT u FROM User u JOIN u.roles r
        WHERE (:role IS NULL OR r.name = :role)
          AND (:enabled IS NULL OR u.enabled = :enabled)
          AND (
              :keyword IS NULL OR
              LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
              LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
              LOWER(u.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
              LOWER(u.lastName) LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
    """)
    Page<User> searchUsers(
            @Param("role") String role,
            @Param("enabled") Boolean enabled,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
