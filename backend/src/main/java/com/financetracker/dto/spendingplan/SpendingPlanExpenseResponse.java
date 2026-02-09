package com.financetracker.dto.spendingplan;

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
public class SpendingPlanExpenseResponse {
    private UUID id;
    private UUID itemId;
    private String itemName;
    private UUID userId;
    private String userName;
    private UUID accountId;
    private String accountName;
    private String accountCurrency;
    private UUID transactionId;
    private BigDecimal amount;
    private BigDecimal amountInPlanCurrency;
    private String planCurrency;
    private String note;
    private LocalDate expenseDate;
    private OffsetDateTime createdAt;
}
