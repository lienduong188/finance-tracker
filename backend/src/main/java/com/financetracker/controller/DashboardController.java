package com.financetracker.controller;

import com.financetracker.dto.dashboard.CashflowReport;
import com.financetracker.dto.dashboard.CategoryReport;
import com.financetracker.dto.dashboard.DashboardSummary;
import com.financetracker.entity.TransactionType;
import com.financetracker.security.CustomUserDetails;
import com.financetracker.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Dashboard and reporting endpoints")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    @Operation(summary = "Get financial summary")
    public ResponseEntity<DashboardSummary> getSummary(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "VND") String currency) {
        return ResponseEntity.ok(dashboardService.getSummary(userDetails.getId(), currency));
    }

    @GetMapping("/cashflow")
    @Operation(summary = "Get cashflow report")
    public ResponseEntity<CashflowReport> getCashflowReport(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(dashboardService.getCashflowReport(userDetails.getId(), startDate, endDate));
    }

    @GetMapping("/by-category")
    @Operation(summary = "Get spending by category")
    public ResponseEntity<CategoryReport> getCategoryReport(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "EXPENSE") TransactionType type,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(dashboardService.getCategoryReport(userDetails.getId(), type, startDate, endDate));
    }
}
