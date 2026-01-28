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
    private final UserRepository userRepository;

    // Run every hour
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void checkRecurringTransactionsDueSoon() {
        log.info("Checking recurring transactions due soon...");

        LocalDate today = LocalDate.now();
        LocalDate threeDaysLater = today.plusDays(3);

        List<RecurringTransaction> dueSoon = recurringTransactionRepository
                .findByIsActiveTrueAndNextExecutionDateBetween(today, threeDaysLater);

        for (RecurringTransaction rt : dueSoon) {
            // Check if we already sent notification in last 24 hours
            if (!notificationService.hasRecentNotification(
                    rt.getUser().getId(),
                    NotificationType.RECURRING_DUE_SOON,
                    24)) {

                int daysUntil = (int) java.time.temporal.ChronoUnit.DAYS.between(today, rt.getNextExecutionDate());
                notificationService.notifyRecurringDueSoon(
                        rt.getUser(),
                        rt.getName(),
                        daysUntil
                );
            }
        }
    }

    // Run every hour
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
                notificationService.notifyDebtDueSoon(
                        debt.getUser(),
                        debt.getName(),
                        daysUntil,
                        debt.getRemainingAmount(),
                        debt.getCurrency()
                );
            }
        }
    }

    // Run every 2 hours
    @Scheduled(fixedRate = 7200000)
    @Transactional
    public void checkBudgetWarnings() {
        log.info("Checking budget warnings...");

        LocalDate today = LocalDate.now();
        int currentMonth = today.getMonthValue();
        int currentYear = today.getYear();

        List<Budget> budgets = budgetRepository.findByMonthAndYear(currentMonth, currentYear);

        for (Budget budget : budgets) {
            BigDecimal spentAmount = budget.getSpentAmount();
            BigDecimal limitAmount = budget.getAmount();

            if (limitAmount.compareTo(BigDecimal.ZERO) > 0) {
                int percentage = spentAmount.multiply(BigDecimal.valueOf(100))
                        .divide(limitAmount, 0, java.math.RoundingMode.HALF_UP)
                        .intValue();

                // Notify at 80%
                if (percentage >= 80 && percentage < 100) {
                    if (!notificationService.hasRecentNotification(
                            budget.getUser().getId(),
                            NotificationType.BUDGET_WARNING,
                            24)) {

                        String categoryName = budget.getCategory() != null
                                ? budget.getCategory().getName()
                                : "Tổng";
                        notificationService.notifyBudgetWarning(budget.getUser(), categoryName, percentage);
                    }
                }
            }
        }
    }

    // Run every hour
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void checkAccountBalances() {
        log.info("Checking account balances...");

        // Find accounts with zero or negative balance
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

    // Run every 30 minutes to check exchange rates
    @Scheduled(fixedRate = 1800000)
    @Transactional
    public void checkExchangeRateAlerts() {
        log.info("Checking exchange rate alerts for JPY/VND...");

        // Get JPY to VND rate
        ExchangeRate jpyRate = exchangeRateRepository.findByBaseCurrencyAndTargetCurrency("VND", "JPY")
                .orElse(null);

        if (jpyRate != null) {
            BigDecimal rate = jpyRate.getRate();
            // JPY to VND rate (1 JPY = X VND)
            BigDecimal jpyToVnd = BigDecimal.ONE.divide(rate, 2, java.math.RoundingMode.HALF_UP);

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
                    // Notify all users who might be interested
                    // For simplicity, we notify users with JPY accounts
                    List<Account> jpyAccounts = accountRepository.findByCurrency("JPY");

                    for (Account account : jpyAccounts) {
                        if (!notificationService.hasRecentNotification(
                                account.getUser().getId(),
                                NotificationType.EXCHANGE_RATE_ALERT,
                                12)) { // Only once per 12 hours

                            notificationService.notifyExchangeRateAlert(
                                    account.getUser(),
                                    "JPY",
                                    "VND",
                                    jpyToVnd
                            );
                        }
                    }
                    break; // Only notify for one target at a time
                }
            }
        }
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
