package com.financetracker.controller;

import com.financetracker.entity.UserBackup;
import com.financetracker.repository.UserBackupRepository;
import com.financetracker.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.UUID;

@RestController
@RequestMapping("/api/backups")
@RequiredArgsConstructor
@Tag(name = "Backups", description = "User backup management")
public class BackupController {

    private final UserBackupRepository userBackupRepository;

    @GetMapping
    @Operation(summary = "List user's backups")
    public ResponseEntity<List<Map<String, Object>>> listBackups(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        UUID userId = userDetails.getId();
        List<UserBackup> backups = userBackupRepository.findByUserIdOrderByCreatedAtDesc(userId);

        List<Map<String, Object>> result = backups.stream().map(b -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", b.getId());
            m.put("fileName", b.getFileName());
            m.put("fileSize", b.getFileSize());
            m.put("createdAt", b.getCreatedAt());
            return m;
        }).toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Download a specific backup file")
    public ResponseEntity<byte[]> downloadBackup(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        UUID userId = userDetails.getId();
        UserBackup backup = userBackupRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Backup not found"));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setContentDisposition(ContentDisposition.attachment().filename(backup.getFileName()).build());
        headers.setContentLength(backup.getContent().length);

        return ResponseEntity.ok().headers(headers).body(backup.getContent());
    }
}
