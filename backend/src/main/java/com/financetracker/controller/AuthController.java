package com.financetracker.controller;

import com.financetracker.dto.auth.AuthResponse;
import com.financetracker.dto.auth.ForgotPasswordRequest;
import com.financetracker.dto.auth.LoginRequest;
import com.financetracker.dto.auth.LogoutRequest;
import com.financetracker.dto.auth.RefreshTokenRequest;
import com.financetracker.dto.auth.RegisterRequest;
import com.financetracker.dto.auth.ResendVerificationRequest;
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
    public ResponseEntity<java.util.Map<String, String>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.register(request, httpRequest));
    }

    @GetMapping("/verify-email")
    @Operation(summary = "Verify email with token")
    public ResponseEntity<java.util.Map<String, String>> verifyEmail(@RequestParam String token) {
        return ResponseEntity.ok(authService.verifyEmail(token));
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Resend verification email")
    public ResponseEntity<java.util.Map<String, String>> resendVerification(
            @Valid @RequestBody ResendVerificationRequest request) {
        return ResponseEntity.ok(authService.resendVerification(request.getEmail()));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with username/email and password")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.login(request, httpRequest));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<AuthResponse> refresh(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.refreshToken(request, httpRequest));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout and revoke refresh token")
    public ResponseEntity<java.util.Map<String, String>> logout(
            @Valid @RequestBody LogoutRequest request) {
        authService.logout(request);
        return ResponseEntity.ok(java.util.Map.of("message", "Logged out successfully"));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset")
    public ResponseEntity<java.util.Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(java.util.Map.of(
                "message", "Password reset email sent"
        ));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password with token")
    public ResponseEntity<java.util.Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(java.util.Map.of("message", "Password reset successful"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user info")
    public ResponseEntity<AuthResponse> getCurrentUser(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(AuthResponse.builder()
                .userId(userDetails.getId())
                .email(userDetails.getEmail())
                .username(userDetails.getUsernameField())
                .fullName(userDetails.getFullName())
                .defaultCurrency(userDetails.getDefaultCurrency())
                .role(userDetails.getRole().name())
                .build());
    }
}
