package com.financetracker.service;

import com.financetracker.dto.user.ChangePasswordRequest;
import com.financetracker.dto.user.UpdateProfileRequest;
import com.financetracker.dto.user.UserResponse;
import com.financetracker.entity.User;
import com.financetracker.exception.ApiException;
import com.financetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse getUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User"));
        return toResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User"));

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

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .defaultCurrency(user.getDefaultCurrency())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
