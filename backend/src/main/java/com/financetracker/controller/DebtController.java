package com.financetracker.controller;

import com.financetracker.dto.debt.*;
import com.financetracker.entity.DebtStatus;
import com.financetracker.entity.DebtType;
import com.financetracker.service.DebtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/debts")
@RequiredArgsConstructor
public class DebtController {

    private final DebtService debtService;

    @GetMapping
    public ResponseEntity<Page<DebtResponse>> getAll(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(required = false) DebtType type,
            @RequestParam(required = false) DebtStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(debtService.getAll(userId, type, status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DebtResponse> getById(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(debtService.getById(userId, id));
    }

    @PostMapping
    public ResponseEntity<DebtResponse> create(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody DebtRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(debtService.create(userId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DebtResponse> update(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody DebtRequest request
    ) {
        return ResponseEntity.ok(debtService.update(userId, id, request));
    }

    @PostMapping("/{id}/payment")
    public ResponseEntity<DebtResponse> recordPayment(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody DebtPaymentRequest request
    ) {
        return ResponseEntity.ok(debtService.recordPayment(userId, id, request));
    }

    @PostMapping("/{id}/mark-paid")
    public ResponseEntity<DebtResponse> markAsPaid(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(debtService.markAsPaid(userId, id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<DebtResponse> cancel(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(debtService.cancel(userId, id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id
    ) {
        debtService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary")
    public ResponseEntity<DebtSummary> getSummary(
            @AuthenticationPrincipal UUID userId
    ) {
        return ResponseEntity.ok(debtService.getSummary(userId));
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<DebtResponse>> getOverdueDebts(
            @AuthenticationPrincipal UUID userId
    ) {
        return ResponseEntity.ok(debtService.getOverdueDebts(userId));
    }
}
