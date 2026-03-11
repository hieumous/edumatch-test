package com.example.jwt.example.service;

import com.example.jwt.example.dto.request.SignUpRequest;
import com.example.jwt.example.dto.response.UserResponse;
import com.example.jwt.example.exception.ResourceNotFoundException;
import com.example.jwt.example.exception.BadRequestException;
import com.example.jwt.example.model.Role;
import com.example.jwt.example.model.User;
import com.example.jwt.example.repository.RoleRepository;
import com.example.jwt.example.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final RefreshTokenService refreshTokenService;

    /**
     * Tao user moi voi role USER
     */
    public User createUser(SignUpRequest request) {
        validateUserRequest(request);

        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", "ROLE_USER"));

        User user = buildUser(request, userRole);
        User savedUser = userRepository.save(user);

        log.info("Created user: {}", savedUser.getUsername());
        auditLogService.logAction(
                savedUser.getId(),
                savedUser.getUsername(),
                "CREATE_USER",
                "User",
                "User account created by admin"
        );

        return savedUser;
    }

    /**
     * Tao employer moi voi role EMPLOYER
     */
    public User createEmployer(SignUpRequest request) {
        validateUserRequest(request);

        Role employerRole = roleRepository.findByName("ROLE_EMPLOYER")
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", "ROLE_EMPLOYER"));

        User employer = buildUser(request, employerRole);
        employer.setOrganizationId(request.getOrganizationId());
        
        User savedEmployer = userRepository.save(employer);

        log.info("Created employer: {}", savedEmployer.getUsername());
        auditLogService.logAction(
                savedEmployer.getId(),
                savedEmployer.getUsername(),
                "CREATE_EMPLOYER",
                "User",
                "Employer account created by admin"
        );

        return savedEmployer;
    }

    /**
     * Lay danh sach users voi filter va phan trang
     */
    @Transactional(readOnly = true)
    public Page<User> getAllUsers(String role, Boolean enabled, String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return userRepository.searchUsers(role, enabled, keyword, pageable);
    }

    /**
     * Lay user theo ID
     */
    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    /**
     * Lay user theo username
     */
    @Transactional(readOnly = true)
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
    }

    /**
     * Xoa user
     */
    public void deleteUser(Long id) {
        User user = getUserById(id);
        
        // Delete related records first to avoid FK constraint violation
        try {
            // Delete refresh tokens
            refreshTokenService.deleteByUserId(id);
            log.info("Deleted refresh tokens for user: {}", user.getUsername());
        } catch (Exception e) {
            log.warn("Error deleting refresh tokens: {}", e.getMessage());
        }
        
        // Log before deletion (audit log will be orphaned but that's ok for audit trail)
        auditLogService.logAction(
                id,
                user.getUsername(),
                "DELETE_USER",
                "User",
                "User account deleted by admin"
        );
        
        // Delete user (user_roles will be auto-deleted by JPA cascade)
        userRepository.delete(user);
        log.info("Deleted user: {}", user.getUsername());
    }

    /**
     * Khoa/mo khoa user
     */
    public User toggleUserStatus(Long id) {
        User user = getUserById(id);
        user.setEnabled(!user.getEnabled());
        User updatedUser = userRepository.save(user);

        String action = updatedUser.getEnabled() ? "UNLOCK_USER" : "LOCK_USER";
        String message = updatedUser.getEnabled() ? "User account unlocked" : "User account locked";

        log.info("{}: {}", action, updatedUser.getUsername());
        auditLogService.logAction(
                id,
                updatedUser.getUsername(),
                action,
                "User",
                message
        );

        return updatedUser;
    }

    /**
     * Convert User entity sang UserResponse DTO
     */
    public UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .sex(user.getSex())
                .organizationId(user.getOrganizationId())
                .enabled(user.getEnabled())
                .status(user.getStatus())
                .subscriptionType(user.getSubscriptionType())
                .roles(user.getRoles().stream()
                        .map(Role::getName)
                        .collect(Collectors.toSet()))
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    /**
     * Convert list User entities sang list UserResponse DTOs
     */
    public List<UserResponse> toUserResponseList(List<User> users) {
        return users.stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());
    }

    // ========== Private Helper Methods ==========

    private void validateUserRequest(SignUpRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already exists: " + request.getUsername());
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already in use: " + request.getEmail());
        }
    }

    private User buildUser(SignUpRequest request, Role role) {
        return User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .enabled(true)
                .roles(Collections.singleton(role))
                .build();
    }
}
