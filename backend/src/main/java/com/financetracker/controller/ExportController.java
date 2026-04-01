package com.financetracker.controller;

import com.financetracker.security.CustomUserDetails;
import com.financetracker.service.ExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
@Tag(name = "Export", description = "Data export and backup endpoints")
public class ExportController {

    private final ExportService exportService;

    @GetMapping("/transactions/csv")
    @Operation(summary = "Export transactions to CSV")
    public ResponseEntity<byte[]> exportTransactionsCsv(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) UUID accountId,
            @RequestParam(required = false) String type) {

        UUID userId = userDetails.getId();
        byte[] csv = exportService.exportTransactionsCsv(userId, startDate, endDate, accountId, type);

        String filename = "transactions_" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".csv";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        headers.setContentLength(csv.length);

        return ResponseEntity.ok().headers(headers).body(csv);
    }

    @GetMapping("/backup")
    @Operation(summary = "Export full data backup as JSON")
    public ResponseEntity<byte[]> exportBackup(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        UUID userId = userDetails.getId();
        byte[] json = exportService.exportFullBackup(userId);

        String filename = "backup_" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".json";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        headers.setContentLength(json.length);

        return ResponseEntity.ok().headers(headers).body(json);
    }
}
