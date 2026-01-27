package com.financetracker.dto.exchangerate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ConvertResponse {
    private BigDecimal fromAmount;
    private String fromCurrency;
    private BigDecimal toAmount;
    private String toCurrency;
    private BigDecimal rate;
    private LocalDate date;
}
