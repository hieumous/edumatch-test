package com.edumatch.scholarship.dto.client;

import lombok.Data;

// DTO đơn giản để hứng dữ liệu trả về từ Auth-Service
@Data
public class UserDetailDto {
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    //cần 2 trường này từ Auth-Service
    private Long organizationId;
    
    // Profile fields for matching
    private Double gpa;
    private String major;
    private String university;
    private Integer yearOfStudy;
    private String skills; // Comma-separated
    private String researchInterests; // Comma-separated
}
