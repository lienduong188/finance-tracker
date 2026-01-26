package com.financetracker.controller;

import com.financetracker.dto.auth.AuthResponse;
import com.financetracker.dto.auth.ForgotPasswordRequest;
import com.financetracker.dto.auth.LoginRequest;
import com.financetracker.dto.auth.RefreshTokenRequest;
import com.financetracker.dto.auth.RegisterRequest;
import com.financetracker.dto.auth.ResetPasswordRequest;
import com.financetracker.security.CustomUserDetails;
import com.financetracker.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication endpoints")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.login(request, httpRequest));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset")
    public ResponseEntity<java.util.Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String token = authService.forgotPassword(request);
        // In production, send this token via email instead of returning it
        return ResponseEntity.ok(java.util.Map.of(
                "message", "Password reset token generated",
                "token", token
        ));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password with token")
    public ResponseEntity<java.util.Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(java.util.Map.of("message", "Password reset successful"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user info")
    public ResponseEntity<AuthResponse> getCurrentUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(AuthResponse.builder()
                .userId(userDetails.getId())
                .email(userDetails.getEmail())
                .fullName(userDetails.getFullName())
                .defaultCurrency(userDetails.getDefaultCurrency())
                .build());
    }
}
