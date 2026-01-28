package com.financetracker.dto.account;

import com.financetracker.entity.AccountVisibility;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AccountVisibilityRequest {

    @NotNull(message = "Visibility là bắt buộc")
    private AccountVisibility visibility;

    private UUID familyId;

    private List<AccountPermissionRequest> permissions;
}
