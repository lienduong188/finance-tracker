package com.financetracker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction extends BaseEntity {

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

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_account_id")
    private Account toAccount;

    @Column(name = "exchange_rate", precision = 19, scale = 6)
    private BigDecimal exchangeRate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recurring_transaction_id")
    private RecurringTransaction recurringTransaction;
}
