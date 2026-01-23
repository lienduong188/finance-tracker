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

    // Statistics
    private Integer accountsCount;
    private Integer transactionsCount;
}
