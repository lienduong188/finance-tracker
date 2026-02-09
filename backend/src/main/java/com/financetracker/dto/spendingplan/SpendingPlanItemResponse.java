package com.financetracker.dto.spendingplan;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SpendingPlanItemResponse {
    private UUID id;
    private UUID planId;
    private String name;
    private BigDecimal estimatedAmount;
    private BigDecimal actualAmount;
    private BigDecimal remainingAmount;
    private double progressPercentage;
    private boolean overBudget;
    private UUID categoryId;
    private String categoryName;
    private String categoryIcon;
    private String icon;
    private String notes;
    private Integer sortOrder;
    private int expensesCount;
    private OffsetDateTime createdAt;
}
