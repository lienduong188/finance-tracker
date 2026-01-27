package com.financetracker.controller;

import com.financetracker.dto.admin.TokenUsageStatsResponse;
import com.financetracker.service.TokenUsageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/token-usage")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminTokenUsageController {

    private final TokenUsageService tokenUsageService;

    @GetMapping("/stats")
    public ResponseEntity<TokenUsageStatsResponse> getStats() {
        return ResponseEntity.ok(tokenUsageService.getAdminStats());
    }
}
