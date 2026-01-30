package com.financetracker.controller;

import com.financetracker.dto.user.ChangePasswordRequest;
import com.financetracker.dto.user.DeleteAccountRequest;
import com.financetracker.dto.user.RestoreAccountRequest;
import com.financetracker.dto.user.UpdateProfileRequest;
import com.financetracker.dto.user.UserResponse;
import com.financetracker.security.CustomUserDetails;
import com.financetracker.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management endpoints")
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<UserResponse> getProfile(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(userService.getUser(userDetails.getId()));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update user profile")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(userDetails.getId(), request));
    }

    @PutMapping("/password")
    @Operation(summary = "Change user password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(userDetails.getId(), request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/account")
    @Operation(summary = "Request account deletion (soft delete with 7-day grace period)")
    public ResponseEntity<Void> deleteAccount(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody DeleteAccountRequest request) {
        userService.deleteAccount(userDetails.getId(), request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/account/restore")
    @Operation(summary = "Restore account within grace period")
    public ResponseEntity<Void> restoreAccount(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody RestoreAccountRequest request) {
        userService.restoreAccount(userDetails.getId(), request);
        return ResponseEntity.ok().build();
    }
}
