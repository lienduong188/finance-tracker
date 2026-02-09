package com.financetracker.dto.spendingplan;

import com.financetracker.entity.SpendingPlanStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SpendingPlanDetailResponse {
    private UUID id;
    private String name;
    private String description;
    private String currency;
    private String icon;
    private String color;
    private LocalDate startDate;
    private LocalDate endDate;
    private SpendingPlanStatus status;
    private BigDecimal totalEstimated;
    private BigDecimal totalActual;
    private BigDecimal remainingAmount;
    private double progressPercentage;
    private UUID familyId;
    private String familyName;
    private UUID userId;
    private String userName;
    private List<SpendingPlanItemResponse> items;
    private OffsetDateTime createdAt;
}
