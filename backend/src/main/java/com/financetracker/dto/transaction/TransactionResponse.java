package com.financetracker.dto.transaction;

import com.financetracker.entity.PaymentType;
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
public class TransactionResponse {

    private UUID id;
    private UUID accountId;
    private String accountName;
    private UUID categoryId;
    private String categoryName;
    private String categoryIcon;
    private UUID familyId;
    private String familyName;
    private UUID createdByUserId;
    private String createdByUserName;
    private TransactionType type;
    private BigDecimal amount;
    private String currency;
    private String description;
    private LocalDate transactionDate;
    private UUID toAccountId;
    private String toAccountName;
    private BigDecimal exchangeRate;
    private PaymentType paymentType;
    private UUID paymentPlanId;
    private OffsetDateTime createdAt;
}
