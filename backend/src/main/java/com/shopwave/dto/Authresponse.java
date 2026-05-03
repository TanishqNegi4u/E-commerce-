package com.shopwave.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {

    private String accessToken;
    private String refreshToken;

    @Builder.Default
    private String tokenType = "Bearer";

    private Long userId;
    private String email;
    private String firstName;
    private String role;

    // BUG-3 FIX: added error field so 409 conflict returns a meaningful body
    // instead of null, preventing frontend TypeError on .message access
    private String error;
}