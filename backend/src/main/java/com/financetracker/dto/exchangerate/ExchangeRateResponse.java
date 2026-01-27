package com.financetracker.dto.exchangerate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ExchangeRateResponse {
    private String fromCurrency;
    private String toCurrency;
    private BigDecimal rate;
    private LocalDate date;
    private String source;
    private OffsetDateTime updatedAt;
}
