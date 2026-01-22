package com.financetracker.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CashflowReport {

    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal netCashflow;
    private List<DailyCashflow> dailyData;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DailyCashflow {
        private LocalDate date;
        private BigDecimal income;
        private BigDecimal expense;
        private BigDecimal net;
    }
}
