package com.example.jwt.example.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserDetailDto {
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private Long organizationId;
    
    // Profile fields for matching
    private Double gpa;
    private String major;
    private String university;
    private Integer yearOfStudy;
    private String skills; // Comma-separated
    private String researchInterests; // Comma-separated
}