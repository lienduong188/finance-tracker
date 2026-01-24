package com.financetracker.dto.recurring;

import com.financetracker.entity.TransactionType;
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
public class UpcomingTransactionResponse {

    private UUID recurringId;
    private String description;
    private BigDecimal amount;
    private String currency;
    private TransactionType type;
    private String accountName;
    private String categoryName;
    private String categoryIcon;
    private LocalDate scheduledDate;
}
