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

    @Value("${exchange-rate.api-url:https://api.frankfurter.app}")
    private String apiUrl;

    @Value("${exchange-rate.cache-duration-minutes:60}")
    private int cacheDurationMinutes;

    @Value("${exchange-rate.fallback-enabled:true}")
    private boolean fallbackEnabled;

    // In-memory cache
    private final Map<String, CachedRate> rateCache = new ConcurrentHashMap<>();

    private record CachedRate(BigDecimal rate, OffsetDateTime cachedAt, String source) {
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

        String cacheKey = from.toUpperCase() + "_" + to.toUpperCase();
        CachedRate cached = rateCache.get(cacheKey);

        if (cached != null && !cached.isExpired(cacheDurationMinutes)) {
            log.debug("Cache hit for {}", cacheKey);
            return ExchangeRateResponse.builder()
                    .fromCurrency(from)
                    .toCurrency(to)
                    .rate(cached.rate())
                    .date(LocalDate.now())
                    .source("cache")
                    .updatedAt(cached.cachedAt())
                    .build();
        }

        // Try to fetch from API
        try {
            BigDecimal rate = fetchRateFromApi(from, to);
            CachedRate newCache = new CachedRate(rate, OffsetDateTime.now(), "frankfurter");
            rateCache.put(cacheKey, newCache);

            return ExchangeRateResponse.builder()
                    .fromCurrency(from)
                    .toCurrency(to)
                    .rate(rate)
                    .date(LocalDate.now())
                    .source("frankfurter")
                    .updatedAt(OffsetDateTime.now())
                    .build();
        } catch (Exception e) {
            log.warn("Failed to fetch rate from API: {}", e.getMessage());

            if (fallbackEnabled) {
                // Try database fallback
                Optional<ExchangeRate> dbRate = exchangeRateRepository.findLatestRate(from.toUpperCase(), to.toUpperCase());
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
        Map<String, BigDecimal> rates = new LinkedHashMap<>();
        List<String> targetCurrencies = getSupportedCurrencies().stream()
                .filter(c -> !c.equalsIgnoreCase(baseCurrency))
                .toList();

        for (String target : targetCurrencies) {
            try {
                ExchangeRateResponse rate = getLatestRate(baseCurrency, target);
                rates.put(target, rate.getRate());
            } catch (Exception e) {
                log.warn("Failed to get rate for {} to {}: {}", baseCurrency, target, e.getMessage());
            }
        }

        return ExchangeRatesResponse.builder()
                .baseCurrency(baseCurrency)
                .date(LocalDate.now())
                .rates(rates)
                .source("frankfurter")
                .build();
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
        log.info("Fetching exchange rates from API...");
        List<String> currencies = getSupportedCurrencies();
        LocalDate today = LocalDate.now();
        int savedCount = 0;

        for (String from : currencies) {
            for (String to : currencies) {
                if (from.equals(to)) continue;

                try {
                    BigDecimal rate = fetchRateFromApi(from, to);

                    // Check if rate already exists for today
                    Optional<ExchangeRate> existing = exchangeRateRepository
                            .findByFromCurrencyAndToCurrencyAndDate(from, to, today);

                    if (existing.isPresent()) {
                        ExchangeRate entity = existing.get();
                        entity.setRate(rate);
                        entity.setSource("frankfurter");
                        exchangeRateRepository.save(entity);
                    } else {
                        ExchangeRate entity = ExchangeRate.builder()
                                .fromCurrency(from)
                                .toCurrency(to)
                                .rate(rate)
                                .date(today)
                                .source("frankfurter")
                                .build();
                        exchangeRateRepository.save(entity);
                    }

                    // Update cache
                    String cacheKey = from + "_" + to;
                    rateCache.put(cacheKey, new CachedRate(rate, OffsetDateTime.now(), "frankfurter"));
                    savedCount++;

                } catch (Exception e) {
                    log.error("Failed to fetch rate for {} to {}: {}", from, to, e.getMessage());
                }
            }
        }

        log.info("Exchange rate update completed. Saved {} rates.", savedCount);
    }

    public void clearCache() {
        rateCache.clear();
        log.info("Exchange rate cache cleared");
    }

    public List<String> getSupportedCurrencies() {
        // Get currencies from database (from accounts and exchange_rates)
        Set<String> currencies = new HashSet<>();
        currencies.addAll(exchangeRateRepository.findDistinctFromCurrencies());
        currencies.addAll(exchangeRateRepository.findDistinctToCurrencies());

        // Add default currencies if empty
        if (currencies.isEmpty()) {
            currencies.add("VND");
            currencies.add("JPY");
            currencies.add("USD");
            currencies.add("EUR");
        }

        return new ArrayList<>(currencies);
    }

    private BigDecimal fetchRateFromApi(String from, String to) {
        // Frankfurter API doesn't support VND directly, so we need to use USD as intermediate
        // For VND conversions, we'll use a workaround
        if (from.equalsIgnoreCase("VND") || to.equalsIgnoreCase("VND")) {
            return fetchVndRate(from, to);
        }

        String url = String.format("%s/latest?from=%s&to=%s", apiUrl, from.toUpperCase(), to.toUpperCase());
        log.debug("Fetching rate from: {}", url);

        FrankfurterResponse response = restTemplate.getForObject(url, FrankfurterResponse.class);
        if (response == null || response.getRates() == null || response.getRates().isEmpty()) {
            throw new RuntimeException("Empty response from Frankfurter API");
        }

        return response.getRates().get(to.toUpperCase());
    }

    private BigDecimal fetchVndRate(String from, String to) {
        // Frankfurter doesn't support VND, so we use hardcoded rates or database fallback
        // In production, you might want to use a different API that supports VND

        // Check database first
        Optional<ExchangeRate> dbRate = exchangeRateRepository.findLatestRate(from.toUpperCase(), to.toUpperCase());
        if (dbRate.isPresent()) {
            return dbRate.get().getRate();
        }

        // Fallback hardcoded rates (approximate)
        Map<String, BigDecimal> vndRates = Map.of(
                "USD_VND", new BigDecimal("24500"),
                "VND_USD", new BigDecimal("0.0000408"),
                "EUR_VND", new BigDecimal("26500"),
                "VND_EUR", new BigDecimal("0.0000377"),
                "JPY_VND", new BigDecimal("163"),
                "VND_JPY", new BigDecimal("0.00613")
        );

        String key = from.toUpperCase() + "_" + to.toUpperCase();
        if (vndRates.containsKey(key)) {
            return vndRates.get(key);
        }

        throw new RuntimeException("VND rate not available for " + from + " to " + to);
    }
}
