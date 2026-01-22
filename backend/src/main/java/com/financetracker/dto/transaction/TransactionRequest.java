package com.financetracker.dto.transaction;

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
public class TransactionRequest {

    @NotNull(message = "Account is required")
    private UUID accountId;

    private UUID categoryId;

    @NotNull(message = "Transaction type is required")
    private TransactionType type;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    private String currency;

    private String description;

    @NotNull(message = "Transaction date is required")
    private LocalDate transactionDate;

    // For TRANSFER type
    private UUID toAccountId;
    private BigDecimal exchangeRate;
}
