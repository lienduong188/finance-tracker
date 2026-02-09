package com.financetracker.dto.spendingplan;

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
public class SpendingPlanExpenseRequest {

    @NotNull(message = "Số tiền là bắt buộc")
    @Positive(message = "Số tiền phải lớn hơn 0")
    private BigDecimal amount;

    @NotNull(message = "Tài khoản là bắt buộc")
    private UUID accountId;

    private String note;

    private LocalDate expenseDate;
}
