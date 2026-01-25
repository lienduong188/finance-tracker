package com.financetracker.dto.account;

import com.financetracker.entity.AccountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AccountResponse {

    private UUID id;
    private String name;
    private AccountType type;
    private String currency;
    private BigDecimal initialBalance;
    private BigDecimal currentBalance;
    private String icon;
    private String color;
    private Boolean isActive;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Credit card specific fields
    private BigDecimal creditLimit;
    private Integer billingDay;
    private Integer paymentDueDay;
}
