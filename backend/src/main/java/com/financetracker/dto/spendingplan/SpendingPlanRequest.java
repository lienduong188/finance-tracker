package com.financetracker.dto.spendingplan;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SpendingPlanRequest {

    @NotBlank(message = "Tên kế hoạch là bắt buộc")
    @Size(max = 100, message = "Tên kế hoạch tối đa 100 ký tự")
    private String name;

    private String description;

    @Size(min = 3, max = 3, message = "Mã tiền tệ phải đúng 3 ký tự")
    private String currency;

    private String icon;

    private String color;

    private LocalDate startDate;

    private LocalDate endDate;

    private UUID familyId;
}
