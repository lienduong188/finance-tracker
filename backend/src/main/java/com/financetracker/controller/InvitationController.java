package com.financetracker.controller;

import com.financetracker.dto.invitation.InvitationRequest;
import com.financetracker.dto.invitation.InvitationResponse;
import com.financetracker.security.CustomUserDetails;
import com.financetracker.service.InvitationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
@Tag(name = "Invitations", description = "API quản lý lời mời gia đình")
public class InvitationController {

    private final InvitationService invitationService;

    @PostMapping
    @Operation(summary = "Gửi lời mời tham gia gia đình")
    public ResponseEntity<InvitationResponse> sendInvitation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody InvitationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(invitationService.sendInvitation(userDetails.getId(), request));
    }

    @GetMapping("/received")
    @Operation(summary = "Lấy danh sách lời mời đã nhận")
    public ResponseEntity<List<InvitationResponse>> getReceivedInvitations(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(invitationService.getReceivedInvitations(userDetails.getId(), userDetails.getEmail()));
    }

    @GetMapping("/received/count")
    @Operation(summary = "Đếm số lời mời đang chờ")
    public ResponseEntity<Map<String, Long>> countPendingInvitations(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        long count = invitationService.countPendingInvitations(userDetails.getId(), userDetails.getEmail());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/family/{familyId}")
    @Operation(summary = "Lấy danh sách lời mời của gia đình")
    public ResponseEntity<List<InvitationResponse>> getFamilyInvitations(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID familyId) {
        return ResponseEntity.ok(invitationService.getFamilyInvitations(userDetails.getId(), familyId));
    }

    @PostMapping("/{token}/accept")
    @Operation(summary = "Chấp nhận lời mời")
    public ResponseEntity<Void> acceptInvitation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String token) {
        invitationService.acceptInvitation(userDetails.getId(), token);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{token}/decline")
    @Operation(summary = "Từ chối lời mời")
    public ResponseEntity<Void> declineInvitation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String token) {
        invitationService.declineInvitation(userDetails.getId(), token);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Hủy lời mời")
    public ResponseEntity<Void> cancelInvitation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        invitationService.cancelInvitation(userDetails.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/resend")
    @Operation(summary = "Gửi lại lời mời")
    public ResponseEntity<InvitationResponse> resendInvitation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        return ResponseEntity.ok(invitationService.resendInvitation(userDetails.getId(), id));
    }
}
