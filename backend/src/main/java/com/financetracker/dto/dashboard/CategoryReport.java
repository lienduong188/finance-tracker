package com.financetracker.dto.dashboard;

import com.financetracker.entity.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategoryReport {

    private TransactionType type;
    private BigDecimal totalAmount;
    private List<CategoryBreakdown> categories;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CategoryBreakdown {
        private UUID categoryId;
        private String categoryName;
        private String icon;
        private String color;
        private BigDecimal amount;
        private Double percentage;
    }
}
