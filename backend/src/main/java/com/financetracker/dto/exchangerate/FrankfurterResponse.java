package com.financetracker.dto.exchangerate;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@Data
public class FrankfurterResponse {
    private BigDecimal amount;
    private String base;
    private LocalDate date;
    private Map<String, BigDecimal> rates;
}
