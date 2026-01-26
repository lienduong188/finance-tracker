package com.financetracker.dto.debt;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebtSummary {

    private BigDecimal totalLent;        // Tổng tiền cho vay (người khác nợ mình)
    private BigDecimal totalBorrowed;    // Tổng tiền đi vay (mình nợ người khác)
    private BigDecimal netBalance;       // = totalLent - totalBorrowed
    private long activeDebtsCount;       // Số khoản nợ đang active
    private long overdueCount;           // Số khoản quá hạn
}
