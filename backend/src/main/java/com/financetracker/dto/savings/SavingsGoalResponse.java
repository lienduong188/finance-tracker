package com.financetracker.dto.savings;

import com.financetracker.entity.SavingsGoalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SavingsGoalResponse {
    private UUID id;
    private String name;
    private String description;
    private BigDecimal targetAmount;
    private BigDecimal currentAmount;
    private String currency;
    private String icon;
    private String color;
    private LocalDate targetDate;
    private SavingsGoalStatus status;
    private UUID familyId;
    private String familyName;
    private UUID userId;
    private String userName;
    private double progressPercentage;
    private int contributorsCount;
    private OffsetDateTime createdAt;
}
