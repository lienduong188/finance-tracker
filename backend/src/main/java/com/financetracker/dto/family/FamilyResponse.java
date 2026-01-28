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
public class FamilyResponse {
    private UUID id;
    private String name;
    private String description;
    private String currency;
    private UUID createdById;
    private String createdByName;
    private int memberCount;
    private FamilyRole myRole;
    private OffsetDateTime createdAt;
}
