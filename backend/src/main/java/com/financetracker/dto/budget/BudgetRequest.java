package com.financetracker.dto.budget;

import com.financetracker.entity.BudgetPeriod;
import jakarta.validation.constraints.*;
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
    @Size(max = 100, message = "Budget name must not exceed 100 characters")
    private String name;

    private UUID categoryId;

    private UUID familyId;  // If set, this is a family budget

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    @DecimalMax(value = "999999999999.99", message = "Amount must not exceed 999,999,999,999.99")
    private BigDecimal amount;

    @Size(min = 3, max = 3, message = "Currency must be 3 characters")
    private String currency = "VND";

    @NotNull(message = "Period is required")
    private BudgetPeriod period = BudgetPeriod.MONTHLY;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private LocalDate endDate;

    @Min(value = 1, message = "Alert threshold must be between 1 and 100")
    @Max(value = 100, message = "Alert threshold must be between 1 and 100")
    private Integer alertThreshold = 80;
}
