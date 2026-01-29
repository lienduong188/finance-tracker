package com.financetracker.controller;

import com.financetracker.dto.savings.*;
import com.financetracker.security.CustomUserDetails;
import com.financetracker.service.SavingsGoalService;
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
@RequestMapping("/api/savings-goals")
@RequiredArgsConstructor
@Tag(name = "Savings Goals", description = "API quản lý mục tiêu tiết kiệm")
public class SavingsGoalController {

    private final SavingsGoalService savingsGoalService;

    @PostMapping
    @Operation(summary = "Tạo mục tiêu tiết kiệm mới")
    public ResponseEntity<SavingsGoalResponse> createGoal(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody SavingsGoalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savingsGoalService.createGoal(userDetails.getId(), request));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách mục tiêu của tôi")
    public ResponseEntity<List<SavingsGoalResponse>> getMyGoals(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(savingsGoalService.getMyGoals(userDetails.getId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết mục tiêu")
    public ResponseEntity<SavingsGoalResponse> getGoal(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        return ResponseEntity.ok(savingsGoalService.getGoal(userDetails.getId(), id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật mục tiêu")
    public ResponseEntity<SavingsGoalResponse> updateGoal(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody SavingsGoalRequest request) {
        return ResponseEntity.ok(savingsGoalService.updateGoal(userDetails.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa mục tiêu")
    public ResponseEntity<Void> deleteGoal(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        savingsGoalService.deleteGoal(userDetails.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/contribute")
    @Operation(summary = "Đóng góp vào mục tiêu")
    public ResponseEntity<SavingsContributionResponse> contribute(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody SavingsContributionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savingsGoalService.contribute(userDetails.getId(), id, request));
    }

    @GetMapping("/{id}/contributions")
    @Operation(summary = "Lấy lịch sử đóng góp")
    public ResponseEntity<List<SavingsContributionResponse>> getContributions(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        return ResponseEntity.ok(savingsGoalService.getContributions(userDetails.getId(), id));
    }

    @GetMapping("/{id}/contributors")
    @Operation(summary = "Lấy tổng hợp đóng góp theo người")
    public ResponseEntity<List<ContributorSummary>> getContributorsSummary(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        return ResponseEntity.ok(savingsGoalService.getContributorsSummary(userDetails.getId(), id));
    }

    @PutMapping("/{goalId}/contributions/{contributionId}")
    @Operation(summary = "Cập nhật đóng góp")
    public ResponseEntity<SavingsContributionResponse> updateContribution(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID goalId,
            @PathVariable UUID contributionId,
            @Valid @RequestBody SavingsContributionUpdateRequest request) {
        return ResponseEntity.ok(savingsGoalService.updateContribution(userDetails.getId(), goalId, contributionId, request));
    }

    @DeleteMapping("/{goalId}/contributions/{contributionId}")
    @Operation(summary = "Xóa đóng góp")
    public ResponseEntity<Void> deleteContribution(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID goalId,
            @PathVariable UUID contributionId) {
        savingsGoalService.deleteContribution(userDetails.getId(), goalId, contributionId);
        return ResponseEntity.noContent().build();
    }
}
