package com.financetracker.controller;

import com.financetracker.dto.account.AccountRequest;
import com.financetracker.dto.account.AccountResponse;
import com.financetracker.security.CustomUserDetails;
import com.financetracker.service.AccountService;
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
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@Tag(name = "Accounts", description = "Account management endpoints")
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    @Operation(summary = "Get all accounts")
    public ResponseEntity<List<AccountResponse>> getAllAccounts(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(accountService.getAllAccounts(userDetails.getId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get account by ID")
    public ResponseEntity<AccountResponse> getAccount(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        return ResponseEntity.ok(accountService.getAccount(userDetails.getId(), id));
    }

    @PostMapping
    @Operation(summary = "Create a new account")
    public ResponseEntity<AccountResponse> createAccount(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AccountRequest request) {
        return ResponseEntity.ok(accountService.createAccount(userDetails.getId(), request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an account")
    public ResponseEntity<AccountResponse> updateAccount(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody AccountRequest request) {
        return ResponseEntity.ok(accountService.updateAccount(userDetails.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an account (soft delete)")
    public ResponseEntity<Void> deleteAccount(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        accountService.deleteAccount(userDetails.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
