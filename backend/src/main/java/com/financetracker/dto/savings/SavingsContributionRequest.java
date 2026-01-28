package com.financetracker.dto.savings;

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
public class SavingsContributionRequest {

    @NotNull(message = "Số tiền đóng góp là bắt buộc")
    @Positive(message = "Số tiền đóng góp phải lớn hơn 0")
    private BigDecimal amount;

    @NotNull(message = "Tài khoản nguồn là bắt buộc")
    private UUID accountId;

    private String note;

    private LocalDate contributionDate;
}
