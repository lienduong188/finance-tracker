package com.financetracker.dto.account;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AccountPermissionResponse {
    private UUID id;
    private UUID userId;
    private String userEmail;
    private String userName;
    private boolean canView;
    private boolean canTransact;
}
