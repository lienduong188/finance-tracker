package com.financetracker.scheduler;

import com.financetracker.entity.Account;
import com.financetracker.entity.AccountType;
import com.financetracker.entity.Transaction;
import com.financetracker.entity.TransactionType;
import com.financetracker.repository.AccountRepository;
import com.financetracker.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class CreditCardResetScheduler {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    /**
     * Process credit card payments daily at 00:10 AM
     * Checks for credit cards where today is the billing day
     */
    @Scheduled(cron = "0 10 0 * * *")
    @Transactional
    public void processCreditCardPayments() {
        log.info("Starting credit card payment processing...");

        int today = LocalDate.now().getDayOfMonth();
        List<Account> creditCards = accountRepository.findCreditCardsDueForPayment(today);

        log.info("Found {} credit cards due for payment on day {}", creditCards.size(), today);

        int successCount = 0;
        int skipCount = 0;
        int failCount = 0;

        for (Account creditCard : creditCards) {
            try {
                boolean processed = processPayment(creditCard);
                if (processed) {
                    successCount++;
                } else {
                    skipCount++;
                }
            } catch (Exception e) {
                log.error("Failed to process credit card {}: {}",
                        creditCard.getName(), e.getMessage(), e);
                failCount++;
            }
        }

        log.info("Credit card processing completed. Success: {}, Skipped: {}, Failed: {}",
                successCount, skipCount, failCount);
    }

    private boolean processPayment(Account creditCard) {
        BigDecimal creditLimit = creditCard.getCreditLimit();
        BigDecimal currentBalance = creditCard.getCurrentBalance();

        if (creditLimit == null || creditLimit.compareTo(BigDecimal.ZERO) <= 0) {
            log.warn("Credit card {} has no credit limit set", creditCard.getName());
            return false;
        }

        // Calculate amount spent (credit limit - current balance)
        BigDecimal amountSpent = creditLimit.subtract(currentBalance);

        if (amountSpent.compareTo(BigDecimal.ZERO) <= 0) {
            log.info("Credit card {} has no outstanding balance", creditCard.getName());
            // Still reset to credit limit
            creditCard.setCurrentBalance(creditLimit);
            accountRepository.save(creditCard);
            return true;
        }

        Account linkedAccount = creditCard.getLinkedAccount();
        if (linkedAccount == null) {
            log.warn("Credit card {} has no linked account for auto-payment", creditCard.getName());
            return false;
        }

        if (linkedAccount.getCurrentBalance().compareTo(amountSpent) < 0) {
            log.warn("Linked account {} has insufficient balance ({}) for credit card payment ({})",
                    linkedAccount.getName(), linkedAccount.getCurrentBalance(), amountSpent);
            return false;
        }

        // Create payment transaction
        Transaction paymentTransaction = Transaction.builder()
                .user(creditCard.getUser())
                .account(linkedAccount)
                .toAccount(creditCard)
                .type(TransactionType.TRANSFER)
                .amount(amountSpent)
                .currency(creditCard.getCurrency())
                .description("Auto-payment for " + creditCard.getName())
                .transactionDate(LocalDate.now())
                .build();

        transactionRepository.save(paymentTransaction);

        // Update account balances
        linkedAccount.setCurrentBalance(linkedAccount.getCurrentBalance().subtract(amountSpent));
        creditCard.setCurrentBalance(creditLimit);

        accountRepository.save(linkedAccount);
        accountRepository.save(creditCard);

        log.info("Processed payment of {} from {} to {}",
                amountSpent, linkedAccount.getName(), creditCard.getName());

        return true;
    }

    /**
     * Manual trigger for testing
     */
    @Transactional
    public void triggerManualExecution() {
        log.info("Manual trigger of credit card payment processing...");
        processCreditCardPayments();
    }
}
