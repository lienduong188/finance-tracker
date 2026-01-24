package com.financetracker.dto.recurring;

import com.financetracker.entity.RecurrenceFrequency;
import com.financetracker.entity.RecurringStatus;
import com.financetracker.entity.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RecurringTransactionResponse {

    private UUID id;

    private UUID accountId;
    private String accountName;

    private UUID categoryId;
    private String categoryName;
    private String categoryIcon;

    private TransactionType type;

    private BigDecimal amount;
    private String currency;
    private String description;

    // Transfer fields
    private UUID toAccountId;
    private String toAccountName;
    private BigDecimal exchangeRate;

    // Recurrence settings
    private RecurrenceFrequency frequency;
    private Integer intervalValue;
    private Integer dayOfWeek;
    private Integer dayOfMonth;

    // Schedule
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate nextExecutionDate;
    private LocalDate lastExecutionDate;

    // Status
    private RecurringStatus status;
    private Integer executionCount;
    private Integer maxExecutions;

    private OffsetDateTime createdAt;
}
