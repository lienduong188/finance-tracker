package com.financetracker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "recurring_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecurringTransaction extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TransactionType type;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(length = 3, nullable = false)
    private String currency;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Transfer fields
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_account_id")
    private Account toAccount;

    @Column(name = "exchange_rate", precision = 19, scale = 6)
    private BigDecimal exchangeRate;

    // Recurrence settings
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RecurrenceFrequency frequency;

    @Column(name = "interval_value", nullable = false)
    @Builder.Default
    private Integer intervalValue = 1;

    @Column(name = "day_of_week")
    private Integer dayOfWeek;

    @Column(name = "day_of_month")
    private Integer dayOfMonth;

    // Schedule control
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "next_execution_date", nullable = false)
    private LocalDate nextExecutionDate;

    @Column(name = "last_execution_date")
    private LocalDate lastExecutionDate;

    // Status
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private RecurringStatus status = RecurringStatus.ACTIVE;

    @Column(name = "execution_count", nullable = false)
    @Builder.Default
    private Integer executionCount = 0;

    @Column(name = "max_executions")
    private Integer maxExecutions;
}
