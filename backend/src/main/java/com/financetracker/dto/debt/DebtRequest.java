package com.financetracker.dto.debt;

import com.financetracker.entity.DebtType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebtRequest {

    @NotNull(message = "Type is required")
    private DebtType type;

    @NotBlank(message = "Person name is required")
    private String personName;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    private String currency;

    private String description;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private LocalDate dueDate;

    private String note;
}
