package com.financetracker.dto.savings;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
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
public class SavingsGoalRequest {

    @NotBlank(message = "Tên mục tiêu là bắt buộc")
    @Size(max = 100, message = "Tên mục tiêu tối đa 100 ký tự")
    private String name;

    private String description;

    @NotNull(message = "Số tiền mục tiêu là bắt buộc")
    @Positive(message = "Số tiền mục tiêu phải lớn hơn 0")
    private BigDecimal targetAmount;

    @Size(min = 3, max = 3, message = "Mã tiền tệ phải đúng 3 ký tự")
    private String currency;

    private String icon;

    private String color;

    private LocalDate targetDate;

    private UUID familyId;
}
