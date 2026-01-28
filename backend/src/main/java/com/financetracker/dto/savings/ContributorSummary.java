package com.financetracker.dto.savings;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ContributorSummary {
    private UUID userId;
    private String userName;
    private BigDecimal totalAmount;
    private double percentage;
}
