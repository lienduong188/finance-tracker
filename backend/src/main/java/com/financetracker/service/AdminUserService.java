package com.financetracker.service;

import com.financetracker.dto.admin.AdminUserResponse;
import com.financetracker.dto.admin.UpdateUserRoleRequest;
import com.financetracker.entity.Role;
import com.financetracker.entity.User;
import com.financetracker.exception.ApiException;
import com.financetracker.repository.AccountRepository;
import com.financetracker.repository.TransactionRepository;
import com.financetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    public Page<AdminUserResponse> getAllUsers(String search, Pageable pageable) {
        Page<User> users;
        if (search != null && !search.isBlank()) {
            users = userRepository.searchUsers(search.trim(), pageable);
        } else {
            users = userRepository.findAll(pageable);
        }
        return users.map(this::toResponse);
    }

    public AdminUserResponse getUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("User"));
        return toResponse(user);
    }

    @Transactional
    public AdminUserResponse updateRole(UUID id, UpdateUserRoleRequest request, UUID currentUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("User"));

        // Prevent self-demotion
        if (id.equals(currentUserId) && request.getRole() != Role.ADMIN) {
            throw ApiException.badRequest("Cannot demote yourself");
        }

        // Prevent removing last admin
        if (user.getRole() == Role.ADMIN && request.getRole() != Role.ADMIN) {
            long adminCount = userRepository.countByRole(Role.ADMIN);
            if (adminCount <= 1) {
                throw ApiException.badRequest("Cannot remove the last admin");
            }
        }

        user.setRole(request.getRole());
        user = userRepository.save(user);
        return toResponse(user);
    }

    @Transactional
    public AdminUserResponse toggleEnabled(UUID id, UUID currentUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("User"));

        // Prevent self-disable
        if (id.equals(currentUserId)) {
            throw ApiException.badRequest("Cannot disable yourself");
        }

        user.setEnabled(!user.getEnabled());
        user = userRepository.save(user);
        return toResponse(user);
    }

    @Transactional
    public void deleteUser(UUID id, UUID currentUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("User"));

        // Prevent self-delete
        if (id.equals(currentUserId)) {
            throw ApiException.badRequest("Cannot delete yourself");
        }

        // Prevent deleting last admin
        if (user.getRole() == Role.ADMIN) {
            long adminCount = userRepository.countByRole(Role.ADMIN);
            if (adminCount <= 1) {
                throw ApiException.badRequest("Cannot delete the last admin");
            }
        }

        userRepository.delete(user);
    }

    private AdminUserResponse toResponse(User user) {
        int accountsCount = accountRepository.findByUserId(user.getId()).size();
        int transactionsCount = (int) transactionRepository.findByUserId(user.getId(), Pageable.unpaged()).getTotalElements();

        return AdminUserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .defaultCurrency(user.getDefaultCurrency())
                .role(user.getRole())
                .enabled(user.getEnabled())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .lastLoginIp(user.getLastLoginIp())
                .lastLoginLocation(user.getLastLoginLocation())
                .lastUserAgent(user.getLastUserAgent())
                .accountsCount(accountsCount)
                .transactionsCount(transactionsCount)
                .build();
    }
}
