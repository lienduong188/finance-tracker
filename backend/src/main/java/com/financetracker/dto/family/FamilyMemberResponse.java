package com.financetracker.dto.family;

import com.financetracker.entity.FamilyRole;
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
public class FamilyMemberResponse {
    private UUID id;
    private UUID userId;
    private String email;
    private String fullName;
    private FamilyRole role;
    private OffsetDateTime joinedAt;
}
