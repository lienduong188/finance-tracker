package com.financetracker.controller;

import com.financetracker.dto.creditcard.*;
import com.financetracker.entity.PaymentPlanStatus;
import com.financetracker.entity.PaymentType;
import com.financetracker.security.CustomUserDetails;
import com.financetracker.service.CreditCardPaymentPlanService;
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
@RequestMapping("/api/credit-card-plans")
@RequiredArgsConstructor
public class CreditCardPaymentPlanController {

    private final CreditCardPaymentPlanService planService;

    @GetMapping
    public ResponseEntity<Page<CreditCardPaymentPlanResponse>> getAll(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) UUID accountId,
            @RequestParam(required = false) PaymentPlanStatus status,
            @RequestParam(required = false) PaymentType paymentType,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(planService.getAll(userDetails.getId(), accountId, status, paymentType, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CreditCardPaymentPlanResponse> getById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(planService.getById(userDetails.getId(), id));
    }

    @PostMapping
    public ResponseEntity<CreditCardPaymentPlanResponse> create(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreditCardPaymentPlanRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(planService.create(userDetails.getId(), request));
    }

    @PostMapping("/bulk")
    public ResponseEntity<BulkCreditCardPaymentPlanResponse> createBulk(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody BulkCreditCardPaymentPlanRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(planService.createBulk(userDetails.getId(), request));
    }

    @PostMapping("/{planId}/payments/{paymentId}/pay")
    public ResponseEntity<CreditCardPaymentResponse> markPaymentAsPaid(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID planId,
            @PathVariable UUID paymentId
    ) {
        return ResponseEntity.ok(planService.markPaymentAsPaid(userDetails.getId(), planId, paymentId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id
    ) {
        planService.cancel(userDetails.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<UpcomingPaymentResponse>> getUpcomingPayments(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "30") int days
    ) {
        return ResponseEntity.ok(planService.getUpcomingPayments(userDetails.getId(), days));
    }
}
