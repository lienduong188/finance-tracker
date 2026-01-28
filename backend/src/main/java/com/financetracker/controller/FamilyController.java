package com.financetracker.controller;

import com.financetracker.dto.family.*;
import com.financetracker.security.CustomUserDetails;
import com.financetracker.service.FamilyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/families")
@RequiredArgsConstructor
@Tag(name = "Families", description = "API quản lý gia đình")
public class FamilyController {

    private final FamilyService familyService;

    @PostMapping
    @Operation(summary = "Tạo gia đình mới")
    public ResponseEntity<FamilyResponse> createFamily(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody FamilyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(familyService.createFamily(userDetails.getId(), request));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách gia đình của tôi")
    public ResponseEntity<List<FamilyResponse>> getMyFamilies(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(familyService.getMyFamilies(userDetails.getId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết gia đình")
    public ResponseEntity<FamilyResponse> getFamily(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        return ResponseEntity.ok(familyService.getFamily(userDetails.getId(), id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin gia đình")
    public ResponseEntity<FamilyResponse> updateFamily(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody FamilyRequest request) {
        return ResponseEntity.ok(familyService.updateFamily(userDetails.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa gia đình (chỉ Owner)")
    public ResponseEntity<Void> deleteFamily(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        familyService.deleteFamily(userDetails.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/members")
    @Operation(summary = "Lấy danh sách thành viên")
    public ResponseEntity<List<FamilyMemberResponse>> getMembers(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        return ResponseEntity.ok(familyService.getMembers(userDetails.getId(), id));
    }

    @PutMapping("/{familyId}/members/{memberId}/role")
    @Operation(summary = "Thay đổi role của thành viên")
    public ResponseEntity<FamilyMemberResponse> updateMemberRole(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID familyId,
            @PathVariable UUID memberId,
            @Valid @RequestBody UpdateMemberRoleRequest request) {
        return ResponseEntity.ok(familyService.updateMemberRole(userDetails.getId(), familyId, memberId, request));
    }

    @DeleteMapping("/{familyId}/members/{memberId}")
    @Operation(summary = "Xóa thành viên khỏi gia đình")
    public ResponseEntity<Void> removeMember(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID familyId,
            @PathVariable UUID memberId) {
        familyService.removeMember(userDetails.getId(), familyId, memberId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/leave")
    @Operation(summary = "Rời khỏi gia đình")
    public ResponseEntity<Void> leaveFamily(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        familyService.leaveFamily(userDetails.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
