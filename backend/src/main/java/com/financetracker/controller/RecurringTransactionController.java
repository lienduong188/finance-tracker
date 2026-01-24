package com.financetracker.controller;

import com.financetracker.dto.recurring.RecurringTransactionRequest;
import com.financetracker.dto.recurring.RecurringTransactionResponse;
import com.financetracker.dto.recurring.UpcomingTransactionResponse;
import com.financetracker.entity.RecurringStatus;
import com.financetracker.security.CustomUserDetails;
import com.financetracker.service.RecurringTransactionService;
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
@RequestMapping("/api/recurring-transactions")
@RequiredArgsConstructor
public class RecurringTransactionController {

    private final RecurringTransactionService recurringService;

    @GetMapping
    public ResponseEntity<Page<RecurringTransactionResponse>> getAll(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(required = false) RecurringStatus status,
            @PageableDefault(size = 20, sort = "nextExecutionDate", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        Page<RecurringTransactionResponse> result;
        if (status != null) {
            result = recurringService.getByStatus(user.getId(), status, pageable);
        } else {
            result = recurringService.getAll(user.getId(), pageable);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecurringTransactionResponse> getById(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(recurringService.getById(user.getId(), id));
    }

    @PostMapping
    public ResponseEntity<RecurringTransactionResponse> create(
            @AuthenticationPrincipal CustomUserDetails user,
            @Valid @RequestBody RecurringTransactionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recurringService.create(user.getId(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecurringTransactionResponse> update(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID id,
            @Valid @RequestBody RecurringTransactionRequest request
    ) {
        return ResponseEntity.ok(recurringService.update(user.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID id
    ) {
        recurringService.delete(user.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/pause")
    public ResponseEntity<RecurringTransactionResponse> pause(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(recurringService.pause(user.getId(), id));
    }

    @PostMapping("/{id}/resume")
    public ResponseEntity<RecurringTransactionResponse> resume(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(recurringService.resume(user.getId(), id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<RecurringTransactionResponse> cancel(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(recurringService.cancel(user.getId(), id));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<UpcomingTransactionResponse>> getUpcoming(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(defaultValue = "30") int days
    ) {
        return ResponseEntity.ok(recurringService.getUpcoming(user.getId(), days));
    }
}
