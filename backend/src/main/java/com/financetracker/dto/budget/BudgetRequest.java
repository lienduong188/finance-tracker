package com.financetracker.dto.budget;

import com.financetracker.entity.BudgetPeriod;
import jakarta.validation.constraints.NotBlank;
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
public class BudgetRequest {

    @NotBlank(message = "Budget name is required")
    private String name;

    private UUID categoryId;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    private String currency = "VND";

    @NotNull(message = "Period is required")
    private BudgetPeriod period = BudgetPeriod.MONTHLY;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private LocalDate endDate;

    private Integer alertThreshold = 80;
}
