package com.financetracker.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DashboardSummary {

    private BigDecimal totalBalance;
    private String primaryCurrency;
    private Map<String, BigDecimal> balanceByCurrency;
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal weeklyExpense;
    private BigDecimal netCashflow;
    private List<AccountSummary> accounts;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AccountSummary {
        private String name;
        private String type;
        private BigDecimal balance;
        private String currency;
        private String icon;
        private String color;
    }
}
