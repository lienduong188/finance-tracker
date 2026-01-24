package com.financetracker.scheduler;

import com.financetracker.entity.RecurringTransaction;
import com.financetracker.repository.RecurringTransactionRepository;
import com.financetracker.service.RecurringTransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecurringTransactionScheduler {

    private final RecurringTransactionRepository recurringRepository;
    private final RecurringTransactionService recurringService;

    /**
     * Process recurring transactions daily at 00:05 AM
     */
    @Scheduled(cron = "0 5 0 * * *")
    public void processRecurringTransactions() {
        log.info("Starting recurring transactions processing...");

        LocalDate today = LocalDate.now();
        List<RecurringTransaction> dueTransactions = recurringRepository.findDueForExecution(today);

        log.info("Found {} recurring transactions due for execution", dueTransactions.size());

        int successCount = 0;
        int failCount = 0;

        for (RecurringTransaction recurring : dueTransactions) {
            try {
                recurringService.executeRecurring(recurring);
                successCount++;
            } catch (Exception e) {
                log.error("Failed to execute recurring transaction {}: {}",
                        recurring.getId(), e.getMessage(), e);
                failCount++;
            }
        }

        log.info("Recurring transactions processing completed. Success: {}, Failed: {}",
                successCount, failCount);
    }

    /**
     * Manual trigger endpoint for testing - can be called via actuator or admin API
     */
    @Transactional
    public void triggerManualExecution() {
        log.info("Manual trigger of recurring transactions processing...");
        processRecurringTransactions();
    }
}
