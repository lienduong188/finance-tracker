package com.financetracker.controller;

import com.financetracker.dto.exchangerate.ConvertResponse;
import com.financetracker.dto.exchangerate.ExchangeRateResponse;
import com.financetracker.dto.exchangerate.ExchangeRatesResponse;
import com.financetracker.service.ExchangeRateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/exchange-rates")
@RequiredArgsConstructor
@Tag(name = "Exchange Rates", description = "Exchange rate endpoints")
public class ExchangeRateController {

    private final ExchangeRateService exchangeRateService;

    @GetMapping("/latest")
    @Operation(summary = "Get latest exchange rate between two currencies")
    public ResponseEntity<ExchangeRateResponse> getLatestRate(
            @RequestParam String from,
            @RequestParam String to) {
        return ResponseEntity.ok(exchangeRateService.getLatestRate(from, to));
    }

    @GetMapping("/all")
    @Operation(summary = "Get all exchange rates for a base currency")
    public ResponseEntity<ExchangeRatesResponse> getAllRates(
            @RequestParam(defaultValue = "VND") String base) {
        return ResponseEntity.ok(exchangeRateService.getAllRates(base));
    }

    @GetMapping("/convert")
    @Operation(summary = "Convert amount between currencies")
    public ResponseEntity<ConvertResponse> convert(
            @RequestParam BigDecimal amount,
            @RequestParam String from,
            @RequestParam String to) {
        return ResponseEntity.ok(exchangeRateService.convert(amount, from, to));
    }

    @GetMapping("/currencies")
    @Operation(summary = "Get list of supported currencies")
    public ResponseEntity<List<String>> getSupportedCurrencies() {
        return ResponseEntity.ok(exchangeRateService.getSupportedCurrencies());
    }

    @PostMapping("/refresh")
    @Operation(summary = "Manually refresh exchange rates (admin)")
    public ResponseEntity<Void> refreshRates() {
        exchangeRateService.fetchAndSaveRates();
        return ResponseEntity.ok().build();
    }
}
