package com.financetracker.service;

import com.financetracker.dto.exchangerate.*;
import com.financetracker.entity.ExchangeRate;
import com.financetracker.exception.ApiException;
import com.financetracker.repository.ExchangeRateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExchangeRateService {

    private final ExchangeRateRepository exchangeRateRepository;
    private final RestTemplate restTemplate;

    @Value("${exchange-rate.api-key:}")
    private String apiKey;

    @Value("${exchange-rate.cache-duration-minutes:60}")
    private int cacheDurationMinutes;

    @Value("${exchange-rate.fallback-enabled:true}")
    private boolean fallbackEnabled;

    private static final String API_URL = "https://v6.exchangerate-api.com/v6";

    // In-memory cache for all rates from a base currency
    private final Map<String, CachedRates> ratesCache = new ConcurrentHashMap<>();

    private record CachedRates(Map<String, BigDecimal> rates, OffsetDateTime cachedAt) {
        boolean isExpired(int ttlMinutes) {
            return cachedAt.plusMinutes(ttlMinutes).isBefore(OffsetDateTime.now());
        }
    }

    public ExchangeRateResponse getLatestRate(String from, String to) {
        if (from.equalsIgnoreCase(to)) {
            return ExchangeRateResponse.builder()
                    .fromCurrency(from)
                    .toCurrency(to)
                    .rate(BigDecimal.ONE)
                    .date(LocalDate.now())
                    .source("identity")
                    .updatedAt(OffsetDateTime.now())
                    .build();
        }

        String fromUpper = from.toUpperCase();
        String toUpper = to.toUpperCase();

        // Check cache first
        CachedRates cached = ratesCache.get(fromUpper);
        if (cached != null && !cached.isExpired(cacheDurationMinutes)) {
            BigDecimal rate = cached.rates().get(toUpper);
            if (rate != null) {
                log.debug("Cache hit for {} to {}", fromUpper, toUpper);
                return ExchangeRateResponse.builder()
                        .fromCurrency(fromUpper)
                        .toCurrency(toUpper)
                        .rate(rate)
                        .date(LocalDate.now())
                        .source("cache")
                        .updatedAt(cached.cachedAt())
                        .build();
            }
        }

        // Fetch from API
        try {
            Map<String, BigDecimal> rates = fetchRatesFromApi(fromUpper);
            BigDecimal rate = rates.get(toUpper);

            if (rate == null) {
                throw new RuntimeException("Rate not found for " + toUpper);
            }

            return ExchangeRateResponse.builder()
                    .fromCurrency(fromUpper)
                    .toCurrency(toUpper)
                    .rate(rate)
                    .date(LocalDate.now())
                    .source("exchangerate-api")
                    .updatedAt(OffsetDateTime.now())
                    .build();
        } catch (Exception e) {
            log.warn("Failed to fetch rate from API: {}", e.getMessage());

            if (fallbackEnabled) {
                Optional<ExchangeRate> dbRate = exchangeRateRepository.findLatestRate(fromUpper, toUpper);
                if (dbRate.isPresent()) {
                    ExchangeRate rate = dbRate.get();
                    return ExchangeRateResponse.builder()
                            .fromCurrency(rate.getFromCurrency())
                            .toCurrency(rate.getToCurrency())
                            .rate(rate.getRate())
                            .date(rate.getDate())
                            .source("database-fallback")
                            .updatedAt(rate.getCreatedAt())
                            .build();
                }
            }

            throw ApiException.badRequest("Unable to fetch exchange rate for " + from + " to " + to);
        }
    }

    public ExchangeRatesResponse getAllRates(String baseCurrency) {
        String baseUpper = baseCurrency.toUpperCase();

        try {
            Map<String, BigDecimal> rates = fetchRatesFromApi(baseUpper);

            // Filter to only supported currencies
            List<String> supported = getSupportedCurrencies();
            Map<String, BigDecimal> filteredRates = new LinkedHashMap<>();
            for (String currency : supported) {
                if (!currency.equals(baseUpper) && rates.containsKey(currency)) {
                    filteredRates.put(currency, rates.get(currency));
                }
            }

            return ExchangeRatesResponse.builder()
                    .baseCurrency(baseUpper)
                    .date(LocalDate.now())
                    .rates(filteredRates)
                    .source("exchangerate-api")
                    .build();
        } catch (Exception e) {
            log.error("Failed to fetch all rates: {}", e.getMessage());
            return ExchangeRatesResponse.builder()
                    .baseCurrency(baseUpper)
                    .date(LocalDate.now())
                    .rates(Map.of())
                    .source("error")
                    .build();
        }
    }

    public ConvertResponse convert(BigDecimal amount, String from, String to) {
        ExchangeRateResponse rateResponse = getLatestRate(from, to);
        BigDecimal convertedAmount = amount.multiply(rateResponse.getRate())
                .setScale(to.equalsIgnoreCase("VND") || to.equalsIgnoreCase("JPY") ? 0 : 2, RoundingMode.HALF_UP);

        return ConvertResponse.builder()
                .fromAmount(amount)
                .fromCurrency(from)
                .toAmount(convertedAmount)
                .toCurrency(to)
                .rate(rateResponse.getRate())
                .date(rateResponse.getDate())
                .build();
    }

    @Transactional
    public void fetchAndSaveRates() {
        log.info("Fetching exchange rates from ExchangeRate-API...");
        List<String> currencies = getSupportedCurrencies();
        LocalDate today = LocalDate.now();
        int savedCount = 0;

        for (String from : currencies) {
            try {
                Map<String, BigDecimal> rates = fetchRatesFromApi(from);

                for (String to : currencies) {
                    if (from.equals(to)) continue;

                    BigDecimal rate = rates.get(to);
                    if (rate == null) continue;

                    Optional<ExchangeRate> existing = exchangeRateRepository
                            .findByFromCurrencyAndToCurrencyAndDate(from, to, today);

                    if (existing.isPresent()) {
                        ExchangeRate entity = existing.get();
                        entity.setRate(rate);
                        entity.setSource("exchangerate-api");
                        exchangeRateRepository.save(entity);
                    } else {
                        ExchangeRate entity = ExchangeRate.builder()
                                .fromCurrency(from)
                                .toCurrency(to)
                                .rate(rate)
                                .date(today)
                                .source("exchangerate-api")
                                .build();
                        exchangeRateRepository.save(entity);
                    }
                    savedCount++;
                }
            } catch (Exception e) {
                log.error("Failed to fetch rates for {}: {}", from, e.getMessage());
            }
        }

        log.info("Exchange rate update completed. Saved {} rates.", savedCount);
    }

    public void clearCache() {
        ratesCache.clear();
        log.info("Exchange rate cache cleared");
    }

    public List<String> getSupportedCurrencies() {
        Set<String> currencies = new HashSet<>();
        currencies.addAll(exchangeRateRepository.findDistinctFromCurrencies());
        currencies.addAll(exchangeRateRepository.findDistinctToCurrencies());

        if (currencies.isEmpty()) {
            currencies.add("VND");
            currencies.add("JPY");
            currencies.add("USD");
            currencies.add("EUR");
        }

        return new ArrayList<>(currencies);
    }

    private Map<String, BigDecimal> fetchRatesFromApi(String baseCurrency) {
        if (apiKey == null || apiKey.isEmpty()) {
            throw new RuntimeException("Exchange rate API key not configured");
        }

        String url = String.format("%s/%s/latest/%s", API_URL, apiKey, baseCurrency);
        log.debug("Fetching rates from ExchangeRate-API for base: {}", baseCurrency);

        ExchangeRateApiResponse response = restTemplate.getForObject(url, ExchangeRateApiResponse.class);

        if (response == null || !"success".equals(response.getResult())) {
            throw new RuntimeException("Failed to fetch rates from ExchangeRate-API");
        }

        Map<String, BigDecimal> rates = response.getConversionRates();

        // Update cache
        ratesCache.put(baseCurrency, new CachedRates(rates, OffsetDateTime.now()));

        return rates;
    }
}
