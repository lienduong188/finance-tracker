package com.financetracker.service;

import com.financetracker.dto.user.ChangePasswordRequest;
import com.financetracker.dto.user.DeleteAccountRequest;
import com.financetracker.dto.user.RestoreAccountRequest;
import com.financetracker.dto.user.UpdateProfileRequest;
import com.financetracker.dto.user.UserResponse;
import com.financetracker.entity.User;
import com.financetracker.exception.ApiException;
import com.financetracker.exception.ErrorCode;
import com.financetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private static final int DELETION_GRACE_PERIOD_DAYS = 7;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    public UserResponse getUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User"));
        return toResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User"));

        if (request.getUsername() != null) {
            if (!request.getUsername().equals(user.getUsername()) && userRepository.existsByUsername(request.getUsername())) {
                throw new ApiException(ErrorCode.AUTH_009);
            }
            user.setUsername(request.getUsername());
        }
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getDefaultCurrency() != null) {
            user.setDefaultCurrency(request.getDefaultCurrency());
        }

        user = userRepository.save(user);
        return toResponse(user);
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw ApiException.badRequest("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount(UUID userId, DeleteAccountRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User"));

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw ApiException.badRequest("Password is incorrect");
        }

        // Check if already marked for deletion
        if (user.getDeletedAt() != null) {
            throw ApiException.badRequest("Account is already marked for deletion");
        }

        // Set deletion timestamps
        OffsetDateTime now = OffsetDateTime.now();
        user.setDeletedAt(now);
        user.setDeletionScheduledAt(now.plusDays(DELETION_GRACE_PERIOD_DAYS));
        user.setEnabled(false);

        userRepository.save(user);

        // Notify all admins
        notificationService.notifyAdminsUserDeleted(user);

        log.info("User {} marked for deletion. Data will be deleted after {}",
                user.getEmail(), user.getDeletionScheduledAt());
    }

    @Transactional
    public void restoreAccount(UUID userId, RestoreAccountRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User"));

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw ApiException.badRequest("Password is incorrect");
        }

        // Check if account is marked for deletion
        if (user.getDeletedAt() == null) {
            throw ApiException.badRequest("Account is not marked for deletion");
        }

        // Check if still within grace period
        if (user.getDeletionScheduledAt().isBefore(OffsetDateTime.now())) {
            throw ApiException.badRequest("Restoration period has expired");
        }

        // Clear deletion timestamps and re-enable account
        user.setDeletedAt(null);
        user.setDeletionScheduledAt(null);
        user.setEnabled(true);

        userRepository.save(user);

        log.info("User {} restored their account", user.getEmail());
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .defaultCurrency(user.getDefaultCurrency())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
