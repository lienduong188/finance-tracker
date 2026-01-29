package com.financetracker.dto.savings;

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
public class SavingsContributionResponse {
    private UUID id;
    private UUID goalId;
    private UUID userId;
    private String userName;
    private UUID accountId;
    private String accountName;
    private UUID transactionId;
    private BigDecimal amount;
    private String currency;
    private String note;
    private LocalDate contributionDate;
    private OffsetDateTime createdAt;
}
