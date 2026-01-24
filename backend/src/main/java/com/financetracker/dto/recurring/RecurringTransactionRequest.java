package com.financetracker.dto.recurring;

import com.financetracker.entity.RecurrenceFrequency;
import com.financetracker.entity.TransactionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RecurringTransactionRequest {

    @NotNull(message = "Account ID is required")
    private UUID accountId;

    private UUID categoryId;

    @NotNull(message = "Transaction type is required")
    private TransactionType type;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    private String currency;

    private String description;

    // Transfer fields
    private UUID toAccountId;

    private BigDecimal exchangeRate;

    // Recurrence settings
    @NotNull(message = "Frequency is required")
    private RecurrenceFrequency frequency;

    @Builder.Default
    private Integer intervalValue = 1;

    private Integer dayOfWeek;

    private Integer dayOfMonth;

    // Schedule
    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private LocalDate endDate;

    private Integer maxExecutions;
}
