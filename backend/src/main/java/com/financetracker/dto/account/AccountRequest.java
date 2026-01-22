package com.financetracker.dto.account;

import com.financetracker.entity.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AccountRequest {

    @NotBlank(message = "Account name is required")
    private String name;

    @NotNull(message = "Account type is required")
    private AccountType type;

    @Size(min = 3, max = 3, message = "Currency must be 3 characters")
    private String currency = "VND";

    private BigDecimal initialBalance = BigDecimal.ZERO;

    private String icon;

    private String color;
}
