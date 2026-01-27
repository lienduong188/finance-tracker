package com.financetracker.dto.exchangerate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ExchangeRatesResponse {
    private String baseCurrency;
    private LocalDate date;
    private Map<String, BigDecimal> rates;
    private String source;
}
