package com.financetracker.dto.admin;

import com.financetracker.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminUserResponse {

    private UUID id;
    private String email;
    private String fullName;
    private String defaultCurrency;
    private Role role;
    private Boolean enabled;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Login tracking
    private OffsetDateTime lastLoginAt;
    private String lastLoginIp;
    private String lastLoginLocation;
    private String lastUserAgent;

    // Statistics
    private Integer accountsCount;
    private Integer transactionsCount;

    // Deletion info
    private OffsetDateTime deletedAt;
    private OffsetDateTime deletionScheduledAt;
    private String deletedByEmail;  // null = self-deleted, value = admin who deleted
    private String deletionStatus;  // ACTIVE, PENDING_DELETION, DELETED
}
