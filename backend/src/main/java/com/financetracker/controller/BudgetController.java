package com.financetracker.controller;

import com.financetracker.dto.budget.BudgetRequest;
import com.financetracker.dto.budget.BudgetResponse;
import com.financetracker.security.CustomUserDetails;
import com.financetracker.service.BudgetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
@Tag(name = "Budgets", description = "Budget management endpoints")
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping
    @Operation(summary = "Get all budgets")
    public ResponseEntity<List<BudgetResponse>> getAllBudgets(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(budgetService.getAllBudgets(userDetails.getId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get budget by ID")
    public ResponseEntity<BudgetResponse> getBudget(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        return ResponseEntity.ok(budgetService.getBudget(userDetails.getId(), id));
    }

    @PostMapping
    @Operation(summary = "Create a new budget")
    public ResponseEntity<BudgetResponse> createBudget(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(budgetService.createBudget(userDetails.getId(), request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a budget")
    public ResponseEntity<BudgetResponse> updateBudget(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(budgetService.updateBudget(userDetails.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a budget (soft delete)")
    public ResponseEntity<Void> deleteBudget(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        budgetService.deleteBudget(userDetails.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
