package com.financetracker.dto.family;

import com.financetracker.entity.FamilyRole;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateMemberRoleRequest {

    @NotNull(message = "Role là bắt buộc")
    private FamilyRole role;
}
