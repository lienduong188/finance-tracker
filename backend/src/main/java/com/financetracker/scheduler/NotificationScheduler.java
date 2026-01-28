package com.financetracker.scheduler;

import com.financetracker.entity.*;
import com.financetracker.repository.*;
import com.financetracker.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduler {

    private final NotificationService notificationService;
    private final RecurringTransactionRepository recurringTransactionRepository;
    private final DebtRepository debtRepository;
    private final BudgetRepository budgetRepository;
    private final AccountRepository accountRepository;
    private final ExchangeRateRepository exchangeRateRepository;

    // Run every hour - check recurring transactions due soon
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void checkRecurringTransactionsDueSoon() {
        log.info("Checking recurring transactions due soon...");

        LocalDate today = LocalDate.now();
        LocalDate threeDaysLater = today.plusDays(3);

        List<RecurringTransaction> dueSoon = recurringTransactionRepository
                .findByIsActiveTrueAndNextExecutionDateBetween(today, threeDaysLater);

        for (RecurringTransaction rt : dueSoon) {
            if (!notificationService.hasRecentNotification(
                    rt.getUser().getId(),
                    NotificationType.RECURRING_DUE_SOON,
                    24)) {

                int daysUntil = (int) java.time.temporal.ChronoUnit.DAYS.between(today, rt.getNextExecutionDate());
                String name = rt.getDescription() != null ? rt.getDescription() : "Giao dịch định kỳ";
                notificationService.notifyRecurringDueSoon(rt.getUser(), name, daysUntil);
            }
        }
    }

    // Run every hour - check debts due soon
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void checkDebtsDueSoon() {
        log.info("Checking debts due soon...");

        LocalDate today = LocalDate.now();
        LocalDate threeDaysLater = today.plusDays(3);

        List<Debt> dueSoon = debtRepository.findByDueDateBetweenAndStatus(today, threeDaysLater, DebtStatus.ACTIVE);

        for (Debt debt : dueSoon) {
            if (!notificationService.hasRecentNotification(
                    debt.getUser().getId(),
                    NotificationType.DEBT_DUE_SOON,
                    24)) {

                int daysUntil = (int) java.time.temporal.ChronoUnit.DAYS.between(today, debt.getDueDate());
                String name = debt.getPersonName() != null ? debt.getPersonName() : "Khoản vay/nợ";
                BigDecimal remainingAmount = debt.getAmount().subtract(debt.getPaidAmount());
                notificationService.notifyDebtDueSoon(debt.getUser(), name, daysUntil, remainingAmount, debt.getCurrency());
            }
        }
    }

    // Run every 2 hours - check budget warnings
    @Scheduled(fixedRate = 7200000)
    @Transactional
    public void checkBudgetWarnings() {
        log.info("Checking budget warnings...");

        List<Budget> budgets = budgetRepository.findAll();

        for (Budget budget : budgets) {
            if (!budget.getIsActive()) continue;

            BigDecimal spentAmount = budget.getSpentAmount();
            BigDecimal limitAmount = budget.getAmount();

            if (limitAmount.compareTo(BigDecimal.ZERO) > 0) {
                int percentage = spentAmount.multiply(BigDecimal.valueOf(100))
                        .divide(limitAmount, 0, java.math.RoundingMode.HALF_UP)
                        .intValue();

                String categoryName = budget.getCategory() != null
                        ? budget.getCategory().getName()
                        : "Tổng";

                // Notify at 80%
                if (percentage >= 80 && percentage < 100) {
                    if (!notificationService.hasRecentNotification(
                            budget.getUser().getId(),
                            NotificationType.BUDGET_WARNING,
                            24)) {
                        notificationService.notifyBudgetWarning(budget.getUser(), categoryName, percentage);
                    }
                }

                // Notify at 100%+ (exceeded)
                if (percentage >= 100) {
                    if (!notificationService.hasRecentNotification(
                            budget.getUser().getId(),
                            NotificationType.BUDGET_EXCEEDED,
                            24)) {
                        notificationService.notifyBudgetExceeded(budget.getUser(), categoryName, percentage);
                    }
                }
            }
        }
    }

    // Run every hour - check account balances
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void checkAccountBalances() {
        log.info("Checking account balances...");

        List<Account> lowBalanceAccounts = accountRepository.findByCurrentBalanceLessThanEqual(BigDecimal.ZERO);

        for (Account account : lowBalanceAccounts) {
            if (!notificationService.hasRecentNotification(
                    account.getUser().getId(),
                    NotificationType.ACCOUNT_EMPTY,
                    24)) {

                notificationService.notifyAccountLowBalance(
                        account.getUser(),
                        account.getName(),
                        account.getCurrentBalance(),
                        account.getCurrency()
                );
            }
        }
    }

    // Run every 30 minutes - check exchange rates for JPY/VND
    @Scheduled(fixedRate = 1800000)
    @Transactional
    public void checkExchangeRateAlerts() {
        log.info("Checking exchange rate alerts for JPY/VND...");

        // Get JPY to VND rate
        exchangeRateRepository.findLatestRate("JPY", "VND").ifPresent(rate -> {
            BigDecimal jpyToVnd = rate.getRate();

            // Check for target rates: 180, 190, 200
            BigDecimal[] targets = {
                    BigDecimal.valueOf(180),
                    BigDecimal.valueOf(190),
                    BigDecimal.valueOf(200)
            };

            for (BigDecimal target : targets) {
                // If rate is within 1% of target
                BigDecimal lowerBound = target.multiply(BigDecimal.valueOf(0.99));
                BigDecimal upperBound = target.multiply(BigDecimal.valueOf(1.01));

                if (jpyToVnd.compareTo(lowerBound) >= 0 && jpyToVnd.compareTo(upperBound) <= 0) {
                    // Notify users with JPY accounts
                    List<Account> jpyAccounts = accountRepository.findByCurrency("JPY");

                    for (Account account : jpyAccounts) {
                        if (!notificationService.hasRecentNotification(
                                account.getUser().getId(),
                                NotificationType.EXCHANGE_RATE_ALERT,
                                12)) {

                            notificationService.notifyExchangeRateAlert(
                                    account.getUser(),
                                    "JPY",
                                    "VND",
                                    jpyToVnd
                            );
                        }
                    }
                    break;
                }
            }
        });
    }

    // Cleanup old notifications - run daily at 3 AM
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupOldNotifications() {
        log.info("Cleaning up old read notifications...");
        OffsetDateTime thirtyDaysAgo = OffsetDateTime.now().minusDays(30);
        int deleted = notificationService.deleteOldNotifications(thirtyDaysAgo);
        log.info("Deleted {} old notifications", deleted);
    }
}
