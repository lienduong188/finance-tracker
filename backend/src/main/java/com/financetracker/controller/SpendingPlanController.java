package com.financetracker.controller;

import com.financetracker.dto.spendingplan.*;
import com.financetracker.entity.SpendingPlanStatus;
import com.financetracker.security.CustomUserDetails;
import com.financetracker.service.SpendingPlanService;
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
@RequestMapping("/api/spending-plans")
@RequiredArgsConstructor
@Tag(name = "Spending Plans", description = "API quản lý kế hoạch chi tiêu")
public class SpendingPlanController {

    private final SpendingPlanService spendingPlanService;

    // === PLAN CRUD ===

    @PostMapping
    @Operation(summary = "Tạo kế hoạch chi tiêu mới")
    public ResponseEntity<SpendingPlanResponse> createPlan(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody SpendingPlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(spendingPlanService.createPlan(userDetails.getId(), request));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách kế hoạch của tôi")
    public ResponseEntity<List<SpendingPlanResponse>> getMyPlans(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(spendingPlanService.getMyPlans(userDetails.getId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết kế hoạch")
    public ResponseEntity<SpendingPlanDetailResponse> getPlan(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        return ResponseEntity.ok(spendingPlanService.getPlan(userDetails.getId(), id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật kế hoạch")
    public ResponseEntity<SpendingPlanResponse> updatePlan(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody SpendingPlanRequest request) {
        return ResponseEntity.ok(spendingPlanService.updatePlan(userDetails.getId(), id, request));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Cập nhật trạng thái kế hoạch")
    public ResponseEntity<SpendingPlanResponse> updatePlanStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @RequestParam SpendingPlanStatus status) {
        return ResponseEntity.ok(spendingPlanService.updatePlanStatus(userDetails.getId(), id, status));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa kế hoạch")
    public ResponseEntity<Void> deletePlan(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        spendingPlanService.deletePlan(userDetails.getId(), id);
        return ResponseEntity.noContent().build();
    }

    // === ITEMS ===

    @PostMapping("/{planId}/items")
    @Operation(summary = "Thêm hạng mục vào kế hoạch")
    public ResponseEntity<SpendingPlanItemResponse> addItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID planId,
            @Valid @RequestBody SpendingPlanItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(spendingPlanService.addItem(userDetails.getId(), planId, request));
    }

    @GetMapping("/{planId}/items")
    @Operation(summary = "Lấy danh sách hạng mục")
    public ResponseEntity<List<SpendingPlanItemResponse>> getItems(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID planId) {
        return ResponseEntity.ok(spendingPlanService.getItems(userDetails.getId(), planId));
    }

    @PutMapping("/{planId}/items/{itemId}")
    @Operation(summary = "Cập nhật hạng mục")
    public ResponseEntity<SpendingPlanItemResponse> updateItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID planId,
            @PathVariable UUID itemId,
            @Valid @RequestBody SpendingPlanItemRequest request) {
        return ResponseEntity.ok(spendingPlanService.updateItem(userDetails.getId(), planId, itemId, request));
    }

    @DeleteMapping("/{planId}/items/{itemId}")
    @Operation(summary = "Xóa hạng mục")
    public ResponseEntity<Void> deleteItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID planId,
            @PathVariable UUID itemId) {
        spendingPlanService.deleteItem(userDetails.getId(), planId, itemId);
        return ResponseEntity.noContent().build();
    }

    // === EXPENSES ===

    @PostMapping("/{planId}/items/{itemId}/expenses")
    @Operation(summary = "Ghi nhận chi tiêu thực tế")
    public ResponseEntity<SpendingPlanExpenseResponse> recordExpense(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID planId,
            @PathVariable UUID itemId,
            @Valid @RequestBody SpendingPlanExpenseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(spendingPlanService.recordExpense(userDetails.getId(), planId, itemId, request));
    }

    @GetMapping("/{planId}/items/{itemId}/expenses")
    @Operation(summary = "Lấy danh sách chi tiêu của hạng mục")
    public ResponseEntity<List<SpendingPlanExpenseResponse>> getItemExpenses(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID planId,
            @PathVariable UUID itemId) {
        return ResponseEntity.ok(spendingPlanService.getExpenses(userDetails.getId(), planId, itemId));
    }

    @GetMapping("/{planId}/expenses")
    @Operation(summary = "Lấy tất cả chi tiêu của kế hoạch")
    public ResponseEntity<List<SpendingPlanExpenseResponse>> getAllExpenses(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID planId) {
        return ResponseEntity.ok(spendingPlanService.getAllExpenses(userDetails.getId(), planId));
    }

    @DeleteMapping("/{planId}/items/{itemId}/expenses/{expenseId}")
    @Operation(summary = "Xóa chi tiêu")
    public ResponseEntity<Void> deleteExpense(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID planId,
            @PathVariable UUID itemId,
            @PathVariable UUID expenseId) {
        spendingPlanService.deleteExpense(userDetails.getId(), planId, itemId, expenseId);
        return ResponseEntity.noContent().build();
    }
}
