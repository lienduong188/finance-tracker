package com.financetracker.dto.account;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AccountPermissionRequest {

    @NotNull(message = "User ID là bắt buộc")
    private UUID userId;

    @Builder.Default
    private boolean canView = true;

    @Builder.Default
    private boolean canTransact = false;
}
