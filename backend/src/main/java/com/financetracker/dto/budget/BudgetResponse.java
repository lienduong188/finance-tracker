package com.financetracker.dto.budget;

import com.financetracker.entity.BudgetPeriod;
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
public class BudgetResponse {

    private UUID id;
    private String name;
    private UUID categoryId;
    private String categoryName;
    private String categoryIcon;
    private UUID familyId;
    private String familyName;
    private BigDecimal amount;
    private String currency;
    private BudgetPeriod period;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal spentAmount;
    private BigDecimal remainingAmount;
    private Double spentPercentage;
    private Integer alertThreshold;
    private Boolean isActive;
    private Boolean isOverBudget;
    private Boolean isNearLimit;
    private OffsetDateTime createdAt;
}
