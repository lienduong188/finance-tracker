package com.financetracker.scheduler;

import com.financetracker.service.ExchangeRateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExchangeRateScheduler {

    private final ExchangeRateService exchangeRateService;

    /**
     * Update exchange rates every hour at minute 0
     * Cron: second minute hour day month weekday
     */
    @Scheduled(cron = "${exchange-rate.update-cron:0 0 * * * *}")
    public void updateExchangeRates() {
        log.info("Starting scheduled exchange rate update...");
        try {
            exchangeRateService.fetchAndSaveRates();
            log.info("Exchange rate update completed successfully");
        } catch (Exception e) {
            log.error("Failed to update exchange rates: {}", e.getMessage(), e);
        }
    }

    /**
     * Manual trigger for testing or admin API
     */
    public void triggerManualUpdate() {
        log.info("Manual exchange rate update triggered");
        updateExchangeRates();
    }
}
