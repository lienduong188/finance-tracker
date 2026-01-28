package com.financetracker.service;

import com.financetracker.dto.transaction.TransactionRequest;
import com.financetracker.dto.transaction.TransactionResponse;
import com.financetracker.entity.*;
import com.financetracker.exception.ApiException;
import com.financetracker.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final BudgetService budgetService;
    private final RecurringTransactionRepository recurringTransactionRepository;
    private final FamilyRepository familyRepository;
    private final FamilyMemberRepository familyMemberRepository;

    public Page<TransactionResponse> getTransactions(UUID userId, Pageable pageable) {
        return transactionRepository.findByUserId(userId, pageable)
                .map(this::toResponse);
    }

    public Page<TransactionResponse> getTransactionsWithFilters(UUID userId, UUID accountId,
            String type, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        var spec = TransactionSpecification.withFilters(userId, accountId, type, startDate, endDate);
        return transactionRepository.findAll(spec, pageable)
                .map(this::toResponse);
    }

    public List<TransactionResponse> getTransactionsByDateRange(UUID userId, LocalDate startDate, LocalDate endDate) {
        return transactionRepository.findByUserIdAndDateRange(userId, startDate, endDate)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public TransactionResponse getTransaction(UUID userId, UUID transactionId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> ApiException.notFound("Transaction"));
        return toResponse(transaction);
    }

    @Transactional
    public TransactionResponse createTransaction(UUID userId, TransactionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User"));

        Account account = accountRepository.findByIdAndUserId(request.getAccountId(), userId)
                .orElseThrow(() -> ApiException.notFound("Account"));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findByIdAndUserIdOrSystem(request.getCategoryId(), userId)
                    .orElseThrow(() -> ApiException.notFound("Category"));
        }

        Account toAccount = null;
        if (request.getType() == TransactionType.TRANSFER) {
            if (request.getToAccountId() == null) {
                throw ApiException.badRequest("To account is required for transfer");
            }
            toAccount = accountRepository.findByIdAndUserId(request.getToAccountId(), userId)
                    .orElseThrow(() -> ApiException.notFound("To account"));
        }

        // Handle family transaction
        Family family = null;
        if (request.getFamilyId() != null) {
            family = familyRepository.findById(request.getFamilyId())
                    .orElseThrow(() -> ApiException.notFound("Family"));

            // Verify user is member
            if (!familyMemberRepository.existsByFamilyIdAndUserId(family.getId(), userId)) {
                throw ApiException.forbidden("Bạn không phải thành viên của nhóm");
            }
        }

        Transaction transaction = Transaction.builder()
                .user(user)
                .family(family)
                .account(account)
                .category(category)
                .type(request.getType())
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : account.getCurrency())
                .description(request.getDescription())
                .transactionDate(request.getTransactionDate())
                .toAccount(toAccount)
                .exchangeRate(request.getExchangeRate())
                .build();

        transaction = transactionRepository.save(transaction);

        updateAccountBalance(account, request.getType(), request.getAmount(), true);
        if (toAccount != null) {
            BigDecimal transferAmount = request.getExchangeRate() != null
                    ? request.getAmount().multiply(request.getExchangeRate())
                    : request.getAmount();
            updateAccountBalance(toAccount, TransactionType.INCOME, transferAmount, true);
        }

        if (category != null && request.getType() == TransactionType.EXPENSE) {
            budgetService.updateBudgetSpentAmount(userId, category.getId(), request.getTransactionDate());
        }

        return toResponse(transaction);
    }

    @Transactional
    public TransactionResponse updateTransaction(UUID userId, UUID transactionId, TransactionRequest request) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> ApiException.notFound("Transaction"));

        // Revert old balance
        updateAccountBalance(transaction.getAccount(), transaction.getType(), transaction.getAmount(), false);
        if (transaction.getToAccount() != null) {
            BigDecimal oldTransferAmount = transaction.getExchangeRate() != null
                    ? transaction.getAmount().multiply(transaction.getExchangeRate())
                    : transaction.getAmount();
            updateAccountBalance(transaction.getToAccount(), TransactionType.INCOME, oldTransferAmount, false);
        }

        Account account = accountRepository.findByIdAndUserId(request.getAccountId(), userId)
                .orElseThrow(() -> ApiException.notFound("Account"));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findByIdAndUserIdOrSystem(request.getCategoryId(), userId)
                    .orElseThrow(() -> ApiException.notFound("Category"));
        }

        Account toAccount = null;
        if (request.getType() == TransactionType.TRANSFER && request.getToAccountId() != null) {
            toAccount = accountRepository.findByIdAndUserId(request.getToAccountId(), userId)
                    .orElseThrow(() -> ApiException.notFound("To account"));
        }

        transaction.setAccount(account);
        transaction.setCategory(category);
        transaction.setType(request.getType());
        transaction.setAmount(request.getAmount());
        transaction.setCurrency(request.getCurrency() != null ? request.getCurrency() : account.getCurrency());
        transaction.setDescription(request.getDescription());
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setToAccount(toAccount);
        transaction.setExchangeRate(request.getExchangeRate());

        transaction = transactionRepository.save(transaction);

        updateAccountBalance(account, request.getType(), request.getAmount(), true);
        if (toAccount != null) {
            BigDecimal transferAmount = request.getExchangeRate() != null
                    ? request.getAmount().multiply(request.getExchangeRate())
                    : request.getAmount();
            updateAccountBalance(toAccount, TransactionType.INCOME, transferAmount, true);
        }

        return toResponse(transaction);
    }

    @Transactional
    public void deleteTransaction(UUID userId, UUID transactionId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> ApiException.notFound("Transaction"));

        updateAccountBalance(transaction.getAccount(), transaction.getType(), transaction.getAmount(), false);
        if (transaction.getToAccount() != null) {
            BigDecimal transferAmount = transaction.getExchangeRate() != null
                    ? transaction.getAmount().multiply(transaction.getExchangeRate())
                    : transaction.getAmount();
            updateAccountBalance(transaction.getToAccount(), TransactionType.INCOME, transferAmount, false);
        }

        transactionRepository.delete(transaction);
    }

    @Transactional
    public TransactionResponse createTransactionFromRecurring(UUID userId, TransactionRequest request, UUID recurringTransactionId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User"));

        Account account = accountRepository.findByIdAndUserId(request.getAccountId(), userId)
                .orElseThrow(() -> ApiException.notFound("Account"));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findByIdAndUserIdOrSystem(request.getCategoryId(), userId)
                    .orElseThrow(() -> ApiException.notFound("Category"));
        }

        Account toAccount = null;
        if (request.getType() == TransactionType.TRANSFER && request.getToAccountId() != null) {
            toAccount = accountRepository.findByIdAndUserId(request.getToAccountId(), userId)
                    .orElseThrow(() -> ApiException.notFound("To account"));
        }

        RecurringTransaction recurring = recurringTransactionRepository.findById(recurringTransactionId)
                .orElse(null);

        Transaction transaction = Transaction.builder()
                .user(user)
                .account(account)
                .category(category)
                .type(request.getType())
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : account.getCurrency())
                .description(request.getDescription())
                .transactionDate(request.getTransactionDate())
                .toAccount(toAccount)
                .exchangeRate(request.getExchangeRate())
                .recurringTransaction(recurring)
                .build();

        transaction = transactionRepository.save(transaction);

        updateAccountBalance(account, request.getType(), request.getAmount(), true);
        if (toAccount != null) {
            BigDecimal transferAmount = request.getExchangeRate() != null
                    ? request.getAmount().multiply(request.getExchangeRate())
                    : request.getAmount();
            updateAccountBalance(toAccount, TransactionType.INCOME, transferAmount, true);
        }

        if (category != null && request.getType() == TransactionType.EXPENSE) {
            budgetService.updateBudgetSpentAmount(userId, category.getId(), request.getTransactionDate());
        }

        return toResponse(transaction);
    }

    private void updateAccountBalance(Account account, TransactionType type, BigDecimal amount, boolean isAdd) {
        BigDecimal currentBalance = account.getCurrentBalance();
        BigDecimal change = amount;

        if (!isAdd) {
            change = change.negate();
        }

        switch (type) {
            case INCOME:
                currentBalance = currentBalance.add(change);
                break;
            case EXPENSE:
            case TRANSFER:
                currentBalance = currentBalance.subtract(change);
                break;
        }

        account.setCurrentBalance(currentBalance);
        accountRepository.save(account);
    }

    private TransactionResponse toResponse(Transaction transaction) {
        return TransactionResponse.builder()
                .id(transaction.getId())
                .accountId(transaction.getAccount().getId())
                .accountName(transaction.getAccount().getName())
                .categoryId(transaction.getCategory() != null ? transaction.getCategory().getId() : null)
                .categoryName(transaction.getCategory() != null ? transaction.getCategory().getName() : null)
                .categoryIcon(transaction.getCategory() != null ? transaction.getCategory().getIcon() : null)
                .familyId(transaction.getFamily() != null ? transaction.getFamily().getId() : null)
                .familyName(transaction.getFamily() != null ? transaction.getFamily().getName() : null)
                .createdByUserId(transaction.getUser().getId())
                .createdByUserName(transaction.getUser().getFullName())
                .type(transaction.getType())
                .amount(transaction.getAmount())
                .currency(transaction.getCurrency())
                .description(transaction.getDescription())
                .transactionDate(transaction.getTransactionDate())
                .toAccountId(transaction.getToAccount() != null ? transaction.getToAccount().getId() : null)
                .toAccountName(transaction.getToAccount() != null ? transaction.getToAccount().getName() : null)
                .exchangeRate(transaction.getExchangeRate())
                .createdAt(transaction.getCreatedAt())
                .build();
    }

    // Get family transactions
    public Page<TransactionResponse> getFamilyTransactions(UUID userId, UUID familyId, Pageable pageable) {
        if (!familyMemberRepository.existsByFamilyIdAndUserId(familyId, userId)) {
            throw ApiException.forbidden("Bạn không phải thành viên của nhóm");
        }

        return transactionRepository.findByFamilyId(familyId, pageable)
                .map(this::toResponse);
    }
}
