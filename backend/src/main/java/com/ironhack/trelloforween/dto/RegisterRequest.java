package com.ironhack.trelloforween.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    private String firstName;
    private String lastName;
    private String name;
    private String username;
    private String email;
    private String password;
    private String role;
    private String positionTitle;
    private String phone;
    private String githubUrl;
    private String linkedinUrl;
    private String profilePicture;
}
