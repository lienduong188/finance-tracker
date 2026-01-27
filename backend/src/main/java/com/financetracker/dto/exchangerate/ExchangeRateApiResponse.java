package com.financetracker.dto.exchangerate;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

@Data
public class ExchangeRateApiResponse {
    private String result;

    @JsonProperty("base_code")
    private String baseCode;

    @JsonProperty("time_last_update_utc")
    private String timeLastUpdateUtc;

    @JsonProperty("conversion_rates")
    private Map<String, BigDecimal> conversionRates;
}
