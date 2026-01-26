package com.financetracker.service;

import com.financetracker.dto.recurring.RecurringTransactionRequest;
import com.financetracker.dto.recurring.RecurringTransactionResponse;
import com.financetracker.dto.recurring.UpcomingTransactionResponse;
import com.financetracker.dto.transaction.TransactionRequest;
import com.financetracker.entity.*;
import com.financetracker.exception.ApiException;
import com.financetracker.repository.AccountRepository;
import com.financetracker.repository.CategoryRepository;
import com.financetracker.repository.RecurringTransactionRepository;
import com.financetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecurringTransactionService {

    private final RecurringTransactionRepository recurringRepository;
    private final TransactionService transactionService;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<RecurringTransactionResponse> getAll(UUID userId, Pageable pageable) {
        return recurringRepository.findByUserId(userId, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<RecurringTransactionResponse> getByStatus(UUID userId, RecurringStatus status, Pageable pageable) {
        return recurringRepository.findByUserIdAndStatus(userId, status, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public RecurringTransactionResponse getById(UUID userId, UUID id) {
        RecurringTransaction recurring = findByIdAndUserId(id, userId);
        return toResponse(recurring);
    }

    @Transactional
    public RecurringTransactionResponse create(UUID userId, RecurringTransactionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        Account account = accountRepository.findByIdAndUserId(request.getAccountId(), userId)
                .orElseThrow(() -> new ApiException("Account not found", HttpStatus.NOT_FOUND));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findByIdAndUserId(request.getCategoryId(), userId)
                    .orElseGet(() -> categoryRepository.findById(request.getCategoryId())
                            .filter(c -> c.getUser() == null)
                            .orElseThrow(() -> new ApiException("Category not found", HttpStatus.NOT_FOUND)));
        }

        Account toAccount = null;
        if (request.getType() == TransactionType.TRANSFER && request.getToAccountId() != null) {
            toAccount = accountRepository.findByIdAndUserId(request.getToAccountId(), userId)
                    .orElseThrow(() -> new ApiException("To account not found", HttpStatus.NOT_FOUND));
        }

        RecurringTransaction recurring = RecurringTransaction.builder()
                .user(user)
                .account(account)
                .category(category)
                .type(request.getType())
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : account.getCurrency())
                .description(request.getDescription())
                .toAccount(toAccount)
                .exchangeRate(request.getExchangeRate())
                .frequency(request.getFrequency())
                .intervalValue(request.getIntervalValue() != null ? request.getIntervalValue() : 1)
                .dayOfWeek(request.getDayOfWeek())
                .dayOfMonth(request.getDayOfMonth())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .nextExecutionDate(request.getStartDate())
                .status(RecurringStatus.ACTIVE)
                .executionCount(0)
                .maxExecutions(request.getMaxExecutions())
                .build();

        recurring = recurringRepository.save(recurring);
        log.info("Created recurring transaction {} for user {}", recurring.getId(), userId);

        return toResponse(recurring);
    }

    @Transactional
    public RecurringTransactionResponse update(UUID userId, UUID id, RecurringTransactionRequest request) {
        RecurringTransaction recurring = findByIdAndUserId(id, userId);

        Account account = accountRepository.findByIdAndUserId(request.getAccountId(), userId)
                .orElseThrow(() -> new ApiException("Account not found", HttpStatus.NOT_FOUND));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findByIdAndUserId(request.getCategoryId(), userId)
                    .orElseGet(() -> categoryRepository.findById(request.getCategoryId())
                            .filter(c -> c.getUser() == null)
                            .orElseThrow(() -> new ApiException("Category not found", HttpStatus.NOT_FOUND)));
        }

        Account toAccount = null;
        if (request.getType() == TransactionType.TRANSFER && request.getToAccountId() != null) {
            toAccount = accountRepository.findByIdAndUserId(request.getToAccountId(), userId)
                    .orElseThrow(() -> new ApiException("To account not found", HttpStatus.NOT_FOUND));
        }

        recurring.setAccount(account);
        recurring.setCategory(category);
        recurring.setType(request.getType());
        recurring.setAmount(request.getAmount());
        recurring.setCurrency(request.getCurrency() != null ? request.getCurrency() : account.getCurrency());
        recurring.setDescription(request.getDescription());
        recurring.setToAccount(toAccount);
        recurring.setExchangeRate(request.getExchangeRate());
        recurring.setFrequency(request.getFrequency());
        recurring.setIntervalValue(request.getIntervalValue() != null ? request.getIntervalValue() : 1);
        recurring.setDayOfWeek(request.getDayOfWeek());
        recurring.setDayOfMonth(request.getDayOfMonth());

        // Recalculate nextExecutionDate when startDate changes
        LocalDate oldStartDate = recurring.getStartDate();
        recurring.setStartDate(request.getStartDate());
        recurring.setEndDate(request.getEndDate());
        recurring.setMaxExecutions(request.getMaxExecutions());

        if (!oldStartDate.equals(request.getStartDate())) {
            LocalDate newNextDate = request.getStartDate();
            LocalDate today = LocalDate.now();
            // If new start date is in the past, calculate next valid date based on frequency
            while (newNextDate.isBefore(today)) {
                newNextDate = calculateNextDateFrom(newNextDate, recurring);
            }
            recurring.setNextExecutionDate(newNextDate);
        }

        recurring = recurringRepository.save(recurring);
        log.info("Updated recurring transaction {} for user {}", recurring.getId(), userId);

        return toResponse(recurring);
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        RecurringTransaction recurring = findByIdAndUserId(id, userId);
        recurringRepository.delete(recurring);
        log.info("Deleted recurring transaction {} for user {}", id, userId);
    }

    @Transactional
    public RecurringTransactionResponse pause(UUID userId, UUID id) {
        RecurringTransaction recurring = findByIdAndUserId(id, userId);

        if (recurring.getStatus() != RecurringStatus.ACTIVE) {
            throw new ApiException("Can only pause active recurring transactions", HttpStatus.BAD_REQUEST);
        }

        recurring.setStatus(RecurringStatus.PAUSED);
        recurring = recurringRepository.save(recurring);
        log.info("Paused recurring transaction {} for user {}", id, userId);

        return toResponse(recurring);
    }

    @Transactional
    public RecurringTransactionResponse resume(UUID userId, UUID id) {
        RecurringTransaction recurring = findByIdAndUserId(id, userId);

        if (recurring.getStatus() != RecurringStatus.PAUSED) {
            throw new ApiException("Can only resume paused recurring transactions", HttpStatus.BAD_REQUEST);
        }

        recurring.setStatus(RecurringStatus.ACTIVE);

        // If next execution date is in the past, update it to today
        if (recurring.getNextExecutionDate().isBefore(LocalDate.now())) {
            recurring.setNextExecutionDate(LocalDate.now());
        }

        recurring = recurringRepository.save(recurring);
        log.info("Resumed recurring transaction {} for user {}", id, userId);

        return toResponse(recurring);
    }

    @Transactional
    public RecurringTransactionResponse cancel(UUID userId, UUID id) {
        RecurringTransaction recurring = findByIdAndUserId(id, userId);

        if (recurring.getStatus() == RecurringStatus.CANCELLED || recurring.getStatus() == RecurringStatus.COMPLETED) {
            throw new ApiException("Recurring transaction is already " + recurring.getStatus().name().toLowerCase(), HttpStatus.BAD_REQUEST);
        }

        recurring.setStatus(RecurringStatus.CANCELLED);
        recurring = recurringRepository.save(recurring);
        log.info("Cancelled recurring transaction {} for user {}", id, userId);

        return toResponse(recurring);
    }

    @Transactional(readOnly = true)
    public List<UpcomingTransactionResponse> getUpcoming(UUID userId, int days) {
        LocalDate untilDate = LocalDate.now().plusDays(days);
        List<RecurringTransaction> recurrings = recurringRepository.findUpcoming(userId, untilDate);

        return recurrings.stream()
                .map(r -> UpcomingTransactionResponse.builder()
                        .recurringId(r.getId())
                        .description(r.getDescription())
                        .amount(r.getAmount())
                        .currency(r.getCurrency())
                        .type(r.getType())
                        .accountName(r.getAccount().getName())
                        .categoryName(r.getCategory() != null ? r.getCategory().getName() : null)
                        .categoryIcon(r.getCategory() != null ? r.getCategory().getIcon() : null)
                        .scheduledDate(r.getNextExecutionDate())
                        .build())
                .toList();
    }

    @Transactional
    public void executeRecurring(RecurringTransaction recurring) {
        log.info("Executing recurring transaction {}", recurring.getId());

        // Create actual transaction
        TransactionRequest txRequest = TransactionRequest.builder()
                .accountId(recurring.getAccount().getId())
                .categoryId(recurring.getCategory() != null ? recurring.getCategory().getId() : null)
                .type(recurring.getType())
                .amount(recurring.getAmount())
                .currency(recurring.getCurrency())
                .description(recurring.getDescription())
                .transactionDate(recurring.getNextExecutionDate())
                .toAccountId(recurring.getToAccount() != null ? recurring.getToAccount().getId() : null)
                .exchangeRate(recurring.getExchangeRate())
                .build();

        transactionService.createTransactionFromRecurring(
                recurring.getUser().getId(),
                txRequest,
                recurring.getId()
        );

        // Update recurring transaction
        recurring.setLastExecutionDate(recurring.getNextExecutionDate());
        recurring.setExecutionCount(recurring.getExecutionCount() + 1);
        recurring.setNextExecutionDate(calculateNextDate(recurring));

        // Check if completed
        if (isCompleted(recurring)) {
            recurring.setStatus(RecurringStatus.COMPLETED);
            log.info("Recurring transaction {} completed after {} executions",
                    recurring.getId(), recurring.getExecutionCount());
        }

        recurringRepository.save(recurring);
    }

    private LocalDate calculateNextDate(RecurringTransaction recurring) {
        return calculateNextDateFrom(recurring.getNextExecutionDate(), recurring);
    }

    private LocalDate calculateNextDateFrom(LocalDate current, RecurringTransaction recurring) {
        int interval = recurring.getIntervalValue();

        return switch (recurring.getFrequency()) {
            case DAILY -> current.plusDays(interval);
            case WEEKLY -> current.plusWeeks(interval);
            case MONTHLY -> {
                LocalDate next = current.plusMonths(interval);
                if (recurring.getDayOfMonth() != null) {
                    int maxDay = next.lengthOfMonth();
                    int day = Math.min(recurring.getDayOfMonth(), maxDay);
                    yield next.withDayOfMonth(day);
                }
                yield next;
            }
            case YEARLY -> current.plusYears(interval);
        };
    }

    private boolean isCompleted(RecurringTransaction recurring) {
        if (recurring.getMaxExecutions() != null &&
                recurring.getExecutionCount() >= recurring.getMaxExecutions()) {
            return true;
        }
        if (recurring.getEndDate() != null &&
                recurring.getNextExecutionDate().isAfter(recurring.getEndDate())) {
            return true;
        }
        return false;
    }

    private RecurringTransaction findByIdAndUserId(UUID id, UUID userId) {
        return recurringRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ApiException("Recurring transaction not found", HttpStatus.NOT_FOUND));
    }

    private RecurringTransactionResponse toResponse(RecurringTransaction recurring) {
        return RecurringTransactionResponse.builder()
                .id(recurring.getId())
                .accountId(recurring.getAccount().getId())
                .accountName(recurring.getAccount().getName())
                .categoryId(recurring.getCategory() != null ? recurring.getCategory().getId() : null)
                .categoryName(recurring.getCategory() != null ? recurring.getCategory().getName() : null)
                .categoryIcon(recurring.getCategory() != null ? recurring.getCategory().getIcon() : null)
                .type(recurring.getType())
                .amount(recurring.getAmount())
                .currency(recurring.getCurrency())
                .description(recurring.getDescription())
                .toAccountId(recurring.getToAccount() != null ? recurring.getToAccount().getId() : null)
                .toAccountName(recurring.getToAccount() != null ? recurring.getToAccount().getName() : null)
                .exchangeRate(recurring.getExchangeRate())
                .frequency(recurring.getFrequency())
                .intervalValue(recurring.getIntervalValue())
                .dayOfWeek(recurring.getDayOfWeek())
                .dayOfMonth(recurring.getDayOfMonth())
                .startDate(recurring.getStartDate())
                .endDate(recurring.getEndDate())
                .nextExecutionDate(recurring.getNextExecutionDate())
                .lastExecutionDate(recurring.getLastExecutionDate())
                .status(recurring.getStatus())
                .executionCount(recurring.getExecutionCount())
                .maxExecutions(recurring.getMaxExecutions())
                .createdAt(recurring.getCreatedAt())
                .build();
    }
}
