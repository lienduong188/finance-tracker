package com.financetracker.dto.invitation;

import com.financetracker.entity.FamilyRole;
import com.financetracker.entity.InvitationStatus;
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
public class InvitationResponse {
    private UUID id;
    private UUID familyId;
    private String familyName;
    private String inviterEmail;
    private String inviterName;
    private String inviteeEmail;
    private FamilyRole role;
    private InvitationStatus status;
    private String token;
    private String message;
    private OffsetDateTime expiresAt;
    private OffsetDateTime createdAt;
}
