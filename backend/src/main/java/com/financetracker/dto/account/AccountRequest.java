package com.financetracker.dto.account;

import com.financetracker.entity.AccountType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AccountRequest {

    @NotBlank(message = "Account name is required")
    @Size(max = 100, message = "Account name must not exceed 100 characters")
    private String name;

    @NotNull(message = "Account type is required")
    private AccountType type;

    @Size(min = 3, max = 3, message = "Currency must be 3 characters")
    private String currency = "VND";

    @PositiveOrZero(message = "Initial balance must not be negative")
    private BigDecimal initialBalance = BigDecimal.ZERO;

    @Size(max = 10, message = "Icon must not exceed 10 characters")
    private String icon;

    @Size(max = 20, message = "Color must not exceed 20 characters")
    private String color;

    // Credit card specific fields
    @PositiveOrZero(message = "Credit limit must not be negative")
    private BigDecimal creditLimit;

    @Min(value = 1, message = "Billing day must be between 1 and 31")
    @Max(value = 31, message = "Billing day must be between 1 and 31")
    private Integer billingDay;

    @Min(value = 1, message = "Payment due day must be between 1 and 31")
    @Max(value = 31, message = "Payment due day must be between 1 and 31")
    private Integer paymentDueDay;

    // Linked account for auto-payment
    private UUID linkedAccountId;
}
