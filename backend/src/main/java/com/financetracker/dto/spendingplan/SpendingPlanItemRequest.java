package com.financetracker.dto.spendingplan;

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
public class SpendingPlanItemRequest {

    @NotBlank(message = "Tên hạng mục là bắt buộc")
    @Size(max = 100, message = "Tên hạng mục tối đa 100 ký tự")
    private String name;

    @NotNull(message = "Số tiền dự kiến là bắt buộc")
    @Positive(message = "Số tiền dự kiến phải lớn hơn 0")
    private BigDecimal estimatedAmount;

    private UUID categoryId;

    private String icon;

    private String notes;

    private LocalDate plannedDate;

    private UUID plannedAccountId;

    private Integer sortOrder;
}
