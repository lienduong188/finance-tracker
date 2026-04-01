package com.financetracker.scheduler;

import com.financetracker.entity.User;
import com.financetracker.entity.UserBackup;
import com.financetracker.repository.UserBackupRepository;
import com.financetracker.repository.UserRepository;
import com.financetracker.service.ExportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BackupScheduler {

    private static final int MAX_BACKUPS_PER_USER = 3;

    private final UserRepository userRepository;
    private final UserBackupRepository userBackupRepository;
    private final ExportService exportService;

    /**
     * Auto backup all users' data daily at 02:00 AM
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void runDailyBackup() {
        log.info("Starting daily backup job...");

        List<User> activeUsers = userRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getEnabled()) && u.getDeletedAt() == null)
                .toList();

        log.info("Backing up data for {} active users", activeUsers.size());

        int success = 0;
        int failed = 0;

        for (User user : activeUsers) {
            try {
                backupUser(user);
                success++;
            } catch (Exception e) {
                log.error("Failed to backup user {}: {}", user.getId(), e.getMessage());
                failed++;
            }
        }

        log.info("Daily backup completed: {} succeeded, {} failed", success, failed);
    }

    @Transactional
    public void backupUser(User user) {
        String fileName = "backup_" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".json";
        byte[] content = exportService.exportFullBackup(user.getId());

        UserBackup backup = UserBackup.builder()
                .user(user)
                .fileName(fileName)
                .fileSize((long) content.length)
                .content(content)
                .build();

        userBackupRepository.save(backup);

        // Delete old backups, keep only last MAX_BACKUPS_PER_USER
        userBackupRepository.deleteOldBackups(user.getId(), MAX_BACKUPS_PER_USER);

        log.debug("Backed up user {} ({} bytes)", user.getId(), content.length);
    }
}
