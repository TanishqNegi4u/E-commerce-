package com.shopwave.controller;

import com.shopwave.dto.*;
import com.shopwave.exception.ResourceNotFoundException;
import com.shopwave.model.User;
import com.shopwave.repository.UserRepository;
import com.shopwave.security.JwtTokenProvider;
import com.shopwave.service.CustomUserDetailsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, Login, Token refresh")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().build();
        }
        User user = User.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .phone(request.getPhone())
            .build();
        userRepository.save(user);
        UserDetails userDetails =
            userDetailsService.loadUserByUsername(user.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(buildAuthResponse(user, userDetails));
    }

    @PostMapping("/login")
    @Operation(summary = "Login and get JWT token")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getEmail(), request.getPassword()));
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() ->
                new ResourceNotFoundException("User not found"));
        UserDetails userDetails =
            userDetailsService.loadUserByUsername(user.getEmail());
        return ResponseEntity.ok(buildAuthResponse(user, userDetails));
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<?> refreshToken(
            @RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        try {
            String email = jwtTokenProvider.extractUsername(refreshToken);
            UserDetails userDetails =
                userDetailsService.loadUserByUsername(email);
            if (jwtTokenProvider.isTokenValid(refreshToken, userDetails)) {
                String newToken = jwtTokenProvider.generateToken(userDetails);
                return ResponseEntity.ok(Map.of(
                    "accessToken", newToken,
                    "tokenType", "Bearer"));
            }
        } catch (Exception e) {
            // fall through
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("error", "Invalid refresh token"));
    }

    private AuthResponse buildAuthResponse(User user, UserDetails userDetails) {
        return AuthResponse.builder()
            .accessToken(jwtTokenProvider.generateToken(userDetails))
            .refreshToken(jwtTokenProvider.generateRefreshToken(userDetails))
            .userId(user.getId())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .role(user.getRole().name())
            .build();
    }
}